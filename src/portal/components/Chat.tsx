import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, Loader2, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ATTACHMENT_ACCEPT,
  checkAttachment,
  db,
  signAttachment,
  supabase,
  uploadAttachment,
} from "../lib/db";
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

/** How close to the bottom still counts as "reading the latest". */
const STICK_THRESHOLD_PX = 80;

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

/**
 * The thread, memoised on its messages. The draft lives in the composer, so a
 * keystroke re-renders the text box and nothing else — before the split, every
 * letter typed re-rendered every bubble in the conversation.
 */
const MessageList = memo(function MessageList({
  messages,
  as,
}: {
  messages: PortalMessage[];
  as: SenderRole;
}) {
  let lastDay = "";

  return (
    <>
      {messages.map((message) => {
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
                  <Attachment path={message.attachment_url} name={message.attachment_name} />
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
      })}
    </>
  );
});

/**
 * Unsent text, per conversation and per side. Leaving the chat unmounts it, so
 * a half-written message used to vanish the moment you checked the project tab
 * for the detail you were about to quote. Stored per device; storage that is
 * unavailable (private mode, blocked site data) just means no draft is kept.
 */
function draftKey(clientId: string, as: SenderRole) {
  return `myve-portal-draft:${as}:${clientId}`;
}

function readDraft(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // Nothing to do — the draft simply is not remembered on this device.
  }
}

/** "1 nová zpráva", "3 nové zprávy", "5 nových zpráv". */
function newMessagesLabel(count: number): string {
  if (count === 1) return "1 nová zpráva";
  if (count >= 2 && count <= 4) return `${count} nové zprávy`;
  return `${count} nových zpráv`;
}

/** On a touch keyboard Return is a new line; only a real keyboard sends with it. */
function enterSends(): boolean {
  return !window.matchMedia("(pointer: coarse)").matches;
}

