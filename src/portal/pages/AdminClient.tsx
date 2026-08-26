import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Copy, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Chat from "../components/Chat";
import UpdateBody from "../components/UpdateBody";
import UpdateComposer from "../components/UpdateComposer";
import { db, uploadClientLogo } from "../lib/db";
import { relativeFromNow } from "../lib/format";
import { notifyProjectProgress, notifyProjectUpdate } from "../lib/push";
import { STATUS_PRESETS, statusTone } from "../lib/status";
import type { PortalClient, PortalProject, PortalUpdate } from "../lib/types";

function ProjectCard({
  project,
  onChanged,
}: {
  project: PortalProject;
  onChanged: () => void;
}) {
  const [status, setStatus] = useState(project.status);
  const [progress, setProgress] = useState(project.progress);
  const [liveUrl, setLiveUrl] = useState(project.live_url ?? "");
  const [saving, setSaving] = useState(false);

  const [updates, setUpdates] = useState<PortalUpdate[]>([]);

  async function loadUpdates() {
    const { data } = await db
      .from("portal_updates")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setUpdates((data as PortalUpdate[]) ?? []);
  }

  useEffect(() => {
    void loadUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const dirty =
    status !== project.status ||
    progress !== project.progress ||
    liveUrl !== (project.live_url ?? "");

  async function save() {
    const progressChanged = progress !== project.progress;
    setSaving(true);
    await db
      .from("portal_projects")
      .update({ status, progress, live_url: liveUrl.trim() || null })
      .eq("id", project.id);
    setSaving(false);
    if (progressChanged) void notifyProjectProgress(project.id);
    onChanged();
  }

  async function postUpdate({ title, body }: { title: string | null; body: string }) {
    const { data } = await db
      .from("portal_updates")
      .insert({ project_id: project.id, title, body, is_html: true })
      .select()
      .single();
    await loadUpdates();
    if (data) void notifyProjectUpdate((data as PortalUpdate).id);
  }

  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display font-semibold text-lg">{project.name}</p>
        <span
          className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border ${statusTone(status)}`}
        >
          {status}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setStatus(preset)}
            className={[
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              status === preset
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-secondary text-muted-foreground border-border hover:text-foreground",
            ].join(" ")}
          >
            {preset}
          </button>
        ))}
      </div>

      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Průběh</span>
          <span className="tabular-nums text-foreground font-semibold">{progress} %</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(event) => setProgress(Number(event.target.value))}
          className="w-full accent-primary"
        />
      </div>

      <Input
        value={liveUrl}
        onChange={(event) => setLiveUrl(event.target.value)}
        placeholder="Odkaz na projekt (nepovinné)"
        className="rounded-xl text-sm"
      />

      {dirty && (
        <Button
          onClick={save}
          disabled={saving}
          size="sm"
          className="w-full rounded-xl font-display"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Uložit změny"}
        </Button>
      )}

      <div className="border-t border-border pt-4 space-y-4">
        <UpdateComposer onSubmit={postUpdate} />

        {updates.length > 0 && (
          <ul className="space-y-3 border-t border-border pt-4">
            {updates.map((update) => (
              <li key={update.id}>
                <p className="text-[11px] text-muted-foreground">
                  {relativeFromNow(update.created_at)}
                </p>
                {update.title && (
                  <p className="font-display font-semibold text-sm mt-0.5">{update.title}</p>
                )}
                <UpdateBody body={update.body} isHtml={update.is_html} className="mt-1" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * The client's logo replaces the MYVE wordmark across their whole portal, so it
 * is edited here next to their name rather than buried in a settings screen.
 */
function LogoField({ client, onChanged }: { client: PortalClient; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset first: without it, re-picking the same file after a failed upload
    // fires no change event and the button looks dead.
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Nahrajte prosím obrázek.");
      return;
    }
    if (file.size > 2_000_000) {
      setError("Logo musí být menší než 2 MB.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const url = await uploadClientLogo(client.id, file);
      const { error: saveError } = await db
        .from("portal_clients")
        .update({ logo_url: url })
        .eq("id", client.id);
      if (saveError) throw new Error(saveError.message);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nahrání se nezdařilo.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    // Only the reference is cleared; the stored object stays. Every upload
    // writes a new path anyway, so reclaiming them properly means listing the
    // folder — not worth it for a few kilobytes per client.
    const { error: saveError } = await db
      .from("portal_clients")
      .update({ logo_url: null })
      .eq("id", client.id);
    setBusy(false);
    if (saveError) setError(saveError.message);
    else onChanged();
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {client.logo_url && (
          <span className="inline-flex items-center rounded-lg bg-white px-2 py-1">
            <img src={client.logo_url} alt="" className="max-h-5 w-auto max-w-24 object-contain" />
          </span>
        )}

        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-solid hover:text-foreground">
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" />
          )}
          {client.logo_url ? "Změnit logo" : "Přidat logo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={pick}
            disabled={busy}
          />
        </label>

        {client.logo_url && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            aria-label="Odebrat logo"
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function AdminClient() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<PortalClient | null>(null);
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"projects" | "chat">("projects");
  const [copied, setCopied] = useState(false);

  const [newProject, setNewProject] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    if (!clientId) return;
    const [{ data: clientRow }, { data: projectRows }] = await Promise.all([
      db.from("portal_clients").select("*").eq("id", clientId).maybeSingle(),
      db
        .from("portal_projects")
        .select("*")
        .eq("client_id", clientId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);
    setClient((clientRow as PortalClient) ?? null);
    setProjects((projectRows as PortalProject[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function addProject(event: React.FormEvent) {
    event.preventDefault();
    if (!clientId || !newProject.trim()) return;
    setCreating(true);
    await db.from("portal_projects").insert({ client_id: clientId, name: newProject.trim() });
    setNewProject("");
    setCreating(false);
    await load();
  }

  async function copyCode() {
    if (!client) return;
    await navigator.clipboard.writeText(client.access_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!client || !clientId) {
    return <p className="text-center py-16 text-muted-foreground">Klient nenalezen.</p>;
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="px-4 pt-4 lg:px-10 lg:pt-8 shrink-0 mx-auto w-full max-w-3xl lg:max-w-5xl">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Klienti
        </Link>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="font-display text-2xl lg:text-3xl font-bold tracking-tight">
            {client.name}
          </h2>
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Zkopírovat přístupový kód"
          >
            <span className="tracking-widest font-display">{client.access_code}</span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          <LogoField client={client} onChanged={load} />
        </div>

        <div className="flex gap-1 bg-secondary rounded-xl p-1 my-4 lg:max-w-xs">
          {(
            [
              ["projects", "Projekty"],
              ["chat", "Chat"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                tab === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "projects" ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl lg:max-w-5xl px-4 pb-6 lg:px-10 lg:pb-10 space-y-4">
            <form onSubmit={addProject} className="flex gap-2">
              <Input
                value={newProject}
                onChange={(event) => setNewProject(event.target.value)}
                placeholder="Název nového projektu"
                className="rounded-xl"
              />
              <Button
                type="submit"
                size="icon"
                disabled={creating || !newProject.trim()}
                className="rounded-xl shrink-0 h-10 w-10"
                style={{ background: "var(--gradient-primary)" }}
                aria-label="Přidat projekt"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </form>

            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Tento klient zatím nemá projekt.
              </p>
            ) : (
              projects.map((project) => (
                <ProjectCard key={project.id} project={project} onChanged={load} />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <Chat clientId={clientId} as="admin" />
        </div>
      )}
    </div>
  );
}
