import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import UnreadBadge from "./UnreadBadge";
import { usePortalSession } from "../lib/session";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Match only the exact path — used for the index route. */
  end?: boolean;
  /** Unread count shown on the icon. Zero renders nothing. */
  badge?: number;
}

interface PortalShellProps {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  children: ReactNode;
  /** Chat manages its own scrolling, so it opts out of the padded scroll area. */
  fullBleed?: boolean;
}

/**
 * Two shells, one component.
 *
 * Under `lg` it is a phone app: compact top bar, thumb-reachable tab bar pinned
 * to the bottom, safe-area insets for the installed PWA. From `lg` up it is a
 * desktop app: persistent left sidebar, no bottom bar, a wider content column.
 * Same routes and same components either way — only the chrome differs.
 */
export default function PortalShell({
  title,
  subtitle,
  nav,
  children,
  fullBleed = false,
}: PortalShellProps) {
  const { signOut } = usePortalSession();

  return (
    <div className="h-[100dvh] flex bg-background text-foreground overflow-hidden">
      <aside className="hidden lg:flex w-[268px] shrink-0 flex-col border-r border-border bg-card">
        <div className="px-5 py-6">
          <p className="display-type wordmark-myve text-3xl">{title}</p>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        {nav.length > 0 && (
          <nav className="flex-1 min-h-0 overflow-y-auto px-3 space-y-1">
            {nav.map(({ to, label, icon: Icon, end, badge = 0 }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/12 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1">{label}</span>
                    {/* The count replaces the active dot when there is one —
                        two markers on one row would just compete. */}
                    {badge > 0 ? (
                      <UnreadBadge count={badge} variant="inline" />
                    ) : (
                      isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        )}

        <div className={`p-3 space-y-1 ${nav.length > 0 ? "border-t border-border" : "mt-auto"}`}>
          <ThemeToggle variant="switch" />
          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Odhlásit se
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="lg:hidden shrink-0 border-b border-border bg-card/85 backdrop-blur-md"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="mx-auto w-full max-w-3xl px-4 h-16 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="display-type wordmark-myve text-xl leading-none">{title}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate mt-1">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <ThemeToggle />
              <button
                type="button"
                onClick={signOut}
                className="h-9 w-9 grid place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Odhlásit se"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </header>

        <main
          className={
            fullBleed
              ? "flex-1 min-h-0 mx-auto w-full max-w-3xl lg:max-w-none"
              : "flex-1 min-h-0 overflow-y-auto"
          }
        >
          {fullBleed ? (
            children
          ) : (
            <div className="mx-auto w-full max-w-3xl lg:max-w-5xl px-4 py-5 lg:px-10 lg:py-9">
              {children}
            </div>
          )}
        </main>

        {/* A one-entry tab bar is just a wide button, so the phone layout drops
            it and relies on in-page navigation. The sidebar still shows it. */}
        {nav.length > 1 && (
          <nav
            className="lg:hidden shrink-0 border-t border-border bg-card"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div
              className="mx-auto w-full max-w-3xl grid"
              style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
            >
              {nav.map(({ to, label, icon: Icon, end, badge = 0 }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    [
                      "relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute top-0 h-0.5 w-10 rounded-full bg-primary" />
                      )}
                      {/* Wrapper so the badge pins to the icon, not the cell. */}
                      <span className="relative">
                        <Icon className="h-5 w-5" />
                        <UnreadBadge count={badge} />
                      </span>
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
