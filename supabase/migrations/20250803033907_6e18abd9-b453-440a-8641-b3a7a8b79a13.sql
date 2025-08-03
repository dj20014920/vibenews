-- 구독 및 결제 관련 테이블 생성

-- 구독 플랜 테이블
CREATE TABLE subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL, -- 월 가격 (센트 단위)
  price_yearly INTEGER, -- 연 가격 (센트 단위)
  currency TEXT NOT NULL DEFAULT 'KRW',
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 구독 테이블
CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, cancelled, expired
  payment_provider TEXT NOT NULL, -- toss, stripe, paypal, etc
  provider_subscription_id TEXT,
  provider_customer_id TEXT,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결제 기록 테이블
CREATE TABLE payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- 센트 단위
  currency TEXT NOT NULL DEFAULT 'KRW',
  payment_provider TEXT NOT NULL,
  provider_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_method TEXT, -- card, bank_transfer, digital_wallet
  country_code TEXT NOT NULL DEFAULT 'KR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결제 제공자 설정 테이블
CREATE TABLE payment_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- toss, stripe, paypal, paypay, ideal, etc
  display_name TEXT NOT NULL,
  country_codes TEXT[] NOT NULL, -- 지원 국가 코드
  currencies TEXT[] NOT NULL, -- 지원 통화
  payment_types TEXT[] NOT NULL, -- subscription, one_time, both
  is_active BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}'::jsonb, -- API 키 등 설정
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security 정책 설정
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;

-- 구독 플랜 정책 (모든 사용자가 조회 가능)
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- 사용자 구독 정책 (본인 구독만 조회/관리)
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- 결제 기록 정책 (본인 기록만 조회)
CREATE POLICY "Users can view own payment transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 결제 제공자 정책 (모든 사용자가 조회 가능)
CREATE POLICY "Anyone can view active payment providers" ON payment_providers
  FOR SELECT USING (is_active = true);

-- 서비스 역할 정책 (Edge Functions에서 사용)
CREATE POLICY "Service role can manage all payment data" ON user_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all payment transactions" ON payment_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- 기본 구독 플랜 데이터 삽입
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features) VALUES
('Basic', '기본 플랜: 광고 제거, 기본 AI 기능', 9900, 99000, 
 '["광고 제거", "기본 AI 설명", "북마크 폴더 10개", "월 100회 AI 요청"]'::jsonb),
('Premium', '프리미엄 플랜: 모든 AI 기능, 우선 지원', 19900, 199000,
 '["모든 Basic 기능", "고급 AI 설명", "무제한 북마크 폴더", "월 1000회 AI 요청", "우선 지원", "새 기능 미리보기"]'::jsonb),
('Enterprise', '기업용 플랜: 팀 기능, API 액세스', 49900, 499000,
 '["모든 Premium 기능", "팀 관리", "API 액세스", "무제한 AI 요청", "전담 지원", "커스텀 통합"]'::jsonb);

-- 기본 결제 제공자 설정
INSERT INTO payment_providers (name, display_name, country_codes, currencies, payment_types) VALUES
('toss', '토스페이먼츠', ARRAY['KR'], ARRAY['KRW'], ARRAY['subscription', 'one_time']),
('stripe', 'Stripe', ARRAY['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'JP'], ARRAY['USD', 'EUR', 'GBP', 'JPY'], ARRAY['subscription', 'one_time']),
('paypal', 'PayPal', ARRAY['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL'], ARRAY['USD', 'EUR', 'GBP'], ARRAY['subscription', 'one_time']),
('paypay', 'PayPay', ARRAY['JP'], ARRAY['JPY'], ARRAY['one_time']),
('ideal', 'iDEAL', ARRAY['NL'], ARRAY['EUR'], ARRAY['subscription', 'one_time']),
('klarna', 'Klarna', ARRAY['SE', 'NO', 'FI', 'DK', 'DE', 'AT', 'NL', 'BE'], ARRAY['EUR', 'SEK', 'NOK'], ARRAY['one_time']);

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();