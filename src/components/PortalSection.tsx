import { useRef, useState } from "react";
import { motion, MotionValue, transform, useReducedMotion, useScroll, useTransform } from "framer-motion";

/** Real screenshots of the live client portal (demo tenant, fictional café). */
const SCREENS = [
  { src: "/portal-mock/projekt-logo.jpg", alt: "Portál: průběh projektu s logem klienta" },
  { src: "/portal-mock/chat.jpg", alt: "Portál: chat s přílohou" },
  { src: "/portal-mock/projekt-druhy.jpg", alt: "Portál: druhý projekt klienta" },
];

const BEATS = [
  {
    index: "01",
    title: "Vždy víte, jak to jde.",
    line: "Procenta, stav a zápis, co se tento týden udělalo. Česky a lidsky, ne v tiketech.",
    points: ["Průběh projektu v %", "Týdenní zápisy bez žargonu"],
  },
  {
    index: "02",
    title: "Všechno na jednom místě.",
    line: "Zprávy, soubory i návrhy píšete přímo nám. Žádné hledání v e-mailech, odpovídáme do 24 hodin.",
    points: ["Chat s přílohami", "Odpověď do 24 hodin"],
  },
  {
    index: "03",
    title: "Každý váš projekt, jedním klepnutím.",
    line: "Víc projektů najednou? Přepínáte mezi nimi na jednom místě, s logem vaší firmy nahoře.",
    points: ["S vaším logem", "V telefonu i v počítači"],
  },
];

/** [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd] in scroll progress. */
type Slice = [number, number, number, number];
const SLICES: Slice[] = [
  [0.0, 0.0, 0.26, 0.34],
  [0.4, 0.48, 0.6, 0.68],
  [0.74, 0.82, 1, 1],
];

/** Phone frame drawn as SVG; the screen is a rounded window on top. */
const Phone = ({ progress, mobile }: { progress: MotionValue<number>; mobile: boolean }) => {
  // Which screenshot is visible, crossfading at the beat boundaries.
  const o0 = useTransform(progress, (v) => transform(v, [0.3, 0.38], [1, 0]));
  const o1 = useTransform(progress, (v) =>
    v < 0.5 ? transform(v, [0.3, 0.38], [0, 1]) : transform(v, [0.64, 0.72], [1, 0])
  );
  const o2 = useTransform(progress, (v) => transform(v, [0.64, 0.72], [0, 1]));
  const opacities = [o0, o1, o2];

  return (
    <div className="relative w-full aspect-[300/620] drop-shadow-[0_40px_80px_rgba(255,87,51,0.18)]">
      {/* Screen */}
      <div
        className="absolute overflow-hidden bg-[#f8f6f2]"
        style={{ left: "3.4%", right: "3.4%", top: "1.7%", bottom: "1.7%", borderRadius: "11.5% / 5.6%" }}
      >
        {SCREENS.map((s, i) => (
          <motion.img
            key={s.src}
            src={s.src}
            alt={s.alt}
            loading="lazy"
            decoding="async"
            style={{ opacity: opacities[i] }}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        ))}
      </div>
      {/* Bezel */}
      <svg viewBox="0 0 300 620" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
        <defs>
          <linearGradient id="portal-bezel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3a3a40" />
            <stop offset="0.5" stopColor="#141417" />
            <stop offset="1" stopColor="#2a2a2f" />
          </linearGradient>
        </defs>
        <path
          fillRule="evenodd"
          fill="url(#portal-bezel)"
          d="M44 0H256A44 44 0 0 1 300 44V576A44 44 0 0 1 256 620H44A44 44 0 0 1 0 576V44A44 44 0 0 1 44 0Z
             M44 10.5H256A34 34 0 0 1 290 44.5V575.5A34 34 0 0 1 256 609.5H44A34 34 0 0 1 10 575.5V44.5A34 34 0 0 1 44 10.5Z"
        />
        <rect x="108" y="22" width="84" height="24" rx="12" fill="#050506" />
        <rect x="-2.5" y="120" width="3" height="30" rx="1.5" fill="#2a2a2f" />
        <rect x="-2.5" y="170" width="3" height="52" rx="1.5" fill="#2a2a2f" />
        <rect x="299.5" y="190" width="3" height="78" rx="1.5" fill="#2a2a2f" />
        {!mobile && <rect x="106" y="606" width="88" height="3.5" rx="1.75" fill="#f8f6f2" opacity="0.55" />}
      </svg>
    </div>
  );
};

