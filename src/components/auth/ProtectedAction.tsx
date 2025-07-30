import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Lock, User } from "lucide-react";
import { Link } from "react-router-dom";

interface ProtectedActionProps {
  children: ReactNode;
  fallback?: ReactNode;
  showLoginPrompt?: boolean;
  requiredAuth?: boolean;
}

/**
 * 인증이 필요한 액션을 보호하는 컴포넌트
 * 비회원: 로그인 유도 메시지 표시
 * 회원: 자식 컴포넌트 렌더링
 */
export const ProtectedAction = ({ 
  children, 
  fallback, 
  showLoginPrompt = true,
  requiredAuth = true 
}: ProtectedActionProps) => {
  const { user } = useAuth();

  // 인증이 필요없는 경우 바로 렌더링
  if (!requiredAuth) {
    return <>{children}</>;
  }

  // 로그인된 사용자는 바로 렌더링
  if (user) {
    return <>{children}</>;
  }

  // 커스텀 fallback이 있으면 사용
  if (fallback) {
    return <>{fallback}</>;
  }

  // 기본 로그인 유도 메시지
  if (showLoginPrompt) {
    return (
      <div className="flex items-center justify-center p-4 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20">
        <div className="text-center space-y-3">
          <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              로그인이 필요한 기능입니다
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              회원가입하고 모든 기능을 이용해보세요
            </p>
          </div>
          <Button asChild size="sm" className="btn-gradient">
            <Link to="/auth">
              <User className="mr-2 h-4 w-4" />
              로그인하기
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // 아무것도 렌더링하지 않음
  return null;
};

interface GuestPromptProps {
  message?: string;
  actionText?: string;
}

/**
 * 비회원에게 회원가입을 유도하는 컴포넌트
 */
export const GuestPrompt = ({ 
  message = "더 많은 기능을 이용하려면 회원가입하세요", 
  actionText = "회원가입"
}: GuestPromptProps) => {
  const { user } = useAuth();

  if (user) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{message}</p>
            <p className="text-xs text-muted-foreground">
              글쓰기, 댓글, 좋아요, 스크랩 기능을 사용할 수 있습니다
            </p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link to="/auth">{actionText}</Link>
        </Button>
      </div>
    </div>
  );
};

interface AuthStatusProps {
  children: ReactNode;
  guestContent?: ReactNode;
  loadingContent?: ReactNode;
}

/**
 * 인증 상태에 따라 다른 컨텐츠를 보여주는 컴포넌트
 */
export const AuthStatus = ({ children, guestContent, loadingContent }: AuthStatusProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return loadingContent || (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return <>{guestContent}</>;
};