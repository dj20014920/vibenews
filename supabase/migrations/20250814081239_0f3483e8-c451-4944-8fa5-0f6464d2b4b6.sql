-- Fix critical security vulnerability: restrict users table access
-- Currently the users table is publicly readable exposing email addresses

-- Drop existing overly permissive policies on users table
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- Create secure RLS policies for users table
-- Allow users to view their own profile data
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

-- Create a public view for user profiles that excludes sensitive data
CREATE OR REPLACE VIEW public.user_profiles_public AS
SELECT 
  id,
  nickname,
  avatar_url,
  bio,
  github_username,
  twitter_handle,
  website,
  location,
  skills,
  level,
  experience_years,
  points,
  badges,
  created_at
FROM public.users;

-- Grant access to the public view
GRANT SELECT ON public.user_profiles_public TO authenticated, anon;

-- Create RLS policy for the public view (allow everyone to see basic profile info)
ALTER VIEW public.user_profiles_public SET (security_barrier = true);

-- Also fix payment_providers table access as identified in scan
DROP POLICY IF EXISTS "Anyone can view active payment providers" ON public.payment_providers;

CREATE POLICY "Authenticated users can view payment providers" 
ON public.payment_providers 
FOR SELECT 
TO authenticated
USING (is_active = true);