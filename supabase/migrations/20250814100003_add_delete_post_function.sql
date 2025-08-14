-- This function allows a user to delete their own post and all of its associated comments in a single, atomic transaction.
create or replace function public.delete_post_and_comments(post_id_in uuid)
returns void
language plpgsql
-- SECURITY DEFINER is used to run the function with the permissions of the user who defined it (the superuser),
-- allowing it to delete comments even if the user doesn't directly own them, after the initial ownership check on the post passes.
security definer
as $$
declare
  post_owner_id uuid;
begin
  -- First, get the owner of the post to verify permission against the currently authenticated user.
  select author_id into post_owner_id from public.community_posts where id = post_id_in;

  -- Check if the current user is the owner of the post. If not, raise an exception.
  if auth.uid() != post_owner_id then
    raise exception 'Authorization error: You are not authorized to delete this post.';
  end if;

  -- If the ownership check passes, proceed with deletion.
  -- Delete all comments associated with the post first to respect foreign key constraints.
  delete from public.comments where post_id = post_id_in;

  -- Finally, delete the post itself.
  delete from public.community_posts where id = post_id_in;
end;
$$;
