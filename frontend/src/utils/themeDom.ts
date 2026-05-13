export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "lamb-agent-theme";

const THEME_COLORS: Record<Theme, string> = {
  light: "#f5f5f4",
  dark: "#151210",
};

interface ThemePreferenceEnvironment {
  localStorage?: Pick<Storage, "getItem"> | null;
  matchMedia?: (query: string) => Pick<MediaQueryList, "matches">;
}

interface ThemeDocument {
  documentElement: {
    classList: Pick<DOMTokenList, "add" | "remove">;
  };
  querySelector?: (selector: string) => Pick<Element, "setAttribute"> | null;
}

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function getInitialThemePreference(
  env: ThemePreferenceEnvironment = globalThis,
): Theme {
  try {
    const stored = env.localStorage?.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) {
      return stored;
    }

    if (env.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    // Storage or matchMedia can be unavailable in restricted browser contexts.
  }

  return "light";
}

export function applyThemeToDocument(
  theme: Theme,
  doc: ThemeDocument = document,
): void {
  if (theme === "dark") {
    doc.documentElement.classList.add("dark");
  } else {
    doc.documentElement.classList.remove("dark");
  }

  const color = THEME_COLORS[theme];
  doc
    .querySelector?.('meta[name="theme-color"]')
    ?.setAttribute("content", color);
  doc
    .querySelector?.('meta[name="apple-mobile-web-app-status-bar-style"]')
    ?.setAttribute("content", theme === "dark" ? "black" : "default");
}
