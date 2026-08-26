-- Update log entries can carry formatting (Tiptap HTML) instead of plain text.
--
-- A flag rather than sniffing the body for tags: a plain-text entry that
-- legitimately contains "<" would be misread as markup, and an entry written
-- before this migration must keep rendering exactly as it was written.
-- Everything already in the table stays plain by virtue of the default.
alter table public.portal_updates
  add column if not exists is_html boolean not null default false;

comment on column public.portal_updates.is_html is
  'True when body holds sanitized HTML from the rich-text composer; false means plain text rendered with preserved line breaks.';
