-- 2. plans 테이블 생성 (구독 플랜 관리)
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KRW',
  description TEXT,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- plans 테이블 RLS 활성화
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- plans 테이블 정책 (모든 사용자가 읽기 가능, 서비스 역할만 수정 가능)
CREATE POLICY "Anyone can view active plans" 
ON public.plans 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Service role can manage plans" 
ON public.plans 
FOR ALL 
TO service_role
USING (true);

-- 3. subscriptions 테이블에 plan_id 추가
ALTER TABLE public.subscriptions 
ADD COLUMN plan_id UUID REFERENCES public.plans(id);

-- 4. 기본 플랜 데이터 삽입
INSERT INTO public.plans (name, amount, currency, description, features) VALUES 
('Basic Monthly', 4900, 'KRW', '기본 월간 구독', '{"features": ["premium_content", "ad_free", "priority_support"]}');

-- 5. plans 테이블에 updated_at 트리거 추가
CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();