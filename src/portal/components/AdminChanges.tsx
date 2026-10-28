import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, supabase } from "../lib/db";
import { CHANGE_STATUSES, changeStatusLabel, changeStatusTone } from "../lib/changes";
import { formatDate } from "../lib/format";
import { notifyChangeRequest } from "../lib/push";
import type { ChangeRequestStatus, PortalChangeRequest, PortalProject } from "../lib/types";

function RequestRow({
  request,
  projectName,
  onSaved,
}: {
  request: PortalChangeRequest;
  projectName: string | null;
  onSaved: (row: PortalChangeRequest) => void;
}) {
  const [note, setNote] = useState(request.admin_note ?? "");
  const [saving, setSaving] = useState<ChangeRequestStatus | "note" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A status change made on another device lands through realtime.
  useEffect(() => {
    setNote(request.admin_note ?? "");
  }, [request.admin_note]);

  async function save(patch: Partial<PortalChangeRequest>, what: ChangeRequestStatus | "note") {
    setSaving(what);
    setError(null);
    const { data, error: updateError } = await db
      .from("portal_change_requests")
      .update(patch)
      .eq("id", request.id)
      .select()
      .single();
    setSaving(null);
    if (updateError || !data) {
      setError("Uložení se nepodařilo.");
      return;
    }
    onSaved(data as PortalChangeRequest);
    void notifyChangeRequest(request.id);
  }

  const noteChanged = note.trim() !== (request.admin_note ?? "");

  return (
    <li className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-block text-[11px] font-medium px-2.5 py-1 rounded-full border ${changeStatusTone(request.status)}`}
        >
          {changeStatusLabel(request.status)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDate(request.created_at)}
          {projectName ? ` · ${projectName}` : ""}
        </span>
      </div>

      <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{request.body}</p>

      <div className="flex flex-wrap gap-1.5">
        {CHANGE_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            disabled={saving !== null || status === request.status}
            onClick={() => void save({ status }, status)}
            className={[
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-default",
              status === request.status
                ? changeStatusTone(status)
                : "border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {saving === status ? <Loader2 className="h-3 w-3 animate-spin" /> : changeStatusLabel(status)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="Odpověď pro klienta (uvidí ji pod požadavkem)"
          className="w-full resize-y rounded-xl bg-secondary px-3 py-2 text-base sm:text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {noteChanged && (
          <Button
            type="button"
            size="sm"
            disabled={saving !== null}
            onClick={() => void save({ admin_note: note.trim() || null }, "note")}
            className="rounded-xl"
          >
            {saving === "note" && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Uložit odpověď
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </li>
  );
}

/** The admin's view of one client's change requests: status buttons and a reply. */
export default function AdminChanges({
  clientId,
  projects,
}: {
  clientId: string;
  projects: PortalProject[];
}) {
  const [requests, setRequests] = useState<PortalChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    db.from("portal_change_requests")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setLoadError("Požadavky se nepodařilo načíst.");
        setRequests((data as PortalChangeRequest[]) ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel(`portal-changes-admin-${clientId}`)
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
          upsert(payload.new as PortalChangeRequest);
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [clientId]);

  function upsert(row: PortalChangeRequest) {
    setRequests((current) =>
      current.some((item) => item.id === row.id)
        ? current.map((item) => (item.id === row.id ? row : item))
        : [row, ...current],
    );
  }

  const projectName = (id: string | null) =>
    id ? projects.find((project) => project.id === id)?.name ?? null : null;

  if (loading) {
    return (
      <div className="flex justify-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (loadError) return <p className="text-sm text-destructive py-6">{loadError}</p>;

  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        Klient zatím neposlal žádný požadavek na změnu.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((request) => (
        <RequestRow
          key={request.id}
          request={request}
          projectName={projectName(request.project_id)}
          onSaved={upsert}
        />
      ))}
    </ul>
  );
}
