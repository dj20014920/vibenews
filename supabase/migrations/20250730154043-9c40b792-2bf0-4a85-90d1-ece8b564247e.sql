-- 1. 먼저 subscriptions 테이블 생성
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL, -- 'stripe', 'paypal', 'kakaopay', 'toss', 'bootpay'
  provider_subscription_id TEXT, -- 결제사에서 제공하는 구독 ID
  provider_customer_id TEXT, -- 결제사에서 제공하는 고객 ID (nullable)
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'past_due'
  amount INTEGER NOT NULL, -- 금액 (센트 단위)
  currency TEXT NOT NULL DEFAULT 'KRW', -- 통화
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}', -- 추가 데이터 저장
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "Users can view own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 서비스 역할만 접근 가능하도록 제한
CREATE POLICY "Service role only" 
ON public.subscriptions 
FOR ALL 
TO service_role
USING (true);

-- provider_subscription_id 고유성 확보
CREATE UNIQUE INDEX unique_provider_subscription 
ON public.subscriptions(provider, provider_subscription_id)
WHERE provider_subscription_id IS NOT NULL;

-- updated_at 트리거 추가
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();