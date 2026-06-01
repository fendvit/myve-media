import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "filled" | "outline";

interface GradientRimButtonProps extends React.HTMLAttributes<HTMLElement> {
  as?: "a" | "button" | "link";
  href?: string;
  to?: string;
  target?: string;
  rel?: string;
  variant?: Variant;
  size?: "md" | "lg";
  rimSpeedSec?: number;
  innerClassName?: string;
  children: React.ReactNode;
  /** Optional render prop to render a custom inner element (e.g. RouterLink) */
  renderInner?: (innerProps: {
    className: string;
    children: React.ReactNode;
  }) => React.ReactNode;
}

/**
 * Wraps any clickable element with a permanently rotating conic-gradient rim.
 * Use `renderInner` for React Router <Link>, otherwise `as="a"` or `as="button"`.
 */
const GradientRimButton = React.forwardRef<HTMLElement, GradientRimButtonProps>(
  (
    {
      as = "button",
      variant = "filled",
      size = "lg",
      rimSpeedSec = 6,
      className,
      innerClassName,
      children,
      renderInner,
      ...rest
    },
    ref
  ) => {
    const padding =
      size === "lg" ? "px-8 py-4 text-base" : "px-6 py-3 text-sm";

    const innerBase = cn(
      "relative z-10 inline-flex items-center justify-center gap-3 rounded-full font-display font-semibold transition-transform duration-300 group-hover:scale-[1.02] active:scale-[0.98] w-full h-full",
      padding,
      variant === "filled"
        ? "text-primary-foreground"
        : "bg-background text-foreground hover:text-foreground",
      innerClassName
    );

    const innerStyle: React.CSSProperties =
      variant === "filled" ? { background: "var(--gradient-primary)" } : {};

    const inner = renderInner ? (
      renderInner({ className: innerBase, children })
    ) : as === "a" ? (
      <a className={innerBase} style={innerStyle} {...(rest as any)}>
        {children}
      </a>
    ) : (
      <button className={innerBase} style={innerStyle} {...(rest as any)}>
        {children}
      </button>
    );

    // For filled variant we still want the rim visible — apply gradient via style on the inner element above.
    // The renderInner / as="a"/"button" cases without filled style need style applied too.
    // Simpler: clone-style approach handled above by passing style on a/button only.
    // For renderInner filled case, consumer should add style themselves OR we wrap with a styled span.
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={cn(
          "group relative inline-flex p-[2px] rounded-full overflow-hidden isolate",
          className
        )}
      >
        {/* Rotating rim — outline variant only */}
        {variant === "outline" && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[180%] -translate-x-1/2 -translate-y-1/2"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary)) 20deg, hsl(var(--accent)) 60deg, transparent 80deg, transparent 180deg, hsl(var(--accent)) 200deg, hsl(var(--primary)) 240deg, transparent 260deg, transparent 360deg)",
                animation: `gradrim-spin ${rimSpeedSec}s linear infinite`,
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full border border-border/60"
            />
          </>
        )}
        {/* Inner button surface */}
        <span
          className={cn(
            "relative z-10 rounded-full",
            variant === "filled" ? "" : "bg-background"
          )}
          style={
            variant === "filled" ? { background: "var(--gradient-primary)" } : undefined
          }
        >
          {inner}
        </span>
      </span>
    );
  }
);
GradientRimButton.displayName = "GradientRimButton";

export default GradientRimButton;
