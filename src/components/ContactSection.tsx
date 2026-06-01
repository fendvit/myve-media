import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import GradientRimButton from "@/components/ui/GradientRimButton";
import { Mail, Instagram, Facebook } from "lucide-react";
import TextReveal from "@/components/ui/TextReveal";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { BackgroundPaths } from "@/components/ui/background-paths";

const ContactSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contact" className="relative overflow-hidden">
      {/* Background Paths */}
      <div className="absolute inset-0 opacity-30">
        <BackgroundPathsBackground />
      </div>

      {/* Warm gradient overlay */}
      <div
        className="absolute inset-0 opacity-40"
        style={{ background: "linear-gradient(180deg, transparent 0%, hsl(280, 30%, 95%) 50%, hsl(12, 40%, 95%) 100%)" }}
      />

      <div className="container mx-auto px-6 lg:px-12 relative z-10 py-20 lg:py-28" ref={ref}>
        <motion.div
          className="text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-primary font-display font-medium text-sm tracking-widest uppercase mb-4">
            Kontakt
          </p>
          <div className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <TextReveal
              className="inline"
              gradient={
                <AnimatedText
                  text="váš projekt."
                  textClassName="text-gradient text-3xl md:text-4xl lg:text-5xl font-bold"
                  underlineClassName="h-3 -bottom-1"
                  underlineDuration={2}
                />
              }
            >
              Pojďme postavit
            </TextReveal>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10">
            Máte nápad nebo projekt? Ozvěte se nám a probereme, jak vám můžeme pomoci.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <GradientRimButton as="a" href="mailto:fendvit.bis@gmail.com" variant="filled">
              <Mail className="w-5 h-5" />
              <span>Napsat email</span>
            </GradientRimButton>
            <GradientRimButton
              as="a"
              href="https://calendly.com/fendvit-bis/strategie"
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
            >
              Domluvit konzultaci
            </GradientRimButton>
          </div>

          <div className="flex justify-center gap-5">
            {[
              { icon: Instagram, href: "https://www.instagram.com/myve.media/", label: "Instagram" },
              { icon: Facebook, href: "https://www.facebook.com/profile.php?id=100092353287649", label: "Facebook" },
              { icon: Mail, href: "mailto:fendvit.bis@gmail.com", label: "Email" },
            ].map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                style={{ boxShadow: "var(--shadow-card)" }}
                aria-label={social.label}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <social.icon className="w-5 h-5" />
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/** Inline wrapper – renders just the floating SVG paths, no title/button */
function BackgroundPathsBackground() {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5} -${189 + i * 6}C-${380 - i * 5} -${189 + i * 6} -${312 - i * 5} ${216 - i * 6} ${152 - i * 5} ${343 - i * 6}C${616 - i * 5} ${470 - i * 6} ${684 - i * 5} ${875 - i * 6} ${684 - i * 5} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 696 316" fill="none">
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="hsl(var(--primary))"
            strokeWidth={path.width}
            strokeOpacity={0.08 + path.id * 0.015}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export default ContactSection;
