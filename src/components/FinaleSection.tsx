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

/** Proof that already lives in the stats strip, repeated where the decision happens. */
const proof = [
  "Odpověď do 1 pracovního dne",
  "Web venku za 14 dní",
  "7+ spuštěných projektů",
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
          Konzultace zdarma
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="display-type text-foreground text-[clamp(2.6rem,8vw,7.5rem)] max-w-5xl mx-auto"
        >
          Zjistěte, co postavit,
          <br />
          <span className="text-primary">za kolik a kdy.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-muted-foreground text-lg leading-relaxed mt-8 mb-12 max-w-xl mx-auto"
        >
          Nemusíte nic připravovat. Nechte nám kontakt a do jednoho pracovního dne se ozveme.
          Řekneme vám na rovinu, co dává smysl, jak dlouho by to trvalo a kolik by to stálo.
          Zdarma a nezávazně.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-5 flex justify-center"
        >
          <ConsultationDialog source="home-finale">
            <GradientRimButton as="button" variant="filled">
              <span>Zjistit, co by to stálo</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </GradientRimButton>
          </ConsultationDialog>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-sm text-muted-foreground mb-10"
        >
          Když to nedává smysl, řekneme vám to na rovinu. I to je zdarma.
        </motion.p>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-display uppercase tracking-[0.2em] text-foreground/70"
        >
          {proof.map((item, i) => (
            <li key={item} className="flex items-center gap-6">
              {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-primary" />}
              <span>{item}</span>
            </li>
          ))}
        </motion.ul>

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
