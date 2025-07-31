-- 콘텐츠 품질 평가 테이블
CREATE TABLE IF NOT EXISTS public.content_quality_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  relevance_score INTEGER NOT NULL,
  technical_depth INTEGER NOT NULL,
  credibility_score INTEGER NOT NULL,
  trending_potential INTEGER NOT NULL,
  developer_level TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  quality_issues TEXT[] DEFAULT '{}',
  recommended_tags TEXT[] DEFAULT '{}',
  auto_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 콘텐츠 단순화 테이블
CREATE TABLE IF NOT EXISTS public.content_simplifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  original_title TEXT NOT NULL,
  simplified_title TEXT NOT NULL,
  original_summary TEXT,
  simplified_summary TEXT,
  technical_terms_explained JSONB DEFAULT '{}',
  reading_level TEXT NOT NULL,
  simplification_notes TEXT[] DEFAULT '{}',
  target_level TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 트렌딩 점수 테이블
CREATE TABLE IF NOT EXISTS public.trending_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  trending_score NUMERIC(10,2) NOT NULL,
  velocity_score NUMERIC(10,2) NOT NULL,
  engagement_score NUMERIC(10,2) NOT NULL,
  recency_score NUMERIC(10,2) NOT NULL,
  quality_score NUMERIC(10,2) NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_id, content_type)
);

-- 북마크 폴더 테이블 (기존 bookmarks 테이블 확장)
CREATE TABLE IF NOT EXISTS public.bookmark_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- RLS 정책 설정
ALTER TABLE public.content_quality_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_simplifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmark_folders ENABLE ROW LEVEL SECURITY;

-- 품질 평가 정책
CREATE POLICY "Anyone can view quality evaluations" 
ON public.content_quality_evaluations 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage quality evaluations" 
ON public.content_quality_evaluations 
FOR ALL 
USING (true);

-- 콘텐츠 단순화 정책
CREATE POLICY "Anyone can view simplifications" 
ON public.content_simplifications 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage simplifications" 
ON public.content_simplifications 
FOR ALL 
USING (true);

-- 트렌딩 점수 정책
CREATE POLICY "Anyone can view trending scores" 
ON public.trending_scores 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage trending scores" 
ON public.trending_scores 
FOR ALL 
USING (true);

-- 북마크 폴더 정책
CREATE POLICY "Users can view own bookmark folders" 
ON public.bookmark_folders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmark folders" 
ON public.bookmark_folders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmark folders" 
ON public.bookmark_folders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmark folders" 
ON public.bookmark_folders 
FOR DELETE 
USING (auth.uid() = user_id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_content_quality_evaluations_content ON public.content_quality_evaluations(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_quality_evaluations_score ON public.content_quality_evaluations(overall_score);

CREATE INDEX IF NOT EXISTS idx_content_simplifications_content ON public.content_simplifications(content_id, content_type);

CREATE INDEX IF NOT EXISTS idx_trending_scores_content ON public.trending_scores(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_trending_scores_score ON public.trending_scores(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_scores_calculated ON public.trending_scores(calculated_at);

CREATE INDEX IF NOT EXISTS idx_bookmark_folders_user ON public.bookmark_folders(user_id);

-- 업데이트 트리거
CREATE TRIGGER update_bookmark_folders_updated_at
BEFORE UPDATE ON public.bookmark_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();