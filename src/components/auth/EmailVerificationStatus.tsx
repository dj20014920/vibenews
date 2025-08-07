import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Mail, Clock, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const EmailVerificationStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | 'resent'>('pending');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const checkVerification = async () => {
      try {
        // URL 파라미터에서 인증 관련 정보 확인
        const verified = searchParams.get('verified');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setVerificationStatus('error');
          toast({
            title: "인증 실패",
            description: errorDescription || "이메일 인증 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        } else if (verified === 'true') {
          setVerificationStatus('success');
          toast({
            title: "인증 완료! 🎉",
            description: "이메일 인증이 성공적으로 완료되었습니다.",
          });
          
          // 3초 후 홈으로 리다이렉트
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        }

        // 현재 세션 상태 확인
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmail(session.user.email);
        }

      } catch (error) {
        console.error('Error checking verification:', error);
        setVerificationStatus('error');
      } finally {
        setLoading(false);
      }
    };

    checkVerification();
  }, [searchParams, navigate, toast]);

  const resendVerificationEmail = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?verified=true`
        }
      });

      if (error) {
        toast({
          title: "재전송 실패",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setVerificationStatus('resent');
        toast({
          title: "인증 메일 재전송",
          description: "인증 메일이 다시 전송되었습니다.",
        });
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast({
        title: "재전송 실패",
        description: "예상치 못한 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-success mx-auto" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-destructive mx-auto" />;
      case 'resent':
        return <Mail className="w-16 h-16 text-primary mx-auto" />;
      default:
        return <Clock className="w-16 h-16 text-muted-foreground mx-auto animate-pulse" />;
    }
  };

  const StatusMessage = () => {
    switch (verificationStatus) {
      case 'success':
        return {
          title: "인증 완료! 🎉",
          description: "이메일 인증이 성공적으로 완료되었습니다. 잠시 후 홈페이지로 이동합니다.",
          variant: "default" as const
        };
      case 'error':
        return {
          title: "인증 실패",
          description: "이메일 인증에 실패했습니다. 링크가 만료되었거나 올바르지 않습니다.",
          variant: "destructive" as const
        };
      case 'resent':
        return {
          title: "재전송 완료",
          description: "인증 메일이 다시 전송되었습니다. 이메일을 확인해주세요.",
          variant: "default" as const
        };
      default:
        return {
          title: "이메일 인증 대기중",
          description: "이메일로 전송된 인증 링크를 클릭해주세요.",
          variant: "default" as const
        };
    }
  };

  if (loading && verificationStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/10 p-4">
        <Card className="w-full max-w-md glass shadow-brand">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Clock className="w-16 h-16 text-muted-foreground mx-auto animate-pulse" />
              <p className="text-sm text-muted-foreground">인증 상태를 확인하는 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const message = StatusMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/10 p-4">
      <Card className="w-full max-w-md glass shadow-brand">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gradient">VibeNews</CardTitle>
          </div>
          <CardDescription>이메일 인증</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <StatusIcon />
            
            <Alert variant={message.variant}>
              <AlertDescription className="text-center">
                <div className="font-medium mb-1">{message.title}</div>
                <div className="text-sm">{message.description}</div>
              </AlertDescription>
            </Alert>

            {email && (
              <div className="text-sm text-muted-foreground">
                인증 대상: <span className="font-mono">{email}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {(verificationStatus === 'pending' || verificationStatus === 'error') && email && (
              <Button
                onClick={resendVerificationEmail}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                {loading ? "전송 중..." : "인증 메일 재전송"}
              </Button>
            )}

            <Button
              onClick={() => navigate('/auth')}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              로그인 페이지로 돌아가기
            </Button>

            {verificationStatus === 'success' && (
              <Button
                onClick={() => navigate('/', { replace: true })}
                className="w-full btn-gradient"
              >
                홈으로 이동
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};