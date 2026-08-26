import { useState } from "react";
import { ArrowRight, KeyRound, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "./ThemeToggle";
import { redeemAccessCode, supabase } from "../lib/db";
import { usePortalSession } from "../lib/session";

/** Formats keystrokes as XXXX-XXXX while leaving paste of any format working. */
function formatCodeInput(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

export default function CodeGate() {
  const { refresh } = usePortalSession();
  const [mode, setMode] = useState<"code" | "admin">("code");

  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCodeSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await redeemAccessCode(code);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Přihlášení se nezdařilo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAdminSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Nesprávný email nebo heslo.");
      setBusy(false);
      return;
    }
    await refresh();
    setBusy(false);
  }

  return (
    <div className="relative min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6">
      {/* Reachable before sign-in on purpose — a dark-mode client should not
          have to sit through a full-brightness login screen first. */}
      <div
        className="absolute top-4 right-4"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm portal-rise">
        <div className="text-center mb-8">
          <h1 className="display-type wordmark-myve text-5xl">MYVE</h1>
          <p className="text-muted-foreground text-sm mt-3">
            {mode === "code" ? "Klientský portál" : "Přihlášení správce"}
          </p>
        </div>

        {mode === "code" ? (
          <form
            onSubmit={handleCodeSubmit}
            className="bg-card border border-border rounded-3xl p-7 space-y-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <KeyRound className="h-4 w-4 text-primary" />
              <span>Zadejte přístupový kód</span>
            </div>

            <Input
              value={code}
              onChange={(event) => setCode(formatCodeInput(event.target.value))}
              placeholder="XXXX-XXXX"
              autoComplete="one-time-code"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              required
              className="rounded-xl text-center font-display text-2xl tracking-[0.2em] h-14"
            />

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button
              type="submit"
              disabled={busy || code.replace(/-/g, "").length !== 8}
              className="w-full rounded-xl font-display h-12 text-base"
              style={{ background: "var(--gradient-primary)" }}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Vstoupit <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Kód jste dostali od nás. Zůstanete přihlášení, takže ho zadáváte jen jednou.
            </p>
          </form>
        ) : (
          <form
            onSubmit={handleAdminSubmit}
            className="bg-card border border-border rounded-3xl p-7 space-y-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
              className="rounded-xl"
            />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Heslo"
              required
              className="rounded-xl"
            />

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl font-display h-12"
              style={{ background: "var(--gradient-primary)" }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Přihlásit se"}
            </Button>
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            setMode(mode === "code" ? "admin" : "code");
            setError(null);
          }}
          className="mt-6 w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
        >
          <Lock className="h-3 w-3" />
          {mode === "code" ? "Jsem správce" : "Mám přístupový kód"}
        </button>
      </div>
    </div>
  );
}
