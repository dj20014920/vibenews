import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Github, Mail, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnhancedAuthForm } from "@/components/auth/EnhancedAuthForm";
import { EmailVerificationStatus } from "@/components/auth/EmailVerificationStatus";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, signInWithProvider } = useAuth();
  const { toast } = useToast();

  // 이메일 인증 관련 파라미터 확인
  const isVerificationPage = searchParams.has('verified') || searchParams.has('error');

  // 로그인된 사용자는 홈으로 리다이렉트
  if (user && !isVerificationPage) {
    return <Navigate to="/" replace />;
  }

  // 인증 상태 페이지 표시
  if (isVerificationPage) {
    return <EmailVerificationStatus />;
  }

  // Enhanced Auth Form 전용 핸들러
  const handleEnhancedSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhancedSignUp = async (email: string, password: string, nickname?: string) => {
    setIsLoading(true);
    try {
      const result = await signUp(email, password, nickname || '');
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'kakao') => {
    setIsLoading(true);
    try {
      await signInWithProvider(provider);
    } catch (error) {
      toast({
        title: "소셜 로그인 실패",
        description: "소셜 로그인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/10 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md glass shadow-brand">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gradient">VibeNews</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            바이브 코딩 트렌드의 모든 것
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <EnhancedAuthForm 
                mode="signin"
                onSubmit={handleEnhancedSignIn}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <EnhancedAuthForm 
                mode="signup"
                onSubmit={handleEnhancedSignUp}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
            >
              <Mail className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignIn('github')}
              disabled={isLoading}
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignIn('kakao')}
              disabled={isLoading}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Kakao
            </Button>
          </div>
        </CardContent>

        <CardFooter className="text-center">
          <p className="text-xs text-muted-foreground">
            로그인하면 <span className="underline">이용약관</span> 및{" "}
            <span className="underline">개인정보 처리방침</span>에 동의하게 됩니다.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;