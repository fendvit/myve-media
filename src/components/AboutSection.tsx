import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import TextReveal from "@/components/ui/TextReveal";
import vitPortrait from "@/assets/hero-portrait.png";

const stats = [
  { number: 4, suffix: "+", label: "vytvořených webů", color: "hsl(12, 85%, 62%)" },
  { number: 3, suffix: "+", label: "dokončených aplikací", color: "hsl(340, 75%, 58%)" },
  { number: 3, suffix: "+", label: "spokojených klientů", color: "hsl(280, 70%, 60%)" },
];

const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="pt-20 lg:pt-28 relative overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-end">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="self-start lg:pb-20"
          >
            <p className="text-primary font-display font-medium text-sm tracking-widest uppercase mb-4">
              O nás
            </p>
            <TextReveal
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-8"
              gradient={<span className="text-gradient">být vidět online.</span>}
            >
              Jmenuji se Vít Fendrych a pomáhám firmám
            </TextReveal>
            <div className="space-y-5 text-muted-foreground text-lg leading-relaxed">
              <p>
                V rámci projektu MYVE – Making You Visible Everywhere tvoříme moderní
                webové stránky, webové aplikace a software na míru.
              </p>
              <p>
                Naším cílem není jen vytvořit hezký web, ale především dodat funkční
                řešení, které pomůže firmám růst a zefektivnit jejich procesy.
              </p>
            </div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-3 gap-6 md:gap-8 mt-14 max-w-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {stats.map((stat) => (
                <div key={stat.label} className="relative">
                  <p className="font-display text-3xl md:text-5xl font-bold text-gradient">
                    <AnimatedCounter target={stat.number} suffix={stat.suffix} />
                  </p>
                  <p className="text-muted-foreground text-xs md:text-sm mt-2">{stat.label}</p>
                  <div
                    className="absolute -bottom-2 left-0 w-8 h-1 rounded-full"
                    style={{ background: stat.color }}
                  />
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Portrait */}
          <motion.div
            className="flex justify-center lg:justify-end self-end"
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -inset-4 rounded-full bg-accent/8 blur-2xl" />
              <img
                src={vitPortrait}
                alt="Vít Fendrych - MYVE"
                className="relative w-64 lg:w-[380px] object-contain drop-shadow-[0_0_30px_hsl(12,85%,62%,0.25)] scale-x-[-1]"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
