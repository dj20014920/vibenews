-- Phase 3-5: 모든 고급 기능 테이블 생성

-- 사용자 상호작용 추적 테이블
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- 'view', 'like', 'share', 'bookmark', 'search'
  interaction_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 학습 경로 테이블
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  technology TEXT NOT NULL,
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 1,
  progress_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 협업 공간 테이블
CREATE TABLE IF NOT EXISTS public.collaboration_spaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL,
  max_participants INTEGER DEFAULT 10,
  tools_used TEXT[] DEFAULT '{}',
  project_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 협업 참가자 테이블
CREATE TABLE IF NOT EXISTS public.collaboration_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'contributor',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 다국어 지원 테이블 (translations는 이미 존재)

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
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

-- 사용자 상호작용 정책
CREATE POLICY "Users can create interactions" ON public.user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own interactions" ON public.user_interactions FOR SELECT USING (auth.uid() = user_id);

-- 학습 경로 정책
CREATE POLICY "Users can manage own learning paths" ON public.learning_paths FOR ALL USING (auth.uid() = user_id);

-- 협업 공간 정책
CREATE POLICY "Anyone can view active collaboration spaces" ON public.collaboration_spaces FOR SELECT USING (status = 'active');
CREATE POLICY "Users can create collaboration spaces" ON public.collaboration_spaces FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own spaces" ON public.collaboration_spaces FOR UPDATE USING (auth.uid() = creator_id);

-- 협업 참가자 정책
CREATE POLICY "Users can view participants" ON public.collaboration_participants FOR SELECT USING (true);
CREATE POLICY "Users can join collaboration spaces" ON public.collaboration_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자 테마 정책
CREATE POLICY "Users can manage own theme settings" ON public.user_themes FOR ALL USING (auth.uid() = user_id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_content ON public.user_interactions(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON public.user_interactions(interaction_type);

CREATE INDEX IF NOT EXISTS idx_learning_paths_user ON public.learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_technology ON public.learning_paths(technology);

CREATE INDEX IF NOT EXISTS idx_collaboration_spaces_creator ON public.collaboration_spaces(creator_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_spaces_status ON public.collaboration_spaces(status);

-- 업데이트 트리거 설정
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON public.learning_paths FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_collaboration_spaces_updated_at BEFORE UPDATE ON public.collaboration_spaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_themes_updated_at BEFORE UPDATE ON public.user_themes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();