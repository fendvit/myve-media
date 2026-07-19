import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { preloadOrbitFrames } from "@/lib/orbitFrames";

type Phase = "drift" | "converge" | "reveal";

const ORANGE = "#FF5D42";
const PINK = "#D83D7C";

// 4 polygons that together form the M (viewBox 260 x 220).
// Symmetric splayed M: the left leg tilts right and the right leg tilts
// left — mirror images about the center — so both feet kick outward and
// the M is widest at the bottom.
const POLYGONS = [
  "40,0 80,0 40,220 0,220",        // outer-left  (tilts right, foot kicks out left)
  "80,0 120,0 150,175 110,175",    // inner-left  (top-left → bottom-center)
  "140,0 180,0 150,175 110,175",   // inner-right (top-right → bottom-center)
  "180,0 220,0 260,220 220,220",   // outer-right (tilts left, foot kicks out right)
];

// Random helpers
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const sign = () => (Math.random() < 0.5 ? -1 : 1);

const EntranceLoader = () => {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<Phase>("drift");

  // Pre-compute drift paths and entry positions per polygon (stable per mount)
  const driftData = useMemo(
    () =>
      POLYGONS.map(() => {
        // Off-screen entry direction
        const entryX = sign() * rand(700, 1100);
        const entryY = sign() * rand(500, 800);
        const entryRot = sign() * rand(60, 140);

        // Drift waypoints — visible viewport units (vw/vh)
        const path = {
          x: [
            rand(-35, 35),
            rand(-35, 35),
            rand(-35, 35),
            rand(-35, 35),
          ],
          y: [
            rand(-30, 30),
            rand(-30, 30),
            rand(-30, 30),
            rand(-30, 30),
          ],
          rotate: [
            rand(-180, 180),
            rand(-180, 180),
            rand(-180, 180),
            rand(-180, 180),
          ],
          duration: rand(8, 12),
        };
        return { entryX, entryY, entryRot, path };
      }),
    []
  );

  // Start streaming the hero orbit frames while the M drifts,
  // so the orbit is scrubbable the moment the page is revealed.
  useEffect(() => {
    preloadOrbitFrames();
  }, []);

  // Lock scroll while visible
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  // Phase orchestration
  useEffect(() => {
    if (!visible) return;

    const minDuration = new Promise<void>((r) => setTimeout(r, 3500));
    const windowLoad =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((r) =>
            window.addEventListener("load", () => r(), { once: true })
          );

    Promise.all([minDuration, windowLoad]).then(() => {
      setPhase("converge");
      setTimeout(() => setPhase("reveal"), 2700);
    });
  }, [visible]);

  if (!visible) return null;

  const sweepDuration = 0.9;
  const fadeDuration = 0.9;

  return (
    <AnimatePresence>
      <motion.div
        key="entrance-loader"
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        style={{ background: "#0A0A0B" }}
        initial={{ opacity: 1 }}
        animate={
          phase === "reveal"
            ? { opacity: 0, scale: 1.15 }
            : { opacity: 1, scale: 1 }
        }
        transition={{ duration: fadeDuration, ease: [0.6, 0.05, 0.2, 1] }}
        onAnimationComplete={() => {
          if (phase === "reveal") setVisible(false);
        }}
      >
        {/* Centered M box — each polygon is rendered at its final position
            inside its own absolutely-positioned SVG layer; we animate the
            layer's translate/rotate to drift or converge. */}
        <div
          className="relative"
          style={{
            width: "min(60vw, 320px)",
            aspectRatio: "260 / 220",
          }}
        >
          {POLYGONS.map((points, i) => {
            const d = driftData[i];

            const initial = reduceMotion
              ? { x: 0, y: 0, rotate: 0, opacity: 0 }
              : { x: d.entryX, y: d.entryY, rotate: d.entryRot, opacity: 0 };

            let animate: any;
            let transition: any;

            if (reduceMotion) {
              animate = { x: 0, y: 0, rotate: 0, opacity: 1 };
              transition = { duration: 0.6 };
            } else if (phase === "drift") {
              // Use vw/vh-like units via custom CSS — but framer-motion expects
              // numbers in px. We approximate "viewport drift" by converting
              // the path values from vw/vh to px at mount time.
              const vw = window.innerWidth / 100;
              const vh = window.innerHeight / 100;
              animate = {
                x: d.path.x.map((v) => v * vw),
                y: d.path.y.map((v) => v * vh),
                rotate: d.path.rotate,
                opacity: 1,
              };
              transition = {
                opacity: { duration: 0.8, ease: "easeOut" },
                x: {
                  duration: d.path.duration,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "mirror",
                },
                y: {
                  duration: d.path.duration * 1.1,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "mirror",
                },
                rotate: {
                  duration: d.path.duration * 1.3,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "mirror",
                },
              };
            } else {
              // converge & reveal — slow glide to final position
              animate = { x: 0, y: 0, rotate: 0, opacity: 1 };
              transition = {
                duration: 1.8,
                ease: [0.65, 0, 0.35, 1],
                delay: i * 0.15,
              };
            }

            return (
              <motion.div
                key={i}
                className="absolute inset-0"
                initial={initial}
                animate={animate}
                transition={transition}
                style={{ willChange: "transform" }}
              >
                <svg
                  viewBox="0 0 260 220"
                  width="100%"
                  height="100%"
                  style={{ overflow: "visible" }}
                >
                  <defs>
                    <linearGradient
                      id={`mGrad-${i}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor={ORANGE} />
                      <stop offset="100%" stopColor={PINK} />
                    </linearGradient>
                  </defs>
                  <polygon points={points} fill={`url(#mGrad-${i})`} />
                </svg>
              </motion.div>
            );
          })}

          {/* Gradient sweep across the assembled M during reveal */}
          {phase === "reveal" && !reduceMotion && (
            <svg
              viewBox="0 0 260 220"
              className="absolute inset-0 pointer-events-none"
              width="100%"
              height="100%"
            >
              <defs>
                <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                <clipPath id="mClipReveal">
                  {POLYGONS.map((p, i) => (
                    <polygon key={i} points={p} />
                  ))}
                </clipPath>
              </defs>
              <g clipPath="url(#mClipReveal)">
                <motion.rect
                  y={-20}
                  width={140}
                  height={260}
                  fill="url(#sweepGrad)"
                  initial={{ x: -180 }}
                  animate={{ x: 320 }}
                  transition={{ duration: sweepDuration, ease: "easeInOut" }}
                />
              </g>
            </svg>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EntranceLoader;
