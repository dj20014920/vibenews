-- ENUM 타입 생성 (user_role은 이미 app_role로 존재하므로 report_status만 추가)
CREATE TYPE report_status_enum AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

-- reports 테이블에 ENUM 적용
ALTER TABLE public.reports
ALTER COLUMN status TYPE report_status_enum USING status::text::report_status_enum;

-- 성능 개선을 위한 필수 인덱스 생성
-- 배열(tags) 검색을 위한 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_news_articles_tags ON public.news_articles USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON public.community_posts USING GIN (tags);

-- 자주 사용될 정렬 및 조회를 위한 B-Tree 인덱스
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON public.community_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments (author_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, is_read);

-- 추가 성능 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON public.news_articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user_content ON public.likes (user_id, article_id, post_id, comment_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows (following_id);