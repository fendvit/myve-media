/**
 * Services (PillarsSection) pointing-choreography frame sequence.
 * Unlike the hero orbit, the mobile variant is a separate 9:16 clip with its
 * own choreography (he points up instead of sideways), not a downscale of the
 * desktop frames — so beat timings differ per variant (see PillarsSection).
 */
import { createFrameSequence } from "@/lib/frameSequence";

export const SERVICES_FRAME_COUNT = 150;

const pad = (n: number) => String(n).padStart(3, "0");

export const servicesFrames = createFrameSequence({
  count: SERVICES_FRAME_COUNT,
  src: (index, variant) => `/frames/${variant}/services_${pad(index + 1)}.webp`,
});
