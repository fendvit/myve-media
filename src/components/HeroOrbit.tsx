import { useCallback, useEffect, useRef } from "react";
import { motion, MotionValue, transform, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  FRAME_COUNT,
  getNearestFrame,
  onFrameLoaded,
  preloadOrbitFrames,
} from "@/lib/orbitFrames";

const NAME = "VÍT FENDRYCH";

/** Single letter that tracks in as the orbit scrubs. */
const ScrubLetter = ({
  p,
  char,
  start,
  end,
}: {
  p: MotionValue<number>;
  char: string;
  start: number;
  end: number;
}) => {
  // Function transforms opt out of framer's WAAPI scroll handoff, which
  // misbehaves with Lenis-driven pinned sections (frozen keyframe values).
  const opacity = useTransform(p, (v) => transform(v, [start, end], [0, 1]));
  const y = useTransform(p, (v) => transform(v, [start, end], ["0.35em", "0em"]));
  return (
    <motion.span style={{ opacity, y }} className="inline-block">
      {char === " " ? " " : char}
    </motion.span>
  );
};

const HeroOrbit = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(0);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Orbit scrub spans the whole pinned range
  const frameProgress = useTransform(scrollYProgress, [0, 1], [0, FRAME_COUNT - 1]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = getNearestFrame(frameIndexRef.current);
    if (!img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    // cover-fit
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }, []);

  // Canvas sizing (devicePixelRatio capped at 2 for perf)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
    };
  }, [draw]);

  // Preload + redraw as frames stream in and as scroll scrubs
  useEffect(() => {
    preloadOrbitFrames();
    const offLoaded = onFrameLoaded(() => draw());
    const unsub = frameProgress.on("change", (v) => {
      const next = Math.round(v);
      if (next !== frameIndexRef.current) {
        frameIndexRef.current = next;
        requestAnimationFrame(draw);
      }
    });
    return () => {
      offLoaded();
      unsub();
    };
  }, [frameProgress, draw]);

  // ---- Kinetic type timings (fractions of the pinned scroll range) ----
  const words = NAME.split(" ");
  const totalLetters = NAME.replace(/ /g, "").length;
  const nameStart = 0.02;
  const nameEnd = 0.38;
  const perLetter = (nameEnd - nameStart) / totalLetters;

  const nameOpacity = useTransform(scrollYProgress, (v) => transform(v, [0.42, 0.5], [1, 0]));
  const nameScale = useTransform(scrollYProgress, (v) => transform(v, [0.42, 0.5], [1, 0.96]));

  const myveOpacity = useTransform(scrollYProgress, (v) =>
    transform(v, [0.52, 0.62, 0.92, 1], [0, 1, 1, 0])
  );
  const myveY = useTransform(scrollYProgress, (v) => transform(v, [0.52, 0.62], ["0.4em", "0em"]));

  const hintOpacity = useTransform(scrollYProgress, (v) => transform(v, [0, 0.04], [1, 0]));

  if (reduced) {
    // Static fallback: first frame as image + headline, no pinning
    return (
      <section id="hero" className="relative min-h-[100svh] flex items-end overflow-hidden bg-background">
        <img
          src="/frames/desktop/orbit_001.webp"
          alt="Vít Fendrych — MYVE"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="relative z-10 container mx-auto px-6 lg:px-12 pb-20">
          <h1 className="display-type text-[clamp(2.6rem,10vw,8rem)] text-foreground">{NAME}</h1>
          <p className="text-muted-foreground text-lg mt-4 max-w-xl">
            Weby, aplikace a software, které vydělávají.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="hero" ref={sectionRef} className="relative h-[300vh] bg-background">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />
        {/* Bottom vignette so type always reads over the frame */}
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />

        {/* Phase A — VÍT FENDRYCH tracks in letter by letter */}
        <motion.div
          style={{ opacity: nameOpacity, scale: nameScale }}
          className="absolute inset-x-0 bottom-[12svh] px-4 text-center pointer-events-none"
        >
          <h1 className="display-type text-foreground text-[clamp(2.2rem,10.5vw,9.5rem)] leading-[0.95] flex flex-wrap justify-center gap-x-[0.28em]">
            {(() => {
              let gi = 0;
              return words.map((word, wi) => (
                <span key={wi} className="inline-flex">
                  {word.split("").map((char, ci) => {
                    const idx = gi++;
                    return (
                      <ScrubLetter
                        key={ci}
                        p={scrollYProgress}
                        char={char}
                        start={nameStart + idx * perLetter}
                        end={nameStart + (idx + 1) * perLetter}
                      />
                    );
                  })}
                </span>
              ));
            })()}
          </h1>
        </motion.div>

        {/* Phase B — MYVE + subtitle */}
        <motion.div
          style={{ opacity: myveOpacity }}
          className="absolute inset-x-0 bottom-[10svh] px-4 text-center pointer-events-none"
        >
          <motion.h2
            style={{ y: myveY }}
            className="display-type wordmark-myve text-[clamp(4rem,18vw,16rem)]"
          >
            MYVE
          </motion.h2>
          <p className="text-foreground/90 font-body text-[clamp(1rem,2.4vw,1.5rem)] mt-3 md:mt-5">
            Weby, aplikace a software, které vydělávají.
          </p>
          <p className="text-primary font-display font-medium text-[11px] md:text-xs tracking-[0.35em] uppercase mt-4">
            Making You Visible Everywhere
          </p>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="absolute bottom-6 inset-x-0 flex flex-col items-center gap-2 text-muted-foreground pointer-events-none"
        >
          <span className="text-[10px] uppercase tracking-[0.35em] font-display">Scrollujte</span>
          <span className="block w-px h-8 bg-gradient-to-b from-primary to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroOrbit;
