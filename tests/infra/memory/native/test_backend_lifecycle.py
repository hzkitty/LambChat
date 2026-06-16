import asyncio

import pytest

from src.infra.memory.client.native import backend as backend_module
from src.infra.memory.client.native.backend import NativeMemoryBackend


@pytest.mark.asyncio
async def test_delete_removes_store_payload_for_long_memory():
    seen: dict[str, object] = {}

    class FakeCollection:
        async def find_one(self, query, _projection=None):
            seen["find_query"] = query
            return {
                "user_id": "u1",
                "memory_id": "m1",
                "content_storage_mode": "store",
                "content_store_key": "memory:m1",
            }

        async def delete_one(self, query):
            seen["delete_query"] = query

            class Result:
                deleted_count = 1

            return Result()

    class FakeStore:
        async def aput(self, namespace, key, value):
            seen["store_delete"] = {"namespace": namespace, "key": key, "value": value}

    backend = NativeMemoryBackend()
    backend._collection = FakeCollection()
    backend._store = FakeStore()

    async def fake_invalidate(_user_id):
        seen["invalidated"] = True

    backend._invalidate_cache = fake_invalidate  # type: ignore[method-assign]

    result = await backend.delete("u1", "m1")

    assert result["success"] is True
    assert seen["find_query"] == {"user_id": "u1", "memory_id": "m1"}
    assert seen["delete_query"] == {"user_id": "u1", "memory_id": "m1"}
    assert seen["store_delete"] == {
        "namespace": ("memories", "u1", "content"),
        "key": "memory:m1",
        "value": None,
    }
    assert seen["invalidated"] is True


@pytest.mark.asyncio
async def test_maybe_embed_offloads_sync_embedding_function(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[object] = []
    backend = NativeMemoryBackend()

    def sync_embedding(text: str) -> list[float]:
        assert text == "hello"
        return [1.0, 2.0]

    async def fake_run_blocking_io(func, *args, **kwargs):
        calls.append(func)
        return func(*args, **kwargs)

    backend._embedding_fn = sync_embedding
    monkeypatch.setattr(backend_module, "run_blocking_io", fake_run_blocking_io)

    result = await backend._maybe_embed("hello")

    assert result == [1.0, 2.0]
    assert calls == [sync_embedding]


@pytest.mark.asyncio
async def test_maybe_embed_awaits_future_returned_by_embedding_function(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    backend = NativeMemoryBackend()

    def future_embedding(text: str) -> asyncio.Future[list[float]]:
        assert text == "hello"
        future = asyncio.get_running_loop().create_future()
        asyncio.get_running_loop().call_later(0.01, future.set_result, [3.0, 4.0])
        return future

    async def fake_run_blocking_io(func, *args, **kwargs):
        return func(*args, **kwargs)

    backend._embedding_fn = future_embedding
    monkeypatch.setattr(backend_module, "run_blocking_io", fake_run_blocking_io)

    result = await backend._maybe_embed("hello")

    assert result == [3.0, 4.0]


@pytest.mark.asyncio
async def test_get_memory_model_uses_native_model_id(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[dict[str, object]] = []

    async def fake_get_model(**kwargs):
        calls.append(kwargs)
        return object()

    async def fake_resolve_model_reference(_value):
        return "memory-model-id", None

    monkeypatch.setattr("src.infra.llm.client.LLMClient.get_model", fake_get_model)
    monkeypatch.setattr(
        "src.infra.llm.models_service.resolve_model_reference",
        fake_resolve_model_reference,
    )
    monkeypatch.setattr(backend_module.settings, "NATIVE_MEMORY_MODEL", "memory-model-id")
    monkeypatch.setattr(backend_module.settings, "NATIVE_MEMORY_API_BASE", "https://unused.test/v1")
    monkeypatch.setattr(backend_module.settings, "NATIVE_MEMORY_API_KEY", "unused-key")

    await NativeMemoryBackend._get_memory_model()

    assert calls == [
        {
            "model_id": "memory-model-id",
            "temperature": 0.1,
            "max_tokens": 2000,
        }
    ]


@pytest.mark.asyncio
async def test_get_memory_model_uses_default_model_when_native_model_empty(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[dict[str, object]] = []

    async def fake_get_model(**kwargs):
        calls.append(kwargs)
        return object()

    async def fake_resolve_model_reference(_value):
        return None, None

    monkeypatch.setattr("src.infra.llm.client.LLMClient.get_model", fake_get_model)
    monkeypatch.setattr(
        "src.infra.llm.models_service.resolve_model_reference",
        fake_resolve_model_reference,
    )
    monkeypatch.setattr(backend_module.settings, "NATIVE_MEMORY_MODEL", "")

    await NativeMemoryBackend._get_memory_model()

    assert calls == [
        {
            "model_id": None,
            "temperature": 0.1,
            "max_tokens": 2000,
        }
    ]
