-- Step 1: Add columns for soft-delete functionality to the comments table
alter table public.comments
add column if not exists is_deleted boolean not null default false;

alter table public.comments
add column if not exists deleted_at timestamptz;

-- Step 2: Update the trigger function to handle soft deletes
-- The existing function `update_comment_count` is in migration 20250813144310.
-- We will replace it with an updated version that handles the `is_deleted` flag.

create or replace function public.update_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if tg_op = 'INSERT' then
        if new.article_id is not null then
            update public.news_articles set comment_count = comment_count + 1 where id = new.article_id;
        elsif new.post_id is not null then
            update public.community_posts set comment_count = comment_count + 1 where id = new.post_id;
        end if;
    elsif tg_op = 'DELETE' then
        -- This handles hard deletes, which might still be used by admins.
        if old.article_id is not null then
            update public.news_articles set comment_count = comment_count - 1 where id = old.article_id;
        elsif old.post_id is not null then
            update public.community_posts set comment_count = comment_count - 1 where id = old.post_id;
        end if;
    elsif tg_op = 'UPDATE' then
        -- This handles soft deletes, when is_deleted changes from false to true.
        if old.is_deleted = false and new.is_deleted = true then
            if old.article_id is not null then
                update public.news_articles set comment_count = comment_count - 1 where id = old.article_id;
            elsif old.post_id is not null then
                update public.community_posts set comment_count = comment_count - 1 where id = old.post_id;
            end if;
        -- This handles restoring a soft-deleted comment, just in case.
        elsif old.is_deleted = true and new.is_deleted = false then
            if old.article_id is not null then
                update public.news_articles set comment_count = comment_count + 1 where id = old.article_id;
            elsif old.post_id is not null then
                update public.community_posts set comment_count = comment_count + 1 where id = old.post_id;
            end if;
        end if;
    end if;
    return null;
end;
$$;

-- Step 3: Recreate the trigger to include UPDATE operations
-- Drop the old trigger first to avoid errors.
drop trigger if exists update_comment_count_on_comments on public.comments;

-- Create the new trigger that fires on INSERT, DELETE, and UPDATE.
create trigger update_comment_count_on_comments
    after insert or delete or update on public.comments
    for each row execute function public.update_comment_count();
