import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PortalTheme = "light" | "dark";

/** Shared with the inline bootstrap in portal.html — keep the two in step. */
export const THEME_STORAGE_KEY = "myve-portal-theme";

/** Clients get daylight by default; dark is opt-in via the switch. */
export const DEFAULT_THEME: PortalTheme = "light";

const THEME_COLORS: Record<PortalTheme, string> = {
  light: "#f8f5f0",
  dark: "#0a0a0b",
};

interface ThemeValue {
  theme: PortalTheme;
  setTheme: (theme: PortalTheme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function readStoredTheme(): PortalTheme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Safari in private mode throws on localStorage access.
  }
  return DEFAULT_THEME;
}

function applyTheme(theme: PortalTheme) {
  document.documentElement.dataset.portalTheme = theme;

  // Drives the status bar tint on Android and the installed PWA.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
}

export function PortalThemeProvider({ children }: { children: ReactNode }) {
  // The inline script in portal.html has already painted the right theme, so
  // read back from the DOM rather than guessing again and risking a flip.
  const [theme, setThemeState] = useState<PortalTheme>(() => {
    if (typeof document === "undefined") return DEFAULT_THEME;
    const applied = document.documentElement.dataset.portalTheme;
    return applied === "light" || applied === "dark" ? applied : readStoredTheme();
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Non-fatal: the theme just won't survive a reload.
    }
  }, [theme]);

  const setTheme = useCallback((next: PortalTheme) => setThemeState(next), []);
  const toggle = useCallback(
    () => setThemeState((current) => (current === "light" ? "dark" : "light")),
    [],
  );

  const value = useMemo<ThemeValue>(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function usePortalTheme(): ThemeValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("usePortalTheme must be used inside <PortalThemeProvider>");
  }
  return context;
}
