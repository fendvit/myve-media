import { cn } from "@/lib/utils";

type DeviceVariant = "phone" | "laptop" | "tablet" | "desktop";

interface DeviceMockupProps {
  variant: DeviceVariant;
  src: string;
  alt?: string;
  className?: string;
  hoverSrc?: string;
  hoverAlt?: string;
}

const variantStyles: Record<DeviceVariant, { wrapper: string; screen: string; bezel: string }> = {
  phone: {
    wrapper: "w-[140px] lg:w-[150px]",
    bezel: "rounded-[24px] p-[8px] pb-[12px]",
    screen: "rounded-[16px] aspect-[9/19.5]",
  },
  tablet: {
    wrapper: "w-[200px] lg:w-[260px]",
    bezel: "rounded-[18px] p-[10px]",
    screen: "rounded-[10px] aspect-[3/4]",
  },
  laptop: {
    wrapper: "w-[280px] lg:w-[360px]",
    bezel: "rounded-t-[12px] p-[8px] pb-[6px]",
    screen: "rounded-[4px] aspect-video",
  },
  desktop: {
    wrapper: "w-[300px] lg:w-[380px]",
    bezel: "rounded-[10px] p-[10px]",
    screen: "rounded-[4px] aspect-video",
  },
};

const DeviceMockup = ({ variant, src, alt = "Project screenshot", className, hoverSrc, hoverAlt }: DeviceMockupProps) => {
  const styles = variantStyles[variant];

  return (
    <div className={cn(styles.wrapper, className)}>
      {/* Device frame */}
      <div
        className={cn(
          styles.bezel,
          "bg-[hsl(var(--foreground)/0.85)] shadow-2xl backdrop-blur-sm border border-[hsl(var(--foreground)/0.15)]"
        )}
      >
        {/* Notch for phone */}
        {variant === "phone" && (
          <div className="flex justify-center mb-1">
            <div className="w-16 h-[5px] rounded-full bg-[hsl(var(--foreground)/0.6)]" />
          </div>
        )}

        {/* Camera dot for laptop/desktop */}
        {(variant === "laptop" || variant === "desktop") && (
          <div className="flex justify-center mb-1">
            <div className="w-[6px] h-[6px] rounded-full bg-[hsl(var(--foreground)/0.4)]" />
          </div>
        )}

        {/* Screen */}
        <div className={cn(styles.screen, "relative overflow-hidden bg-secondary")}>
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
          {hoverSrc && (
            <div className="absolute inset-0 flex items-center justify-center bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out">
              <img
                src={hoverSrc}
                alt={hoverAlt || alt}
                className="max-w-[70%] max-h-[70%] object-contain"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>

      {/* Laptop base / keyboard */}
      {variant === "laptop" && (
        <div className="mx-auto">
          <div className="h-[6px] bg-[hsl(var(--foreground)/0.7)] rounded-b-lg mx-4 border-t border-[hsl(var(--foreground)/0.3)]" />
          <div className="h-[3px] bg-[hsl(var(--foreground)/0.5)] rounded-b-xl mx-8" />
        </div>
      )}

      {/* Desktop stand */}
      {variant === "desktop" && (
        <div className="flex flex-col items-center">
          <div className="w-[30%] h-[20px] bg-[hsl(var(--foreground)/0.6)] border-x border-[hsl(var(--foreground)/0.3)]" />
          <div className="w-[45%] h-[6px] bg-[hsl(var(--foreground)/0.5)] rounded-b-lg" />
        </div>
      )}
    </div>
  );
};

export default DeviceMockup;
