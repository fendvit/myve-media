import * as React from "react";
import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {}

const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
BentoGrid.displayName = "BentoGrid";

interface BentoCardProps {
  name: string;
  className?: string;
  background?: React.ReactNode;
  Icon: React.ElementType;
  description: string;
  href?: string;
  cta?: string;
}

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: BentoCardProps) => (
  <div
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl",
      "bg-card border border-border",
      "transition-all hover:shadow-lg",
      className
    )}
    style={{ boxShadow: "var(--shadow-card)" }}
  >
    <div
      className="pointer-events-none absolute top-0 left-0 right-0 h-[58%] z-0 overflow-hidden bg-gradient-to-b from-primary/[0.06] via-accent/[0.04] to-transparent"
      style={{
        WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
        maskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
      }}
    >
      {background}
    </div>
    <div className="relative z-10 flex flex-col justify-end h-full p-6">
      <Icon className="h-10 w-10 text-primary mb-3 origin-left transition-all duration-300 ease-in-out group-hover:scale-75" />
      <h3 className="font-display text-lg font-semibold mb-1">{name}</h3>
      <p className="text-muted-foreground text-sm max-w-lg">{description}</p>
      {cta && href && (
        <a
          href={href}
          className="mt-3 inline-flex items-center gap-1 text-sm text-primary font-medium opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
        >
          {cta} <ArrowRightIcon className="h-4 w-4" />
        </a>
      )}
    </div>
    <div className="pointer-events-none absolute inset-0 transition-all duration-300 group-hover:bg-muted/5" />
  </div>
);

export { BentoGrid, BentoCard };
