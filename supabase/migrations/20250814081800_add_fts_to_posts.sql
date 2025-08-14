-- Step 1: Add the 'fts' tsvector column to community_posts
ALTER TABLE public.community_posts
ADD COLUMN fts tsvector GENERATED ALWAYS AS (
  to_tsvector('simple', title || ' ' || content)
) STORED;

-- Step 2: Create a GIN index on the new column for performance
CREATE INDEX community_posts_fts_idx ON public.community_posts USING gin (fts);

-- Step 3: Add the 'fts' tsvector column to news_articles
ALTER TABLE public.news_articles
ADD COLUMN fts tsvector GENERATED ALWAYS AS (
  to_tsvector('simple', title || ' ' || summary || ' ' || content)
) STORED;

-- Step 4: Create a GIN index on the new column for performance
CREATE INDEX news_articles_fts_idx ON public.news_articles USING gin (fts);

-- Comment on the new columns to explain their purpose
COMMENT ON COLUMN public.community_posts.fts IS 'Full-Text Search vector for title and content';
COMMENT ON COLUMN public.news_articles.fts IS 'Full-Text Search vector for title, summary, and content';
