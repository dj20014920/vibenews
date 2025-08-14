-- These composite indexes are designed to significantly speed up the queries
-- used in the 'trending-algorithm' function to fetch recent activity.
-- By indexing the foreign key and the timestamp together, the database can
-- efficiently locate and filter the relevant rows without a full table scan.
-- Using 'CONCURRENTLY' ensures that these indexes are built without locking
-- the tables, which is a crucial best practice for live production databases.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_article_id_created_at ON public.likes (article_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_post_id_created_at ON public.likes (post_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_article_id_created_at ON public.comments (article_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_id_created_at ON public.comments (post_id, created_at DESC);
