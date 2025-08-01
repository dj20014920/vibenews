-- Phase 3: 고급 상호작용 테이블들

-- 사용자 팔로우 시스템 (기존 user_follows 테이블 활용)
-- 이미 존재하므로 추가 설정만 필요

-- 태그 팔로우 시스템 (기존 tag_follows 테이블 활용)
-- 이미 존재하므로 추가 설정만 필요

-- 소셜 공유 추적 테이블
CREATE TABLE IF NOT EXISTS public.social_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  share_url TEXT,
  share_count INTEGER DEFAULT 1
);

-- 검색 제안 및 개인화 테이블
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- 'view', 'like', 'share', 'bookmark', 'search'
  interaction_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 4: 학습 & 협업 테이블들

-- 학습 자료 테이블
CREATE TABLE IF NOT EXISTS public.learning_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL, -- 'video', 'article', 'course', 'tutorial', 'book'
  difficulty_level INTEGER DEFAULT 1, -- 1-5
  tags TEXT[] DEFAULT '{}',
  url TEXT,
  thumbnail TEXT,
  estimated_duration INTEGER, -- in minutes
  rating NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_by UUID,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 학습 진행 상황 테이블
CREATE TABLE IF NOT EXISTS public.learning_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resource_id UUID NOT NULL REFERENCES public.learning_resources(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  rating INTEGER, -- 1-5
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

-- 실시간 협업 공간 테이블
CREATE TABLE IF NOT EXISTS public.collaboration_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT NOT NULL, -- 'study', 'project', 'discussion', 'code_review'
  max_participants INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT TRUE,
  password_hash TEXT,
  created_by UUID NOT NULL,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'ended'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 협업 참가자 테이블
CREATE TABLE IF NOT EXISTS public.collaboration_room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.collaboration_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'participant', -- 'host', 'moderator', 'participant'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(room_id, user_id)
);

-- 협업 메시지 테이블
CREATE TABLE IF NOT EXISTS public.collaboration_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.collaboration_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'code', 'file', 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- code language, file info, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 멘토링 매칭 시스템 (기존 mentoring_requests 테이블 확장)
-- 멘토 프로필 테이블
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  expertise_areas TEXT[] NOT NULL,
  experience_years INTEGER,
  bio TEXT,
  availability TEXT, -- 'full-time', 'part-time', 'weekends', 'evenings'
  hourly_rate NUMERIC(10,2),
  rating NUMERIC(3,2) DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 멘토링 세션 테이블
CREATE TABLE IF NOT EXISTS public.mentoring_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.mentoring_requests(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  session_type TEXT DEFAULT 'video', -- 'video', 'chat', 'in-person'
  meeting_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  mentor_rating INTEGER, -- 1-5
  mentee_rating INTEGER, -- 1-5
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 코드 공유 테이블
CREATE TABLE IF NOT EXISTS public.code_snippets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE,
  fork_from UUID REFERENCES public.code_snippets(id),
  like_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 5: 비즈니스 & 최적화 테이블들

-- 광고 시스템 테이블
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  click_url TEXT NOT NULL,
  ad_type TEXT NOT NULL, -- 'banner', 'sponsored_post', 'sidebar'
  target_audience JSONB DEFAULT '{}', -- targeting criteria
  budget NUMERIC(10,2),
  spent NUMERIC(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 광고 노출 추적 테이블
CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  user_id UUID,
  page_url TEXT,
  clicked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 다국어 지원 테이블
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'news_article', 'community_post', 'ui_text'
  language_code TEXT NOT NULL, -- 'ko', 'en', 'ja', 'zh', etc.
  field_name TEXT NOT NULL, -- 'title', 'content', 'summary'
  translated_text TEXT NOT NULL,
  translation_quality NUMERIC(3,2), -- AI confidence score
  is_auto_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_id, content_type, language_code, field_name)
);

-- SEO 데이터 테이블
CREATE TABLE IF NOT EXISTS public.seo_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  canonical_url TEXT,
  schema_markup JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 사용자 테마 설정 테이블
CREATE TABLE IF NOT EXISTS public.user_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  theme_name TEXT DEFAULT 'default',
  custom_colors JSONB DEFAULT '{}',
  font_family TEXT DEFAULT 'system',
  font_size TEXT DEFAULT 'medium',
  layout_density TEXT DEFAULT 'comfortable',
  animations_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 정책 설정
ALTER TABLE public.social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

-- 소셜 공유 정책
CREATE POLICY "Users can create social shares" ON public.social_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view social shares" ON public.social_shares FOR SELECT USING (true);

-- 사용자 상호작용 정책
CREATE POLICY "Users can create interactions" ON public.user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own interactions" ON public.user_interactions FOR SELECT USING (auth.uid() = user_id);

-- 학습 자료 정책
CREATE POLICY "Anyone can view active learning resources" ON public.learning_resources FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can create learning resources" ON public.learning_resources FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own learning resources" ON public.learning_resources FOR UPDATE USING (auth.uid() = created_by);

-- 학습 진행 정책
CREATE POLICY "Users can manage own learning progress" ON public.learning_progress FOR ALL USING (auth.uid() = user_id);

