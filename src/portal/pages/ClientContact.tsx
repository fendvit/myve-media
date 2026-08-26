import { useEffect, useState } from "react";
import { Mail, MapPin, Phone, Smartphone } from "lucide-react";
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
    <div className="space-y-5">
      <section
        className="bg-card border border-border rounded-3xl p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h2 className="font-display text-xl font-bold mb-1">{CONTACT.name}</h2>
        <p className="text-sm text-muted-foreground mb-5">
          {CONTACT.company} — váš kontakt na všechno kolem projektu
        </p>

        <div className="space-y-1">
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
      </section>

      {installable && (
        <section className="bg-card border border-border rounded-3xl p-6">
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
        </section>
      )}

      <section className="bg-card border border-border rounded-3xl p-6">
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
      </section>
    </div>
  );
}
