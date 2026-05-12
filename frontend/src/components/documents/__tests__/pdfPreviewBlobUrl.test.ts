import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../DocumentPreview.tsx", import.meta.url),
  "utf8",
);

test("PDF preview uses a local PDF blob URL instead of embedding the download URL directly", () => {
  const pdfBranch = source.match(
    /if \(resolvedPdfFile\) \{(?<body>[\s\S]*?)\n\s*\}\n\n\s*\/\/ 视频文件/,
  )?.groups?.body;

  assert.ok(pdfBranch, "resolvedPdfFile branch should exist");
  assert.match(pdfBranch, /fetchDocumentArrayBuffer\(url\)/);
  assert.match(
    pdfBranch,
    /new Blob\(\[.*\], \{ type: "application\/pdf" \}\)/s,
  );
  assert.match(pdfBranch, /URL\.createObjectURL/);
  assert.doesNotMatch(pdfBranch, /setPdfUrl\(url\)/);
});

test("PDF preview revokes generated blob URLs", () => {
  assert.match(source, /if \(pdfUrl\?\.startsWith\("blob:"\)\)/);
  assert.match(source, /URL\.revokeObjectURL\(pdfUrl\)/);
});

test("unsupported preview files render a guardrail instead of auto-downloading", () => {
  const unsupportedBranch = source.match(
    /else if \(unsupportedPreviewFile\) \{(?<body>[\s\S]*?)\n\s*\}\s*else if \(wordPreviewFile/,
  )?.groups?.body;

  assert.ok(unsupportedBranch, "unsupported preview branch should exist");
  assert.doesNotMatch(unsupportedBranch, /document\.createElement\("a"\)/);
  assert.match(source, /documents\.unsupportedFilePreview/);
  assert.match(source, /documents\.unsupportedFileHint/);
});
