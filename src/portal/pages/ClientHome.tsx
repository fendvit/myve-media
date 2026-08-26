import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { db } from "../lib/db";
import { formatDate, relativeFromNow } from "../lib/format";
import { usePortalSession } from "../lib/session";
import type { PortalProject, PortalUpdate } from "../lib/types";

export default function ClientHome() {
  const { clientId } = usePortalSession();
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
        if (active) setUpdates((data as PortalUpdate[]) ?? []);
      });

    return () => {
      active = false;
    };
  }, [activeId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <p className="font-display text-lg font-semibold mb-1">Projekt se připravuje</p>
        <p className="text-sm text-muted-foreground">
          Jakmile začneme, uvidíte tady jeho stav a průběh. Zatím nám můžete napsat v chatu.
        </p>
      </div>
    );
  }

  const active = projects.find((project) => project.id === activeId) ?? projects[0];

  return (
    <div className="space-y-5">
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
                  : "bg-secondary text-secondary-foreground border-border hover:text-foreground",
              ].join(" ")}
            >
              {project.name}
            </button>
          ))}
        </div>
      )}

      <section
        className="bg-card border border-border rounded-3xl p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="font-display text-2xl font-bold leading-tight">{active.name}</h2>
          <span className="shrink-0 text-xs font-medium px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/25">
            {active.status}
          </span>
        </div>

        {active.description && (
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            {active.description}
          </p>
        )}

        <div className="mt-5">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Průběh</span>
            <span className="tabular-nums font-medium text-foreground">{active.progress} %</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${active.progress}%`, background: "var(--gradient-primary)" }}
            />
          </div>
        </div>

        {active.live_url && (
          <a
            href={active.live_url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4"
          >
            Otevřít projekt <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        <p className="text-xs text-muted-foreground mt-5">
          Založeno {formatDate(active.created_at)}
        </p>
      </section>

      <section>
        <h3 className="font-display font-semibold text-lg mb-3 px-1">Co se děje</h3>

        {updates.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">
            Zatím žádné novinky. Dáme vědět, jakmile se něco pohne.
          </p>
        ) : (
          <ol className="relative pl-5">
            <span className="absolute left-[5px] top-2 bottom-2 w-px bg-border" aria-hidden />
            {updates.map((update) => (
              <li key={update.id} className="relative pb-5 last:pb-0">
                <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                <p className="text-[11px] text-muted-foreground mb-1">
                  {relativeFromNow(update.created_at)}
                </p>
                {update.title && (
                  <p className="font-display font-semibold text-sm mb-0.5">{update.title}</p>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {update.body}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
