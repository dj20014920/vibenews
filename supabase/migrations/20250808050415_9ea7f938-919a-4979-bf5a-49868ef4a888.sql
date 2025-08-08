-- 인증 활동 로그 테이블 생성
CREATE TABLE public.auth_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  location TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 정책 설정
ALTER TABLE public.auth_activity_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 모든 로그 조회 가능
CREATE POLICY "Admins can view all auth logs" 
ON public.auth_activity_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- 사용자는 자신의 로그만 조회 가능
CREATE POLICY "Users can view own auth logs" 
ON public.auth_activity_logs 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

-- 서비스 롤은 모든 작업 가능
CREATE POLICY "Service role can manage auth logs" 
ON public.auth_activity_logs 
FOR ALL 
USING (auth.role() = 'service_role');

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_auth_activity_logs_user_id ON public.auth_activity_logs(user_id);
CREATE INDEX idx_auth_activity_logs_email ON public.auth_activity_logs(email);
CREATE INDEX idx_auth_activity_logs_activity_type ON public.auth_activity_logs(activity_type);
CREATE INDEX idx_auth_activity_logs_created_at ON public.auth_activity_logs(created_at DESC);
CREATE INDEX idx_auth_activity_logs_ip_address ON public.auth_activity_logs(ip_address);

-- 보안 설정 테이블 생성 (선택사항)
CREATE TABLE public.security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  two_factor_enabled BOOLEAN DEFAULT false,
  login_notifications BOOLEAN DEFAULT true,
  suspicious_activity_alerts BOOLEAN DEFAULT true,
  session_timeout_minutes INTEGER DEFAULT 60,
  max_concurrent_sessions INTEGER DEFAULT 3,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  last_security_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 정책 설정
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 보안 설정만 관리 가능
CREATE POLICY "Users can manage own security settings" 
ON public.security_settings 
FOR ALL 
USING (auth.uid() = user_id);

-- 관리자는 모든 보안 설정 조회 가능
CREATE POLICY "Admins can view all security settings" 
ON public.security_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 업데이트 트리거 생성
CREATE TRIGGER update_security_settings_updated_at
BEFORE UPDATE ON public.security_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 사용자 생성 시 보안 설정 자동 생성 함수
CREATE OR REPLACE FUNCTION public.create_user_security_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.security_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 생성 시 보안 설정 자동 생성 트리거
CREATE TRIGGER create_user_security_settings_trigger
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.create_user_security_settings();