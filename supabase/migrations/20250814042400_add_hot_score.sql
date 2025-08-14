ALTER TABLE public.trending_scores
ADD COLUMN IF NOT EXISTS hot_score REAL DEFAULT 0;

COMMENT ON COLUMN public.trending_scores.hot_score IS 'Score based on recent activity (likes, comments in the last 24h) with a time decay gravity factor.';

CREATE INDEX IF NOT EXISTS idx_trending_scores_hot_score ON public.trending_scores (hot_score DESC);
