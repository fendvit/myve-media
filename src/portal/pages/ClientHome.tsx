import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";
import UpdateBody from "../components/UpdateBody";
import { db, supabase } from "../lib/db";
import { formatDate, relativeFromNow } from "../lib/format";
import { statusTone } from "../lib/status";
import { usePortalSession } from "../lib/session";
import { usePortalUnread } from "../lib/unread";
import type { PortalProject, PortalUpdate } from "../lib/types";

/** Fills from zero on mount so the number reads as progress, not decoration. */
function ProgressBar({ value }: { value: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    // Two frames: one to paint at the old width, one to transition to the new.
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] [transition-duration:900ms] ease-out motion-reduce:transition-none"
        style={{ width: `${shown}%`, background: "var(--gradient-primary)" }}
      />
    </div>
  );
}

export default function ClientHome() {
  const { clientId } = usePortalSession();
  const { markUpdatesSeen } = usePortalUnread();
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [updates, setUpdates] = useState<PortalUpdate[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    let active = true;

    db.from("portal_projects")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        const rows = (data as PortalProject[]) ?? [];
        setProjects(rows);
        setActiveId((current) => current ?? rows[0]?.id ?? null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [clientId]);

  useEffect(() => {
    if (!activeId) {
      setUpdates([]);
      return;
    }
    let active = true;

    db.from("portal_updates")
      .select("*")
      .eq("project_id", activeId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setUpdates((data as PortalUpdate[]) ?? []);
        // The watermark is per client, not per project, so viewing one
        // project's timeline clears the badge for all of them. Acceptable
        // because the project switcher sits directly above this list — the
        // alternative is a second watermark table for a badge.
        if (clientId) void markUpdatesSeen(clientId);
      });

    // Without this, an entry posted while the client is on this very screen
    // would raise a badge on the tab they are already looking at, and the
    // timeline under it would stay stale until a reload.
    const channel = supabase
      .channel(`portal-updates-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "portal_updates",
          filter: `project_id=eq.${activeId}`,
        },
        (payload) => {
          const incoming = payload.new as PortalUpdate;
          setUpdates((current) =>
            current.some((update) => update.id === incoming.id)
              ? current
              : [incoming, ...current],
          );
          if (clientId) void markUpdatesSeen(clientId);
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [activeId, clientId, markUpdatesSeen]);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 px-6 portal-rise">
        <div className="mx-auto mb-4 h-12 w-12 grid place-items-center rounded-2xl bg-primary/12 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="font-display text-xl font-bold mb-1">Projekt se připravuje</p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Jakmile začneme, uvidíte tady jeho stav a průběh. Zatím nám můžete napsat v chatu.
        </p>
      </div>
    );
  }

  const active = projects.find((project) => project.id === activeId) ?? projects[0];

  return (
    <div className="space-y-5 portal-rise">
      {projects.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => setActiveId(project.id)}
              className={[
                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                project.id === active.id
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "bg-card text-muted-foreground border-border hover:text-foreground",
              ].join(" ")}
            >
              {project.name}
            </button>
          ))}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-2 lg:gap-7 lg:items-start space-y-5 lg:space-y-0">
        <section
          className="bg-card border border-border rounded-3xl p-6 lg:p-7"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <span
            className={`inline-block text-[11px] font-medium px-2.5 py-1 rounded-full border ${statusTone(active.status)}`}
          >
            {active.status}
          </span>

          <h2 className="font-display text-2xl lg:text-3xl font-bold leading-tight tracking-tight mt-3">
            {active.name}
          </h2>

          {active.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-2.5">
              {active.description}
            </p>
          )}

          <div className="mt-6">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs text-muted-foreground">Průběh</span>
              <span className="font-display text-2xl font-bold tabular-nums leading-none">
                {active.progress}
                <span className="text-sm text-muted-foreground font-medium"> %</span>
              </span>
            </div>
            <ProgressBar value={active.progress} />
          </div>

          {active.live_url && (
            <a
              href={active.live_url}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15 transition-colors"
            >
              Otevřít projekt <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <p className="text-xs text-muted-foreground mt-6">
            Založeno {formatDate(active.created_at)}
          </p>
        </section>

        <section>
          <h3 className="font-display font-bold text-lg mb-4 px-1">Co se děje</h3>

          {updates.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1 leading-relaxed">
              Zatím žádné novinky. Dáme vědět, jakmile se něco pohne.
            </p>
          ) : (
            <ol className="relative pl-5">
              <span className="absolute left-[5px] top-2 bottom-2 w-px bg-border" aria-hidden />
              {updates.map((update) => (
                <li key={update.id} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    {relativeFromNow(update.created_at)}
                  </p>
                  {update.title && (
                    <p className="font-display font-semibold text-[15px] mb-0.5">
                      {update.title}
                    </p>
                  )}
                  <UpdateBody body={update.body} isHtml={update.is_html} />
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
