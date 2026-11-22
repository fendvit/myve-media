import { Link, useLocation } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import ConsultationDialog from "@/components/ConsultationDialog";
import GradientRimButton from "@/components/ui/GradientRimButton";

// Every unknown URL. The host answers it with status 404 (vercel.json → /404.html, written
// by scripts/prerender.ts); this is what the visitor sees once the app starts.
const LINKS = [
  { to: "/", label: "Hlavní stránka" },
  { to: "/sluzby", label: "Služby" },
  { to: "/projekty", label: "Projekty" },
  { to: "/jak-to-delame", label: "Jak to děláme" },
];

const NotFound = () => {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Stránka nenalezena (404) — MYVE"
        description="Tato stránka neexistuje nebo byla přesunuta. Vraťte se na hlavní stránku studia MYVE."
        path={pathname}
        noindex
      />
      <Navbar />
      <main className="pt-32 pb-24 lg:pt-40 container mx-auto px-6 lg:px-12 max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-widest text-primary mb-4">Chyba 404</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 text-gradient">Tuto stránku jsme nenašli.</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10">
          Odkaz, který jste otevřeli, je pravděpodobně neúplný nebo stránka byla přesunuta. Pokračujte prosím
          některou z následujících stránek, případně se nám rovnou ozvěte.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 mb-10">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="flex min-h-[52px] items-center justify-between rounded-xl border border-border px-5 py-3 text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {l.label}
                <span aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ul>
        <ConsultationDialog source="404">
          <GradientRimButton as="button" variant="filled" size="md">
            Konzultace zdarma
          </GradientRimButton>
        </ConsultationDialog>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
