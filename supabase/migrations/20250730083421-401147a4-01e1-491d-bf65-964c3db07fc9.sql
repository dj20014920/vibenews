-- 보안 경고 수정: 함수의 search_path 설정
CREATE OR REPLACE FUNCTION public.update_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.article_id IS NOT NULL THEN 
            UPDATE news_articles SET like_count = like_count + 1 WHERE id = NEW.article_id;
        ELSIF NEW.post_id IS NOT NULL THEN 
            UPDATE community_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.comment_id IS NOT NULL THEN 
            UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.article_id IS NOT NULL THEN 
            UPDATE news_articles SET like_count = like_count - 1 WHERE id = OLD.article_id;
        ELSIF OLD.post_id IS NOT NULL THEN 
            UPDATE community_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
        ELSIF OLD.comment_id IS NOT NULL THEN 
            UPDATE comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$;

-- update_updated_at_column 함수 수정
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;