import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { usePortalSession } from "../lib/session";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Match only the exact path — used for the index route. */
  end?: boolean;
}

interface PortalShellProps {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  children: ReactNode;
  /** Chat manages its own scrolling, so it opts out of the padded scroll area. */
  fullBleed?: boolean;
}

export default function PortalShell({
  title,
  subtitle,
  nav,
  children,
  fullBleed = false,
}: PortalShellProps) {
  const { signOut } = usePortalSession();

  return (
    <div className="h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden">
      <header className="shrink-0 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-3xl px-4 h-16 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display font-bold text-lg leading-tight truncate">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={signOut}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-2 -mr-2"
            aria-label="Odhlásit se"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main
        className={
          fullBleed
            ? "flex-1 min-h-0 mx-auto w-full max-w-3xl"
            : "flex-1 min-h-0 overflow-y-auto"
        }
      >
        {fullBleed ? children : <div className="mx-auto w-full max-w-3xl px-4 py-5">{children}</div>}
      </main>

      {nav.length > 0 && (
        <nav
          className="shrink-0 border-t border-border bg-card"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div
            className="mx-auto w-full max-w-3xl grid"
            style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
          >
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  ].join(" ")
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