-- 협업 공간 정책
CREATE POLICY "Anyone can view public collaboration rooms" ON public.collaboration_rooms FOR SELECT USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "Authenticated users can create collaboration rooms" ON public.collaboration_rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);
CREATE POLICY "Room creators can update own rooms" ON public.collaboration_rooms FOR UPDATE USING (auth.uid() = created_by);

-- 협업 참가자 정책
CREATE POLICY "Users can join collaboration rooms" ON public.collaboration_room_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view room participants" ON public.collaboration_room_participants FOR SELECT USING (true);
CREATE POLICY "Users can update own participation" ON public.collaboration_room_participants FOR UPDATE USING (auth.uid() = user_id);

-- 협업 메시지 정책
CREATE POLICY "Users can send messages in joined rooms" ON public.collaboration_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.collaboration_room_participants WHERE room_id = collaboration_messages.room_id AND user_id = auth.uid() AND is_active = true)
);
CREATE POLICY "Users can view messages in joined rooms" ON public.collaboration_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collaboration_room_participants WHERE room_id = collaboration_messages.room_id AND user_id = auth.uid() AND is_active = true)
);

-- 멘토 프로필 정책
CREATE POLICY "Anyone can view active mentor profiles" ON public.mentor_profiles FOR SELECT USING (is_active = true);
CREATE POLICY "Users can manage own mentor profile" ON public.mentor_profiles FOR ALL USING (auth.uid() = user_id);

-- 멘토링 세션 정책
CREATE POLICY "Mentors and mentees can view sessions" ON public.mentoring_sessions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.mentoring_requests mr 
    WHERE mr.id = mentoring_sessions.request_id 
    AND (mr.mentor_id = auth.uid() OR mr.mentee_id = auth.uid())
  )
);
CREATE POLICY "Mentors and mentees can manage sessions" ON public.mentoring_sessions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.mentoring_requests mr 
    WHERE mr.id = mentoring_sessions.request_id 
    AND (mr.mentor_id = auth.uid() OR mr.mentee_id = auth.uid())
  )
);

-- 코드 스니펫 정책
CREATE POLICY "Anyone can view public code snippets" ON public.code_snippets FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "Authenticated users can create code snippets" ON public.code_snippets FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users can update own code snippets" ON public.code_snippets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own code snippets" ON public.code_snippets FOR DELETE USING (auth.uid() = user_id);

-- 광고 정책
CREATE POLICY "Anyone can view active advertisements" ON public.advertisements FOR SELECT USING (is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));
CREATE POLICY "Advertisers can manage own ads" ON public.advertisements FOR ALL USING (auth.uid() = created_by);

-- 광고 노출 추적 정책
CREATE POLICY "Anyone can create ad impressions" ON public.ad_impressions FOR INSERT WITH CHECK (true);
CREATE POLICY "Advertisers can view own ad impressions" ON public.ad_impressions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.advertisements WHERE id = ad_impressions.ad_id AND created_by = auth.uid())
);

-- 번역 정책
CREATE POLICY "Anyone can view translations" ON public.translations FOR SELECT USING (true);
CREATE POLICY "Service role can manage translations" ON public.translations FOR ALL USING (true);

-- SEO 메타데이터 정책
CREATE POLICY "Anyone can view SEO metadata" ON public.seo_metadata FOR SELECT USING (true);
CREATE POLICY "Service role can manage SEO metadata" ON public.seo_metadata FOR ALL USING (true);

-- 사용자 테마 정책
CREATE POLICY "Users can manage own theme settings" ON public.user_themes FOR ALL USING (auth.uid() = user_id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_social_shares_content ON public.social_shares(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_social_shares_platform ON public.social_shares(platform);

CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_content ON public.user_interactions(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON public.user_interactions(interaction_type);

CREATE INDEX IF NOT EXISTS idx_learning_resources_tags ON public.learning_resources USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_learning_resources_difficulty ON public.learning_resources(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON public.learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_resource ON public.learning_progress(resource_id);

CREATE INDEX IF NOT EXISTS idx_collaboration_rooms_type ON public.collaboration_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_collaboration_rooms_public ON public.collaboration_rooms(is_public, status);

CREATE INDEX IF NOT EXISTS idx_collaboration_messages_room ON public.collaboration_messages(room_id, created_at);

CREATE INDEX IF NOT EXISTS idx_mentor_profiles_expertise ON public.mentor_profiles USING GIN(expertise_areas);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_active ON public.mentor_profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_code_snippets_language ON public.code_snippets(language);
CREATE INDEX IF NOT EXISTS idx_code_snippets_tags ON public.code_snippets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_code_snippets_public ON public.code_snippets(is_public);

CREATE INDEX IF NOT EXISTS idx_advertisements_active ON public.advertisements(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad ON public.ad_impressions(ad_id, created_at);

CREATE INDEX IF NOT EXISTS idx_translations_content ON public.translations(content_id, content_type, language_code);

-- 업데이트 트리거 설정
CREATE TRIGGER update_learning_resources_updated_at BEFORE UPDATE ON public.learning_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON public.learning_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_collaboration_rooms_updated_at BEFORE UPDATE ON public.collaboration_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mentor_profiles_updated_at BEFORE UPDATE ON public.mentor_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_code_snippets_updated_at BEFORE UPDATE ON public.code_snippets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seo_metadata_updated_at BEFORE UPDATE ON public.seo_metadata FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_themes_updated_at BEFORE UPDATE ON public.user_themes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();