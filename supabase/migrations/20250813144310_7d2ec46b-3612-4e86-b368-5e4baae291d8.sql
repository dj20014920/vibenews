-- Enable realtime for key tables
ALTER TABLE public.news_articles REPLICA IDENTITY FULL;
ALTER TABLE public.community_posts REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER TABLE public.bookmarks REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_articles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Update triggers for comment count
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

-- Add comment_count column to news_articles if not exists
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Create trigger for comment count updates
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