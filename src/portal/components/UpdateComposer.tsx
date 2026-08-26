import { useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Send,
  Strikethrough,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Shared with the MCP server, which owns this converter: one definition of
// "what Markdown means here" for both the AI and the person typing.
import { markdownToHtml } from "../../../supabase/functions/portal-mcp/markdown";
import { isRichTextEmpty, sanitizeRichText } from "../lib/richText";

interface UpdateComposerProps {
  /** Resolves when the entry is stored; the composer clears on success. */
  onSubmit: (entry: { title: string | null; body: string }) => Promise<void>;
}

/**
 * Conservative on purpose. A false positive rewrites text the user wanted
 * literally, so this only fires on syntax that starts a line — the cases where
 * pasting raw would visibly lose formatting.
 */
function looksLikeMarkdown(text: string): boolean {
  return /^\s{0,3}(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s)/m.test(text);
}

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      // Buttons steal focus from the editor on mousedown, which collapses the
      // selection before the command can act on it.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={[
        "h-7 w-7 inline-flex items-center justify-center rounded-lg transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  function setLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const input = window.prompt("Odkaz (prázdné pole odkaz odebere)", previous ?? "https://");
    if (input === null) return;

    const href = input.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        label="Tučně"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        label="Kurzíva"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        label="Přeškrtnuto"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-border" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        label="Mezinadpis"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        label="Odrážky"
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        label="Číslovaný seznam"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-border" />

      <ToolbarButton onClick={setLink} active={editor.isActive("link")} label="Odkaz">
        <Link2 className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
}

/**
 * Writes one entry into a project's log. Formatting is stored as HTML and
 * sanitized on the way in as well as on the way out.
 */
export default function UpdateComposer({ onSubmit }: UpdateComposerProps) {
  const [title, setTitle] = useState("");
  const [posting, setPosting] = useState(false);
  const [empty, setEmpty] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Three levels rather than one so a heading pasted in from a document
        // or another entry survives the round trip instead of being flattened.
        // StarterKit's input rules make "# ", "- ", "1. " and "**bold**" work
        // while typing, which is what makes the editor feel Markdown-native.
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
    ],
    editorProps: {
      attributes: {
        class: "portal-rich min-h-[76px] px-3 py-2.5 outline-none",
      },
      handlePaste: (view, event) => {
        const clipboard = event.clipboardData;
        if (!clipboard) return false;

        // Real HTML on the clipboard already carries its structure — let
        // Tiptap's own parser handle it, headings and all.
        if (clipboard.getData("text/html")) return false;

        const text = clipboard.getData("text/plain");
        if (!text || !looksLikeMarkdown(text)) return false;

        // Plain text that is clearly Markdown: pasting it raw would drop every
        // "##" and "-" on the floor as literal characters.
        const html = markdownToHtml(text);
        if (!html) return false;

        event.preventDefault();
        view.pasteHTML(html);
        return true;
      },
    },
    onUpdate: ({ editor: instance }) => setEmpty(isRichTextEmpty(instance.getHTML())),
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editor || posting || empty) return;

    setPosting(true);
    try {
      await onSubmit({
        title: title.trim() || null,
        body: sanitizeRichText(editor.getHTML()),
      });
      editor.commands.clearContent();
      setTitle("");
      setEmpty(true);
    } finally {
      setPosting(false);
    }
  }

  if (!editor) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Nadpis záznamu (nepovinné)"
        className="rounded-xl text-sm font-display"
      />

      <div className="rounded-xl border border-input bg-secondary/40 overflow-hidden focus-within:ring-2 focus-within:ring-ring">
        <Toolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">Klient uvidí záznam okamžitě.</p>
        <Button
          type="submit"
          size="sm"
          disabled={posting || empty}
          className="rounded-xl font-display"
          style={{ background: "var(--gradient-primary)" }}
        >
          {posting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-3.5 w-3.5 mr-1.5" /> Přidat záznam
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
