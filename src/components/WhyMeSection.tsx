import { motion, useInView, useReducedMotion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  MousePointerClick,
  Zap,
  Activity,
  CalendarCheck2,
  BellRing,
  Clock,
  Check,
  TrendingUp,
} from "lucide-react";
import TextReveal from "@/components/ui/TextReveal";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";

/* -------------------------------------------------------------------------- */
/*  Shared shell                                                              */
/* -------------------------------------------------------------------------- */

const PreviewShell = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 flex items-start justify-center px-6 pt-6 opacity-90 transition-opacity group-hover:opacity-100">
    <div className="w-full rounded-2xl border border-border/50 bg-background/80 p-4 backdrop-blur-sm relative overflow-hidden">
      {children}
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  1 — Conversion moment                                                     */
/* -------------------------------------------------------------------------- */

const ConversionMomentPreview = () => {
  const reduced = useReducedMotion();
  return (
    <PreviewShell>
      <div className="flex flex-col items-center justify-center gap-5 py-2">
        {/* CTA button mock with pulsing glow */}
        <motion.div
          className="relative inline-flex items-center gap-2 px-5 py-3 rounded-full text-primary-foreground text-sm font-display font-semibold"
          style={{ background: "var(--gradient-primary)" }}
          animate={
            reduced
              ? undefined
              : { boxShadow: ["0 8px 22px hsl(var(--primary) / 0.25)", "0 12px 30px hsl(var(--primary) / 0.45)", "0 8px 22px hsl(var(--primary) / 0.25)"] }
          }
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          Získat konzultaci
          <MousePointerClick className="w-4 h-4" />
        </motion.div>

        {/* Floating notification */}
        <motion.div
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background px-3 py-2 shadow-md w-[88%] max-w-[280px]"
          initial={{ opacity: 0, y: -10 }}
          animate={reduced ? { opacity: 1, y: 0 } : { opacity: [0, 1, 1, 0], y: [-10, 0, 0, -6] }}
          transition={{ duration: 4, times: [0, 0.15, 0.85, 1], repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
            <BellRing className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-foreground leading-tight">Nová poptávka</p>
            <p className="text-[10px] text-muted-foreground">právě teď</p>
          </div>
          <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">+1</span>
        </motion.div>
      </div>
    </PreviewShell>
  );
};

/* -------------------------------------------------------------------------- */
/*  2 — Performance chart                                                     */
/* -------------------------------------------------------------------------- */

const PerformanceChartPreview = () => {
  const reduced = useReducedMotion();
  return (
    <PreviewShell>
      <div className="flex items-center gap-4">
        {/* Chart */}
        <div className="flex-1 min-w-0">
          <svg viewBox="0 0 200 90" className="w-full h-[90px]">
            <defs>
              <linearGradient id="perfStroke" x1="0" x2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
              <linearGradient id="perfFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d="M0 70 L30 60 L60 65 L90 45 L120 50 L150 25 L180 18 L200 8"
              fill="none"
              stroke="url(#perfStroke)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={reduced ? { pathLength: 1 } : { pathLength: [0, 1, 1] }}
              transition={{ duration: 4, times: [0, 0.7, 1], repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M0 70 L30 60 L60 65 L90 45 L120 50 L150 25 L180 18 L200 8 L200 90 L0 90 Z"
              fill="url(#perfFill)"
              initial={{ opacity: 0 }}
              animate={reduced ? { opacity: 1 } : { opacity: [0, 0.9, 0.9] }}
              transition={{ duration: 4, times: [0, 0.7, 1], repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* Metrics */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <motion.div
            className="flex items-baseline gap-1"
            animate={reduced ? undefined : { y: [0, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-2xl text-foreground">+34</span>
            <span className="font-display font-bold text-base text-foreground">%</span>
          </motion.div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">konverze</span>
          <motion.span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-semibold"
            animate={reduced ? undefined : { opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Zap className="w-3 h-3 fill-primary" />
            100/100
          </motion.span>
        </div>
      </div>
    </PreviewShell>
  );
};

/* -------------------------------------------------------------------------- */
/*  3 — Live traffic                                                          */
/* -------------------------------------------------------------------------- */

const LiveCounter = () => {
  const reduced = useReducedMotion();
  const [val, setVal] = useState(15420);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setVal((v) => {
        const delta = Math.floor(Math.random() * 9) - 3; // -3..+5
        return Math.max(15380, Math.min(15480, v + delta));
      });
    }, 1400);
    return () => clearInterval(id);
  }, [reduced]);
  return (
    <span className="font-display font-bold text-3xl tabular-nums text-foreground tracking-tight">
      {val.toLocaleString("cs-CZ")}
    </span>
  );
};

const LiveTrafficPreview = () => {
  const reduced = useReducedMotion();
  return (
    <PreviewShell>
      <div className="flex items-center gap-5">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">aktivních uživatelů</p>
          <LiveCounter />
          <div className="flex items-center gap-2 mt-2">
            <span className="relative flex w-2.5 h-2.5">
              {!reduced && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-emerald-500/60"
                  animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] text-muted-foreground">
              <span className="font-mono font-semibold text-foreground">100% Uptime</span> · tohle nespadne
            </span>
          </div>
        </div>

        {/* Sparkline bars */}
        <div className="flex items-end gap-1 h-14 shrink-0">
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.span
              key={i}
              className="w-1.5 rounded-full bg-gradient-to-t from-primary/30 to-accent/60"
              style={{ height: `${30 + ((i * 17) % 50)}%` }}
              animate={reduced ? undefined : { scaleY: [0.6, 1, 0.6] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
            />
          ))}
        </div>
      </div>
    </PreviewShell>
  );
};

/* -------------------------------------------------------------------------- */
/*  4 — Time saved checklist                                                  */
/* -------------------------------------------------------------------------- */

const TASKS = ["Aktualizace pluginů", "Záloha databáze", "Hlášení chyb", "Optimalizace rychlosti"];

const TimeSavedPreview = () => {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setActive((a) => (a + 1) % TASKS.length), 1400);
    return () => clearInterval(id);
  }, [reduced]);
  return (
    <PreviewShell>
      <div className="flex flex-col gap-2">
        {TASKS.map((task, i) => {
          const done = reduced ? true : i <= active;
          return (
            <div key={task} className="flex items-center gap-2.5">
              <motion.span
                className="flex items-center justify-center w-5 h-5 rounded-md border"
                animate={{
                  backgroundColor: done ? "hsl(var(--primary) / 0.12)" : "hsl(var(--background))",
                  borderColor: done ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))",
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.span animate={{ opacity: done ? 1 : 0, scale: done ? 1 : 0.6 }} transition={{ duration: 0.25 }}>
                  <Check className="w-3 h-3 text-primary" strokeWidth={3} />
                </motion.span>
              </motion.span>
              <div className="relative flex-1">
                <span className={`text-[12px] transition-colors ${done ? "text-muted-foreground" : "text-foreground"}`}>
                  {task}
                </span>
                <motion.span
                  className="absolute left-0 top-1/2 h-px bg-muted-foreground/60"
                  initial={false}
                  animate={{ width: done ? "100%" : 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}

        <motion.div
          className="self-end mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-[11px] font-mono font-semibold"
          animate={reduced ? undefined : { y: [0, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Clock className="w-3 h-3" />
          Ušetřeno 40 h měsíčně
        </motion.div>
      </div>
    </PreviewShell>
  );
};

/* -------------------------------------------------------------------------- */
/*  Features list                                                             */
/* -------------------------------------------------------------------------- */

const features = [
  {
    Icon: MousePointerClick,
    name: "Vizuál, který prodává za vás",
    description:
      "Zapomeňte na zaměnitelné šablony. Tvoříme čistý, sebevědomý design, který vaše klienty okamžitě přesvědčí, že mají čest s absolutní špičkou v oboru.",
    className: "col-span-3 lg:col-span-1",
    background: <ConversionMomentPreview />,
  },
  {
    Icon: Zap,
    name: "Bleskový výkon bez kompromisů",
    description:
      "Pomalý web zabíjí prodeje. Proto využíváme ty nejvýkonnější dostupné technologie (React, Node.js). Výsledek? Okamžité načítání a perfektní plynulost.",
    className: "col-span-3 lg:col-span-2",
    background: <PerformanceChartPreview />,
  },
  {
    Icon: Activity,
    name: "Zvládneme váš extrémní růst",
    description:
      "Váš byznys poroste. Náš kód s tím počítá. Stavíme robustní a neprůstřelné systémy, které bez zadýchání zvládnou i desetinásobné nápory návštěvnosti.",
    className: "col-span-3 lg:col-span-2",
    background: <LiveTrafficPreview />,
  },
  {
    Icon: CalendarCheck2,
    name: "Převezmeme technologickou zátěž",
    description:
      "Žádný stres ani zmatky. Od úvodní strategie přes vývoj až po spuštění řešíme vše za vás. Vy se dál plně soustředíte na svůj byznys.",
    className: "col-span-3 lg:col-span-1",
    background: <TimeSavedPreview />,
  },
];

const WhyMeSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 lg:py-28 relative">
      <div className="container mx-auto px-6 lg:px-12" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-primary font-display font-medium text-sm tracking-widest uppercase mb-4">
            Proč s námi
          </p>
          <TextReveal
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            gradientBlock
            gradient={<span className="text-gradient">Tvoříme digitální dominanci.</span>}
          >
            Nestavíme jen weby.
          </TextReveal>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Šablony přenecháváme konkurenci. Navrhujeme a kódujeme prémiové weby a aplikace,
            které vašemu byznysu reálně vydělávají a budují vaši autoritu.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <BentoGrid>
            {features.map((feature) => (
              <BentoCard key={feature.name} {...feature} />
            ))}
          </BentoGrid>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyMeSection;
