-- Auto-hide content when reports reach threshold
CREATE OR REPLACE FUNCTION public.auto_hide_content_on_reports()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  -- Only count pending or null statuses
  IF NEW.status IS NULL OR NEW.status = 'pending' THEN
    IF NEW.article_id IS NOT NULL THEN
      IF (
        SELECT COUNT(*) FROM public.reports
        WHERE article_id = NEW.article_id AND (status IS NULL OR status = 'pending')
      ) >= 3 THEN
        UPDATE public.news_articles SET is_hidden = true WHERE id = NEW.article_id;
      END IF;
    ELSIF NEW.post_id IS NOT NULL THEN
      IF (
        SELECT COUNT(*) FROM public.reports
        WHERE post_id = NEW.post_id AND (status IS NULL OR status = 'pending')
      ) >= 3 THEN
        UPDATE public.community_posts SET is_hidden = true WHERE id = NEW.post_id;
      END IF;
    ELSIF NEW.comment_id IS NOT NULL THEN
      IF (
        SELECT COUNT(*) FROM public.reports
        WHERE comment_id = NEW.comment_id AND (status IS NULL OR status = 'pending')
      ) >= 3 THEN
        UPDATE public.comments SET is_hidden = true WHERE id = NEW.comment_id;
      END IF;
    END IF;

    -- mark this report row to indicate auto-hide considered
    UPDATE public.reports SET auto_hidden = true WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_hide_content_on_reports ON public.reports;
CREATE TRIGGER trg_auto_hide_content_on_reports
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE PROCEDURE public.auto_hide_content_on_reports();