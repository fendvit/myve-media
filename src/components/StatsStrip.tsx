import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

const stats = [
  { target: 7, suffix: "+", label: "projektů spuštěných pro české firmy" },
  { target: 14, suffix: " dní", label: "a váš web je venku — od zadání ke spuštění" },
  { target: 40, suffix: "+", label: "hodin měsíčně, které klienti nemusí řešit ručně" },
  { target: 24, suffix: " h", label: "maximální čekání na naši odpověď" },
];

const StatsStrip = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="relative py-20 lg:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-14 lg:mb-20"
        >
          <p className="text-primary font-display font-medium text-xs tracking-[0.3em] uppercase mb-5">
            O nás
          </p>
          <h2 className="display-type text-[clamp(1.8rem,4.5vw,3.6rem)] text-foreground normal-case">
            Jmenuji se Vít Fendrych a&nbsp;pomáhám firmám{" "}
            <span className="text-primary">být vidět online.</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mt-6 max-w-2xl">
            V rámci projektu MYVE — Making You Visible Everywhere tvoříme moderní webové
            stránky, webové aplikace a software na míru. Naším cílem není jen hezký web,
            ale funkční řešení, které pomáhá firmám růst.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 border-t border-border pt-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
            >
              <p className="display-type text-[clamp(2.4rem,6vw,4.5rem)] text-foreground">
                <AnimatedCounter target={stat.target} suffix={stat.suffix} />
              </p>
              <div className="w-8 h-1 rounded-full bg-primary mt-3 mb-3" />
              <p className="text-muted-foreground text-sm leading-snug">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsStrip;
