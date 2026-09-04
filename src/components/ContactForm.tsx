import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FUNNEL_EVENTS, track } from "@/lib/track";

/**
 * Outcomes, not deliverables. The visitor should never have to decide between
 * "web" and "webová aplikace" — that decision is the thing we are offering
 * to make for them. "Ještě nevím" is a valid, first-class answer.
 */
export const GOALS = [
  "Chci víc poptávek z webu",
  "Chci ušetřit ruční práci",
  "Potřebuju vlastní aplikaci",
  "Ještě nevím",
] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Zadejte prosím své jméno."),
  email: z.string().trim().email("Zadejte prosím platný e-mail."),
  goal: z.string().optional(),
  message: z.string().trim().optional(),
  website: z.string().optional(), // honeypot
});

type FormValues = z.infer<typeof schema>;

const followUpSchema = z
  .object({
    phone: z.string().trim().optional(),
    message: z.string().trim().optional(),
  })
  .refine((v) => (v.phone && v.phone.length > 0) || (v.message && v.message.length > 0), {
    message: "Doplňte telefon nebo pár slov.",
    path: ["message"],
  });

type FollowUpValues = z.infer<typeof followUpSchema>;

const fieldBase =
  "bg-card/60 border-border/70 text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-colors";

const NEXT_STEPS = [
  "Přečteme si, co jste nám poslali, a podíváme se na váš byznys.",
  "Do jednoho pracovního dne se ozveme a domluvíme krátký hovor.",
  "Řekneme vám na rovinu, co dává smysl, za kolik a kdy. I kdyby to mělo být „zatím nic“.",
];

interface ContactFormProps {
  className?: string;
  /** Where the form was opened from — lands in analytics only. */
  source?: string;
  /** Called the moment the request is accepted (e.g. to swap a dialog title). */
  onSubmitted?: () => void;
  /** Called when the visitor is done with the thank-you step (e.g. to close a dialog). */
  onDone?: () => void;
}

const postContact = async (payload: Record<string, unknown>) => {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Odeslání se nezdařilo.");
  return data;
};

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Něco se pokazilo. Zkuste to prosím znovu.";

/** Step 2 — shown only after the visitor has already committed. */
const ThankYou = ({
  lead,
  source,
  onDone,
}: {
  lead: { name: string; email: string };
  source?: string;
  onDone?: () => void;
}) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FollowUpValues>({ resolver: zodResolver(followUpSchema) });

  const onSubmit = async (values: FollowUpValues) => {
    setSending(true);
    try {
      await postContact({ kind: "followup", ...lead, ...values });
      track(FUNNEL_EVENTS.contactFollowUp, { source: source ?? "unknown" });
      setSent(true);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full text-left space-y-6" data-testid="contact-thankyou">
      <ol className="space-y-3">
        {NEXT_STEPS.map((step, i) => (
          <li key={step} className="flex gap-3 text-sm text-foreground/90">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-[11px] font-semibold text-primary">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {sent ? (
        <p className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <Check className="h-4 w-4 text-primary" />
          Díky, máme to u sebe. Uvidíme se v hovoru.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <p className="text-sm text-muted-foreground">
            Chcete, aby hovor šel rychleji? Doplňte cokoliv z toho níže. Není to nutné.
          </p>
          <div className="space-y-1.5">
            <label htmlFor="cf-phone" className="text-sm font-medium text-foreground/90">
              Telefon
            </label>
            <Input
              id="cf-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+420 …"
              className={fieldBase}
              {...register("phone")}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cf-followup" className="text-sm font-medium text-foreground/90">
              Pár slov o tom, co děláte a co vás teď brzdí
            </label>
            <Textarea
              id="cf-followup"
              rows={3}
              placeholder="Např. „Máme e-shop s doplňky, objednávky přepisujeme ručně do účetnictví.“"
              className={cn(fieldBase, "resize-none")}
              {...register("message")}
            />
            {errors.message && <p className="text-xs text-primary">{errors.message.message}</p>}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onDone}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Zavřít, ozvete se mi
            </button>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-card/60 px-6 py-3 font-display text-sm font-semibold text-foreground transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>{sending ? "Odesílám…" : "Doplnit"}</span>
            </button>
          </div>
        </form>
      )}

      {sent && (
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 font-display font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: "var(--gradient-primary)" }}
        >
          Hotovo
        </button>
      )}
    </div>
  );
};

const ContactForm = ({ className, source, onSubmitted, onDone }: ContactFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [lead, setLead] = useState<{ name: string; email: string } | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { goal: "", message: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    track(FUNNEL_EVENTS.contactSubmit, {
      source: source ?? "unknown",
      goal: values.goal || "none",
    });
    try {
      await postContact({ kind: "request", ...values });
      track(FUNNEL_EVENTS.contactSuccess, { source: source ?? "unknown" });
      setLead({ name: values.name, email: values.email });
      onSubmitted?.();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (lead) {
    return (
      <div className={className}>
        <ThankYou lead={lead} source={source} onDone={onDone} />
      </div>
    );
  }

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
            autoComplete="name"
            placeholder="Vaše jméno"
            className={fieldBase}
            {...register("name")}
          />
          {errors.name && <p className="text-xs text-primary">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cf-email" className="text-sm font-medium text-foreground/90">
            E-mail
          </label>
          <Input
            id="cf-email"
            type="email"
            autoComplete="email"
            placeholder="vas@email.cz"
            className={fieldBase}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-primary">{errors.email.message}</p>}
        </div>
      </div>

      <Controller
        control={control}
        name="goal"
        render={({ field }) => (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground/90">
              Co by vám teď pomohlo nejvíc?{" "}
              <span className="text-muted-foreground">(nepovinné)</span>
            </legend>
            <div role="radiogroup" className="flex flex-wrap gap-2">
              {GOALS.map((goal) => {
                const active = field.value === goal;
                return (
                  <button
                    key={goal}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => field.onChange(active ? "" : goal)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border/70 bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      />

      <div className="space-y-1.5">
        <label htmlFor="cf-message" className="text-sm font-medium text-foreground/90">
          Poznámka <span className="text-muted-foreground">(nepovinné)</span>
        </label>
        <Textarea
          id="cf-message"
          rows={3}
          placeholder="Pokud chcete, napište pár slov. Nemusíte nic vymýšlet, zjistíme to spolu."
          className={cn(fieldBase, "resize-none")}
          {...register("message")}
        />
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
            <span>Chci vědět, na čem jsem</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      <p className="text-xs text-muted-foreground">
        Ozveme se do jednoho pracovního dne. Zdarma, nezávazně, bez obchodního tlaku. Odesláním
        souhlasíte se zpracováním údajů pro účely odpovědi.
      </p>
    </form>
  );
};

export default ContactForm;
