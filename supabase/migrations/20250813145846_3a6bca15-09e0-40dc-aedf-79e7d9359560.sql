-- Enable realtime for key tables (only if not already enabled)
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER TABLE public.bookmarks REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication (check if not already exists)
DO $$
BEGIN
    -- Check and add comments table
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
    END IF;
    
    -- Check and add likes table
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'likes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
    END IF;
    
    -- Check and add bookmarks table
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'bookmarks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
    END IF;
    
    -- Check and add notifications table
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- Add comment_count column to news_articles if not exists
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Update existing comment counts for news_articles
UPDATE public.news_articles SET comment_count = (
    SELECT COUNT(*) FROM public.comments 
    WHERE comments.article_id = news_articles.id
) WHERE comment_count = 0;

-- Update existing comment counts for community_posts
UPDATE public.community_posts SET comment_count = (
    SELECT COUNT(*) FROM public.comments 
    WHERE comments.post_id = community_posts.id
) WHERE comment_count IS NULL OR comment_count = 0;

-- Create trigger for comment count updates (only if not exists)
DROP TRIGGER IF EXISTS update_comment_count_on_comments ON public.comments;
CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.article_id IS NOT NULL THEN 
            UPDATE public.news_articles SET comment_count = comment_count + 1 WHERE id = NEW.article_id;
        ELSIF NEW.post_id IS NOT NULL THEN 
            UPDATE public.community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.article_id IS NOT NULL THEN 
            UPDATE public.news_articles SET comment_count = comment_count - 1 WHERE id = OLD.article_id;
        ELSIF OLD.post_id IS NOT NULL THEN 
            UPDATE public.community_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER update_comment_count_on_comments
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_comment_count();

-- Create function for incrementing view count
CREATE OR REPLACE FUNCTION public.increment_view_count(content_type TEXT, content_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF content_type = 'news_article' THEN
        UPDATE public.news_articles 
        SET view_count = view_count + 1 
        WHERE id = content_id;
    ELSIF content_type = 'community_post' THEN
        UPDATE public.community_posts 
        SET view_count = view_count + 1 
        WHERE id = content_id;
    END IF;
END;
$$;