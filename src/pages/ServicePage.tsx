import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import ConsultationDialog from "@/components/ConsultationDialog";
import GradientRimButton from "@/components/ui/GradientRimButton";
import { supabase } from "@/integrations/supabase/client";
import { serviceLd, type ServicePageData } from "@/seo/content";

// A service landing page (/tvorba-webu-jaromer, /aplikace-na-miru). The words live in
// src/seo/content.ts, so scripts/prerender.ts can put the same text into static HTML.
const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.5 } };

const ServicePage = ({ data }: { data: ServicePageData }) => {
  const { data: refs } = useQuery({
    queryKey: ["service-refs", data.slug],
    queryFn: async () => {
      const { data: rows, error } = await supabase.from("projects").select("slug, title, description, image_url").in("slug", data.references);
      if (error) throw error;
      type Ref = { slug: string; title: string; description: string | null; image_url: string | null };
      const list = (rows || []) as Ref[];
      return data.references.map((s) => list.find((r) => r.slug === s)).filter((r): r is Ref => !!r);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Seo title={data.title} description={data.description} path={data.path} jsonLd={serviceLd(data)} />
      <Navbar />
      <main>
        <section className="relative pt-32 pb-16 lg:pt-44 lg:pb-24 overflow-hidden">
          <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
            <nav aria-label="Drobečková navigace" className="text-sm text-muted-foreground mb-10">
              <Link to="/" className="hover:text-foreground transition-colors">MYVE</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground/80">{data.h1}</span>
            </nav>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="text-primary font-display font-medium text-xs tracking-[0.35em] uppercase mb-4">{data.eyebrow}</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="display-type text-foreground text-[clamp(2.6rem,8vw,6.5rem)] leading-[0.95]">{data.h1}</motion.h1>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-muted-foreground text-lg md:text-xl leading-relaxed mt-8 max-w-3xl">{data.lead}</motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.35 }} className="mt-10 flex flex-wrap gap-4">
              <ConsultationDialog source={data.slug}>
                <GradientRimButton as="button" variant="filled">
                  <span>Zjistit, co by to stálo</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </GradientRimButton>
              </ConsultationDialog>
              <GradientRimButton variant="outline" renderInner={({ className, children }) => (
                <a href={`tel:+420602513145`} className={className}>{children}</a>
              )}>
                +420 602 513 145
              </GradientRimButton>
            </motion.div>
          </div>
        </section>

        {data.sections.map((s) => (
          <section key={s.h2} className="py-14 lg:py-20 border-t border-border">
            <motion.div {...fade} className="container mx-auto px-6 lg:px-12 max-w-5xl">
              <h2 className="display-type text-foreground text-[clamp(1.8rem,4vw,3rem)] normal-case mb-8">{s.h2}</h2>
              {s.text?.map((t) => <p key={t} className="text-muted-foreground text-lg leading-relaxed mb-4 max-w-3xl">{t}</p>)}
              {s.bullets && (
                <ul className="grid gap-4 max-w-3xl">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-foreground/90 text-lg leading-relaxed">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-1.5" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {s.cards && (
                <div className="grid md:grid-cols-3 gap-6">
                  {s.cards.map((c) => (
                    <div key={c.title} className="rounded-2xl bg-card border border-border p-7">
                      <h3 className="font-display font-semibold text-foreground text-xl mb-3">{c.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </section>
        ))}

        <section className="py-14 lg:py-20 border-t border-border">
          <motion.div {...fade} className="container mx-auto px-6 lg:px-12 max-w-5xl">
            <h2 className="display-type text-foreground text-[clamp(1.8rem,4vw,3rem)] normal-case mb-8">Jak to probíhá</h2>
            <ol className="grid md:grid-cols-2 gap-6">
              {data.steps.map((st, i) => (
                <li key={st.title} className="rounded-2xl bg-card border border-border p-7">
                  <span className="display-type text-primary text-4xl">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-display font-semibold text-foreground text-xl mt-3 mb-2">{st.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{st.text}</p>
                </li>
              ))}
            </ol>
            <Link to="/jak-to-delame" className="inline-flex items-center gap-2 text-primary font-display font-medium text-sm mt-8 group">
              Celý postup krok po kroku <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </section>

        {!!refs?.length && (
          <section className="py-14 lg:py-20 border-t border-border">
            <motion.div {...fade} className="container mx-auto px-6 lg:px-12 max-w-5xl">
              <h2 className="display-type text-foreground text-[clamp(1.8rem,4vw,3rem)] normal-case mb-8">Ukázky naší práce</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {refs.map((p) => (
                  <Link key={p.slug} to={`/projekty/${p.slug}`} className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 transition-colors">
                    {p.image_url && <img src={p.image_url} alt={p.title} loading="lazy" className="w-full aspect-video object-cover" />}
                    <div className="p-6">
                      <h3 className="font-display font-semibold text-foreground text-lg group-hover:text-primary transition-colors">{p.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mt-2 line-clamp-3">{p.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to="/projekty" className="inline-flex items-center gap-2 text-primary font-display font-medium text-sm mt-8 group">
                Všechny projekty <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </section>
        )}

        <section className="py-14 lg:py-20 border-t border-border">
          <motion.div {...fade} className="container mx-auto px-6 lg:px-12 max-w-3xl">
            <h2 className="display-type text-foreground text-[clamp(1.8rem,4vw,3rem)] normal-case mb-8">Časté otázky</h2>
            <div className="divide-y divide-border border-y border-border">
              {data.faq.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-display font-semibold text-foreground text-lg">
                    {f.q}
                    <span className="text-primary text-2xl leading-none transition-transform group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="text-muted-foreground leading-relaxed mt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="py-20 lg:py-28 border-t border-border">
          <div className="container mx-auto px-6 max-w-3xl text-center">
            <h2 className="display-type text-foreground text-[clamp(2rem,5vw,3.6rem)] normal-case mb-6">Do jednoho pracovního dne víte, na čem jste</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              Nechte nám kontakt. Ozveme se do jednoho pracovního dne a řekneme vám na rovinu, co by to obnášelo, jak dlouho by to trvalo a kolik by to stálo. Zdarma a nezávazně.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <ConsultationDialog source={`${data.slug}-bottom`}>
                <GradientRimButton as="button" variant="filled">
                  <span>Zjistit, co by to stálo</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </GradientRimButton>
              </ConsultationDialog>
            </div>
            <Link to={data.related.path} className="inline-block text-muted-foreground hover:text-primary transition-colors text-sm mt-10">
              {data.related.label} →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ServicePage;
