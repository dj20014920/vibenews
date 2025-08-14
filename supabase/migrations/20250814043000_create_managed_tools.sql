CREATE TABLE IF NOT EXISTS public.managed_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  logo_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('IDE', 'CLI', 'SaaS')),
  popularity_sources JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for managed_tools table
ALTER TABLE public.managed_tools ENABLE ROW LEVEL SECURITY;

-- Anyone can read the tools
CREATE POLICY "Public can view managed tools"
ON public.managed_tools
FOR SELECT
USING (true);

-- Admins can manage tools
CREATE POLICY "Admins can manage tools"
ON public.managed_tools
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger to update 'updated_at' column
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.managed_tools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.managed_tools IS 'Curated list of development tools, manageable by admins.';
COMMENT ON COLUMN public.managed_tools.category IS 'Category of the tool: IDE, CLI, or SaaS.';
COMMENT ON COLUMN public.managed_tools.popularity_sources IS 'JSON object containing links to sources for popularity ranking, e.g., {"github": "...", "reddit": "..."}.';
