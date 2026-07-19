/**
 * Generic scroll-scrub frame sequence: shared preloader + cache + nearest-frame
 * lookup. Instances are created per sequence (hero orbit, services) so each
 * keeps its own cache and load state.
 */

export type FrameVariant = "desktop" | "mobile";

const isMobileViewport = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

export interface FrameSequence {
  count: number;
  frameSrc: (index: number) => string;
  onFrameLoaded: (cb: () => void) => () => void;
  preload: () => Promise<void>;
  getNearestFrame: (index: number) => HTMLImageElement | null;
  firstFrame: () => HTMLImageElement | null;
}

export const createFrameSequence = (opts: {
  count: number;
  src: (index: number, variant: FrameVariant) => string;
}): FrameSequence => {
  const { count } = opts;

  // Variant is resolved once so a mid-session resize can't mix frame sets.
  let variant: FrameVariant | null = null;
  const frameSrc = (index: number) => {
    if (!variant) variant = isMobileViewport() ? "mobile" : "desktop";
    return opts.src(index, variant);
  };

  const cache: (HTMLImageElement | null)[] = new Array(count).fill(null);
  const loading = new Set<number>();
  let started = false;
  const listeners = new Set<() => void>();

  const onFrameLoaded = (cb: () => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  };

  const notify = () => listeners.forEach((cb) => cb());

  const loadFrame = (index: number) =>
    new Promise<void>((resolve) => {
      if (cache[index] || loading.has(index)) return resolve();
      loading.add(index);
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        cache[index] = img;
        loading.delete(index);
        notify();
        resolve();
      };
      img.onerror = () => {
        loading.delete(index);
        resolve();
      };
      img.src = frameSrc(index);
    });

  /**
   * Two-pass preload: every 6th frame first so coarse scrubbing works almost
   * immediately, then the full set fills in the gaps.
   */
  const preload = async () => {
    if (started || typeof window === "undefined") return;
    started = true;

    const coarse: number[] = [];
    for (let i = 0; i < count; i += 6) coarse.push(i);
    await Promise.all(coarse.map(loadFrame));

    const fine: number[] = [];
    for (let i = 0; i < count; i++) if (!cache[i]) fine.push(i);
    // limited concurrency to keep the main thread and network responsive
    const CONCURRENCY = 8;
    let cursor = 0;
    const worker = async () => {
      while (cursor < fine.length) {
        const idx = fine[cursor++];
        await loadFrame(idx);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  };

  /** Nearest already-loaded frame to the requested index (for gap-free scrubbing). */
  const getNearestFrame = (index: number): HTMLImageElement | null => {
    const i = Math.max(0, Math.min(count - 1, Math.round(index)));
    if (cache[i]) return cache[i];
    for (let d = 1; d < count; d++) {
      if (cache[i - d]) return cache[i - d];
      if (cache[i + d]) return cache[i + d];
    }
    return null;
  };

  return {
    count,
    frameSrc,
    onFrameLoaded,
    preload,
    getNearestFrame,
    firstFrame: () => getNearestFrame(0),
  };
};
