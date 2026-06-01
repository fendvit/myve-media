import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, MotionValue } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, Sparkles, Wand2, ShieldCheck, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import FloatingShapes from "@/components/ui/FloatingShapes";
import { ILLUSTRATIONS } from "@/components/howwework/StepIllustration";
import GradientRimButton from "@/components/ui/GradientRimButton";

const STEPS = [
  {
    number: "01",
    title: "Analýza a architektura řešení",
    body:
      "Nezačínáme rovnou programovat. Na začátku potřebujeme do detailu pochopit váš byznys. Kdo je vaše cílová skupina a jaký problém má daný systém vlastně vyřešit? Nestavíme totiž jen hezké vizitky, ale vyvíjíme funkční nástroje. Společně definujeme hlavní funkce, rozsah projektu a logiku, na které to celé poběží.",
    badge: { icon: Sparkles, title: "Základ úspěšného projektu", subtitle: "Nejprve strategie, potom kód." },
  },
  {
    number: "02",
    title: "UX/UI design a vizuální identita",
    body:
      "Jakmile máme jasnou strategii, dáváme projektu tvář. Připravíme vizuální návrhy a navrhneme uživatelské prostředí tak, aby se v něm vaši zákazníci (nebo zaměstnanci) intuitivně orientovali. Vše s vámi průběžně konzultujeme a ladíme k dokonalosti, abychom měli jistotu, že jsme na stejné vlně.",
    badge: { icon: Wand2, title: "Intuitivní. Přehledné. Vaše.", subtitle: "Design, který nejen vypadá skvěle, ale hlavně funguje." },
  },
  {
    number: "03",
    title: "Programování a zátěžové testy",
    body:
      "Po schválení designu se pouštíme do psaní čistého kódu a projekt ožívá. V této fázi integrujeme potřebné databáze, programujeme funkce na míru a vše rovnou podrobujeme důkladnému internímu testování. Aplikace i weby musí běžet bleskově, bezpečně a bezchybně na všech zařízeních.",
    badge: { icon: ShieldCheck, title: "Rychle, bezpečně, bezchybně.", subtitle: "Stabilní kód, rychlý výkon, špičkové zabezpečení." },
  },
  {
    number: "04",
    title: "Finální revize a nasazení do světa",
    body:
      "Než cokoliv definitivně vypustíme do ostrého provozu, předáváme vám testovací verzi. V klidu si vše proklikáte a zkontrolujete, zda systém funguje přesně podle vašich představ. Pokud objevíme detaily k úpravě, obratem je vyřešíme. Jakmile od vás dostaneme zelenou, projekt slavnostně spouštíme.",
    badge: { icon: CheckCircle2, title: "Vše pod kontrolou.", subtitle: "Pečlivě testujeme, doladíme a spouštíme bez kompromisů." },
  },
];

// Final resting offsets per card so they read as a stacked deck
const RESTING = [
  { x: -18, y: -22, rotate: -2 },
  { x: 12, y: -8, rotate: 1 },
  { x: -8, y: 10, rotate: -1 },
  { x: 18, y: 26, rotate: 2 },
];

const StepIndicatorDots = ({ active, total }: { active: number; total: number }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: total }).map((_, i) => (
      <span
        key={i}
        className={`h-1.5 rounded-full transition-all duration-500 ${
          i === active
            ? "w-6 bg-primary"
            : i < active
            ? "w-1.5 bg-primary/60"
            : "w-1.5 bg-foreground/15"
        }`}
      />
    ))}
  </div>
);

