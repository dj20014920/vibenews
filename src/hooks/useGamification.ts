import { useUserLevels } from './useUserLevels';
import { useAuth } from '@/contexts/AuthContext';

// 포인트 시스템 설정
const POINTS = {
  LIKE_GIVEN: 5,          // 좋아요 누름
  LIKE_RECEIVED: 10,      // 좋아요 받음
  COMMENT_WRITTEN: 15,    // 댓글 작성
  COMMENT_RECEIVED: 8,    // 댓글 받음
  POST_CREATED: 25,       // 포스트 작성
  POST_FEATURED: 100,     // 포스트 추천
  DAILY_LOGIN: 5,         // 일일 로그인
  FIRST_POST: 50,         // 첫 포스트
  POPULAR_POST: 75,       // 인기 포스트 (좋아요 10개 이상)
  CODE_SHARED: 20,        // 코드 공유
  CODE_FORKED: 15,        // 코드 포크됨
} as const;

export const useGamification = () => {
  const { user } = useAuth();
  const { addPoints, awardBadge, userStats } = useUserLevels();

  // 좋아요 관련 포인트 지급
  const handleLikeAction = async (isLiking: boolean, contentAuthorId?: string) => {
    if (!user) return;

    if (isLiking) {
      // 좋아요를 누른 사용자에게 포인트
      await addPoints(POINTS.LIKE_GIVEN, "좋아요");
      
      // 좋아요를 받은 사용자에게 포인트 (다른 사용자인 경우)
      if (contentAuthorId && contentAuthorId !== user.id) {
        // TODO: 다른 사용자에게 포인트 지급 로직
      }
    }
  };

  // 댓글 작성 포인트 지급
  const handleCommentAction = async (isCreating: boolean, postAuthorId?: string) => {
    if (!user || !isCreating) return;

    await addPoints(POINTS.COMMENT_WRITTEN, "댓글 작성");

    // 첫 댓글 배지 체크
    const commentCount = userStats?.badges.filter(b => b.badge_id.includes('comment')).length || 0;
    if (commentCount === 0) {
      await awardBadge({
        badge_id: 'first_comment',
        badge_name: '첫 댓글러',
        badge_description: '첫 번째 댓글을 작성했습니다',
        badge_icon: 'message-square',
        badge_color: 'blue',
        badge_category: 'achievement'
      });
    }
  };

  // 포스트 작성 포인트 지급
  const handlePostAction = async (isCreating: boolean) => {
    if (!user || !isCreating) return;

    await addPoints(POINTS.POST_CREATED, "포스트 작성");

    // 첫 포스트 배지 체크
    const postCount = userStats?.badges.filter(b => b.badge_id.includes('post')).length || 0;
    if (postCount === 0) {
      await addPoints(POINTS.FIRST_POST, "첫 포스트 보너스");
      await awardBadge({
        badge_id: 'first_post',
        badge_name: '첫 발걸음',
        badge_description: '첫 번째 포스트를 작성했습니다',
        badge_icon: 'star',
        badge_color: 'yellow',
        badge_category: 'achievement'
      });
    }
  };

  // 코드 공유 포인트 지급
  const handleCodeAction = async (isCreating: boolean, isForked = false) => {
    if (!user) return;

    if (isCreating) {
      await addPoints(POINTS.CODE_SHARED, "코드 공유");

      // 첫 코드 공유 배지
      const codeCount = userStats?.badges.filter(b => b.badge_id.includes('code')).length || 0;
      if (codeCount === 0) {
        await awardBadge({
          badge_id: 'first_code',
          badge_name: '코드 공유러',
          badge_description: '첫 번째 코드를 공유했습니다',
          badge_icon: 'code',
          badge_color: 'green',
          badge_category: 'contribution'
        });
      }
    }

    if (isForked) {
      await addPoints(POINTS.CODE_FORKED, "코드 포크됨");
    }
  };

  // 인기도 기반 배지 체크
  const checkPopularityBadges = async (likeCount: number, viewCount: number) => {
    if (!user) return;

    // 인기 포스트 배지 (좋아요 10개 이상)
    if (likeCount >= 10) {
      const hasPopularBadge = userStats?.badges.some(b => b.badge_id === 'popular_content');
      if (!hasPopularBadge) {
        await addPoints(POINTS.POPULAR_POST, "인기 포스트");
        await awardBadge({
          badge_id: 'popular_content',
          badge_name: '인기왕',
          badge_description: '좋아요 10개 이상을 받았습니다',
          badge_icon: 'trending-up',
          badge_color: 'orange',
          badge_category: 'social'
        });
      }
    }

    // 조회수 기반 배지 (1000회 이상)
    if (viewCount >= 1000) {
      const hasViralBadge = userStats?.badges.some(b => b.badge_id === 'viral_content');
      if (!hasViralBadge) {
        await awardBadge({
          badge_id: 'viral_content',
          badge_name: '바이럴 크리에이터',
          badge_description: '조회수 1000회를 달성했습니다',
          badge_icon: 'zap',
          badge_color: 'purple',
          badge_category: 'achievement'
        });
      }
    }
  };

  // 연속 로그인 체크
  const handleDailyLogin = async () => {
    if (!user) return;
    
    // 일일 로그인 포인트는 하루에 한 번만
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem(`last_login_${user.id}`);
    
    if (lastLogin !== today) {
      await addPoints(POINTS.DAILY_LOGIN, "일일 로그인");
      localStorage.setItem(`last_login_${user.id}`, today);

      // 연속 로그인 배지 체크 (추후 구현)
    }
  };

  return {
    handleLikeAction,
    handleCommentAction,
    handlePostAction,
    handleCodeAction,
    checkPopularityBadges,
    handleDailyLogin,
    POINTS
  };
};