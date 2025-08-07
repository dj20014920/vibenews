import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserLevel {
  level: number;
  title: string;
  min_points: number;
  max_points: number;
  color: string;
  perks: string[];
}

export interface UserBadge {
  id: string;
  badge_id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_color: string;
  badge_category: string;
  badge_level?: number;
  earned_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  level: number;
  points: number;
  badges: UserBadge[];
}

const USER_LEVELS: UserLevel[] = [
  { level: 1, title: "코딩 입문자", min_points: 0, max_points: 99, color: "gray", perks: ["기본 기능 사용"] },
  { level: 2, title: "코딩 탐험가", min_points: 100, max_points: 299, color: "green", perks: ["배지 획득", "프로필 커스텀"] },
  { level: 3, title: "개발 마니아", min_points: 300, max_points: 699, color: "blue", perks: ["고급 필터", "우선 표시"] },
  { level: 4, title: "코딩 전문가", min_points: 700, max_points: 1499, color: "purple", perks: ["멘토 자격", "특별 이벤트"] },
  { level: 5, title: "개발 구루", min_points: 1500, max_points: 2999, color: "orange", perks: ["컨텐츠 추천", "베타 기능"] },
  { level: 6, title: "코딩 마스터", min_points: 3000, max_points: 9999, color: "red", perks: ["모든 기능", "마스터 배지"] }
];

export const useUserLevels = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  // 포인트로 레벨 계산
  const calculateLevel = (points: number): UserLevel => {
    return USER_LEVELS.find(level => 
      points >= level.min_points && points <= level.max_points
    ) || USER_LEVELS[0];
  };

  // 사용자 레벨/포인트 정보 로드
  const loadUserStats = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // 레벨/포인트 정보 조회
      const { data: levelData, error: levelError } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (levelError && levelError.code !== 'PGRST116') {
        throw levelError;
      }

      // 배지 정보 조회
      const { data: badgesData, error: badgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (badgesError) {
        throw badgesError;
      }

      // 레벨 데이터가 없으면 초기화
      if (!levelData) {
        const { data: newLevel, error: createError } = await supabase
          .from('user_levels')
          .insert({ user_id: user.id, level: 1, points: 0 })
          .select()
          .single();

        if (createError) throw createError;

        setUserStats({
          id: newLevel.id,
          user_id: user.id,
          level: 1,
          points: 0,
          badges: badgesData || []
        });
      } else {
        setUserStats({
          id: levelData.id,
          user_id: user.id,
          level: levelData.level || 1,
          points: levelData.points || 0,
          badges: badgesData || []
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      toast({
        title: "오류",
        description: "사용자 정보를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 포인트 추가
  const addPoints = async (points: number, reason: string) => {
    if (!user?.id || !userStats) return;

    try {
      const newPoints = userStats.points + points;
      const currentLevel = calculateLevel(userStats.points);
      const newLevel = calculateLevel(newPoints);

      const { error } = await supabase
        .from('user_levels')
        .update({ 
          points: newPoints,
          level: newLevel.level,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // 레벨업 체크
      if (newLevel.level > currentLevel.level) {
        toast({
          title: "🎉 레벨업!",
          description: `${newLevel.title}(${newLevel.level}레벨)에 도달했습니다!`,
        });

        // 레벨업 배지 획득
        await awardBadge({
          badge_id: `level_${newLevel.level}`,
          badge_name: `${newLevel.title}`,
          badge_description: `${newLevel.level}레벨에 도달했습니다`,
          badge_icon: 'crown',
          badge_color: newLevel.color,
          badge_category: 'achievement',
          badge_level: newLevel.level
        });
      } else {
        toast({
          title: "포인트 획득",
          description: `${reason}으로 ${points}포인트를 획득했습니다!`,
        });
      }

      // 상태 업데이트
      setUserStats(prev => prev ? {
        ...prev,
        points: newPoints,
        level: newLevel.level
      } : null);

    } catch (error) {
      console.error('Error adding points:', error);
      toast({
        title: "오류",
        description: "포인트 추가에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // 배지 획득
  const awardBadge = async (badge: Omit<UserBadge, 'id' | 'earned_at'> & { badge_category: 'achievement' | 'contribution' | 'social' | 'special' }) => {
    if (!user?.id) return;

    try {
      // 중복 체크
      const { data: existing } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', user.id)
        .eq('badge_id', badge.badge_id)
        .single();

      if (existing) return; // 이미 보유한 배지

      const { data, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          ...badge,
          earned_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "🏆 새 배지 획득!",
        description: `"${badge.badge_name}" 배지를 획득했습니다!`,
      });

      // 배지 목록 업데이트
      setUserStats(prev => prev ? {
        ...prev,
        badges: [data, ...prev.badges]
      } : null);

    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };

  useEffect(() => {
    loadUserStats();
  }, [user?.id]);

  return {
    userStats,
    loading,
    addPoints,
    awardBadge,
    calculateLevel,
    USER_LEVELS,
    reload: loadUserStats
  };
};