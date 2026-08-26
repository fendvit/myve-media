import { useCallback, useEffect, useRef, useState } from "react";
import { motion, MotionValue, transform, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { SERVICES_FRAME_COUNT, servicesFrames } from "@/lib/servicesFrames";

const PILLARS = [
  {
    index: "01",
    title: "Weby",
    line: "Web, který prodává, i když spíte.",
    features: ["firemní weby", "landing pages", "e-shopy", "redesign"],
  },
  {
    index: "02",
    title: "Webové aplikace",
    line: "Z procesu, který zdržuje, uděláme systém, který šlape.",
    features: ["SaaS", "dashboardy", "portály", "interní systémy"],
  },
  {
    index: "03",
    title: "Software na míru",
    line: "Když hotová řešení nestačí, postavíme vlastní.",
    features: ["mobilní aplikace", "API integrace", "automatizace"],
  },
];

// Scroll fraction reserved before the clip starts scrubbing, so the section
// header gets breathing room (the clip opens already mid-point).
const SCRUB_START = 0.1;

/**
 * [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd] in scroll progress.
 * Derived from the hold poses in the generated clips (he freezes pointing for
 * ~2s per beat); values map frame ranges through SCRUB_START. The desktop and
 * mobile clips have different choreography, hence separate timings.
 */
type Slice = [number, number, number, number];

const DESKTOP_SLICES: Slice[] = [
  [0.125, 0.165, 0.225, 0.265], // frames ~6-22: points left from right third
  [0.52, 0.56, 0.67, 0.71], // frames ~73-96: points right from left third
  [0.92, 0.96, 1, 1], // frames ~138-150: open palm toward left, holds to end
];

const MOBILE_SLICES: Slice[] = [
  [0.185, 0.23, 0.345, 0.385], // frames ~16-42: points up-left
  [0.5, 0.545, 0.645, 0.685], // frames ~68-92: points up-right
  [0.86, 0.905, 1, 1], // frames ~128-150: both arms raised, holds to end
];

/** Content block pinned to where he points during one hold pose. */
const PillarBlock = ({
  p,
  pillar,
  slice,
  align,
  className,
}: {
  p: MotionValue<number>;
  pillar: (typeof PILLARS)[number];
  slice: Slice;
  align: "left" | "right" | "center";
  className: string;
}) => {
  const [in0, in1, out0, out1] = slice;
  const holdsToEnd = out1 >= 1;
  // Function transforms opt out of framer's WAAPI scroll handoff (see HeroOrbit)
  const opacity = useTransform(p, (v) =>
    transform(v, [in0, in1, out0, out1], [0, 1, 1, holdsToEnd ? 1 : 0])
  );
  const y = useTransform(p, (v) => transform(v, [in0, in1], [28, 0]));
  const lineScale = useTransform(p, (v) => transform(v, [in0, in1], [0, 1]));

  return (
    <motion.div style={{ opacity, y }} className={`${className} pointer-events-none`}>
      {/* Index + coral hairline gesturing toward him */}
      <div
        className={`flex items-center gap-4 ${
          align === "right" ? "flex-row-reverse" : align === "center" ? "justify-center" : ""
        }`}
      >
        <span className="display-type text-primary text-[clamp(1.8rem,4vw,3.4rem)] leading-none">
          {pillar.index}
        </span>
        {align !== "center" && (
          <motion.div
            style={{ scaleX: lineScale }}
            className={`h-px flex-1 max-w-[10rem] bg-primary/60 ${
              align === "right" ? "origin-right" : "origin-left"
            }`}
          />
        )}
      </div>
      <h3 className="display-type text-foreground text-[clamp(2.4rem,6.2vw,6rem)] leading-[0.95] mt-3">
        {pillar.title}
      </h3>
      <p className="text-foreground font-body text-[clamp(1.05rem,2.1vw,1.6rem)] mt-5">
        {pillar.line}
      </p>
      <p className="text-foreground/60 text-[clamp(0.85rem,1.3vw,1.05rem)] font-body mt-4 tracking-wide">
        {pillar.features.join(" · ")}
      </p>
    </motion.div>
  );
};

const PillarsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(0);
  const reduced = useReducedMotion();
  const [isMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const frameProgress = useTransform(scrollYProgress, (v) =>
    transform(v, [SCRUB_START, 1], [0, SERVICES_FRAME_COUNT - 1])
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = servicesFrames.getNearestFrame(frameIndexRef.current);
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

  // Preload once the section approaches the viewport; redraw as frames stream
  // in and as scroll scrubs.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          servicesFrames.preload();
          io.disconnect();
        }
      },
      { rootMargin: "150% 0px 150% 0px" }
    );
    io.observe(section);

    const offLoaded = servicesFrames.onFrameLoaded(() => draw());
    const unsub = frameProgress.on("change", (v) => {
      const next = Math.round(v);
      if (next !== frameIndexRef.current) {
        frameIndexRef.current = next;
        requestAnimationFrame(draw);
      }
    });
    return () => {
      io.disconnect();
      offLoaded();
      unsub();
    };
  }, [frameProgress, draw]);

  const headerOpacity = useTransform(scrollYProgress, (v) =>
    transform(v, [0, 0.06, 0.11], [1, 1, 0])
  );

  if (reduced) {
    return (
      <section id="services" className="relative py-20 bg-background">
        <div className="container mx-auto px-6 lg:px-12 flex flex-col gap-16">
          <p className="text-primary font-display font-medium text-xs tracking-[0.3em] uppercase">
            Služby
          </p>
          <h2 className="display-type text-foreground text-[clamp(1.8rem,4.5vw,3rem)]">
            Stavíme to, co vám ušetří čas a vydělá peníze.
          </h2>
          {PILLARS.map((pillar) => (
            <div key={pillar.index}>
              <span className="display-type text-primary text-5xl block">{pillar.index}</span>
              <h3 className="display-type text-foreground text-4xl mt-2">{pillar.title}</h3>
              <p className="text-muted-foreground mt-3">{pillar.line}</p>
              <p className="text-muted-foreground/70 text-sm mt-2">
                {pillar.features.join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const slices = isMobile ? MOBILE_SLICES : DESKTOP_SLICES;
  // Placement mirrors where he points during each hold (desktop: left / right /
  // left again; mobile: everything lives in the empty top half above him).
  const layouts: { align: "left" | "right" | "center"; className: string }[] = isMobile
    ? [
        { align: "left", className: "absolute top-[10svh] left-6 right-16" },
        { align: "right", className: "absolute top-[10svh] right-6 left-16 text-right" },
        { align: "center", className: "absolute top-[8svh] inset-x-6 text-center" },
      ]
    : [
        {
          align: "left",
          className: "absolute left-[6vw] top-[42%] -translate-y-1/2 w-[min(44rem,46vw)]",
        },
        {
          align: "right",
          className:
            "absolute right-[6vw] top-[42%] -translate-y-1/2 w-[min(44rem,46vw)] text-right",
        },
        {
          align: "left",
          className: "absolute left-[6vw] top-[42%] -translate-y-1/2 w-[min(44rem,46vw)]",
        },
      ];

  return (
    <section id="services" ref={sectionRef} className="relative h-[450vh] bg-background">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* Pointing-choreography scrub — he presents each pillar himself */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-background to-transparent pointer-events-none" />

        {/* Section label */}
        <motion.div
          style={{ opacity: headerOpacity }}
          className="absolute top-[12svh] inset-x-0 text-center md:inset-x-auto md:left-[6vw] md:max-w-[52vw] md:text-left pointer-events-none"
        >
          <p className="text-primary font-display font-medium text-xs tracking-[0.35em] uppercase">
            Služby
          </p>
          <h2 className="display-type text-foreground text-[clamp(2rem,3.8vw,3.4rem)] mt-3">
            Stavíme to, co vám ušetří čas a vydělá peníze.
          </h2>
        </motion.div>

        {PILLARS.map((pillar, i) => (
          <PillarBlock
            key={pillar.index}
            p={scrollYProgress}
            pillar={pillar}
            slice={slices[i]}
            align={layouts[i].align}
            className={layouts[i].className}
          />
        ))}
      </div>
    </section>
  );
};

export default PillarsSection;
