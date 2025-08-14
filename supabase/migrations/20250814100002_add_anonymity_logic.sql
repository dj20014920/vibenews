-- Step 1: Create helper function to get a claim from the user's JWT
-- This function safely retrieves a specific claim from the current user's JWT claims.
create or replace function public.get_my_claim(claim text)
returns jsonb
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb -> claim;
$$;

-- Step 2: Create helper function to check if the current user is an admin
-- This uses the get_my_claim function to check for a 'user_role' claim with the value 'admin'.
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
as $$
begin
  -- The claim might be a JSON array, so we check if the first element is 'admin'
  return (get_my_claim('user_role')->>0 = '"admin"');
exception
  -- If any error occurs (e.g., claim doesn't exist), return false for safety.
  when others then
    return false;
end;
$$;

-- Step 3: Create the secure view for community_posts
-- This view redacts the author_id for anonymous posts unless the viewer is an admin.
create or replace view public.v_community_posts as
select
  *,
  case
    when is_anonymous and not is_admin() then null
    else author_id
  end as author_id_visible,
  case
    when not is_admin() then null
    else anonymous_author_id
  end as anonymous_author_id_visible
from public.community_posts;

-- Step 4: Create the secure view for comments
-- This view does the same redaction for comments.
create or replace view public.v_comments as
select
  *,
  case
    when is_anonymous and not is_admin() then null
    else author_id
  end as author_id_visible,
  case
    when not is_admin() then null
    else anonymous_author_id
  end as anonymous_author_id_visible
from public.comments;

-- Step 5: Update RLS policies to apply to the views instead of the tables
-- We will apply SELECT policies on the views and keep CUD (Create, Update, Delete) policies on the base tables.

-- Drop the old SELECT policies from the base tables first.
drop policy if exists "Public can read community posts" on public.community_posts;
drop policy if exists "Public can read comments" on public.comments;

-- Create new SELECT policies on the secure views.
create policy "Public can read community posts" on public.v_community_posts for select using (is_hidden = false);
create policy "Public can read comments" on public.v_comments for select using (is_hidden = false);

-- Step 6: Revoke direct SELECT access on tables and grant it on views
-- This is a critical step to force the application to use the secure views for reading data.
revoke select on table public.community_posts from authenticated, anon;
revoke select on table public.comments from authenticated, anon;

-- Grant select on the new views to the same roles.
grant select on table public.v_community_posts to authenticated, anon;
grant select on table public.v_comments to authenticated, anon;
