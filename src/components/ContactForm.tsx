import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PROJECT_TYPES = [
  "Web na míru",
  "Webová aplikace",
  "Software na míru",
  "Něco jiného",
] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Zadejte prosím své jméno."),
  email: z.string().trim().email("Zadejte prosím platný e-mail."),
  projectType: z.string().optional(),
  message: z.string().trim().min(10, "Napište prosím alespoň pár vět."),
  website: z.string().optional(), // honeypot
});

type FormValues = z.infer<typeof schema>;

const fieldBase =
  "bg-card/60 border-border/70 text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-colors";

interface ContactFormProps {
  className?: string;
  /** Called after a successful submit — e.g. to close a dialog. */
  onSuccess?: () => void;
}

const ContactForm = ({ className, onSuccess }: ContactFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { projectType: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Odeslání se nezdařilo.");

      toast.success("Poptávka odeslána — ozveme se do jednoho pracovního dne.");
      reset();
      onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Něco se pokazilo. Zkuste to prosím znovu."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("w-full text-left space-y-5", className)}
      noValidate
    >
      {/* Honeypot — visually hidden, off from tab + a11y */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        {...register("website")}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="cf-name" className="text-sm font-medium text-foreground/90">
            Jméno
          </label>
          <Input
            id="cf-name"
            placeholder="Vaše jméno"
            className={fieldBase}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-primary">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cf-email" className="text-sm font-medium text-foreground/90">
            E-mail
          </label>
          <Input
            id="cf-email"
            type="email"
            placeholder="vas@email.cz"
            className={fieldBase}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-primary">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="cf-type" className="text-sm font-medium text-foreground/90">
          Typ projektu <span className="text-muted-foreground">(nepovinné)</span>
        </label>
        <Controller
          control={control}
          name="projectType"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="cf-type"
                className={cn(fieldBase, "h-11 rounded-lg")}
              >
                <SelectValue placeholder="Vyberte…" />
              </SelectTrigger>
              <SelectContent className="border-border/70 bg-card/95 backdrop-blur-xl">
                {PROJECT_TYPES.map((t) => (
                  <SelectItem
                    key={t}
                    value={t}
                    className="cursor-pointer rounded-md focus:bg-primary/15 focus:text-foreground data-[state=checked]:text-primary"
                  >
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="cf-message" className="text-sm font-medium text-foreground/90">
          Zpráva
        </label>
        <Textarea
          id="cf-message"
          rows={5}
          placeholder="Popište nám krátce svůj nápad nebo projekt…"
          className={cn(fieldBase, "resize-none")}
          {...register("message")}
        />
        {errors.message && (
          <p className="text-xs text-primary">{errors.message.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="group relative inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 font-display font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        style={{ background: "var(--gradient-primary)" }}
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Odesílám…</span>
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            <span>Odeslat poptávku</span>
          </>
        )}
      </button>

      <p className="text-xs text-muted-foreground">
        Odesláním souhlasíte se zpracováním údajů pro účely odpovědi na vaši poptávku.
      </p>
    </form>
  );
};

export default ContactForm;
