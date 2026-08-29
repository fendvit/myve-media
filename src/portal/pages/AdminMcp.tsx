import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "../lib/db";
import { formatDate, relativeFromNow } from "../lib/format";
import {
  MCP_ENDPOINT,
  claudeCodeCommand,
  claudeConfigJson,
  generateMcpToken,
  sha256Hex,
  tokenHint,
} from "../lib/mcp";
import type { PortalMcpToken } from "../lib/types";

/** Copy-to-clipboard button that confirms itself for a moment. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 text-muted-foreground hover:text-primary transition-colors p-1"
      aria-label={label}
    >
      {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

/** A snippet with its own copy button, used throughout the tutorial. */
function Snippet({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <span className="text-[11px] text-muted-foreground flex-1">{title}</span>
        <CopyButton value={value} label={`Zkopírovat: ${title}`} />
      </div>
      <pre className="px-3 py-2.5 text-xs overflow-x-auto leading-relaxed">
        <code>{value}</code>
      </pre>
    </div>
  );
}

/**
 * Shown once, immediately after minting. The plaintext exists only in this
 * component's state — nothing on the server can produce it again, so the screen
 * says so plainly rather than letting the admin assume they can come back.
 */
function FreshToken({ token, onDone }: { token: string; onDone: () => void }) {
  return (
    <div
      className="bg-card border border-primary/40 rounded-3xl p-6 space-y-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="font-display font-semibold">Token vidíte jenom teď</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Uložený je jenom jeho otisk. Až tuhle kartu zavřete, nepůjde zobrazit
            znovu — dá se jen zneplatnit a vyrobit nový.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
        <code className="text-xs flex-1 break-all">{token}</code>
        <CopyButton value={token} label="Zkopírovat token" />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-display font-semibold">Připojení v Claude Code</p>
        <Snippet title="PowerShell" value={claudeCodeCommand(token)} />

        <p className="text-sm font-display font-semibold pt-1">
          Nebo ručně do konfigurace (Claude Desktop, .mcp.json)
        </p>
        <Snippet title="JSON" value={claudeConfigJson(token)} />
      </div>

      <Button onClick={onDone} variant="secondary" className="w-full rounded-xl font-display">
        Mám zkopírováno, zavřít
      </Button>
    </div>
  );
}

function TokenRow({
  row,
  onRevoke,
  revoking,
}: {
  row: PortalMcpToken;
  onRevoke: (row: PortalMcpToken) => void;
  revoking: boolean;
}) {
  const revoked = row.revoked_at !== null;

  return (
    <li
      className={[
        "bg-card border rounded-2xl p-4 flex items-center gap-3",
        revoked ? "border-border opacity-60" : "border-border",
      ].join(" ")}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold truncate">
          {row.label}
          {revoked && (
            <span className="ml-2 text-[11px] font-normal text-muted-foreground">
              zneplatněn {formatDate(row.revoked_at!)}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          <code>{row.token_hint}…</code> · vytvořen {formatDate(row.created_at)} ·{" "}
          {row.last_used_at ? `naposled použit ${relativeFromNow(row.last_used_at)}` : "zatím nepoužit"}
        </p>
      </div>

      {!revoked && (
        <button
          type="button"
          onClick={() => onRevoke(row)}
          disabled={revoking}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 disabled:opacity-50"
          aria-label={`Zneplatnit token ${row.label}`}
        >
          {revoking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      )}
    </li>
  );
}

export default function AdminMcp() {
  const [rows, setRows] = useState<PortalMcpToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error: loadError } = await db
      .from("portal_mcp_tokens")
      .select("*")
      .order("created_at", { ascending: false });

    if (loadError) setError(loadError.message);
    else setRows((data as PortalMcpToken[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const token = generateMcpToken();
    const { data: session } = await db.auth.getUser();

    const { error: insertError } = await db.from("portal_mcp_tokens").insert({
      label: label.trim(),
      token_hash: await sha256Hex(token),
      token_hint: tokenHint(token),
      created_by: session.user?.id ?? null,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setLabel("");
    setAdding(false);
    setSaving(false);
    setFresh(token);
    await load();
  }

  async function handleRevoke(row: PortalMcpToken) {
    // No confirm dialog: revoking is recoverable in the only sense that matters
    // — mint another token and repaste it. Losing a token is far less costly
    // than leaving a leaked one live while you hunt for the confirm button.
    setRevokingId(row.id);
    const { error: revokeError } = await db
      .from("portal_mcp_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", row.id);

    if (revokeError) setError(revokeError.message);
    setRevokingId(null);
    await load();
  }

  const live = rows.filter((row) => row.revoked_at === null);

  return (
    <div className="space-y-5 portal-rise">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-bold tracking-tight">
            Claude / MCP
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {live.length === 0
              ? "Žádný aktivní token"
              : `${live.length} ${live.length === 1 ? "aktivní token" : "aktivních tokenů"}`}
          </p>
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
              <Plus className="h-4 w-4 mr-1" /> Nový token
            </>
          )}
        </Button>
      </div>

      <section className="bg-card border border-border rounded-2xl p-5 space-y-2">
        <h3 className="font-display font-semibold">Co to je</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Po připojení můžete Claudovi v jakémkoli chatu říct „změň průběh
          projektu na 60 % a napiš klientovi report“ a on to udělá přímo tady
          v portálu. Umí zakládat klienty a projekty, měnit stav a průběh, psát
          záznamy do logu, číst chat a sbírat podklady na reporty.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Token je plný přístup</strong> ke
          všem datům všech klientů — zachází se s ním jako se service role
          klíčem. Dávejte ho jen do svého vlastního Claude.
        </p>
        <div className="flex items-center gap-2 pt-1 rounded-xl border border-border bg-secondary/30 px-3 py-2">
          <span className="text-[11px] text-muted-foreground shrink-0">Adresa</span>
          <code className="text-xs flex-1 break-all">{MCP_ENDPOINT}</code>
          <CopyButton value={MCP_ENDPOINT} label="Zkopírovat adresu serveru" />
        </div>
      </section>

      {adding && (
        <form
          onSubmit={handleCreate}
          className="bg-card border border-border rounded-3xl p-6 space-y-3"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <Input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="K čemu je — např. Vítův notebook"
            required
            className="rounded-xl"
          />
          <Button
            type="submit"
            disabled={saving || !label.trim()}
            className="w-full rounded-xl font-display"
            style={{ background: "var(--gradient-primary)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vygenerovat token"}
          </Button>
        </form>
      )}

      {fresh && <FreshToken token={fresh} onDone={() => setFresh(null)} />}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">
          Zatím žádný token. Vygenerujte si první a vložte ho do svého Claude.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <TokenRow
              key={row.id}
              row={row}
              onRevoke={handleRevoke}
              revoking={revokingId === row.id}
            />
          ))}
        </ul>
      )}

      <section className="bg-card border border-border rounded-2xl p-5 space-y-2">
        <h3 className="font-display font-semibold">Co MCP nedělá</h3>
        <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5 list-disc pl-4">
          <li>
            Zprávy poslané přes <code>send_message</code> neposílají push
            notifikaci — ta potřebuje přihlášený prohlížeč. Zpráva dorazí,
            notifikace ne.
          </li>
          <li>
            Reporty nepíše server. Claude si vytáhne podklady a text napíše sám;
            teprve pak ho zveřejní do logu.
          </li>
          <li>
            Na claude.ai jako vlastní konektor to nepřipojíte — ten chce OAuth.
            Claude Code a Claude Desktop s hlavičkou ano.
          </li>
        </ul>
      </section>
    </div>
  );
}
