from __future__ import annotations

import asyncio
from typing import Any

import pytest

from src.infra.channel.feishu import handler as feishu_handler


class _FakeManager:
    def __init__(self) -> None:
        self.sent_messages: list[tuple[str, str, str]] = []

    async def send_message(
        self, user_id: str, chat_id: str, content: str, instance_id: str | None = None
    ) -> None:
        self.sent_messages.append((user_id, chat_id, content))


class _FakeReactionManager:
    def __init__(self) -> None:
        self.add_calls: list[tuple[str, str, str]] = []
        self.delete_calls: list[tuple[str, str, str]] = []

    async def add_reaction(
        self,
        user_id: str,
        message_id: str,
        emoji_type: str,
        instance_id: str | None = None,
    ) -> str:
        self.add_calls.append((user_id, message_id, emoji_type))
        return "reaction-1"

    async def delete_reaction(
        self,
        user_id: str,
        message_id: str,
        reaction_id: str,
        instance_id: str | None = None,
    ) -> bool:
        self.delete_calls.append((user_id, message_id, reaction_id))
        return True


class _FakeStreamingClient:
    def __init__(self) -> None:
        self.created = 0
        self.initial_texts: list[str] = []
        self.sent: list[tuple[str, str, str | None]] = []
        self.updates: list[tuple[str, str, int]] = []
        self.finalized: list[tuple[str, str, int]] = []

    async def create_stream_card(self, initial_text: str = "...") -> str:
        self.created += 1
        self.initial_texts.append(initial_text)
        return "card-1"

    async def send_card_by_id(
        self, chat_id: str, card_id: str, *, reply_to_id: str | None = None
    ) -> tuple[bool, str]:
        self.sent.append((chat_id, card_id, reply_to_id))
        return True, "message-1"

    async def update_stream_card(self, card_id: str, content: str, sequence: int) -> bool:
        self.updates.append((card_id, content, sequence))
        return True

    async def finalize_stream_card(self, card_id: str, content: str, sequence: int) -> bool:
        self.finalized.append((card_id, content, sequence))
        return True


class _FakeStreamingManager:
    def __init__(self, client: _FakeStreamingClient) -> None:
        self.client = client

    def _find_channel(self, user_id: str, instance_id: str | None = None):
        return self.client if user_id == "user-1" else None


class _FakeTaskManager:
    def __init__(self) -> None:
        self.submit_calls: list[dict[str, Any]] = []

    async def submit(self, **kwargs: Any) -> tuple[str, str]:
        self.submit_calls.append(kwargs)
        executor = kwargs["executor"]
        async for _event in executor(
            kwargs["session_id"],
            kwargs["agent_id"],
            kwargs["message"],
            kwargs["user_id"],
            enabled_skills=["planning"],
            persona_system_prompt="Persona prompt",
            disabled_mcp_tools=["mcp.tool"],
        ):
            pass
        return "run-1", ""


class _FakeChannelStorage:
    def __init__(self) -> None:
        self.cleared_configs: list[tuple[str, Any, str]] = []

    async def get_config(self, user_id: str, channel_type: Any, instance_id: str):
        return {
            "name": "Feishu Channel",
            "agent_id": "search",
            "model_id": None,
            "project_id": "deleted-project",
        }

    async def clear_config_project_id(
        self, user_id: str, channel_type: Any, instance_id: str
    ) -> int:
        self.cleared_configs.append((user_id, channel_type, instance_id))
        return 1


class _FakeProjectStorage:
    def __init__(self) -> None:
        self.created_names: list[tuple[str, str]] = []

    async def get_by_id(self, project_id: str, user_id: str):
        return None

    async def get_or_create_by_name(self, user_id: str, name: str):
        self.created_names.append((user_id, name))
        return type("Project", (), {"id": "project-from-channel-name"})()