function Composer({
  clientId,
  as,
  onSent,
}: {
  clientId: string;
  as: SenderRole;
  onSent: (message: PortalMessage) => void;
}) {
  const storageKey = draftKey(clientId, as);
  const [draft, setDraft] = useState(() => readDraft(storageKey));
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    writeDraft(storageKey, draft);
  }, [storageKey, draft]);

  // Grows with the text up to max-h, then scrolls inside. A fixed one-row box
  // made anything longer than a line impossible to read back before sending.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [draft]);

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setPendingFile(null);
      return;
    }

    // `accept` only filters the picker's default view — it is still possible to
    // choose "all files", so the check has to run on what actually came back.
    const checked = checkAttachment(file);
    if (checked.error) {
      setPendingFile(null);
      // Without the reset, picking the same file again fires no change event
      // and the paperclip looks dead.
      event.target.value = "";
      setError(checked.error);
      return;
    }

    setError(null);
    setPendingFile(file);
  }

  async function handleSend(event?: React.FormEvent) {
    event?.preventDefault();
    if (sending) return;
    if (!draft.trim() && !pendingFile) return;

    setSending(true);
    setError(null);

    try {
      let attachmentPath: string | null = null;
      let attachmentName: string | null = null;

      if (pendingFile) {
        const checked = checkAttachment(pendingFile);
        if (checked.error) throw new Error(checked.error);

        const uploaded = await uploadAttachment(clientId, pendingFile, checked.contentType);
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

      onSent(data as PortalMessage);

      // Fire-and-forget: the message is already saved, so a push failure must
      // not be reported as a send failure.
      void notifyNewMessage((data as PortalMessage).id);

      setDraft("");
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Zprávu se nepodařilo odeslat.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSend} className="shrink-0 border-t border-border bg-card px-3 py-2.5 w-full">
      {/* No safe-area padding here: on a phone the tab bar sits below and
          carries it, and with the keyboard up there is no home indicator to
          clear — the inset only opened a gap above the keys. */}
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
            accept={ATTACHMENT_ACCEPT}
            className="hidden"
            onChange={pickFile}
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

          {/* 16px, not 15: iOS zooms the whole page into any field set smaller. */}
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends, Shift+Enter makes a new line — on a desktop. The
              // IME check keeps Enter from sending a half-composed word.
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing &&
                enterSends()
              ) {
                event.preventDefault();
                void handleSend();
              }
            }}
            rows={1}
            placeholder="Napište zprávu…"
            className="flex-1 resize-none bg-secondary rounded-xl px-4 py-2.5 text-base leading-6 outline-none focus:ring-2 focus:ring-ring max-h-32 min-h-[44px] overflow-y-auto"
          />

          <Button
            type="submit"
            size="icon"
            disabled={sending || (!draft.trim() && !pendingFile)}
            // Taking focus would blur the text box, and on a phone that drops
            // the keyboard after every single message.
            onMouseDown={(event) => event.preventDefault()}
            className="rounded-xl shrink-0 h-11 w-11"
            style={{ background: "var(--gradient-primary)" }}
            aria-label="Odeslat"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function Chat({ clientId, as, heading }: ChatProps) {
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { markMessagesSeen } = usePortalUnread();

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Whether the reader is at the latest message. Kept in a ref: it changes on
  // every scroll event and nothing on screen renders from it.
  const stuckRef = useRef(true);
  // Messages from the other side that arrived while the reader was scrolled
  // up. Without a marker they landed silently below the fold.
  const [unseenBelow, setUnseenBelow] = useState(0);

  const snapToBottom = useCallback(() => {
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, []);

  // Stay on the latest message whenever something changes size underneath:
  // photos arriving after their signed URL, a new bubble, or the keyboard
  // opening and shrinking the thread. One scroll after the first render was
  // not enough — every image that loaded later pushed the reader up the thread.
  // Someone who has scrolled up to read history is left where they are.
  useEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;

    const observer = new ResizeObserver(() => {
      if (stuckRef.current) snapToBottom();
    });
    observer.observe(scroller);
    observer.observe(content);
    return () => observer.disconnect();
  }, [snapToBottom]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    stuckRef.current = true;
    setUnseenBelow(0);

    db.from("portal_messages")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setLoadError("Zprávy se nepodařilo načíst.");
        else setMessages((data as PortalMessage[]) ?? []);
        setLoading(false);
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
          if (incoming.sender_role !== as && !stuckRef.current) {
            setUnseenBelow((count) => count + 1);
          }
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
  }, [clientId, as, markMessagesSeen]);

  const handleSent = useCallback((sent: PortalMessage) => {
    // Your own message always brings you back down, even from deep in history.
    stuckRef.current = true;
    setUnseenBelow(0);
    setMessages((current) =>
      current.some((message) => message.id === sent.id) ? current : [...current, sent],
    );
  }, []);

  const jumpToLatest = useCallback(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    stuckRef.current = true;
    setUnseenBelow(0);
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      {heading && (
        <div className="px-4 py-3 border-b border-border shrink-0">
          <p className="font-display font-semibold">{heading}</p>
        </div>
      )}

      {/* The thread keeps a readable column on a wide monitor instead of
          throwing bubbles at the far edges of the screen. */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        <div
          ref={scrollRef}
          onScroll={(event) => {
            const el = event.currentTarget;
            const stuck = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX;
            stuckRef.current = stuck;
            // Same value is a no-op render, so this is cheap on every scroll.
            if (stuck) setUnseenBelow(0);
          }}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 w-full max-w-3xl mx-auto"
        >
          <div ref={contentRef} className="min-h-full flex flex-col justify-end space-y-1">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : loadError ? (
              <p className="flex-1 flex items-center justify-center text-sm text-destructive">
                {loadError}
              </p>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <p className="font-display text-lg font-semibold mb-1">Zatím tu nic není</p>
                <p className="text-sm text-muted-foreground">
                  {as === "client"
                    ? "Napište nám cokoliv — jsme tu pro vás."
                    : "Napište klientovi první zprávu."}
                </p>
              </div>
            ) : (
              <MessageList messages={messages} as={as} />
            )}
          </div>
        </div>

        {unseenBelow > 0 && (
          <button
            type="button"
            onClick={jumpToLatest}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-lg"
          >
            <ArrowDown className="h-4 w-4" />
            {newMessagesLabel(unseenBelow)}
          </button>
        )}
      </div>

      {/* Keyed by conversation: the admin screen keeps this component mounted
          while switching clients, and one client's draft must not follow you
          into another's thread. */}
      <Composer key={clientId} clientId={clientId} as={as} onSent={handleSent} />
    </div>
  );
}
