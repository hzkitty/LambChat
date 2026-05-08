import test from "node:test";
import assert from "node:assert/strict";
import { getModelSelectorDropdownStyle } from "../modelSelectorPosition.ts";

test("expands the model selector from the trigger to the viewport bottom", () => {
  const style = getModelSelectorDropdownStyle({
    triggerRect: {
      top: 48,
      bottom: 76,
      left: 275,
    },
    viewportWidth: 390,
    viewportHeight: 600,
  });

  assert.equal(style.top, 84);
  assert.equal(style.maxHeight, 508);
});

test("uses the remaining viewport height even when the trigger is near the bottom", () => {
  const style = getModelSelectorDropdownStyle({
    triggerRect: {
      top: 520,
      bottom: 548,
      left: 275,
    },
    viewportWidth: 390,
    viewportHeight: 600,
  });

  assert.equal(style.top, 556);
  assert.equal(style.maxHeight, 36);
});

test("clamps the model selector inside the horizontal viewport", () => {
  const style = getModelSelectorDropdownStyle({
    triggerRect: {
      top: 40,
      bottom: 68,
      left: 330,
    },
    viewportWidth: 390,
    viewportHeight: 600,
  });

  assert.equal(style.left, 94);
});
