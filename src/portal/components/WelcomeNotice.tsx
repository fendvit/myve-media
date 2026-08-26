import { X } from "lucide-react";

interface WelcomeNoticeProps {
  onDismiss: () => void;
}

/**
 * The "how this page works" explainer every project opens with.
 *
 * Rendered from code rather than seeded as a portal_updates row: it is the same
 * text on every project, it would otherwise sit in the report feed forever, and
 * a new project gets it without the admin having to remember to write it.
 * Visibility is decided by the caller — see portal_welcome_dismissals.
 */
export default function WelcomeNotice({ onDismiss }: WelcomeNoticeProps) {
  return (
    <aside className="relative rounded-2xl border border-border bg-secondary/70 px-5 py-4 pr-12">
      <p className="text-sm leading-relaxed text-muted-foreground">
        <span aria-hidden className="mr-1.5">
          👋
        </span>
        <strong className="font-semibold text-foreground">
          Vítejte na stránce vašeho projektu.
        </strong>{" "}
        Tady vždy najdete aktuální stav vývoje — co je hotové a co jsme naposledy
        nasadili. Stránku průběžně aktualizujeme, takže si ji stačí uložit do
        záložek. Není potřeba nic hledat v e-mailech.
      </p>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Zavřít uvítací zprávu"
        className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </aside>
  );
}
