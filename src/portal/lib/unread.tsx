import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { db, supabase } from "./db";
import { usePortalSession } from "./session";
import type { PortalUnreadRow } from "./types";

interface UnreadValue {
  /** Keyed by client id. Missing means zero. */
  byClient: Map<string, PortalUnreadRow>;
  /** Totals across every client the viewer can see. */
  totalMessages: number;
  totalUpdates: number;
  /** Moves the watermark to now and clears the badge optimistically. */
  markMessagesSeen: (clientId: string) => Promise<void>;
  markUpdatesSeen: (clientId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const UnreadContext = createContext<UnreadValue | null>(null);

const EMPTY = new Map<string, PortalUnreadRow>();

export function PortalUnreadProvider({ children }: { children: ReactNode }) {
  const { session } = usePortalSession();
  const userId = session?.user?.id ?? null;

  const [byClient, setByClient] = useState<Map<string, PortalUnreadRow>>(EMPTY);

  // Read inside the realtime callback, which would otherwise close over the
  // first render's value forever.
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  // Counts arrive from two places that can overlap — the realtime handler and
  // the refresh that follows a "mark seen" write. Without a sequence number the
  // slower of the two wins regardless of which asked last, and a badge the user
  // just cleared reappears.
  const requestSeq = useRef(0);

  const refresh = useCallback(async () => {
    if (!userId) {
      setByClient(EMPTY);
      return;
    }
    const seq = ++requestSeq.current;
    const { data, error } = await db.rpc("portal_unread_summary");

    // A failed count is not worth an error state on screen — the badge simply
    // stays as it was.
    if (error || !data) return;
    if (seq !== requestSeq.current) return;

    setByClient(
      new Map((data as PortalUnreadRow[]).map((row) => [row.client_id, row])),
    );
  }, [userId]);

  refreshRef.current = refresh;

  useEffect(() => {
    if (!userId) return;
    void refresh();

    // Both tables are already in the supabase_realtime publication, and RLS
    // filters the stream, so this only fires for rows the viewer may see.
    const channel = supabase
      .channel(`portal-unread-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "portal_messages" },
        () => void refreshRef.current(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "portal_updates" },
        () => void refreshRef.current(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  const markSeen = useCallback(
    async (clientId: string, column: "messages_seen_at" | "updates_seen_at") => {
      if (!userId) return;

      // Clear locally first: the row is on screen and the user just looked at
      // it, so waiting for a round trip only makes the badge linger.
      setByClient((current) => {
        const row = current.get(clientId);
        if (!row) return current;
        const field = column === "messages_seen_at" ? "unread_messages" : "unread_updates";
        if (row[field] === 0) return current;

        const next = new Map(current);
        next.set(clientId, { ...row, [field]: 0 });
        return next;
      });

      const { error } = await db.from("portal_read_state").upsert(
        { user_id: userId, client_id: clientId, [column]: new Date().toISOString() },
        { onConflict: "user_id,client_id" },
      );

      // Refresh either way, and only once the write has landed. On failure it
      // restores the badge rather than showing "read" for something the server
      // still counts; on success it settles the count against the new
      // watermark, which is what makes an entry arriving on the open screen
      // stay cleared instead of flickering back.
      await refresh();
      if (error) console.warn("Nepodařilo se uložit stav přečtení:", error.message);
    },
    [userId, refresh],
  );

  // Stable identities on purpose. Callers put these in effect dependency
  // arrays; if they were rebuilt whenever the counts changed, marking a thread
  // seen would change the counts, change the callback, re-run the effect and
  // mark it seen again — a resubscribe loop.
  const markMessagesSeen = useCallback(
    (clientId: string) => markSeen(clientId, "messages_seen_at"),
    [markSeen],
  );
  const markUpdatesSeen = useCallback(
    (clientId: string) => markSeen(clientId, "updates_seen_at"),
    [markSeen],
  );

  const value = useMemo<UnreadValue>(() => {
    let totalMessages = 0;
    let totalUpdates = 0;
    for (const row of byClient.values()) {
      totalMessages += row.unread_messages;
      totalUpdates += row.unread_updates;
    }

    return {
      byClient,
      totalMessages,
      totalUpdates,
      markMessagesSeen,
      markUpdatesSeen,
      refresh,
    };
  }, [byClient, markMessagesSeen, markUpdatesSeen, refresh]);

  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
}

export function usePortalUnread(): UnreadValue {
  const context = useContext(UnreadContext);
  if (!context) {
    throw new Error("usePortalUnread must be used inside <PortalUnreadProvider>");
  }
  return context;
}
