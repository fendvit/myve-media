import { useMemo } from "react";
import { sanitizeRichText } from "../lib/richText";

interface UpdateBodyProps {
  body: string;
  /** Entries written before the rich-text composer are plain text. */
  isHtml: boolean;
  className?: string;
}

/** Renders one update-log body in whichever format it was written. */
export default function UpdateBody({ body, isHtml, className }: UpdateBodyProps) {
  // Sanitized again at render time, not just on save: rows already in the
  // database predate the composer's sanitizer, and this is the step that
  // actually feeds innerHTML.
  const html = useMemo(() => (isHtml ? sanitizeRichText(body) : null), [body, isHtml]);

  const classes = ["portal-rich", className ?? ""].join(" ");

  if (html === null) {
    return <p className={`${classes} whitespace-pre-wrap`}>{body}</p>;
  }

  return <div className={classes} dangerouslySetInnerHTML={{ __html: html }} />;
}
