import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { OFFER } from "@/seo/content";

// Homepage → the offer: three pillars with real text and links (the hero above is a scroll
// animation with almost no words, so this is also what Google reads first about MYVE).
const ServicesLinks = () => (
  <section id="sluzby" className="relative py-20 lg:py-28 bg-background">
    <div className="container mx-auto px-6 lg:px-12">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }} className="max-w-3xl mb-12">
        <p className="text-primary font-display font-medium text-xs tracking-[0.3em] uppercase mb-5">Služby</p>
        <h2 className="display-type text-[clamp(1.8rem,4.5vw,3.6rem)] text-foreground normal-case">
          Ne jen web. <span className="text-primary">Celý systém.</span>
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed mt-6">
          Web, e-maily, automatizace i aplikace — postavené tak, aby na sebe navazovaly, a s někým, kdo se o ně stará i po spuštění.
        </p>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-6">
        {OFFER.pillars.map((p, i) => (
          <motion.div key={p.path} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}>
            <Link to={p.path} className="group flex flex-col h-full rounded-2xl bg-card border border-border p-7 lg:p-8 hover:border-primary/40 transition-colors">
              <span className="display-type text-primary text-4xl">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="display-type text-foreground text-[clamp(1.35rem,2.4vw,1.9rem)] normal-case mt-4">{p.title}</h3>
              <p className="text-muted-foreground leading-relaxed mt-4 flex-1">{p.text}</p>
              <span className="inline-flex items-center gap-2 text-primary font-display font-medium text-sm mt-6">
                Více <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
      <Link to="/sluzby" className="inline-flex items-center gap-2 text-primary font-display font-medium text-sm mt-10 group">
        Všechno, co pro vás postavíme <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  </section>
);

export default ServicesLinks;
