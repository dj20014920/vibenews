CREATE OR REPLACE FUNCTION public.sync_managed_tools(tools_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure the function is run by an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied. Admin role required.';
  END IF;

  -- Perform delete and insert within a single transaction
  DELETE FROM public.managed_tools;

  INSERT INTO public.managed_tools (name, description, url, logo_url, category, popularity_sources)
  SELECT
    (t->>'name')::TEXT,
    (t->>'description')::TEXT,
    (t->>'url')::TEXT,
    (t->>'logo_url')::TEXT,
    (t->>'category')::TEXT,
    (t->'popularity_sources')::JSONB
  FROM jsonb_array_elements(tools_data) AS t;
END;
$$;
