import test from "node:test";
import assert from "node:assert/strict";

import {
  applyThemeToDocument,
  getInitialThemePreference,
} from "../themeDom.ts";

test("getInitialThemePreference prefers persisted theme over system preference", () => {
  const env = {
    localStorage: {
      getItem: (key: string) => (key === "lamb-agent-theme" ? "light" : null),
    },
    matchMedia: () => ({ matches: true }),
  };

  assert.equal(getInitialThemePreference(env), "light");
});

test("getInitialThemePreference falls back to dark system preference", () => {
  const env = {
    localStorage: {
      getItem: () => null,
    },
    matchMedia: () => ({ matches: true }),
  };

  assert.equal(getInitialThemePreference(env), "dark");
});

test("applyThemeToDocument synchronously toggles dark class and browser chrome", () => {
  const classes = new Set<string>(["dark"]);
  const metaValues = new Map<string, string>();
  const documentLike = {
    documentElement: {
      classList: {
        add: (name: string) => classes.add(name),
        remove: (name: string) => classes.delete(name),
      },
    },
    querySelector: (selector: string) =>
      selector === 'meta[name="theme-color"]' ||
      selector === 'meta[name="apple-mobile-web-app-status-bar-style"]'
        ? {
            setAttribute: (_name: string, value: string) => {
              metaValues.set(selector, value);
            },
          }
        : null,
  };

  applyThemeToDocument("light", documentLike);

  assert.equal(classes.has("dark"), false);
  assert.equal(metaValues.get('meta[name="theme-color"]'), "#f5f5f4");
  assert.equal(
    metaValues.get('meta[name="apple-mobile-web-app-status-bar-style"]'),
    "default",
  );
});
