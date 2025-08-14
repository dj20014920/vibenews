-- Performance Optimizations Migration

-- Part 1: Full-Text Search for News Articles
-- This is now integrated into the RPC function below, but we still need the column and index.

-- 1.1: Add a tsvector column to store the searchable tokens.
-- Using a generated column is a modern and efficient way to keep the vector updated.
alter table public.news_articles
add column if not exists fts tsvector generated always as (
  to_tsvector('english', title || ' ' || summary)
) stored;

-- 1.2: Create a GIN index on the new tsvector column for fast searching.
create index if not exists news_articles_fts_idx on public.news_articles using gin (fts);


-- Part 2: RPC Function to solve N+1 query for bookmarks AND implement efficient search.
-- This function fetches news articles, includes bookmark status for the user, and performs full-text search.
create or replace function public.get_news_with_bookmarks(
  requesting_user_id uuid,
  search_query text default null
)
returns table (
  id uuid,
  created_at timestamptz,
  title text,
  summary text,
  source_url text,
  thumbnail text,
  author text,
  tags text[],
  published_at timestamptz,
  view_count integer,
  like_count integer,
  comment_count integer,
  is_featured boolean,
  is_hidden boolean,
  is_bookmarked boolean
)
language plpgsql
stable
as $$
begin
  return query
  select
    na.id,
    na.created_at,
    na.title,
    na.summary,
    na.source_url,
    na.thumbnail,
    na.author,
    na.tags,
    na.published_at,
    na.view_count,
    na.like_count,
    na.comment_count,
    na.is_featured,
    na.is_hidden,
    (b.id is not null) as is_bookmarked
  from
    public.news_articles as na
  left join
    public.bookmarks as b on na.id = b.article_id and b.user_id = requesting_user_id
  where
    na.is_hidden = false
    and
    (
      -- If search_query is null or empty, the condition is true and all articles are returned.
      -- Otherwise, it performs a full-text search against the pre-calculated 'fts' column.
      search_query is null or search_query = '' or
      na.fts @@ to_tsquery('english', search_query)
    );
end;
$$;