const CardContent = ({
  step,
  index,
  total,
}: {
  step: (typeof STEPS)[number];
  index: number;
  total: number;
}) => {
  const Illustration = ILLUSTRATIONS[index];
  const BadgeIcon = step.badge.icon;
  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div className="grid grid-cols-1 md:grid-cols-[1.25fr_1fr] gap-6 h-full">
        {/* Left col */}
        <div className="flex flex-col">
          <div className="flex items-center gap-4 mb-3">
            <span
              className="font-display font-bold text-5xl md:text-6xl bg-clip-text text-transparent leading-none"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {step.number}
            </span>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] tracking-[0.25em] uppercase text-primary/80 font-display font-medium">
                Krok {index + 1} ze {total}
              </span>
              <StepIndicatorDots active={index} total={total} />
            </div>
          </div>
          <h2 className="font-display font-semibold text-2xl md:text-[28px] text-foreground mb-2 leading-tight">
            {step.title}
          </h2>
          <div
            className="h-[3px] w-16 rounded-full mb-4"
            style={{ background: "var(--gradient-primary)" }}
          />
          <p className="font-body text-muted-foreground text-[15px] md:text-base leading-relaxed flex-1">
            {step.body}
          </p>
          {/* Accent badge */}
          <motion.div
            whileHover={{ y: -2 }}
            className="mt-5 inline-flex items-start gap-3 rounded-2xl bg-primary/5 border border-primary/15 px-4 py-3 self-start max-w-md"
          >
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <BadgeIcon className="w-4 h-4" />
            </motion.span>
            <div className="flex flex-col">
              <span className="font-display font-semibold text-sm text-primary leading-tight">
                {step.badge.title}
              </span>
              <span className="font-body text-xs text-muted-foreground mt-0.5 leading-snug">
                {step.badge.subtitle}
              </span>
            </div>
          </motion.div>
        </div>
        {/* Right col — illustration */}
        <div className="hidden md:flex items-center justify-center relative">
          <Illustration />
        </div>
      </div>
    </>
  );
};

const StepCard = ({
  step,
  index,
  total,
  scrollYProgress,
}: {
  step: (typeof STEPS)[number];
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) => {
  const slice = 1 / total;
  const start = index * slice;
  const end = start + slice * 0.7;
  const rest = RESTING[index];

  const y = useTransform(scrollYProgress, [start, end], [-600, rest.y]);
  const x = useTransform(scrollYProgress, [start, end], [rest.x * 0.4, rest.x]);
  const opacity = useTransform(scrollYProgress, [start, start + slice * 0.15, end], [0, 1, 1]);
  const rotate = useTransform(scrollYProgress, [start, end], [-10, rest.rotate]);
  const scale = useTransform(scrollYProgress, [start, end], [0.92, 1]);

  const initialStyle =
    index === 0
      ? { opacity: 1, y: rest.y, x: rest.x, rotate: rest.rotate, scale: 1 }
      : { y, x, opacity, rotate, scale };

  return (
    <motion.article
      style={{ ...initialStyle, zIndex: 10 + index, boxShadow: "var(--shadow-card)" }}
      whileHover={{ scale: 1.01 }}
      className="absolute inset-0 mx-auto w-[96%] rounded-3xl bg-card border border-border p-7 md:p-8 overflow-hidden"
    >
      <CardContent step={step} index={index} total={total} />
    </motion.article>
  );
};

const BackdropNumber = ({
  index,
  total,
  scrollYProgress,
  label,
}: {
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
  label: string;
}) => {
  const slice = 1 / total;
  const start = index * slice;
  const end = start + slice;
  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, start - slice * 0.15), start + slice * 0.15, end - slice * 0.1, end + slice * 0.05],
    [0, 1, 1, 0]
  );
  const x = useTransform(scrollYProgress, [start, end], ["-2%", "2%"]);
  const y = useTransform(scrollYProgress, [start, end], ["1%", "-1%"]);

  return (
    <motion.span
      style={{ opacity, x, y }}
      className="absolute top-[2%] left-[2%] font-display font-bold text-foreground/10 leading-[0.8] select-none pointer-events-none"
    >
      <span className="text-[16rem] xl:text-[22rem] tracking-tighter">{label}</span>
    </motion.span>
  );
};

