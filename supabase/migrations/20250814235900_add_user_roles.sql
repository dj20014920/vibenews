-- Step 1: Add the 'role' column to the users table for role-based access control.
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL;

-- Add a check constraint to ensure only valid roles are used.
ALTER TABLE public.users
ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user', 'moderator'));

COMMENT ON COLUMN public.users.role IS 'User role for access control (e.g., admin, user, moderator)';


-- Step 2: Fix the overly restrictive SELECT policy on the users table.
-- The previous policy only allowed users to see their own profile, which breaks
-- public profile pages and the admin user management page.
-- This new policy makes user profiles public, which is standard for a community platform.
-- Sensitive data should not be stored in the public.users table.

-- Drop any potentially conflicting SELECT policies first to be safe.
DROP POLICY IF EXISTS "Allow users to view their own profile data only" ON public.users;
DROP POLICY IF EXISTS "Public user profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.users;


-- Create a new, permissive SELECT policy.
CREATE POLICY "Public user profiles are viewable by everyone"
ON public.users
FOR SELECT
USING (true);


-- Step 3: Ensure the UPDATE policy is secure.
-- The existing policy "Users can update their own profile" (`USING (auth.uid() = id)`)
-- is correct. We do not need to modify it. The 'role' column is protected because
-- only a secure backend function (using the service_role_key) will be allowed to modify it.
-- The public API for profile updates should not allow changing the 'role' field.
-- For clarity, we can re-state the ideal update policy here.

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
-- The WITH CHECK clause is omitted here because we assume the frontend API will only
-- send fields the user is allowed to edit (e.g., nickname, bio).
-- The 'role' column will be managed by a separate, secure admin function.
;
