import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("attachment preview host is mounted at ChatView level", () => {
  const chatViewSource = readFileSync(
    new URL("../../layout/AppContent/ChatView.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    chatViewSource,
    /<AttachmentPreviewHost\s*\/>/,
    "ChatView should mount a global attachment preview host outside ChatInput",
  );
});

test("attachment preview host fills the mobile viewport", () => {
  const attachmentPreviewHostSource = readFileSync(
    new URL("../AttachmentPreviewHost.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    attachmentPreviewHostSource,
    /<LazyDocumentPreview[\s\S]*?\bmobileFillViewport\b[\s\S]*?\/>/,
    "Uploaded attachment previews should use the full mobile viewport",
  );
});
