import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/hooks/useGamification';
import { useUserLevels } from '@/hooks/useUserLevels';

interface GamificationContextType {
  handleLikeAction: (isLiking: boolean, contentAuthorId?: string) => Promise<void>;
  handleCommentAction: (isCreating: boolean, postAuthorId?: string) => Promise<void>;
  handlePostAction: (isCreating: boolean) => Promise<void>;
  handleCodeAction: (isCreating: boolean, isForked?: boolean) => Promise<void>;
  checkPopularityBadges: (likeCount: number, viewCount: number) => Promise<void>;
  handleDailyLogin: () => Promise<void>;
  userStats: any;
  loading: boolean;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { userStats, loading } = useUserLevels();
  const gamification = useGamification();

  // 로그인 시 일일 로그인 체크
  useEffect(() => {
    if (user && !loading) {
      gamification.handleDailyLogin();
    }
  }, [user, loading]);

  return (
    <GamificationContext.Provider value={{
      ...gamification,
      userStats,
      loading
    }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamificationContext = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamificationContext must be used within a GamificationProvider');
  }
  return context;
};