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

interface ConsultationDialogProps {
  /** The element that opens the dialog (e.g. a button). */
  children: ReactNode;
}

/**
 * Opens the consultation request form in a modal. Use anywhere a CTA should
 * collect a project brief without navigating away.
 */
const ConsultationDialog = ({ children }: ConsultationDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl border-border/70 bg-background/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Domluvme si konzultaci
          </DialogTitle>
          <DialogDescription>
            Napište nám pár vět o svém projektu. Ozveme se vám obvykle do jednoho
            pracovního dne.
          </DialogDescription>
        </DialogHeader>
        <ContactForm className="mt-2" onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationDialog;
