-- Fix critical security vulnerability: restrict users table access
-- Drop ALL existing policies on users table first
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT pol.polname 
        FROM pg_policy pol
        JOIN pg_class cls ON pol.polrelid = cls.oid
        JOIN pg_namespace ns ON cls.relnamespace = ns.oid
        WHERE cls.relname = 'users' AND ns.nspname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.users';
    END LOOP;
END $$;

-- Create secure RLS policies for users table
-- Allow users to view their own profile data only
CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create a public view for user profiles that excludes sensitive email data
CREATE OR REPLACE VIEW public.user_profiles_public AS
SELECT 
  id,
  nickname,
  avatar_url,
  bio,
  github_username,
  twitter_username,
  website_url,
  created_at
FROM public.users;

-- Grant access to the public view
GRANT SELECT ON public.user_profiles_public TO authenticated, anon;

-- Also fix payment_providers table access
DROP POLICY IF EXISTS "Anyone can view active payment providers" ON public.payment_providers;

CREATE POLICY "Authenticated users can view payment providers" 
ON public.payment_providers 
FOR SELECT 
TO authenticated
USING (is_active = true);