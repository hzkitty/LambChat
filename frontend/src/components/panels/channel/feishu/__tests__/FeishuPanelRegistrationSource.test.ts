import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const panelSource = readFileSync(
  new URL("../FeishuPanel.tsx", import.meta.url),
  "utf8",
);

test("registration polling cleanup cancels active server-side session", () => {
  assert.match(panelSource, /cancelFeishuRegistration/);
  assert.match(
    panelSource,
    /channelApi\s*\.\s*cancelFeishuRegistration\(\s*registrationSessionId\s*\)/,
  );
  assert.match(panelSource, /return\s+\(\)\s*=>\s*\{/);
});
