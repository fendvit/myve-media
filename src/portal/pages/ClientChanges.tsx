import { useEffect, useState } from "react";
import { ListChecks, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, supabase } from "../lib/db";
import { changeStatusLabel, changeStatusTone } from "../lib/changes";
import { formatDate } from "../lib/format";
import { notifyChangeRequest } from "../lib/push";
import { usePortalSession } from "../lib/session";
import type { PortalChangeRequest, PortalProject } from "../lib/types";

const MAX_LENGTH = 4000;

/**
 * Where the client asks for a change on their project and sees where each
 * request stands. The chat is for talking; a request written there scrolls
 * away under the next messages, so here it keeps its own row and status.
 */
export default function ClientChanges() {
  const { clientId } = usePortalSession();
  const [requests, setRequests] = useState<PortalChangeRequest[]>([]);
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    let active = true;

    Promise.all([
      db
        .from("portal_change_requests")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      db
        .from("portal_projects")
        .select("*")
        .eq("client_id", clientId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]).then(([requestResult, projectResult]) => {
      if (!active) return;
      if (requestResult.error) setLoadError("Požadavky se nepodařilo načíst.");
      setRequests((requestResult.data as PortalChangeRequest[]) ?? []);
      setProjects((projectResult.data as PortalProject[]) ?? []);
      setLoading(false);
    });

    // The admin changing a status while the client has this screen open.
    const channel = supabase
      .channel(`portal-changes-${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "portal_change_requests",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const gone = payload.old as Partial<PortalChangeRequest>;
            setRequests((current) => current.filter((row) => row.id !== gone.id));
            return;
          }
          const row = payload.new as PortalChangeRequest;
          setRequests((current) =>
            current.some((item) => item.id === row.id)
              ? current.map((item) => (item.id === row.id ? row : item))
              : [row, ...current],
          );
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [clientId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!clientId || sending || !draft.trim()) return;

    setSending(true);
    setError(null);
    setSent(false);

    const { data, error: insertError } = await db
      .from("portal_change_requests")
      .insert({
        client_id: clientId,
        project_id: projectId || null,
        body: draft.trim(),
      })
      .select()
      .single();

    setSending(false);

    if (insertError || !data) {
      setError("Požadavek se nepodařilo odeslat. Zkuste to prosím znovu.");
      return;
    }

    const row = data as PortalChangeRequest;
    setRequests((current) =>
      current.some((item) => item.id === row.id) ? current : [row, ...current],
    );
    setDraft("");
    setSent(true);
    void notifyChangeRequest(row.id);
  }

  const projectName = (id: string | null) =>
    id ? projects.find((project) => project.id === id)?.name ?? null : null;

  return (
    <div className="space-y-8 portal-rise">
      <section>
        <h1 className="font-display text-2xl lg:text-3xl font-bold tracking-tight">Změny</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2 max-w-xl">
          Napište nám, co si na svém projektu přejete upravit nebo doplnit. Každý požadavek
          zůstane v přehledu níže a u každého uvidíte, v jakém stavu se právě nachází.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {projects.length > 1 && (
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="w-full rounded-xl bg-secondary px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
              aria-label="Projekt"
            >
              <option value="">Obecně, bez konkrétního projektu</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}

          {/* 16px: iOS zooms the page into any field set smaller. */}
          <textarea
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              if (sent) setSent(false);
            }}
            maxLength={MAX_LENGTH}
            rows={4}
            placeholder="Například: Na úvodní stránce prosím vyměňte fotografii za novou z chatu."
            className="w-full resize-y rounded-xl bg-secondary px-4 py-3 text-base leading-6 outline-none focus:ring-2 focus:ring-ring min-h-[112px]"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
          {sent && (
            <p className="text-sm text-primary">
              Děkujeme, požadavek jsme přijali. O jeho vyřízení vás budeme informovat.
            </p>
          )}

          <Button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-xl h-11 px-5 gap-2 text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Odeslat požadavek
          </Button>
        </form>
      </section>

      <section className="border-t border-border pt-6">
        <h2 className="font-display font-bold text-lg mb-4">Vaše požadavky</h2>

        {loading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : requests.length === 0 ? (
          <div className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
            <ListChecks className="h-5 w-5 shrink-0 mt-0.5" />
            <p>Zatím jste nám neposlali žádný požadavek na změnu.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {requests.map((request) => {
              const project = projectName(request.project_id);
              return (
                <li key={request.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`inline-block text-[11px] font-medium px-2.5 py-1 rounded-full border ${changeStatusTone(request.status)}`}
                    >
                      {changeStatusLabel(request.status)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(request.created_at)}
                      {project ? ` · ${project}` : ""}
                    </span>
                  </div>
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                    {request.body}
                  </p>
                  {request.admin_note && (
                    <div className="mt-3 rounded-xl bg-secondary px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                        Odpověď MYVE
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {request.admin_note}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
