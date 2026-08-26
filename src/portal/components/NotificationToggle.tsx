import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { disablePush, enablePush, getPushState, type PushState } from "../lib/push";

export default function NotificationToggle() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPushState().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, []);

  async function toggle(next: boolean) {
    setBusy(true);
    setError(null);
    try {
      setState(next ? await enablePush() : await disablePush());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se nastavit upozornění.");
    } finally {
      setBusy(false);
    }
  }

  if (state === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Načítám…
      </div>
    );
  }

  if (state === "needs-install") {
    return (
      <div className="flex items-start gap-3">
        <Smartphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm mb-1">Upozornění na iPhonu</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nejdřív si portál přidejte na plochu (Sdílet →{" "}
            <span className="text-foreground">Přidat na plochu</span>). Apple
            povoluje upozornění jen nainstalovaným aplikacím.
          </p>
        </div>
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <div className="flex items-start gap-3">
        <BellOff className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tenhle prohlížeč upozornění nepodporuje.
        </p>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex items-start gap-3">
        <BellOff className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm mb-1">Upozornění jsou zablokovaná</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Povolte je v nastavení prohlížeče u této stránky a vraťte se sem.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Bell className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-sm">Upozornění na nové zprávy</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dáme vědět, i když máte portál zavřený.
            </p>
          </div>
        </div>

        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        ) : (
          <Switch
            checked={state === "on"}
            onCheckedChange={toggle}
            aria-label="Upozornění na nové zprávy"
          />
        )}
      </div>

      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  );
}
