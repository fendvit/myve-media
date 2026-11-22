import type { ReactNode } from "react";
import { Phone } from "lucide-react";
import GradientRimButton from "@/components/ui/GradientRimButton";
import { BUSINESS } from "@/seo/content";
import { FUNNEL_EVENTS, track } from "@/lib/track";

/**
 * "Call us" next to every consultation CTA. Small firms often prefer a call to a form,
 * and the number used to be only in the footer. Every tap is a `call_click` in analytics.
 */
const CallLink = ({
  source,
  variant = "outline",
  size = "lg",
  className,
  children,
}: {
  source: string;
  variant?: "filled" | "outline";
  size?: "md" | "lg";
  className?: string;
  children?: ReactNode;
}) => (
  <GradientRimButton
    as="a"
    href={`tel:${BUSINESS.phone}`}
    variant={variant}
    size={size}
    className={className}
    onClick={() => track(FUNNEL_EVENTS.callClick, { source })}
  >
    <Phone className="w-4 h-4" aria-hidden />
    <span>{children ?? `Zavolat ${BUSINESS.phoneDisplay}`}</span>
  </GradientRimButton>
);

export default CallLink;
