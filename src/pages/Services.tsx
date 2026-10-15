import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import ConsultationDialog from "@/components/ConsultationDialog";
import GradientRimButton from "@/components/ui/GradientRimButton";
import { OFFER, PAGES, breadcrumbLd } from "@/seo/content";

// /sluzby — the whole offer on one page. Words in src/seo/content.ts (OFFER), shared with the
// static HTML scripts/prerender.ts writes for crawlers.
const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.5 } };
const H2 = "display-type text-foreground text-[clamp(1.8rem,4vw,3rem)] normal-case mb-8";

const Cta = ({ source }: { source: string }) => (
  <ConsultationDialog source={source}>
    <GradientRimButton as="button" variant="filled">
      <span>Zjistit, co by to stálo</span>
      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
    </GradientRimButton>
  </ConsultationDialog>
);

const Services = () => (
  <div className="min-h-screen bg-background">
    <Seo title={PAGES.services.title} description={PAGES.services.description} path="/sluzby"
      jsonLd={[breadcrumbLd([{ name: "MYVE", path: "/" }, { name: "Služby", path: "/sluzby" }])]} />
    <Navbar />
    <main>
      <section className="relative pt-32 pb-16 lg:pt-44 lg:pb-24 overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-primary font-display font-medium text-xs tracking-[0.35em] uppercase mb-4">{OFFER.eyebrow}</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="display-type text-foreground text-[clamp(2.4rem,6.5vw,5.5rem)] leading-[0.95] normal-case">{OFFER.h1}</motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground text-lg md:text-xl leading-relaxed mt-8 max-w-3xl">{OFFER.lead}</motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.35 }} className="mt-10">
            <Cta source="sluzby" />
          </motion.div>
        </div>
      </section>

      <section className="py-14 lg:py-20 border-t border-border">
        <motion.div {...fade} className="container mx-auto px-6 lg:px-12 max-w-6xl">
          <h2 className={H2}>Tři pilíře</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {OFFER.pillars.map((p, i) => (
              <Link key={p.path} to={p.path} className="group flex flex-col rounded-2xl bg-card border border-border p-7 lg:p-8 hover:border-primary/40 transition-colors">
                <span className="display-type text-primary text-4xl">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display font-semibold text-foreground text-xl mt-4 mb-3">{p.title}</h3>
                <p className="text-muted-foreground leading-relaxed flex-1">{p.text}</p>
                <span className="inline-flex items-center gap-2 text-primary font-display font-medium text-sm mt-6">
                  Více <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="py-14 lg:py-20 border-t border-border">
        <motion.div {...fade} className="container mx-auto px-6 lg:px-12 max-w-6xl">
          <h2 className={H2}>A navíc ke každé spolupráci</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {OFFER.bonuses.map((b) => (
              <div key={b.title} className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-7">
                <Plus className="w-5 h-5 text-primary" aria-hidden />
                <h3 className="font-display font-semibold text-foreground text-lg mt-3 mb-2">{b.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
          <a href="/#portal" className="inline-flex items-center gap-2 text-primary font-display font-medium text-sm mt-8 group">
            Jak vypadá klientská aplikace <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </section>

      <section className="py-14 lg:py-20 border-t border-border">
        <motion.div {...fade} className="container mx-auto px-6 lg:px-12 max-w-6xl">
          <h2 className={H2}>Co od nás můžete čekat</h2>
          <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 border-t border-border pt-10">
            {OFFER.dials.map((d) => (
              <div key={d.k}>
                <dt className="font-display font-semibold text-foreground text-lg">{d.k}</dt>
                <div className="w-8 h-1 rounded-full bg-primary mt-3 mb-3" />
                <dd className="text-muted-foreground leading-relaxed">{d.v}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </section>

      <section className="py-14 lg:py-20 border-t border-border">
        <motion.div {...fade} className="container mx-auto px-6 lg:px-12 max-w-3xl">
          <h2 className={H2}>Co když…</h2>
          <div className="divide-y divide-border border-y border-border">
            {OFFER.risks.map((r) => (
              <div key={r.q} className="py-6">
                <h3 className="font-display font-semibold text-foreground text-lg">{r.q}</h3>
                <p className="text-muted-foreground leading-relaxed mt-2">{r.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="py-20 lg:py-28 border-t border-border">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <h2 className="display-type text-foreground text-[clamp(2rem,5vw,3.6rem)] normal-case mb-6">Do jednoho pracovního dne víte, na čem jste</h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10">
            Napište, co vaši firmu dnes brzdí. Řekneme vám na rovinu, co by to obnášelo, jak dlouho by to trvalo a kolik by to stálo. Zdarma a nezávazně.
          </p>
          <Cta source="sluzby-bottom" />
          <p className="text-sm text-muted-foreground mt-10">
            Sídlíme v Jaroměři a pracujeme pro firmy z celého Česka. <Link to="/tvorba-webu-jaromer" className="hover:text-primary transition-colors underline-offset-4 hover:underline">Tvorba webů v Jaroměři a okolí</Link> · <Link to="/jak-to-delame" className="hover:text-primary transition-colors underline-offset-4 hover:underline">Jak to děláme</Link>
          </p>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Services;
