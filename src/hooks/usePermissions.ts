import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UsePermissionsReturn {
  isAuthenticated: boolean;
  canWrite: boolean;
  canLike: boolean;
  canComment: boolean;
  canBookmark: boolean;
  canReport: boolean;
  requireAuth: (action: string) => boolean;
  showAuthPrompt: (action: string) => void;
}

/**
 * 사용자 권한을 관리하는 훅
 * 비회원: 읽기만 가능
 * 회원: 모든 활동 가능
 */
export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth();
  const { toast } = useToast();

  const isAuthenticated = !!user;

  // 모든 쓰기 권한은 로그인 필요
  const canWrite = isAuthenticated;
  const canLike = isAuthenticated;
  const canComment = isAuthenticated;
  const canBookmark = isAuthenticated;
  const canReport = isAuthenticated;

  const requireAuth = (action: string): boolean => {
    if (!isAuthenticated) {
      showAuthPrompt(action);
      return false;
    }
    return true;
  };

  const showAuthPrompt = (action: string) => {
    const actionMessages: Record<string, string> = {
      write: "글을 작성하려면 로그인이 필요합니다",
      like: "좋아요를 누르려면 로그인이 필요합니다",
      comment: "댓글을 작성하려면 로그인이 필요합니다",
      bookmark: "스크랩하려면 로그인이 필요합니다",
      report: "신고하려면 로그인이 필요합니다",
    };

    toast({
      title: "로그인 필요",
      description: actionMessages[action] || "이 기능을 사용하려면 로그인이 필요합니다",
    });
  };

  return {
    isAuthenticated,
    canWrite,
    canLike,
    canComment,
    canBookmark,
    canReport,
    requireAuth,
    showAuthPrompt,
  };
};