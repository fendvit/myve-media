import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Homepage → the service pages. Real text and real links, so Google sees what MYVE does and
// where (the hero above is a scroll animation with almost no words in it).
const ITEMS = [
  { to: "/tvorba-webu-jaromer", eyebrow: "Weby", title: "Tvorba webů v Jaroměři a okolí",
    text: "Rychlý web na míru pro vaši firmu, do 14 dní od zadání. Správa i doména v měsíčním paušálu." },
  { to: "/aplikace-na-miru", eyebrow: "Aplikace", title: "Aplikace a software na míru",
    text: "Mobilní aplikace pro Android i iPhone, webové aplikace a interní systémy, které šetří čas." },
];

const ServicesLinks = () => (
  <section id="sluzby" className="relative py-20 lg:py-28 bg-background">
    <div className="container mx-auto px-6 lg:px-12">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }} className="max-w-3xl mb-12">
        <p className="text-primary font-display font-medium text-xs tracking-[0.3em] uppercase mb-5">Služby</p>
        <h2 className="display-type text-[clamp(1.8rem,4.5vw,3.6rem)] text-foreground normal-case">
          Weby a aplikace na míru <span className="text-primary">z Jaroměře.</span>
        </h2>
      </motion.div>
      <div className="grid md:grid-cols-2 gap-6">
        {ITEMS.map((it, i) => (
          <motion.div key={it.to} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}>
            <Link to={it.to} className="group block h-full rounded-2xl bg-card border border-border p-7 lg:p-9 hover:border-primary/40 transition-colors">
              <p className="text-primary font-display font-medium text-xs tracking-[0.3em] uppercase">{it.eyebrow}</p>
              <h3 className="display-type text-foreground text-[clamp(1.5rem,3vw,2.2rem)] normal-case mt-3">{it.title}</h3>
              <p className="text-muted-foreground leading-relaxed mt-4">{it.text}</p>
              <span className="inline-flex items-center gap-2 text-primary font-display font-medium text-sm mt-6">
                Více <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesLinks;
