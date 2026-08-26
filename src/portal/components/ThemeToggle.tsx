import { Moon, Sun } from "lucide-react";
import { usePortalTheme } from "../lib/theme";

interface ThemeToggleProps {
  /** `icon` is a bare button for the mobile header; `switch` is a labelled row. */
  variant?: "icon" | "switch";
  className?: string;
}

export default function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { theme, toggle } = usePortalTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Přepnout na světlý režim" : "Přepnout na tmavý režim";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        className={[
          "relative h-9 w-9 shrink-0 grid place-items-center rounded-xl",
          "text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
          className ?? "",
        ].join(" ")}
      >
        {/* Both icons stay mounted and cross-fade, so the button never reflows. */}
        <Sun
          className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
            isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
          }`}
        />
        <Moon
          className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
          }`}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      className={[
        "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
        "text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
        className ?? "",
      ].join(" ")}
    >
      {isDark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
      <span className="flex-1 text-left">{isDark ? "Tmavý režim" : "Světlý režim"}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          isDark ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow-sm transition-transform ${
            isDark ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
