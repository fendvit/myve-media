import { Link } from "react-router-dom";

// Columns of real links (services, firm, seat, contact, socials), the legal row, and the
// MYVE wordmark in the brand gradient (the logo's orange #FF5D42 → pink #D83D7C), set so
// large that the footer cuts it off.
const COLS: { title: string; links: { label: string; to?: string; href?: string }[] }[] = [
  { title: "Služby", links: [
    { label: "Celý systém", to: "/sluzby" },
    { label: "Tvorba webů", to: "/tvorba-webu" },
    { label: "E-maily a automatizace", to: "/emailing-a-automatizace" },
    { label: "Aplikace na míru", to: "/aplikace-na-miru" },
    { label: "Tvorba webů Jaroměř", to: "/tvorba-webu-jaromer" },
  ] },
  { title: "MYVE", links: [
    { label: "Projekty", to: "/projekty" },
    { label: "Jak to děláme", to: "/jak-to-delame" },
    { label: "Klientský portál", href: "https://portal.myve.media" },
  ] },
  { title: "Sociální sítě", links: [
    { label: "Instagram", href: "https://www.instagram.com/myve.media/" },
    { label: "Facebook", href: "https://www.facebook.com/profile.php?id=100092353287649" },
  ] },
];

const LINK = "text-foreground/85 hover:text-primary transition-colors";
const HEAD = "text-muted-foreground font-display text-base mb-4";

const Footer = () => (
  <footer className="relative overflow-hidden border-t border-border bg-background">
    <div className="container mx-auto px-6 lg:px-12 pt-16 lg:pt-24">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-12 text-sm">
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className={HEAD}>{c.title}</p>
            <ul className="space-y-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  {l.to ? <Link to={l.to} className={LINK}>{l.label}</Link>
                        : <a href={l.href} className={LINK} target="_blank" rel="noopener noreferrer">{l.label}</a>}
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <p className={`${HEAD} flex items-center gap-2`}>
            Sídlo <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden />
          </p>
          <address className="not-italic text-foreground/85 leading-relaxed">
            Vít Fendrych — MYVE<br />
            Obránců míru 449<br />
            551 01 Jaroměř<br />
            IČO 24512362
          </address>
        </div>
        <div>
          <p className={HEAD}>Kontakt</p>
          <p className="text-foreground/85 leading-relaxed">
            Vít Fendrych<br />
            <a href="tel:+420602513145" className={LINK}>+420 602 513 145</a><br />
            <a href="mailto:fendvit.bis@gmail.com" className={LINK}>fendvit.bis@gmail.com</a>
          </p>
        </div>
      </div>

      <div className="mt-16 lg:mt-24 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-muted-foreground">
        <p className="font-display">© {new Date().getFullYear()} MYVE — Making You Visible Everywhere</p>
        <nav aria-label="Právní informace" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/zasady-ochrany-osobnich-udaju" className="hover:text-primary transition-colors">Ochrana osobních údajů</Link>
          <Link to="/pravni-informace" className="hover:text-primary transition-colors">Právní informace</Link>
          <Link to="/pravni-informace#cookies" className="hover:text-primary transition-colors">Cookies</Link>
        </nav>
      </div>
    </div>

    <div aria-hidden className="select-none pointer-events-none mt-8 lg:mt-12 -mb-[0.12em] overflow-hidden">
      <p
        className="display-type text-center leading-[0.8] text-[clamp(4.5rem,25vw,26rem)] tracking-tight whitespace-nowrap"
        style={{
          background: "linear-gradient(100deg, #FF5D42 0%, #FF7A3D 45%, #D83D7C 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        }}
      >
        MYVE
      </p>
    </div>
  </footer>
);

export default Footer;
