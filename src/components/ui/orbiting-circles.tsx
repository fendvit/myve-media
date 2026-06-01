import * as React from "react";
import { cn } from "@/lib/utils";

interface OrbitingCirclesProps extends React.HTMLAttributes<HTMLDivElement> {
  radius?: number;
  duration?: number;
  delay?: number;
  reverse?: boolean;
  path?: boolean;
}

const OrbitingCircles = React.forwardRef<HTMLDivElement, OrbitingCirclesProps>(
  (
    {
      className,
      children,
      radius = 50,
      duration = 20,
      delay = 10,
      reverse = false,
      path = true,
      ...props
    },
    ref
  ) => {
    return (
      <>
        {path && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            className="pointer-events-none absolute inset-0 size-full"
          >
            <circle
              className="stroke-foreground/10 stroke-1"
              cx="50%"
              cy="50%"
              r={radius}
              fill="none"
            />
          </svg>
        )}
        <div
          ref={ref}
          className={cn(
            "absolute flex size-full transform-gpu animate-orbit items-center justify-center rounded-full",
            { "[animation-direction:reverse]": reverse },
            className
          )}
          style={
            {
              "--duration": duration,
              "--radius": radius,
              "--delay": -delay,
            } as React.CSSProperties
          }
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);

OrbitingCircles.displayName = "OrbitingCircles";

export { OrbitingCircles };