@pytest.mark.asyncio
async def test_feishu_executor_accepts_task_runtime_skill_kwargs(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: dict[str, Any] = {}
    fake_task_manager = _FakeTaskManager()
    fake_manager = _FakeManager()

    async def _fake_execute_feishu_agent(**kwargs: Any):
        captured.update(kwargs)
        yield {"event": "done", "data": {}}

    async def _no_op_process_events(**kwargs: Any) -> None:
        return None

    async def _no_op_collector_method(self) -> None:
        return None

    monkeypatch.setattr(
        feishu_handler,
        "_get_feishu_session_id",
        lambda chat_id: _async_return(f"feishu_{chat_id}"),
    )
    monkeypatch.setattr(
        "src.infra.task.manager.get_task_manager",
        lambda: fake_task_manager,
    )
    monkeypatch.setattr(feishu_handler, "execute_feishu_agent", _fake_execute_feishu_agent)
    monkeypatch.setattr(feishu_handler, "_process_events", _no_op_process_events)
    monkeypatch.setattr(
        feishu_handler.FeishuResponseCollector,
        "stop_processing_indicator",
        _no_op_collector_method,
    )
    monkeypatch.setattr(
        feishu_handler.FeishuResponseCollector,
        "send_card_message",
        _no_op_collector_method,
    )
    monkeypatch.setattr(
        feishu_handler.FeishuResponseCollector,
        "upload_and_send_files",
        _no_op_collector_method,
    )

    handler = feishu_handler.create_feishu_message_handler(fake_manager, default_agent="search")

    await handler(
        user_id="user-1",
        sender_id="sender-1",
        chat_id="chat-1",
        content="hello",
        metadata={},
    )

    assert fake_manager.sent_messages == []
    assert captured["enabled_skills"] == ["planning"]
    assert captured["persona_system_prompt"] == "Persona prompt"
    assert captured["disabled_mcp_tools"] == ["mcp.tool"]


@pytest.mark.asyncio
async def test_feishu_handler_ignores_stale_channel_project_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_task_manager = _FakeTaskManager()
    fake_manager = _FakeManager()
    fake_project_storage = _FakeProjectStorage()
    fake_channel_storage = _FakeChannelStorage()

    async def _fake_execute_feishu_agent(**kwargs: Any):
        yield {"event": "done", "data": {}}

    async def _no_op_process_events(**kwargs: Any) -> None:
        return None

    async def _no_op_collector_method(self) -> None:
        return None

    monkeypatch.setattr(
        feishu_handler,
        "_get_feishu_session_id",
        lambda chat_id: _async_return(f"feishu_{chat_id}"),
    )
    monkeypatch.setattr(
        "src.infra.task.manager.get_task_manager",
        lambda: fake_task_manager,
    )
    monkeypatch.setattr(
        "src.infra.channel.channel_storage.ChannelStorage",
        lambda: fake_channel_storage,
    )
    monkeypatch.setattr(
        "src.infra.folder.storage.get_project_storage",
        lambda: fake_project_storage,
    )
    monkeypatch.setattr(feishu_handler, "execute_feishu_agent", _fake_execute_feishu_agent)
    monkeypatch.setattr(feishu_handler, "_process_events", _no_op_process_events)
    monkeypatch.setattr(
        feishu_handler.FeishuResponseCollector,
        "stop_processing_indicator",
        _no_op_collector_method,
    )
    monkeypatch.setattr(
        feishu_handler.FeishuResponseCollector,
        "send_card_message",
        _no_op_collector_method,
    )
    monkeypatch.setattr(
        feishu_handler.FeishuResponseCollector,
        "upload_and_send_files",
        _no_op_collector_method,
    )

    handler = feishu_handler.create_feishu_message_handler(fake_manager, default_agent="fast")

    await handler(
        user_id="user-1",
        sender_id="sender-1",
        chat_id="chat-1",
        content="hello",
        metadata={"instance_id": "instance-1"},
    )

    assert fake_project_storage.created_names == [("user-1", "Feishu Channel")]
    assert fake_channel_storage.cleared_configs
    assert fake_task_manager.submit_calls[0]["project_id"] == "project-from-channel-name"


@pytest.mark.asyncio
async def test_feishu_handler_uses_event_chat_id_for_p2p_delivery(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_task_manager = _FakeTaskManager()
    fake_manager = _FakeManager()
    captured_collector: dict[str, Any] = {}

    async def _fake_execute_feishu_agent(**kwargs: Any):
        yield {"event": "done", "data": {}}

    async def _no_op_process_events(**kwargs: Any) -> None:
        return None

    class _CaptureCollector:
        def __init__(self, **kwargs: Any) -> None:
            captured_collector.update(kwargs)

        async def start_processing_indicator(self, message_id: str) -> None:
            return None

        async def stop_processing_indicator(self) -> None:
            return None

        async def finalize_stream_message(self) -> bool:
            return False

        async def send_card_message(self) -> bool:
            return True

        async def upload_and_send_files(self) -> None:
            return None

    monkeypatch.setattr(
        feishu_handler,
        "_get_feishu_session_id",
        lambda chat_id: _async_return(f"feishu_{chat_id}"),
    )
    monkeypatch.setattr(
        "src.infra.task.manager.get_task_manager",
        lambda: fake_task_manager,
    )
    monkeypatch.setattr(feishu_handler, "execute_feishu_agent", _fake_execute_feishu_agent)
    monkeypatch.setattr(feishu_handler, "_process_events", _no_op_process_events)
    monkeypatch.setattr(feishu_handler, "FeishuResponseCollector", _CaptureCollector)

    handler = feishu_handler.create_feishu_message_handler(fake_manager, default_agent="search")

    await handler(
        user_id="user-1",
        sender_id="ou_sender",
        chat_id="ou_sender",
        content="hello",
        metadata={
            "message_id": "om_original",
            "chat_type": "p2p",
            "reply_chat_id": "oc_p2p_chat",
        },
    )

    assert fake_task_manager.submit_calls[0]["session_id"] == "feishu_ou_sender"
    assert captured_collector["chat_id"] == "oc_p2p_chat"
    assert captured_collector["reply_to_message_id"] is None


async def _async_return(value: Any) -> Any:
    return value


@pytest.mark.asyncio
async def test_feishu_processing_indicator_adds_once_and_removes_on_stop() -> None:
    manager = _FakeReactionManager()
    collector = feishu_handler.FeishuResponseCollector(
        manager=manager,
        user_id="user-1",
        chat_id="chat-1",
    )

    await collector.start_processing_indicator("message-1")
    await collector.start_processing_indicator("message-1")
    await collector.stop_processing_indicator()
    await collector.stop_processing_indicator()

    assert manager.add_calls == [("user-1", "message-1", "StatusInFlight")]
    assert manager.delete_calls == [("user-1", "message-1", "reaction-1")]


@pytest.mark.asyncio
async def test_feishu_collector_streams_chunks_and_finalizes_card() -> None:
    client = _FakeStreamingClient()
    collector = feishu_handler.FeishuResponseCollector(
        manager=_FakeStreamingManager(client),
        user_id="user-1",
        chat_id="oc_chat",
        reply_to_message_id="original-message",
        stream_reply=True,
    )

    await collector.append_stream_chunk("hello")
    await asyncio.sleep(0)
    await collector.append_stream_chunk(" world")
    await asyncio.sleep(feishu_handler.FEISHU_STREAM_UPDATE_DEBOUNCE_SECONDS + 0.05)

    assert client.created == 1
    assert client.initial_texts == ["hello"]
    assert client.sent == [("oc_chat", "card-1", "original-message")]
    assert client.updates == [("card-1", "hello world", 1)]

    assert await collector.finalize_stream_message() is True
    assert client.finalized == [("card-1", "hello world", 2)]


@pytest.mark.asyncio
async def test_feishu_collector_splits_large_first_stream_update() -> None:
    client = _FakeStreamingClient()
    collector = feishu_handler.FeishuResponseCollector(
        manager=_FakeStreamingManager(client),
        user_id="user-1",
        chat_id="oc_chat",
        stream_reply=True,
    )

    first_chunk = "这是一段比较长的开头内容，应该先推很短的一小段"
    await collector.append_stream_chunk(first_chunk)
    await asyncio.sleep(feishu_handler.FEISHU_STREAM_UPDATE_DEBOUNCE_SECONDS + 0.05)

    assert client.initial_texts == [
        first_chunk[: feishu_handler.FEISHU_STREAM_FIRST_PAINT_CHARS]
    ]
    assert client.updates == [("card-1", first_chunk, 1)]


@pytest.mark.asyncio
async def test_feishu_collector_falls_back_when_stream_card_creation_fails() -> None:
    class _FailingClient(_FakeStreamingClient):
        async def create_stream_card(self, initial_text: str = "...") -> None:
            self.created += 1
            return None

    client = _FailingClient()
    collector = feishu_handler.FeishuResponseCollector(
        manager=_FakeStreamingManager(client),
        user_id="user-1",
        chat_id="oc_chat",
        stream_reply=True,
    )

    await collector.append_stream_chunk("hello")

    assert collector.text_parts == ["hello"]
    assert await collector.finalize_stream_message() is False
    assert client.sent == []
