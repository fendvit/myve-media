import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import UnreadBadge from "./UnreadBadge";
// The wordmark cropped to its artwork. logo-myve.png is a 1024² canvas with the
// mark filling 5% of it, so at header sizes it renders a few pixels tall — the
// marketing nav compensates with h-32, which no app bar has room for.
import logoMyve from "@/assets/logo-myve-wordmark.png";

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
  /** Client logo. When set it takes the wordmark's place and MYVE is credited under it. */
  logoUrl?: string | null;
}

/**
 * The client's logo, drawn bare — no tile, no plate, in either theme.
 *
 * An earlier version put it on a white rectangle so that a logo drawn for white
 * paper could not disappear against the dark theme. It reads as a sticker
 * pasted onto the header, which is worse than the problem it solves: this is
 * the client's own mark and it should sit in the chrome, not on top of it. A
 * client whose logo is dark-on-transparent will look faint in dark mode — the
 * fix for that is a second, dark-mode logo upload, not a box around this one.
 */
function ClientLogo({ src, alt, className }: { src: string; alt: string; className: string }) {
  return <img src={src} alt={alt} className={`w-auto max-w-full object-contain ${className}`} />;
}

/** Our own mark. Sized by height only — the crop is a fixed 5.05:1. */
function MyveLogo({ className, alt = "MYVE" }: { className: string; alt?: string }) {
  return <img src={logoMyve} alt={alt} className={`w-auto object-contain ${className}`} />;
}

/**
 * Desktop sidebar branding: the client's mark where our wordmark used to be,
 * with ours demoted to a credit line — the portal should read as their project,
 * not our product. The phone header splits these apart instead (see below).
 */
function SidebarBrand({
  logoUrl,
  title,
  subtitle,
}: {
  logoUrl?: string | null;
  title: string;
  subtitle?: string;
}) {
  if (logoUrl) {
    return (
      <div className="min-w-0">
        <ClientLogo src={logoUrl} alt={subtitle ?? title} className="max-h-8" />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
          od <MyveLogo className="h-3.5" />
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <MyveLogo className="h-7" alt={title} />
      {subtitle && <p className="truncate text-sm text-muted-foreground mt-2">{subtitle}</p>}
    </div>
  );
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
  logoUrl,
}: PortalShellProps) {
  return (
    <div className="h-[100dvh] flex bg-background text-foreground overflow-hidden">
      <aside className="hidden lg:flex w-[var(--portal-sidebar-w)] shrink-0 flex-col border-r border-border bg-card">
        <div className="px-5 py-6">
          <SidebarBrand logoUrl={logoUrl} title={title} subtitle={subtitle} />
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

        <div className={`p-3 ${nav.length > 0 ? "border-t border-border" : "mt-auto"}`}>
          <ThemeToggle variant="switch" />
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="lg:hidden shrink-0 border-b border-border bg-card/85 backdrop-blur-md"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          {/* Three slots: ours left, the client's centred, the theme control
              right.

              Equal outer tracks are what centre the middle against the header
              itself rather than against the leftover space. They need an
              explicit floor, though: as a bare `1fr` the track's automatic
              minimum does not hold for a replaced element, and a wide enough
              client logo collapsed our slot to zero — the wordmark disappeared
              outright. `minmax(6rem, 1fr)` clears the 91px mark and cannot be
              squeezed past it. The middle carries min-w-0 so an oversized
              client logo gives way instead of pushing into either neighbour. */}
          <div className="mx-auto w-full max-w-3xl px-4 h-16 grid grid-cols-[minmax(6rem,1fr)_auto_minmax(6rem,1fr)] items-center gap-3">
            <MyveLogo className="h-[18px] shrink-0 justify-self-start" alt={title} />

            <div className="min-w-0 justify-self-center">
              {logoUrl ? (
                <ClientLogo src={logoUrl} alt={subtitle ?? title} className="max-h-8" />
              ) : (
                subtitle && (
                  <p className="truncate text-sm font-medium text-muted-foreground">{subtitle}</p>
                )
              )}
            </div>

            <div className="justify-self-end">
              <ThemeToggle />
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
