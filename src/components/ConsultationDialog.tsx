import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ContactForm from "@/components/ContactForm";
import { FUNNEL_EVENTS, track } from "@/lib/track";

interface ConsultationDialogProps {
  /** The element that opens the dialog (e.g. a button). */
  children: ReactNode;
  /** Where on the site this CTA lives — lands in analytics only. */
  source?: string;
}

/**
 * Opens the free-consultation request in a modal. The ask is deliberately
 * tiny (name + e-mail); the "tell us about your project" part happens after
 * the visitor has committed, on the thank-you step.
 */
const ConsultationDialog = ({ children, source = "unknown" }: ConsultationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      track(FUNNEL_EVENTS.ctaClick, { source });
    } else {
      // Fresh form next time; the thank-you step is a one-off.
      setSubmitted(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl border-border/70 bg-background/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {submitted ? (
            <>
              <DialogTitle className="font-display text-2xl">Díky, máme to.</DialogTitle>
              <DialogDescription>
                Ozveme se do jednoho pracovního dne. Tady je, co se stane dál:
              </DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle className="font-display text-2xl">
                Do jednoho pracovního dne víte, na čem jste
              </DialogTitle>
              <DialogDescription>
                Nemusíte nic připravovat. Nechte nám kontakt, ozveme se a společně zjistíme, co
                dává smysl, za kolik a kdy. Když to smysl nedává, řekneme vám to na rovinu.
              </DialogDescription>
            </>
          )}
        </DialogHeader>
        <ContactForm
          className="mt-2"
          source={source}
          onSubmitted={() => setSubmitted(true)}
          onDone={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationDialog;
