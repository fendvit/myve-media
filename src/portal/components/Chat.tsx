import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, signAttachment, supabase, uploadAttachment } from "../lib/db";
import { notifyNewMessage } from "../lib/push";
import { formatDayLabel, formatTime } from "../lib/format";
import { usePortalUnread } from "../lib/unread";
import type { PortalMessage, SenderRole } from "../lib/types";

interface ChatProps {
  clientId: string;
  /** Which side of the conversation the current user is on. */
  as: SenderRole;
  /** Shown above the thread when the admin is viewing a specific client. */
  heading?: string;
}

/** The bucket is private, so each attachment needs a short-lived signed URL. */
function Attachment({ path, name }: { path: string; name: string | null }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    signAttachment(path).then((signed) => {
      if (active) setUrl(signed);
    });
    return () => {
      active = false;
    };
  }, [path]);

  const label = name ?? "Příloha";
  const isImage = /\.(png|jpe?g|gif|webp|avif)$/i.test(path);

  if (!url) {
    return (
      <div className="flex items-center gap-2 text-xs opacity-70">
        <Loader2 className="h-3 w-3 animate-spin" /> {label}
      </div>
    );
  }

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <img src={url} alt={label} className="rounded-xl max-h-64 w-auto" loading="lazy" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 text-sm underline underline-offset-2 break-all"
    >
      <Paperclip className="h-3.5 w-3.5 shrink-0" />
      {label}
    </a>
  );
}

export default function Chat({ clientId, as, heading }: ChatProps) {
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { markMessagesSeen } = usePortalUnread();

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    db.from("portal_messages")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true })
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) setError("Zprávy se nepodařilo načíst.");
        else setMessages((data as PortalMessage[]) ?? []);
        setLoading(false);
        requestAnimationFrame(() => scrollToBottom("auto"));
        // The thread is on screen, so it counts as read.
        void markMessagesSeen(clientId);
      });

    const channel = supabase
      .channel(`portal-messages-${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "portal_messages",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const incoming = payload.new as PortalMessage;
          setMessages((current) =>
            // The sender already appended it optimistically.
            current.some((message) => message.id === incoming.id)
              ? current
              : [...current, incoming],
          );
          requestAnimationFrame(() => scrollToBottom());
          // Arriving while the thread is open means it was read on arrival —
          // otherwise the badge would appear on the screen you are looking at.
          if (incoming.sender_role !== as) void markMessagesSeen(clientId);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [clientId, scrollToBottom, as, markMessagesSeen]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;
    if (!draft.trim() && !pendingFile) return;

    setSending(true);
    setError(null);

    try {
      let attachmentPath: string | null = null;
      let attachmentName: string | null = null;

      if (pendingFile) {
        const uploaded = await uploadAttachment(clientId, pendingFile);
        attachmentPath = uploaded.path;
        attachmentName = uploaded.name;
      }

      const { data, error: insertError } = await db
        .from("portal_messages")
        .insert({
          client_id: clientId,
          sender_role: as,
          body: draft.trim() || null,
          attachment_url: attachmentPath,
          attachment_name: attachmentName,
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      setMessages((current) =>
        current.some((message) => message.id === (data as PortalMessage).id)
          ? current
          : [...current, data as PortalMessage],
      );

      // Fire-and-forget: the message is already saved, so a push failure must
      // not be reported as a send failure.
      void notifyNewMessage((data as PortalMessage).id);

      setDraft("");
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      requestAnimationFrame(() => scrollToBottom());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Zprávu se nepodařilo odeslat.");
    } finally {
      setSending(false);
    }
  }

  let lastDay = "";

  return (
    <div className="flex flex-col h-full min-h-0">
      {heading && (
        <div className="px-4 py-3 border-b border-border shrink-0">
          <p className="font-display font-semibold">{heading}</p>
        </div>
      )}

      {/* The thread keeps a readable column on a wide monitor instead of
          throwing bubbles at the far edges of the screen. */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1 w-full max-w-3xl mx-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <p className="font-display text-lg font-semibold mb-1">Zatím tu nic není</p>
            <p className="text-sm text-muted-foreground">
              {as === "client"
                ? "Napište nám cokoliv — jsme tu pro vás."
                : "Napište klientovi první zprávu."}
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const mine = message.sender_role === as;
            const day = formatDayLabel(message.created_at);
            const showDay = day !== lastDay;
            lastDay = day;

            return (
              <div key={message.id}>
                {showDay && (
                  <div className="flex justify-center my-4">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                      {day}
                    </span>
                  </div>
                )}

                <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-1.5`}>
                  <div
                    className={[
                      "max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 space-y-2",
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md",
                    ].join(" ")}
                  >
                    {message.attachment_url && (
                      <Attachment
                        path={message.attachment_url}
                        name={message.attachment_name}
                      />
                    )}

                    {message.body && (
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {message.body}
                      </p>
                    )}

                    <p
                      className={`text-[10px] tabular-nums ${
                        mine ? "text-primary-foreground/60" : "text-muted-foreground"
                      } text-right`}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-border bg-card px-3 py-3 w-full"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="w-full max-w-3xl mx-auto space-y-2">
          {error && <p className="text-xs text-destructive px-1">{error}</p>}

          {pendingFile && (
            <div className="flex items-center gap-2 text-xs bg-secondary rounded-lg px-3 py-2">
              <Paperclip className="h-3 w-3 shrink-0" />
              <span className="truncate flex-1">{pendingFile.name}</span>
              <button
                type="button"
                onClick={() => {
                  setPendingFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Odebrat přílohu"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) => setPendingFile(event.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl shrink-0 h-11 w-11"
              aria-label="Přiložit soubor"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends, Shift+Enter makes a new line — chat convention.
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend(event);
                }
              }}
              rows={1}
              placeholder="Napište zprávu…"
              className="flex-1 resize-none bg-secondary rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-ring max-h-32 min-h-[44px]"
            />

            <Button
              type="submit"
              size="icon"
              disabled={sending || (!draft.trim() && !pendingFile)}
              className="rounded-xl shrink-0 h-11 w-11"
              style={{ background: "var(--gradient-primary)" }}
              aria-label="Odeslat"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
