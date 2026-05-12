import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../PdfPreview.tsx", import.meta.url),
  "utf8",
);

test("PDF preview delegates rendering to a native embedded viewer", () => {
  assert.doesNotMatch(source, /from\s+"react-pdf"/);
  assert.doesNotMatch(source, /\bDocument\b/);
  assert.doesNotMatch(source, /\bPage\b/);
  assert.match(source, /<iframe\b/);
});

test("PDF preview asks native viewers to fit the component width", () => {
  assert.match(source, /pdfViewerUrl/);
  assert.match(source, /zoom=page-width/);
  assert.match(source, /view=FitH/);
  assert.match(source, /src=\{pdfViewerUrl\}/);
});

test("PDF preview does not keep app-level page navigation controls", () => {
  assert.doesNotMatch(source, /pageNumber/);
  assert.doesNotMatch(source, /goToPrevPage|goToNextPage/);
  assert.doesNotMatch(source, /ChevronLeft|ChevronRight/);
  assert.doesNotMatch(source, /previousPage|nextPage/);
});