const BeatBlock = ({
  p,
  beat,
  slice,
  className,
}: {
  p: MotionValue<number>;
  beat: (typeof BEATS)[number];
  slice: Slice;
  className: string;
}) => {
  const [in0, in1, out0, out1] = slice;
  const holdsToEnd = out1 >= 1;
  const opacity = useTransform(p, (v) =>
    transform(v, [in0, in1 + 0.0001, out0, out1 + 0.0001], [in0 === 0 ? 1 : 0, 1, 1, holdsToEnd ? 1 : 0])
  );
  const y = useTransform(p, (v) => transform(v, [in0, in1 + 0.0001], [in0 === 0 ? 0 : 26, 0]));
  return (
    <div className={`${className} pointer-events-none flex`}>
    <motion.div style={{ opacity, y }} className="self-center w-full">
      <span className="display-type text-primary text-[clamp(1.6rem,3.4vw,2.8rem)] leading-none">{beat.index}</span>
      <h3 className="display-type text-foreground normal-case text-[clamp(1.9rem,4.4vw,4rem)] leading-[0.98] mt-3">
        {beat.title}
      </h3>
      <p className="text-foreground/80 font-body text-[clamp(1rem,1.6vw,1.3rem)] leading-relaxed mt-5">{beat.line}</p>
      <ul className="mt-5 flex flex-wrap gap-2 md:gap-3">
        {beat.points.map((pt) => (
          <li
            key={pt}
            className="rounded-full border border-primary/40 px-4 py-1.5 text-xs md:text-sm font-body text-foreground/85"
          >
            {pt}
          </li>
        ))}
      </ul>
    </motion.div>
    </div>
  );
};

const PortalSection = () => {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [mobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Desktop: phone sits right, glides to the left for beat 2, back right for beat 3.
  const phoneX = useTransform(scrollYProgress, (v) =>
    transform(v, [0.24, 0.4, 0.58, 0.74], [0, -1, -1, 0])
  );
  const phoneXpx = useTransform(phoneX, (k) => `${k * 56}vw`);
  const tilt = useTransform(scrollYProgress, (v) => transform(v, [0.24, 0.32, 0.4, 0.58, 0.66, 0.74], [0, -4, 0, 0, 4, 0]));
  const headerOpacity = useTransform(scrollYProgress, (v) => transform(v, [0, 0.05, 0.1], [1, 1, 0]));

  if (reduced) {
    return (
      <section id="portal" className="relative py-20 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <p className="text-primary font-display font-medium text-xs tracking-[0.3em] uppercase">Klientský portál</p>
          <h2 className="display-type text-foreground normal-case text-[clamp(1.8rem,4.5vw,3rem)] mt-3">
            Váš projekt v telefonu. Na jednom místě.
          </h2>
          <div className="grid md:grid-cols-3 gap-10 mt-12">
            {BEATS.map((b, i) => (
              <div key={b.index}>
                <img src={SCREENS[i].src} alt={SCREENS[i].alt} loading="lazy" className="w-48 rounded-3xl border border-border" />
                <h3 className="display-type text-foreground normal-case text-2xl mt-5">{b.title}</h3>
                <p className="text-muted-foreground mt-3">{b.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="portal" ref={ref} className="relative h-[380vh] bg-background">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* soft coral glow behind the phone */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_70%_50%,hsl(9_100%_63%/0.10),transparent_55%)]" />

        <motion.div
          style={{ opacity: headerOpacity }}
          className="absolute top-[11svh] md:top-[12svh] left-6 md:left-[6vw] z-10 pointer-events-none"
        >
          <p className="text-primary font-display font-medium text-xs tracking-[0.35em] uppercase">Klientský portál</p>
        </motion.div>

        {/* Phone */}
        <div
          className={
            mobile
              ? "absolute inset-x-0 bottom-[-12svh] flex justify-center"
              : "absolute inset-y-0 right-[9vw] flex items-center"
          }
        >
          <motion.div
            style={{
              x: mobile ? 0 : phoneXpx,
              rotate: tilt,
              width: mobile ? "min(58vw, 260px)" : "min(21rem, 27vw, 74svh * 0.484)",
            }}
          >
            <Phone progress={scrollYProgress} mobile={mobile} />
          </motion.div>
        </div>

        {/* Copy — beats 1 & 3 on the left of the phone, beat 2 on the right */}
        {BEATS.map((beat, i) => (
          <BeatBlock
            key={beat.index}
            p={scrollYProgress}
            beat={beat}
            slice={SLICES[i]}
            className={
              mobile
                ? "absolute top-[17svh] bottom-[48svh] inset-x-6"
                : i === 1
                  ? "absolute right-[6vw] inset-y-0 w-[min(36rem,42vw)]"
                  : "absolute left-[6vw] inset-y-0 w-[min(36rem,42vw)]"
            }
          />
        ))}
      </div>
    </section>
  );
};

export default PortalSection;
