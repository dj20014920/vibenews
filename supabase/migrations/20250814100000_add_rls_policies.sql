-- Step 1: Enable RLS for all relevant tables
alter table public.news_articles enable row level security;
alter table public.community_posts enable row level security;
alter table public.comments enable row level security;

-- Step 2: Policies for news_articles
-- Public can read non-hidden articles.
create policy "Public can read news" on public.news_articles for select using (is_hidden = false);
-- Note: We assume no UI for creating news articles by non-admin users, so no INSERT/UPDATE/DELETE policies are added for them.

-- Step 3: Policies for community_posts
-- Public can read non-hidden posts.
create policy "Public can read community posts" on public.community_posts for select using (is_hidden = false);

-- Authenticated users can create posts.
create policy "Users can create community posts" on public.community_posts for insert with check (auth.role() = 'authenticated');

-- Users can update their own posts.
create policy "Users can update their own community posts" on public.community_posts for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Users can delete their own posts.
create policy "Users can delete their own community posts" on public.community_posts for delete using (auth.uid() = author_id);

-- Step 4: Policies for comments
-- Public can read non-hidden comments.
create policy "Public can read comments" on public.comments for select using (is_hidden = false);

-- Authenticated users can create comments.
create policy "Users can create comments" on public.comments for insert with check (auth.role() = 'authenticated');

-- Users can update their own comments.
create policy "Users can update their own comments" on public.comments for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Users can delete their own comments.
create policy "Users can delete their own comments" on public.comments for delete using (auth.uid() = author_id);
