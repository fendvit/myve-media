import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Mail, Instagram, Facebook, ArrowRight } from "lucide-react";
import ConsultationDialog from "@/components/ConsultationDialog";
import GradientRimButton from "@/components/ui/GradientRimButton";

const socials = [
  { icon: Instagram, href: "https://www.instagram.com/myve.media/", label: "Instagram" },
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=100092353287649", label: "Facebook" },
  { icon: Mail, href: "mailto:fendvit.bis@gmail.com", label: "Email" },
];

const FinaleSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contact" className="relative py-28 lg:py-40 overflow-hidden bg-background">
      {/* Coral glow anchor */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-4xl max-h-96 rounded-full blur-[140px] opacity-20"
        style={{ background: "hsl(var(--primary))" }}
      />

      <div className="container relative z-10 mx-auto px-6 lg:px-12 text-center" ref={ref}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-primary font-display font-medium text-xs tracking-[0.35em] uppercase mb-6"
        >
          Kontakt
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="display-type text-foreground text-[clamp(2.6rem,8vw,7.5rem)] max-w-5xl mx-auto"
        >
          Pojďme postavit
          <br />
          <span className="text-primary">váš projekt.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-muted-foreground text-lg leading-relaxed mt-8 mb-12 max-w-xl mx-auto"
        >
          Máte nápad nebo projekt? Probereme ho spolu — nezávazně a zdarma. Ozveme
          se vám do 24 hodin.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-14 flex justify-center"
        >
          <ConsultationDialog>
            <GradientRimButton as="button" variant="filled">
              <span>Nezávazná konzultace</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </GradientRimButton>
          </ConsultationDialog>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex justify-center gap-5"
        >
          {socials.map((social) => (
            <motion.a
              key={social.label}
              href={social.href}
              className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
              aria-label={social.label}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <social.icon className="w-5 h-5" />
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FinaleSection;
