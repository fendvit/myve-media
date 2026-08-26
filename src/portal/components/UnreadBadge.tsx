interface UnreadBadgeProps {
  count: number;
  /**
   * `pin` floats the badge over an icon (phone-style); `inline` sits in a row
   * of content and keeps its place in the layout.
   */
  variant?: "pin" | "inline";
  className?: string;
}

/** The phone-style unread count. Renders nothing at zero. */
export default function UnreadBadge({
  count,
  variant = "pin",
  className,
}: UnreadBadgeProps) {
  if (count <= 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      // The number alone reads as "9" to a screen reader; say what it counts.
      aria-label={`${count} nepřečtených`}
      className={[
        "grid place-items-center rounded-full bg-primary text-primary-foreground",
        "text-[10px] font-bold leading-none tabular-nums",
        // Round at one digit, stretch into a pill from two.
        "h-[18px] min-w-[18px] px-1",
        variant === "pin"
          ? "absolute -top-1.5 -right-2 ring-2 ring-card"
          : "shrink-0",
        className ?? "",
      ].join(" ")}
    >
      {label}
    </span>
  );
}
