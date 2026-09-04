import { useRef, useState } from "react";
import { AnimatePresence, motion, transform, useScroll, useTransform, useReducedMotion, MotionValue } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, Sparkles, Wand2, ShieldCheck, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { ILLUSTRATIONS } from "@/components/howwework/StepIllustration";
import GradientRimButton from "@/components/ui/GradientRimButton";
import ConsultationDialog from "@/components/ConsultationDialog";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    number: "01",
    title: "Přesně víte, do čeho jdete",
    body:
      "Většina projektů selže dřív, než padne první řádek kódu — protože nikdo pořádně nezjistil, co má vlastně vyřešit. Proto začínáme u vašeho byznysu: kdo jsou vaši zákazníci, kde ztrácíte čas nebo peníze a co se musí stát, aby se investice vrátila. Výstupem je jasný rozsah, termín i cena — víte, co dostanete a za kolik, ještě než začneme.",
    badge: { icon: Sparkles, title: "Víte, za co platíte.", subtitle: "Rozsah, termín i cena jsou jasné před začátkem prací." },
  },
  {
    number: "02",
    title: "Vidíte to, než to začneme stavět",
    body:
      "Než se začne programovat, uvidíte, jak bude váš web nebo aplikace vypadat a fungovat — do posledního tlačítka. Návrhy spolu procházíme a upravujeme, dokud nesedí. Právě teď jsou změny nejrychlejší a nejlevnější; přepisovat hotový kód stojí násobně víc. Dokud návrh neschválíte, nepokračujeme dál.",
    badge: { icon: Wand2, title: "Nic se neprogramuje bez vašeho OK.", subtitle: "Úpravy návrhu řešíme obratem, dokud nesedí." },
  },
  {
    number: "03",
    title: "Stavíme na míru, ne na krabici",
    body:
      "Teď se staví. Píšeme vlastní kód, napojujeme databáze a integrace a průběžně testujeme na mobilech, tabletech i desktopech. Nestavíme na šabloně, která vás za rok zastaví — řešení jde kdykoliv rozšířit o další funkce. Po celou dobu víte, v jaké fázi jsme, a na zprávu odpovídáme do jednoho pracovního dne.",
    badge: { icon: ShieldCheck, title: "Rychlé, bezpečné a rozšiřitelné.", subtitle: "Vlastní kód, na kterém se dá stavět dál — ne šablona." },
  },
  {
    number: "04",
    title: "Poslední slovo máte vy",
    body:
      "Testovací verzi dostanete dřív, než ji uvidí kterýkoliv z vašich zákazníků. V klidu si všechno proklikáte a co nesedí, doladíme. Spouštíme až ve chvíli, kdy řeknete, že je to hotové. A po spuštění nekončíme — ozvat se můžete kdykoliv, když bude potřeba cokoliv upravit nebo doplnit.",
    badge: { icon: CheckCircle2, title: "Spouštíme, až řeknete vy.", subtitle: "Testovací verzi vidíte první — a po spuštění nezůstanete sami." },
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

/**
 * Phone-first accordion rendered as a single cohesive panel. Steps are clean
 * segments divided by hairlines; the active step is lifted with a left accent
 * and expands within the block. Tapping an open step closes it — all can close.
 */
const MobileStepsAccordion = ({ total }: { total: number }) => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="rounded-[28px] bg-card border border-border overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {STEPS.map((step, i) => {
        const isOpen = open === i;
        const isLast = i === STEPS.length - 1;
        const BadgeIcon = step.badge.icon;
        return (
          <div
            key={step.number}
            // Lower rows sit in front and overlap the top lip of the row above,
            // so the stack reads as cards resting on one another (see reference).
            style={{ zIndex: i }}
            className={cn(
              "relative transition-colors duration-300 rounded-t-[22px]",
              isOpen ? "bg-primary/[0.04]" : "bg-card",
              i > 0 &&
                "-mt-3 border-t border-white/[0.06] shadow-[0_-7px_18px_-6px_rgba(0,0,0,0.55)]"
            )}
          >
            {/* Left accent bar for the active step */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.span
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  exit={{ scaleY: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full origin-center"
                  style={{ background: "var(--gradient-primary)" }}
                />
              )}
            </AnimatePresence>

            {/* Header — always visible, toggles the step */}
            <button
              type="button"
              onClick={() => setOpen((cur) => (cur === i ? null : i))}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-4 px-5 py-5 text-left"
            >
              <span
                className={cn(
                  "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-lg transition-all duration-300",
                  isOpen ? "text-primary-foreground" : "text-primary bg-primary/10"
                )}
                style={isOpen ? { background: "var(--gradient-primary)" } : undefined}
              >
                {step.number}
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] tracking-[0.22em] uppercase text-primary/80 font-display font-medium mb-1">
                  Krok {i + 1} ze {total}
                </span>
                <h2 className="font-display font-semibold text-[17px] text-foreground leading-snug">
                  {step.title}
                </h2>
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 flex-shrink-0 text-muted-foreground transition-transform duration-300",
                  isOpen && "rotate-180 text-primary"
                )}
              />
            </button>

            {/* Body — expands only for the active step */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                    opacity: { duration: 0.25, ease: "easeOut" },
                  }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-6 pl-[76px]">
                    <p className="font-body text-muted-foreground text-[15px] leading-relaxed">
                      {step.body}
                    </p>
                    <div className="mt-5 flex items-start gap-3 rounded-2xl bg-primary/5 border border-primary/15 px-4 py-3.5">
                      <span
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        <BadgeIcon className="w-4 h-4" />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-display font-semibold text-sm text-primary leading-tight">
                          {step.badge.title}
                        </span>
                        <span className="font-body text-xs text-muted-foreground mt-0.5 leading-snug">
                          {step.badge.subtitle}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>
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

  // Function transforms opt out of framer's WAAPI scroll handoff (see HeroOrbit)
  const y = useTransform(scrollYProgress, (v) => transform(v, [start, end], [-600, rest.y]));
  const x = useTransform(scrollYProgress, (v) => transform(v, [start, end], [rest.x * 0.4, rest.x]));
  const opacity = useTransform(scrollYProgress, (v) =>
    transform(v, [start, start + slice * 0.15, end], [0, 1, 1])
  );
  const rotate = useTransform(scrollYProgress, (v) => transform(v, [start, end], [-10, rest.rotate]));
  const scale = useTransform(scrollYProgress, (v) => transform(v, [start, end], [0.92, 1]));

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
  const opacity = useTransform(scrollYProgress, (v) =>
    transform(
      v,
      [Math.max(0, start - slice * 0.15), start + slice * 0.15, end - slice * 0.1, end + slice * 0.05],
      [0, 1, 1, 0]
    )
  );
  const x = useTransform(scrollYProgress, (v) => transform(v, [start, end], [-24, 24]));
  const y = useTransform(scrollYProgress, (v) => transform(v, [start, end], [10, -10]));

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
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
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
        description="Čtyři kroky od zadání ke spuštění — s jasným rozsahem, termínem i cenou předem. Podívejte se, jak v MYVE vyvíjíme weby, aplikace a software na míru."
        path="/jak-to-delame"
      />
      <Navbar />
      <main>

      {/* Intro */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
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
            Od zadání ke spuštění. Bez překvapení.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-body text-lg md:text-xl text-muted-foreground leading-relaxed"
          >
            U vývoje se firmy nejčastěji bojí tří věcí: že se to potáhne měsíce, že cena poletí
            jinam, než zněla nabídka, a že nakonec dostanou něco jiného, než čekaly. Proto má náš
            proces čtyři kroky s jasným výstupem — víte, co se právě děje, co dostanete a kdy.
            Běžný web spouštíme v průměru za 14 dní a na každou zprávu odpovídáme do jednoho pracovního dne.
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
      <section className={`${!reduced ? "lg:hidden" : ""} py-10`}>
        <div className="container mx-auto px-5 max-w-xl">
          <MobileStepsAccordion total={STEPS.length} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Do jednoho pracovního dne víte, na čem jste
          </h2>
          <p className="text-muted-foreground text-lg mb-4 leading-relaxed">
            Nemusíte nic připravovat. Nechte nám kontakt, ozveme se do jednoho pracovního dne a
            řekneme vám na rovinu, co by to obnášelo, jak dlouho by to trvalo a kolik by to stálo.
            I kdyby závěr měl být, že to zatím nepotřebujete. Zdarma a nezávazně.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Když to nedává smysl, řekneme vám to na rovinu. I to je zdarma.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <ConsultationDialog source="how-we-work">
              <GradientRimButton as="button" variant="filled">
                <span>Zjistit, co by to stálo</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </GradientRimButton>
            </ConsultationDialog>
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
