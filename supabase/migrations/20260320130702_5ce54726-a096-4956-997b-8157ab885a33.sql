
CREATE TABLE public.partner_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view partner logos"
  ON public.partner_logos FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert partner logos"
  ON public.partner_logos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update partner logos"
  ON public.partner_logos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete partner logos"
  ON public.partner_logos FOR DELETE TO authenticated USING (true);
