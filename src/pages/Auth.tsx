import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Github, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnhancedAuthForm } from "@/components/auth/EnhancedAuthForm";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nickname: "",
  });
  
  const { user, signIn, signUp, signInWithProvider } = useAuth();
  const { toast } = useToast();

  // 로그인된 사용자는 홈으로 리다이렉트
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({
        title: "입력 오류",
        description: "이메일과 비밀번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        let message = "로그인에 실패했습니다.";
        if (error.message.includes("Invalid login credentials")) {
          message = "이메일 또는 비밀번호가 올바르지 않습니다.";
        } else if (error.message.includes("Email not confirmed")) {
          message = "이메일 인증을 완료해주세요.";
        }
        toast({
          title: "로그인 실패",
          description: message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "로그인 실패",
        description: "예상치 못한 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.nickname) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호는 6자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(formData.email, formData.password, formData.nickname);
      if (error) {
        let message = "회원가입에 실패했습니다.";
        if (error.message.includes("User already registered")) {
          message = "이미 등록된 이메일입니다.";
        } else if (error.message.includes("Password should be")) {
          message = "비밀번호는 6자 이상이어야 합니다.";
        }
        toast({
          title: "회원가입 실패",
          description: message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "회원가입 실패",
        description: "예상치 못한 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
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
                onSubmit={async (email, password) => await signIn(email, password)}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <EnhancedAuthForm 
                mode="signup"
                onSubmit={async (email, password, nickname) => await signUp(email, password, nickname || '')}
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

          <div className="grid grid-cols-2 gap-4 mt-6">
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