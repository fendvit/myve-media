import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronRight, Copy, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationToggle from "../components/NotificationToggle";
import UnreadBadge from "../components/UnreadBadge";
import { db } from "../lib/db";
import { formatDate } from "../lib/format";
import { usePortalSession } from "../lib/session";
import { usePortalUnread } from "../lib/unread";
import type { PortalClient, PortalProject } from "../lib/types";

interface Row extends PortalClient {
  projects: PortalProject[];
}

export default function AdminHome() {
  const { signOut } = usePortalSession();
  const { byClient } = usePortalUnread();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error: loadError } = await db
      .from("portal_clients")
      .select("*, projects:portal_projects(*)")
      .eq("archived", false)
      .order("created_at", { ascending: false });

    if (loadError) setError(loadError.message);
    else setRows((data as unknown as Row[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    // access_code is filled in by the portal_generate_code() column default.
    const { data, error: insertError } = await db
      .from("portal_clients")
      .insert({ name: name.trim(), contact_email: email.trim() || null })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    if (projectName.trim()) {
      await db
        .from("portal_projects")
        .insert({ client_id: (data as PortalClient).id, name: projectName.trim() });
    }

    setName("");
    setEmail("");
    setProjectName("");
    setAdding(false);
    setSaving(false);
    await load();
  }

  async function copyCode(client: PortalClient) {
    await navigator.clipboard.writeText(client.access_code);
    setCopiedId(client.id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  return (
    <div className="space-y-5 portal-rise">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-bold tracking-tight">Klienti</h2>
          {!loading && rows.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {rows.length} aktivních ·{" "}
              {rows.reduce((total, row) => total + row.projects.length, 0)} projektů
            </p>
          )}
        </div>
        <Button
          onClick={() => setAdding((current) => !current)}
          size="sm"
          className="rounded-xl font-display"
          style={adding ? undefined : { background: "var(--gradient-primary)" }}
          variant={adding ? "secondary" : "default"}
        >
          {adding ? (
            <>
              <X className="h-4 w-4 mr-1" /> Zrušit
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" /> Nový klient
            </>
          )}
        </Button>
      </div>

      {adding && (
        <form
          onSubmit={handleCreate}
          className="bg-card border border-border rounded-3xl p-6 space-y-3"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jméno klienta / firma"
            required
            className="rounded-xl"
          />
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email (nepovinné)"
            className="rounded-xl"
          />
          <Input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="První projekt (nepovinné)"
            className="rounded-xl"
          />
          <Button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full rounded-xl font-display"
            style={{ background: "var(--gradient-primary)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vytvořit a vygenerovat kód"}
          </Button>
        </form>
      )}

      <section className="bg-card border border-border rounded-2xl p-5">
        <NotificationToggle />
      </section>

      <section className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display font-semibold mb-1">Účet</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-1">
          Přihlášeno jako správce.
        </p>
        <button
          type="button"
          onClick={signOut}
          className="w-full text-left text-sm text-muted-foreground hover:text-destructive transition-colors py-2"
        >
          Odhlásit se
        </button>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">
          Zatím žádní klienti. Přidejte prvního a pošlete mu vygenerovaný kód.
        </p>
      ) : (
        <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {rows.map((row) => {
            const unread = byClient.get(row.id)?.unread_messages ?? 0;

            return (
              <li
                key={row.id}
                className={[
                  "bg-card border rounded-2xl overflow-hidden transition-shadow hover:[box-shadow:var(--shadow-card-hover)]",
                  // A waiting client is worth finding at a glance in a long list.
                  unread > 0 ? "border-primary/40" : "border-border",
                ].join(" ")}
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <Link
                  to={`/admin/${row.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={[
                        "font-display truncate",
                        unread > 0 ? "font-bold" : "font-semibold",
                      ].join(" ")}
                    >
                      {row.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {row.projects.length === 0
                        ? "Žádný projekt"
                        : row.projects.map((project) => project.name).join(" · ")}
                    </p>
                  </div>
                  <UnreadBadge count={unread} variant="inline" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>

                <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-secondary/30">
                  <span className="text-[11px] text-muted-foreground shrink-0">Kód</span>
                  <code className="font-display tracking-widest text-sm flex-1">
                    {row.access_code}
                  </code>
                  <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
                    {formatDate(row.created_at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCode(row)}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors p-1"
                    aria-label="Zkopírovat kód"
                  >
                    {copiedId === row.id ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
