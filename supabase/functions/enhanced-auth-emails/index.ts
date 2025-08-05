import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { WelcomeEmail } from './_templates/welcome-email.tsx';
import { SecurityAlertEmail } from './_templates/security-alert.tsx';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string;

// Supabase 클라이언트 초기화
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthEventData {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      nickname?: string;
      avatar_url?: string;
      provider?: string;
    };
    app_metadata?: {
      provider?: string;
    };
  };
  email_data?: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

interface SecurityAlertData {
  user_email: string;
  alert_type: 'failed_login' | 'account_locked' | 'suspicious_activity' | 'password_reset';
  device_info?: string;
  location?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp?: string;
}

// 위치 정보 가져오기 (IP 기반)
async function getLocationFromIP(ip: string): Promise<string> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city`);
    const data = await response.json();
    if (data.status === 'success') {
      return `${data.city}, ${data.regionName}, ${data.country}`;
    }
  } catch (error) {
    console.error('Error getting location:', error);
  }
  return '알 수 없는 위치';
}

// 디바이스 정보 파싱
function parseUserAgent(userAgent: string): string {
  const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
  const osMatch = userAgent.match(/(Windows|Mac|Linux|iOS|Android)/);
  
  const browser = browserMatch ? browserMatch[1] : '알 수 없는 브라우저';
  const os = osMatch ? osMatch[1] : '알 수 없는 OS';
  
  return `${browser} on ${os}`;
}

// 인증 활동 로깅
async function logAuthActivity(
  userId: string, 
  email: string, 
  activityType: string, 
  metadata: any
) {
  try {
    await supabase.from('auth_activity_logs').insert({
      user_id: userId,
      email: email,
      activity_type: activityType,
      metadata: metadata,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging auth activity:', error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // 보안 알림 이메일 엔드포인트
    if (pathname.includes('/security-alert')) {
      const alertData: SecurityAlertData = await req.json();
      
      const html = await renderAsync(
        React.createElement(SecurityAlertEmail, {
          user_email: alertData.user_email,
          alert_type: alertData.alert_type,
          device_info: alertData.device_info,
          location: alertData.location,
          timestamp: alertData.timestamp || new Date().toISOString(),
          ip_address: alertData.ip_address,
          user_agent: alertData.user_agent,
        })
      );

      const subject = (() => {
        switch (alertData.alert_type) {
          case 'failed_login': return '[VibeNews] 로그인 실패 알림';
          case 'account_locked': return '[VibeNews] 계정 잠금 알림';
          case 'suspicious_activity': return '[VibeNews] 의심스러운 활동 감지';
          case 'password_reset': return '[VibeNews] 비밀번호 재설정 요청';
          default: return '[VibeNews] 보안 알림';
        }
      })();

      const { error } = await resend.emails.send({
        from: 'VibeNews Security <security@vibenews.kr>',
        to: [alertData.user_email],
        subject: subject,
        html,
      });

      if (error) {
        throw error;
      }

      // 보안 활동 로깅
      await logAuthActivity('', alertData.user_email, `security_alert_${alertData.alert_type}`, alertData);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Supabase Auth 웹훅 처리 (회원가입 환영 이메일)
    if (req.method === 'POST') {
      const payload = await req.text();
      const headers = Object.fromEntries(req.headers);
      
      // 웹훅 시크릿이 설정된 경우에만 검증
      if (hookSecret) {
        const wh = new Webhook(hookSecret);
        try {
          wh.verify(payload, headers);
        } catch (error) {
          console.error('Webhook verification failed:', error);
          return new Response('Unauthorized', { status: 401 });
        }
      }

      const authData: AuthEventData = JSON.parse(payload);
      const { user, email_data } = authData;

      if (!email_data) {
        return new Response('No email data provided', { status: 400 });
      }

      // IP 주소와 User-Agent 가져오기
      const clientIP = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown';
      const userAgent = headers['user-agent'] || 'unknown';
      
      // 위치 정보 조회
      const location = clientIP !== 'unknown' ? await getLocationFromIP(clientIP) : '알 수 없는 위치';
      const deviceInfo = parseUserAgent(userAgent);

      // 인증 방식 결정
      const authMethod = user.app_metadata?.provider || user.user_metadata?.provider || 'email';
      
      const html = await renderAsync(
        React.createElement(WelcomeEmail, {
          token: email_data.token,
          supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
          email_action_type: email_data.email_action_type,
          redirect_to: email_data.redirect_to,
          token_hash: email_data.token_hash,
          user_email: user.email,
          auth_method: authMethod as 'email' | 'google' | 'github',
          user_nickname: user.user_metadata?.nickname,
          device_info: deviceInfo,
          location: location,
        })
      );

      const subjectPrefix = (() => {
        switch (authMethod) {
          case 'google': return '[VibeNews] Google 계정으로 가입 완료';
          case 'github': return '[VibeNews] GitHub 계정으로 가입 완료';
          default: return '[VibeNews] 회원가입을 환영합니다';
        }
      })();

      const { error } = await resend.emails.send({
        from: 'VibeNews <welcome@vibenews.kr>',
        to: [user.email],
        subject: `${subjectPrefix} - 이메일 인증이 필요합니다`,
        html,
      });

      if (error) {
        console.error('Email sending error:', error);
        throw error;
      }

      // 회원가입 활동 로깅
      await logAuthActivity(user.id, user.email, 'signup_email_sent', {
        auth_method: authMethod,
        location: location,
        device_info: deviceInfo,
        ip_address: clientIP,
        user_agent: userAgent,
      });

      console.log(`Welcome email sent successfully to ${user.email} (${authMethod} signup)`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error: any) {
    console.error('Error in enhanced-auth-emails function:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);