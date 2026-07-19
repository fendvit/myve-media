/**
 * Hero orbit frame sequence.
 * The EntranceLoader kicks off preloading on mount so the orbit is
 * scrubbable the moment the loader reveals the page.
 */
import { createFrameSequence } from "@/lib/frameSequence";

// The captured sequence runs slightly past a full 360° (frames 109-121 over-
// rotate to a side profile). We stop at 108, where he faces front again, so the
// scrub lands on a clean forward-facing pose instead of drifting off to the side.
export const FRAME_COUNT = 108;

const pad = (n: number) => String(n).padStart(3, "0");

const orbit = createFrameSequence({
  count: FRAME_COUNT,
  src: (index, variant) => `/frames/${variant}/orbit_${pad(index + 1)}.webp`,
});

export const frameSrc = orbit.frameSrc;
export const onFrameLoaded = orbit.onFrameLoaded;
export const preloadOrbitFrames = orbit.preload;
export const getNearestFrame = orbit.getNearestFrame;
export const firstFrame = orbit.firstFrame;
