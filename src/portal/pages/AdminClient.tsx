import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Chat from "../components/Chat";
import { db } from "../lib/db";
import { relativeFromNow } from "../lib/format";
import type { PortalClient, PortalProject, PortalUpdate } from "../lib/types";

const STATUS_PRESETS = ["V přípravě", "Probíhá", "Ke kontrole", "Hotovo", "Pozastaveno"];

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
  const [updateBody, setUpdateBody] = useState("");
  const [posting, setPosting] = useState(false);

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
    setSaving(true);
    await db
      .from("portal_projects")
      .update({ status, progress, live_url: liveUrl.trim() || null })
      .eq("id", project.id);
    setSaving(false);
    onChanged();
  }

  async function postUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (!updateBody.trim()) return;
    setPosting(true);
    await db
      .from("portal_updates")
      .insert({ project_id: project.id, body: updateBody.trim() });
    setUpdateBody("");
    setPosting(false);
    await loadUpdates();
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <p className="font-display font-semibold">{project.name}</p>

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
          <span className="tabular-nums text-foreground font-medium">{progress} %</span>
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

      <div className="border-t border-border pt-4">
        <form onSubmit={postUpdate} className="flex items-end gap-2">
          <textarea
            value={updateBody}
            onChange={(event) => setUpdateBody(event.target.value)}
            rows={2}
            placeholder="Nový záznam do logu…"
            className="flex-1 resize-none bg-secondary rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            type="submit"
            size="icon"
            disabled={posting || !updateBody.trim()}
            className="rounded-xl shrink-0 h-10 w-10"
            style={{ background: "var(--gradient-primary)" }}
            aria-label="Přidat záznam"
          >
            {posting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {updates.length > 0 && (
          <ul className="mt-4 space-y-3">
            {updates.map((update) => (
              <li key={update.id} className="text-sm">
                <p className="text-[11px] text-muted-foreground">
                  {relativeFromNow(update.created_at)}
                </p>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {update.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function AdminClient() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<PortalClient | null>(null);
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"projects" | "chat">("projects");

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
      <div className="px-4 pt-4 shrink-0">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Klienti
        </Link>

        <h2 className="font-display text-xl font-bold">{client.name}</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Kód <span className="tracking-widest">{client.access_code}</span>
        </p>

        <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-4">
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
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "projects" ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-4">
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
      ) : (
        <div className="flex-1 min-h-0">
          <Chat clientId={clientId} as="admin" />
        </div>
      )}
    </div>
  );
}
