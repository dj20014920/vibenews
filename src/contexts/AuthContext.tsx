import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en' | 'ja' | 'zh' | 'hi';
  content_mode: 'developer' | 'beginner';
  email_notifications: boolean;
  push_notifications: boolean;
  anonymous_mode_default: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  preferences: UserPreferences | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nickname: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'github' | 'kakao') => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 인증 상태 정리 함수
const cleanupAuthState = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 사용자 설정 로드
  const loadUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          theme: data.theme as 'light' | 'dark' | 'system',
          language: data.language as 'ko' | 'en' | 'ja' | 'zh' | 'hi',
          content_mode: data.content_mode as 'developer' | 'beginner',
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
          anonymous_mode_default: data.anonymous_mode_default,
        });
      }
    } catch (error) {
      console.error('Error in loadUserPreferences:', error);
    }
  };

  useEffect(() => {
    // 인증 상태 변경 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // 사용자 설정 로드를 지연시켜 데드락 방지
          setTimeout(() => {
            loadUserPreferences(session.user.id);
          }, 0);
          
          // 프로필 생성 (필요시)
          if (event === 'SIGNED_IN') {
            setTimeout(async () => {
              try {
                const { data: existingProfile } = await supabase
                  .from('users')
                  .select('id')
                  .eq('id', session.user.id)
                  .maybeSingle();

                if (!existingProfile) {
                  await supabase.from('users').insert({
                    id: session.user.id,
                    email: session.user.email!,
                    nickname: session.user.user_metadata?.nickname || session.user.email?.split('@')[0] || 'User',
                    provider: session.user.app_metadata?.provider || 'email',
                    avatar_url: session.user.user_metadata?.avatar_url
                  });
                }
              } catch (error) {
                console.error('Error creating user profile:', error);
              }
            }, 100);
          }
        } else {
          setPreferences(null);
        }
        
        setLoading(false);
      }
    );

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          loadUserPreferences(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // 기존 상태 정리
      cleanupAuthState();
      
      // 기존 세션 정리 시도
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // 에러 무시하고 계속 진행
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // 친화적인 에러 메시지
        let message = "로그인에 실패했습니다.";
        if (error.message.includes("Invalid login credentials")) {
          message = "이메일 또는 비밀번호가 올바르지 않습니다.";
        } else if (error.message.includes("Email not confirmed")) {
          message = "이메일 인증을 완료해주세요. 인증 메일을 확인하세요.";
        } else if (error.message.includes("Account not found")) {
          message = "등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.";
        } else if (error.message.includes("Too many requests")) {
          message = "너무 많은 시도입니다. 잠시 후 다시 시도해주세요.";
        } else if (error.message.includes("Invalid password")) {
          message = "비밀번호가 올바르지 않습니다.";
        }
        
        toast({
          title: "로그인 실패",
          description: message,
          variant: "destructive",
        });
        return { error };
      }

      if (data.user) {
        const welcomeMessages = [
          "다시 만나서 반가워요! 👋",
          "환영합니다! 🎉",
          "로그인 성공! ✨",
          "좋은 하루 되세요! 😊"
        ];
        const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        
        toast({
          title: "로그인 성공",
          description: randomMessage,
        });
      }

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({
        title: "로그인 실패",
        description: "예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, nickname: string) => {
    try {
      cleanupAuthState();
      
      const redirectUrl = `${window.location.origin}/auth?verified=true`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nickname: nickname,
            signup_source: 'web'
          }
        }
      });

      if (error) {
        // 친화적인 에러 메시지
        let message = "회원가입에 실패했습니다.";
        if (error.message.includes("User already registered")) {
          message = "이미 등록된 이메일입니다. 로그인을 시도해보세요.";
        } else if (error.message.includes("Password should be")) {
          message = "비밀번호는 6자 이상이어야 합니다.";
        } else if (error.message.includes("Invalid email")) {
          message = "올바르지 않은 이메일 형식입니다.";
        } else if (error.message.includes("Signup is disabled")) {
          message = "현재 회원가입이 비활성화되어 있습니다.";
        }
        
        toast({
          title: "회원가입 실패",
          description: message,
          variant: "destructive",
        });
        return { error };
      }

      // 이메일 확인 필요한 경우
      if (data.user && !data.session) {
        toast({
          title: "회원가입 완료! 📧",
          description: "이메일로 전송된 인증 링크를 클릭하여 계정을 활성화해주세요.",
        });
      } 
      // 즉시 로그인되는 경우 (이메일 확인 비활성화된 경우)
      else if (data.session) {
        toast({
          title: "회원가입 성공! 🎉",
          description: "환영합니다! 바로 서비스를 이용하실 수 있습니다.",
        });
      }

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({
        title: "회원가입 실패",
        description: "예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // 에러 무시
      }
      
      toast({
        title: "로그아웃 완료",
        description: "안전하게 로그아웃되었습니다.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "설정 저장됨",
        description: "설정이 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "설정 저장 실패",
        description: "설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const signInWithProvider = async (provider: 'google' | 'github' | 'kakao') => {
    try {
      cleanupAuthState();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          title: "소셜 로그인 오류",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      const err = error as Error;
      console.error('OAuth error:', error);
      toast({
        title: "소셜 로그인 오류",
        description: "소셜 로그인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return { error: err };
    }
  };

  const value = {
    user,
    session,
    preferences,
    loading,
    signIn,
    signUp,
    signOut,
    updatePreferences,
    signInWithProvider,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};