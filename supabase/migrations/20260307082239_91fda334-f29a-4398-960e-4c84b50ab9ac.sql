
ALTER TABLE public.projects 
  ADD COLUMN external_url text,
  ADD COLUMN detailed_description text,
  ADD COLUMN screenshots text[] DEFAULT '{}'::text[],
  ADD COLUMN steps jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN slug text;

-- Create unique index on slug for URL-friendly project pages
CREATE UNIQUE INDEX projects_slug_unique ON public.projects (slug) WHERE slug IS NOT NULL;
