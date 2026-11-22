import { useCallback, useEffect, useRef } from "react";
import { motion, transform, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  FRAME_COUNT,
  frameSrc,
  getNearestFrame,
  onFrameLoaded,
  preloadOrbitFrames,
} from "@/lib/orbitFrames";
import ConsultationDialog from "@/components/ConsultationDialog";
import CallLink from "@/components/CallLink";
import GradientRimButton from "@/components/ui/GradientRimButton";

// The offer is on screen from the first paint. The orbit (him turning) still scrubs on
// scroll, but behind the text and over a short pin, not three screens of letters
// (conversion audit 2026-11-22: median visit 8 s, so nothing may wait for a scroll).
const PROOF = ["7+ spuštěných projektů", "Odpověď do 1 pracovního dne", "Web do 14 dní"];

const HeroCopy = () => (
  <div className="container mx-auto px-5 lg:px-12">
    <div className="max-w-xl">
      <p className="text-primary font-display font-medium text-xs tracking-[0.3em] uppercase mb-4">
        Vít Fendrych · MYVE
      </p>
      {/* Not .display-type: that style is all-caps 900, unreadable for a full sentence. */}
      <h1 className="font-display font-bold tracking-[-0.02em] text-foreground text-[clamp(1.75rem,3.6vw,3.4rem)] leading-[1.06]">
        Weby, aplikace a automatizace, které vaší firmě šetří čas a přivádějí zákazníky.
      </h1>
      {/* Hidden on phones so the copy stays below his face; the H1 already says it. */}
      <p className="hidden sm:block text-foreground/80 text-base md:text-lg leading-relaxed mt-5 max-w-2xl">
        Postavíme vám web, aplikaci nebo automatizaci na míru a postaráme se o ně i po spuštění.
        Rozsah, termín i cenu znáte předem.
      </p>
      <div className="mt-7 flex flex-col items-start sm:flex-row gap-3 sm:items-center">
        <ConsultationDialog source="hero">
          <GradientRimButton as="button" variant="filled">
            <span>Konzultace zdarma</span>
            <ArrowRight className="w-5 h-5" aria-hidden />
          </GradientRimButton>
        </ConsultationDialog>
        <CallLink source="hero" />
      </div>
      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-xs font-display uppercase tracking-[0.1em] sm:tracking-[0.18em] text-foreground/70">
        {PROOF.map((item, i) => (
          <li key={item} className="flex items-center gap-5">
            {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-primary" />}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const HeroOrbit = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(0);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const frameProgress = useTransform(scrollYProgress, [0, 1], [0, FRAME_COUNT - 1]);
  // Function transforms opt out of framer's WAAPI scroll handoff, which misbehaves with
  // Lenis-driven pinned sections.
  const copyOpacity = useTransform(scrollYProgress, (v) => transform(v, [0.75, 1], [1, 0]));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = getNearestFrame(frameIndexRef.current);
    if (!img) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }, []);

  useEffect(() => {
    if (reduced) return;
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
  }, [draw, reduced]);

  useEffect(() => {
    if (reduced) return;
    // The poster <img> shows frame 1 at once. The other 107 frames (~6–9 MB) load only
    // once the visitor starts to scroll (or after 4 s on a desktop), so a phone visitor
    // who reads the offer and calls never pays for the animation.
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      preloadOrbitFrames();
      off();
    };
    const events = ["scroll", "wheel", "touchstart", "keydown"] as const;
    const off = () => events.forEach((e) => window.removeEventListener(e, start));
    events.forEach((e) => window.addEventListener(e, start, { passive: true, once: true }));
    const timer = window.innerWidth >= 768 ? window.setTimeout(start, 4000) : undefined;
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
      off();
      if (timer) window.clearTimeout(timer);
    };
  }, [frameProgress, draw, reduced]);

  const poster = (
    <img
      src={frameSrc(0)}
      alt="Vít Fendrych, MYVE"
      // React 18 only passes the lowercase attribute through to the DOM.
      {...{ fetchpriority: "high" }}
      decoding="async"
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
  const vignette = (
    <>
      {/* Text contrast (his note 2026-11-22: copy hard to read over the photo). Phone: the
          lower half is nearly solid behind the copy and fades out above his chest. */}
      <div className="absolute inset-x-0 bottom-0 h-[78%] bg-gradient-to-t from-background from-35% via-background/85 via-60% to-transparent pointer-events-none" />
      {/* Desktop: the copy sits left of him, so the left side goes dark behind it. */}
      <div className="hidden md:block absolute inset-y-0 left-0 w-[70%] bg-gradient-to-r from-background from-20% via-background/75 via-50% to-transparent pointer-events-none" />
    </>
  );

  if (reduced) {
    return (
      <section id="hero" className="relative min-h-[100svh] flex items-end overflow-hidden bg-background">
        {poster}
        {vignette}
        <div className="relative z-10 w-full pb-14 md:pb-20 pt-28">
          <HeroCopy />
        </div>
      </section>
    );
  }

  return (
    <section id="hero" ref={sectionRef} className="relative h-[150svh] md:h-[170vh] bg-background">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {poster}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />
        {vignette}
        <motion.div style={{ opacity: copyOpacity }} className="absolute inset-x-0 bottom-0 pb-10 md:pb-16">
          <HeroCopy />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroOrbit;
