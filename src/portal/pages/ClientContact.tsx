import { useEffect, useState, type ReactNode } from "react";
import { Mail, MapPin, Phone, Smartphone } from "lucide-react";
import NotificationToggle from "../components/NotificationToggle";
import ThemeToggle from "../components/ThemeToggle";
import { db } from "../lib/db";
import { usePortalSession } from "../lib/session";
import type { PortalClient } from "../lib/types";

const CONTACT = {
  name: "Vít Fendrych",
  company: "MYVE",
  email: "fendvit.bis@gmail.com",
  phone: "+420 602 513 145",
  phoneHref: "+420602513145",
  address: "Obránců míru 449, 551 01 Jaroměř",
};

/**
 * One card, one look. The contact card used to be the only one carrying
 * `--shadow-card`, which read as an accident rather than emphasis.
 */
function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={`bg-card border border-border rounded-3xl ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {children}
    </section>
  );
}

export default function ClientContact() {
  const { clientId, signOut } = usePortalSession();
  const [client, setClient] = useState<PortalClient | null>(null);

  useEffect(() => {
    if (!clientId) return;
    let active = true;

    db.from("portal_clients")
      .select("*")
      .eq("id", clientId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setClient((data as PortalClient) ?? null);
      });

    return () => {
      active = false;
    };
  }, [clientId]);

  // The install banner is only meaningful when the app is running in a tab.
  const [installable, setInstallable] = useState(false);
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setInstallable(!standalone);
  }, []);

  return (
    // Two independent stacks, not a grid of loose cards.
    //
    // `grid-cols-2` over five siblings of unequal height fills row by row and
    // pads every card up to the tallest one in its row, so a short card next to
    // the tall contact card left a hole and the next row started below the
    // hole — cards looked scattered at random. Columns that each own their own
    // stack keep the vertical rhythm even; only the very bottom of the shorter
    // column is ragged, which is what a page is supposed to look like.
    <div className="portal-rise grid gap-5 lg:grid-cols-2 lg:items-start">
      <div className="space-y-5">
        <Card className="p-6">
          <h2 className="font-display text-xl font-bold mb-1">{CONTACT.name}</h2>
          <p className="text-sm text-muted-foreground mb-5">
            {CONTACT.company} — váš kontakt na všechno kolem projektu
          </p>

          <div>
            <a
              href={`mailto:${CONTACT.email}`}
              className="flex items-center gap-3 py-3 border-t border-border hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm break-all">{CONTACT.email}</span>
            </a>
            <a
              href={`tel:${CONTACT.phoneHref}`}
              className="flex items-center gap-3 py-3 border-t border-border hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm">{CONTACT.phone}</span>
            </a>
            <div className="flex items-center gap-3 py-3 border-t border-border">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">{CONTACT.address}</span>
            </div>
          </div>
        </Card>

        {installable && (
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-semibold mb-1">Mějte portál po ruce</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Přidejte si portál na plochu telefonu — otevře se jako běžná aplikace.
                  V prohlížeči zvolte nabídku a{" "}
                  <span className="text-foreground">Přidat na plochu</span>.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-5">
        {/* Notifications and theme are both "how this device behaves", and both
            are one switch wide. As separate cards they were the two stubs that
            made the grid look scattered; as rows of one card they read as a
            settings list. */}
        <Card className="p-3">
          <h3 className="font-display font-semibold px-3 pt-3 pb-1">Nastavení</h3>
          <div className="px-3 py-3">
            <NotificationToggle />
          </div>
          <div className="border-t border-border pt-1">
            <ThemeToggle variant="switch" />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold mb-4">Účet</h3>

          {client && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Klient</span>
                <span className="font-medium text-right">{client.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Přístupový kód</span>
                <span className="font-display tracking-widest text-right">
                  {client.access_code}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={signOut}
            className="mt-5 w-full text-sm text-muted-foreground hover:text-destructive transition-colors py-2"
          >
            Odhlásit se
          </button>
        </Card>
      </div>
    </div>
  );
}
