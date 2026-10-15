import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import { LEGAL, PAGES } from "@/seo/content";

// /pravni-informace — operator, terms, copyright, cookies, disputes (text in src/seo/content.ts)
const Legal = () => {
  const { hash } = useLocation();
  useEffect(() => {  // the footer's "Cookies" link lands on #cookies
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 150);
  }, [hash]);
  return (
  <div className="min-h-screen bg-background">
    <Seo title={PAGES.legal.title} description={PAGES.legal.description} path="/pravni-informace" />
    <Navbar />
    <main className="pt-32 pb-24 lg:pt-40 container mx-auto px-6 lg:px-12 max-w-3xl">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 text-gradient">Právní informace</h1>
      <p className="text-sm text-muted-foreground mb-10">Aktualizováno {LEGAL.updated}</p>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        {LEGAL.sections.map((s) => (
          <section key={s.h2} id={s.id} className="scroll-mt-28">
            <h2 className="font-display text-2xl font-semibold text-foreground mt-8 mb-3">{s.h2}</h2>
            {s.text.map((t) => <p key={t} className="mb-3">{t}</p>)}
          </section>
        ))}
        <p className="pt-6">
          Jak zpracováváme osobní údaje, najdete v <Link to="/zasady-ochrany-osobnich-udaju" className="text-primary hover:underline">zásadách ochrany osobních údajů</Link>.
        </p>
      </div>
    </main>
    <Footer />
  </div>
  );
};

export default Legal;
