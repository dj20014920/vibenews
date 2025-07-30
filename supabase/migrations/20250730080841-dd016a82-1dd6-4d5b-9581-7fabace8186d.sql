-- 북마크/스크랩 시스템 (요구사항 4)
CREATE TABLE public.bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id UUID,
  post_id UUID,
  folder_name TEXT DEFAULT 'default',
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT bookmarks_one_content CHECK (
    (article_id IS NOT NULL AND post_id IS NULL) OR 
    (article_id IS NULL AND post_id IS NOT NULL)
  )
);

-- 신고 시스템 (요구사항 1, 2, 9)
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID,
  reported_user_id UUID,
  article_id UUID,
  post_id UUID,
  comment_id UUID,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT reports_one_content CHECK (
    (article_id IS NOT NULL AND post_id IS NULL AND comment_id IS NULL) OR 
    (article_id IS NULL AND post_id IS NOT NULL AND comment_id IS NULL) OR
    (article_id IS NULL AND post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- 사용자 팔로우 시스템 (요구사항 6)
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- 검색 기록 (요구사항 4)
CREATE TABLE public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 태그 팔로우 (요구사항 11)
CREATE TABLE public.tag_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag_name)
);

-- 사용자 역할 시스템 (요구사항 9, 26)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  assigned_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 콘텐츠 변경 이력 (요구사항 27)
CREATE TABLE public.content_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'article', 'post', 'comment'
  content_id UUID NOT NULL,
  user_id UUID NOT NULL,
  changes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 보안 로그 (요구사항 26)
CREATE TABLE public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  ip_address INET,
  event_type TEXT NOT NULL,
  details JSONB,
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 협업 공간 (요구사항 19)
CREATE TABLE public.collaboration_spaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  project_url TEXT,
  tools_used TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  max_participants INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.collaboration_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'contributor',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(space_id, user_id)
);

-- 멘토링 시스템 (요구사항 19)
CREATE TABLE public.mentoring_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentee_id UUID NOT NULL,
  mentor_id UUID,
  topic TEXT NOT NULL,
  description TEXT,
  skill_level TEXT DEFAULT 'beginner',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  matched_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 학습 경로 (요구사항 18)
CREATE TABLE public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  technology TEXT NOT NULL,
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 1,
  progress_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 도구 비교 데이터 (요구사항 21)
CREATE TABLE public.tool_comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_per_month DECIMAL(10,2),
  features JSONB DEFAULT '{}',
  user_ratings JSONB DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tool_name)
);

-- 알림 시스템
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 정책 설정
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 북마크 정책
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
FOR ALL USING (auth.uid() = user_id);

-- 신고 정책
CREATE POLICY "Users can create reports" ON public.reports
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators can view all reports" ON public.reports
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
  )
);

-- 팔로우 정책
CREATE POLICY "Users can manage own follows" ON public.follows
FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Users can view all follows" ON public.follows
FOR SELECT USING (true);

-- 검색 기록 정책
CREATE POLICY "Users can manage own search history" ON public.search_history
FOR ALL USING (auth.uid() = user_id);

-- 태그 팔로우 정책
CREATE POLICY "Users can manage own tag follows" ON public.tag_follows
FOR ALL USING (auth.uid() = user_id);

-- 사용자 역할 정책
CREATE POLICY "Everyone can view roles" ON public.user_roles
FOR SELECT USING (true);

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 콘텐츠 이력 정책
CREATE POLICY "Users can view content history" ON public.content_history
FOR SELECT USING (true);

-- 보안 로그 정책 (관리자만)
CREATE POLICY "Admins can view security logs" ON public.security_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 협업 공간 정책
CREATE POLICY "Anyone can view active collaboration spaces" ON public.collaboration_spaces
FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create collaboration spaces" ON public.collaboration_spaces
FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own spaces" ON public.collaboration_spaces
FOR UPDATE USING (auth.uid() = creator_id);

-- 협업 참가자 정책
CREATE POLICY "Users can join collaboration spaces" ON public.collaboration_participants
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view participants" ON public.collaboration_participants
FOR SELECT USING (true);

-- 멘토링 정책
CREATE POLICY "Users can create mentoring requests" ON public.mentoring_requests
FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Users can view open requests" ON public.mentoring_requests
FOR SELECT USING (status = 'open' OR auth.uid() IN (mentee_id, mentor_id));

CREATE POLICY "Mentors can update matched requests" ON public.mentoring_requests
FOR UPDATE USING (auth.uid() = mentor_id);

-- 학습 경로 정책
CREATE POLICY "Users can manage own learning paths" ON public.learning_paths
FOR ALL USING (auth.uid() = user_id);

-- 도구 비교 정책 (읽기 전용)
CREATE POLICY "Anyone can view tool comparisons" ON public.tool_comparisons
FOR SELECT USING (true);

-- 알림 정책
CREATE POLICY "Users can manage own notifications" ON public.notifications
FOR ALL USING (auth.uid() = user_id);

-- 보안 함수 생성
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 트리거 생성
CREATE TRIGGER update_collaboration_spaces_updated_at
BEFORE UPDATE ON public.collaboration_spaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at
BEFORE UPDATE ON public.learning_paths
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();