const ScrollBackdrop = ({
  scrollYProgress,
  total,
}: {
  scrollYProgress: MotionValue<number>;
  total: number;
}) => {
  const blobAY = useTransform(scrollYProgress, [0, 1], ["-15%", "25%"]);
  const blobAX = useTransform(scrollYProgress, [0, 1], ["-10%", "8%"]);
  const blobBY = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);
  const blobBX = useTransform(scrollYProgress, [0, 1], ["10%", "-12%"]);
  const blobCY = useTransform(scrollYProgress, [0, 1], ["10%", "-15%"]);
  const blobCX = useTransform(scrollYProgress, [0, 1], ["-5%", "15%"]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <motion.div
        style={{ y: blobAY, x: blobAX }}
        className="absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full blur-3xl opacity-40"
        aria-hidden
      >
        <div className="w-full h-full rounded-full" style={{ background: "hsl(var(--primary) / 0.55)" }} />
      </motion.div>
      <motion.div
        style={{ y: blobBY, x: blobBX }}
        className="absolute top-1/3 -right-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-35"
        aria-hidden
      >
        <div className="w-full h-full rounded-full" style={{ background: "hsl(var(--accent) / 0.6)" }} />
      </motion.div>
      <motion.div
        style={{ y: blobCY, x: blobCX }}
        className="absolute bottom-[-10%] left-1/4 w-[380px] h-[380px] rounded-full blur-3xl opacity-30"
        aria-hidden
      >
        <div className="w-full h-full rounded-full" style={{ background: "var(--gradient-primary)" }} />
      </motion.div>

      {Array.from({ length: total }).map((_, i) => (
        <BackdropNumber
          key={i}
          index={i}
          total={total}
          scrollYProgress={scrollYProgress}
          label={String(i + 1).padStart(2, "0")}
        />
      ))}
    </div>
  );
};

const HowWeWork = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Jak to děláme — Proces vývoje | MYVE"
        description="Jak v MYVE postupujeme od analýzy a designu po programování, testování a nasazení. Transparentní proces vývoje webů a aplikací."
        path="/jak-to-delame"
      />
      <Navbar />
      <main>

      {/* Intro */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
        <FloatingShapes />
        <div className="container relative z-10 mx-auto px-6 lg:px-12 max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-primary font-display font-medium text-sm tracking-widest uppercase mb-4"
          >
            Proces
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight"
          >
            Jak u nás probíhá vývoj
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-body text-lg md:text-xl text-muted-foreground leading-relaxed"
          >
            Ať už pro vás stavíme moderní web, komplexní webovou aplikaci, nebo rovnou software na
            míru, věříme, že by celý proces měl dávat smysl a mít jasný řád. Nejsme korporát, kde se
            ztratíte v tabulkách. Zakládáme si na tom, že přesně víte, na čem zrovna pracujeme.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-xs uppercase tracking-[0.25em] font-display">Posuňte níže</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* Pinned scroll-stack (desktop) */}
      {!reduced && (
        <div ref={containerRef} className="relative hidden lg:block" style={{ height: `${STEPS.length * 100}vh` }}>
          <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
            <ScrollBackdrop scrollYProgress={scrollYProgress} total={STEPS.length} />

            <div className="relative w-full max-w-[1080px] h-[460px] mx-auto z-10 mt-5 px-6">
              {STEPS.map((step, i) => (
                <StepCard
                  key={step.number}
                  step={step}
                  index={i}
                  total={STEPS.length}
                  scrollYProgress={scrollYProgress}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile / reduced-motion fallback */}
      <section className={`${!reduced ? "lg:hidden" : ""} py-12`}>
        <div className="container mx-auto px-6 max-w-2xl flex flex-col gap-6">
          {STEPS.map((step, i) => (
            <motion.article
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="relative rounded-3xl bg-card border border-border p-6 overflow-hidden"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <CardContent step={step} index={i} total={STEPS.length} />
            </motion.article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Pojďme váš projekt rozhýbat
          </h2>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Domluvíme si nezávaznou konzultaci a probereme, jak by váš projekt mohl vypadat.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <GradientRimButton
              as="a"
              href="https://calendly.com/fendvit-bis/30min"
              target="_blank"
              rel="noopener noreferrer"
              variant="filled"
            >
              <span>Domluvit konzultaci</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </GradientRimButton>
            <GradientRimButton
              variant="outline"
              renderInner={({ className, children }) => (
                <Link to="/projekty" className={className}>
                  {children}
                </Link>
              )}
            >
              Naše projekty
            </GradientRimButton>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
};

export default HowWeWork;
