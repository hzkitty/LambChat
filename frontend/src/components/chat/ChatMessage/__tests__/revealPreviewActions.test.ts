import assert from "node:assert/strict";
import test from "node:test";
import {
  getActiveRevealPreviewState,
  setActiveRevealPreviewState,
} from "../items/activeRevealPreviewStore.ts";
import { openRevealPreview } from "../items/revealPreviewActions.ts";

const preview = {
  kind: "file" as const,
  previewKey: "preview:file:1",
  filePath: "src/index.ts",
};

test("opens the global preview state when manual open has no callback", () => {
  setActiveRevealPreviewState(null);

  const opened = openRevealPreview(preview, "manual");

  assert.equal(opened, true);
  assert.deepEqual(getActiveRevealPreviewState()?.request, preview);

  setActiveRevealPreviewState(null);
});

test("does not auto-open without a callback", () => {
  setActiveRevealPreviewState(null);

  const opened = openRevealPreview(preview, "auto");

  assert.equal(opened, false);
  assert.equal(getActiveRevealPreviewState(), null);
});

test("uses the provided callback when present", () => {
  setActiveRevealPreviewState(null);

  let called = 0;
  const opened = openRevealPreview(preview, "manual", () => {
    called += 1;
    return true;
  });

  assert.equal(opened, true);
  assert.equal(called, 1);
  assert.equal(getActiveRevealPreviewState(), null);
});
