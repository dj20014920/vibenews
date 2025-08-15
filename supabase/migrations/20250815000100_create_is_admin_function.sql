-- A helper function to easily check if a user has the 'admin' role.
-- This can be used in other functions and RLS policies for security checks.
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = p_user_id AND role = 'admin'
  );
$$;
