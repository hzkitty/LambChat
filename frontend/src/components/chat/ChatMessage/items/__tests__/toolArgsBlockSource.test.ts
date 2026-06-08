import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readSource(relativePath: string): string {
  return readFileSync(resolve(__dirname, relativePath), "utf8");
}

const argsBlockConsumers = [
  "../EditFileItem.tsx",
  "../GlobItem.tsx",
  "../GrepItem.tsx",
  "../LsItem.tsx",
  "../ReadFileItem.tsx",
  "../WriteFileItem.tsx",
];

test("tool argument blocks share detail and compact wrappers", () => {
  const source = readSource("../ToolArgsBlock.tsx");

  assert.match(source, /type ToolArgsBlockSize = "detail" \| "compact"/);
  assert.match(
    source,
    /detail:\s*"group\/args relative flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-sm text-stone-500 dark:text-stone-400 font-mono"/,
  );
  assert.match(
    source,
    /compact:\s*"group\/args relative flex items-center gap-2 mb-2 px-2 py-1\.5 rounded-md bg-stone-100 dark:bg-stone-800 text-xs text-stone-500 dark:text-stone-400 font-mono"/,
  );
  assert.match(source, /wrap \? "flex-wrap" : ""/);

  for (const relativePath of argsBlockConsumers) {
    const consumer = readSource(relativePath);

    assert.match(
      consumer,
      /import \{ ToolArgsBlock \} from "\.\/ToolArgsBlock"/,
      `${relativePath} should import ToolArgsBlock`,
    );
    assert.match(
      consumer,
      /<ToolArgsBlock size="detail"/,
      `${relativePath} should use the detail args block`,
    );
    assert.match(
      consumer,
      /<ToolArgsBlock size="compact"/,
      `${relativePath} should use the compact args block`,
    );
    assert.doesNotMatch(
      consumer,
      /group\/args relative flex items-center gap-2 (?:mb-2 )?px-(?:3 py-2 rounded-lg|2 py-1\.5 rounded-md) bg-stone-100 dark:bg-stone-800 text-(?:sm|xs) text-stone-500 dark:text-stone-400 font-mono/,
      `${relativePath} should not duplicate ToolArgsBlock classes`,
    );
  }
});
