import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type DeviceVariant = "phone" | "laptop" | "tablet" | "desktop";

interface DeviceMockupProps {
  variant: DeviceVariant;
  src: string;
  alt?: string;
  className?: string;
  hoverSrc?: string;
  hoverAlt?: string;
  /** Domain shown in the browser URL pill, e.g. "realflows.cz". */
  label?: string;
}

const HoverReveal = ({ hoverSrc, hoverAlt }: { hoverSrc?: string; hoverAlt?: string }) =>
  hoverSrc ? (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/95 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out">
      <img
        src={hoverSrc}
        alt={hoverAlt}
        className="max-w-[62%] max-h-[62%] object-contain"
        loading="lazy"
      />
    </div>
  ) : null;

/** Premium floating browser window — used for all web projects. */
const BrowserFrame = ({ src, alt, hoverSrc, hoverAlt, label }: Omit<DeviceMockupProps, "variant" | "className">) => (
  <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[hsl(var(--card))] shadow-[0_2px_8px_hsl(240_5%_0%/0.5),0_30px_60px_-15px_hsl(240_5%_0%/0.7)] transition-transform duration-500 ease-out group-hover:-translate-y-1.5">
    {/* Toolbar */}
    <div className="flex h-9 items-center gap-3 border-b border-white/[0.06] bg-[hsl(var(--secondary))] px-4">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
      </div>
      <div className="flex h-5 min-w-0 flex-1 items-center gap-1.5 rounded-full bg-background/60 px-3">
        <Lock className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
        <span className="truncate font-body text-[10px] text-muted-foreground">
          {label || "www"}
        </span>
      </div>
    </div>
    {/* Screen */}
    <div className="relative aspect-video overflow-hidden bg-secondary">
      <img src={src} alt={alt} className="h-full w-full object-cover object-top" loading="lazy" />
      <HoverReveal hoverSrc={hoverSrc} hoverAlt={hoverAlt} />
    </div>
  </div>
);

/** Modern edge-to-edge phone — used for app projects. */
const PhoneFrame = ({ src, alt, hoverSrc, hoverAlt }: Omit<DeviceMockupProps, "variant" | "className" | "label">) => (
  <div className="mx-auto w-[170px] rounded-[2.2rem] border border-white/10 bg-[hsl(var(--card))] p-2 shadow-[0_2px_8px_hsl(240_5%_0%/0.5),0_30px_60px_-15px_hsl(240_5%_0%/0.7)] transition-transform duration-500 ease-out group-hover:-translate-y-1.5">
    <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.6rem] bg-secondary">
      {/* Dynamic island */}
      <div className="absolute left-1/2 top-2 z-30 h-4 w-16 -translate-x-1/2 rounded-full bg-black/90" />
      <img src={src} alt={alt} className="h-full w-full object-cover object-top" loading="lazy" />
      <HoverReveal hoverSrc={hoverSrc} hoverAlt={hoverAlt} />
    </div>
  </div>
);

const DeviceMockup = ({ variant, className, ...media }: DeviceMockupProps) => (
  <div className={cn("w-full", className)}>
    {variant === "phone" ? <PhoneFrame {...media} /> : <BrowserFrame {...media} />}
  </div>
);

export default DeviceMockup;
