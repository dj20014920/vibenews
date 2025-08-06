import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Crown, 
  Star, 
  Award, 
  Shield, 
  Heart, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Code, 
  Zap 
} from 'lucide-react';

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'achievement' | 'contribution' | 'social' | 'special';
  level?: number;
  earned_at: string;
}

export interface UserLevel {
  level: number;
  title: string;
  min_points: number;
  max_points: number;
  color: string;
  perks: string[];
}

interface UserBadgeSystemProps {
  user: {
    id: string;
    nickname: string;
    level: number;
    points: number;
    badges: UserBadge[];
  };
  showLevel?: boolean;
  showBadges?: boolean;
  maxBadges?: number;
  size?: 'sm' | 'md' | 'lg';
}

// 사용자 레벨 정의
const USER_LEVELS: UserLevel[] = [
  {
    level: 1,
    title: '새싹 개발자',
    min_points: 0,
    max_points: 99,
    color: 'bg-green-500',
    perks: ['기본 댓글 작성']
  },
  {
    level: 2,
    title: '성장하는 개발자',
    min_points: 100,
    max_points: 299,
    color: 'bg-blue-500',
    perks: ['게시글 작성', '좋아요 권한']
  },
  {
    level: 3,
    title: '활발한 개발자',
    min_points: 300,
    max_points: 599,
    color: 'bg-purple-500',
    perks: ['코드 스니펫 공유', '태그 추천']
  },
  {
    level: 4,
    title: '숙련된 개발자',
    min_points: 600,
    max_points: 999,
    color: 'bg-orange-500',
    perks: ['멘토링 신청', '고급 검색']
  },
  {
    level: 5,
    title: '전문 개발자',
    min_points: 1000,
    max_points: 1999,
    color: 'bg-red-500',
    perks: ['전문가 배지', '우선 답변']
  },
  {
    level: 6,
    title: 'VibeNews 마스터',
    min_points: 2000,
    max_points: Infinity,
    color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    perks: ['모든 권한', '특별 이벤트 참여']
  }
];

// 배지 아이콘 매핑
const getBadgeIcon = (iconName: string, size: number = 16) => {
  const iconProps = { size, className: "text-current" };
  
  switch (iconName) {
    case 'crown':
      return <Crown {...iconProps} />;
    case 'star':
      return <Star {...iconProps} />;
    case 'award':
      return <Award {...iconProps} />;
    case 'shield':
      return <Shield {...iconProps} />;
    case 'heart':
      return <Heart {...iconProps} />;
    case 'message':
      return <MessageSquare {...iconProps} />;
    case 'trending':
      return <TrendingUp {...iconProps} />;
    case 'users':
      return <Users {...iconProps} />;
    case 'code':
      return <Code {...iconProps} />;
    case 'zap':
      return <Zap {...iconProps} />;
    default:
      return <Star {...iconProps} />;
  }
};

// 레벨 색상 반환
const getLevelColor = (level: number): string => {
  const userLevel = USER_LEVELS.find(l => l.level === level);
  return userLevel?.color || 'bg-gray-500';
};

// 레벨 타이틀 반환
const getLevelTitle = (level: number): string => {
  const userLevel = USER_LEVELS.find(l => l.level === level);
  return userLevel?.title || '개발자';
};

// 배지 색상 클래스 매핑
const getBadgeColorClass = (color: string): string => {
  const colorMap: Record<string, string> = {
    'gold': 'bg-yellow-500 text-yellow-50',
    'silver': 'bg-gray-400 text-gray-50',
    'bronze': 'bg-amber-600 text-amber-50',
    'blue': 'bg-blue-500 text-blue-50',
    'green': 'bg-green-500 text-green-50',
    'purple': 'bg-purple-500 text-purple-50',
    'red': 'bg-red-500 text-red-50',
    'pink': 'bg-pink-500 text-pink-50',
    'indigo': 'bg-indigo-500 text-indigo-50',
  };
  
  return colorMap[color] || 'bg-gray-500 text-gray-50';
};

export function UserBadgeSystem({ 
  user, 
  showLevel = true, 
  showBadges = true, 
  maxBadges = 3,
  size = 'md'
}: UserBadgeSystemProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  const badgesToShow = showBadges ? user.badges.slice(0, maxBadges) : [];
  const hiddenBadgesCount = user.badges.length - maxBadges;

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
        {/* 사용자 레벨 */}
        {showLevel && (
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="secondary"
                className={`${getLevelColor(user.level)} text-white border-0 font-semibold`}
              >
                <Crown className="w-3 h-3 mr-1" />
                Lv.{user.level}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-semibold">{getLevelTitle(user.level)}</p>
                <p className="text-xs text-muted-foreground">
                  {user.points.toLocaleString()} 포인트
                </p>
                <div className="mt-2 text-xs">
                  <p className="font-medium">혜택:</p>
                  <ul className="list-disc list-inside text-left">
                    {USER_LEVELS.find(l => l.level === user.level)?.perks.map((perk, i) => (
                      <li key={i}>{perk}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* 사용자 배지들 */}
        {showBadges && badgesToShow.map((badge) => (
          <Tooltip key={badge.id}>
            <TooltipTrigger>
              <Badge
                variant="secondary"
                className={`${getBadgeColorClass(badge.color)} border-0 flex items-center gap-1`}
              >
                {getBadgeIcon(badge.icon, iconSizes[size])}
                <span className="font-medium">{badge.name}</span>
                {badge.level && (
                  <span className="text-xs opacity-80">
                    {badge.level}
                  </span>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <p className="font-semibold">{badge.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {badge.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  획득일: {new Date(badge.earned_at).toLocaleDateString()}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* 숨겨진 배지 수 */}
        {hiddenBadgesCount > 0 && (
          <Badge variant="outline" className="text-xs">
            +{hiddenBadgesCount}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}

// 배지 진행 상황 컴포넌트
interface BadgeProgressProps {
  badges: UserBadge[];
  availableBadges: Omit<UserBadge, 'earned_at'>[];
}

export function BadgeProgress({ badges, availableBadges }: BadgeProgressProps) {
  const earnedBadgeIds = badges.map(b => b.id);
  const earnedCount = badges.length;
  const totalCount = availableBadges.length;
  const progressPercentage = (earnedCount / totalCount) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">배지 컬렉션</h3>
        <span className="text-sm text-muted-foreground">
          {earnedCount}/{totalCount}
        </span>
      </div>

      {/* 진행 바 */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* 배지 그리드 */}
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {availableBadges.map((badge) => {
          const isEarned = earnedBadgeIds.includes(badge.id);
          
          return (
            <TooltipProvider key={badge.id}>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className={`
                      flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200
                      ${isEarned 
                        ? `${getBadgeColorClass(badge.color)} border-current` 
                        : 'bg-gray-100 border-gray-300 opacity-50'
                      }
                    `}
                  >
                    {getBadgeIcon(badge.icon, 24)}
                    <span className="text-xs font-medium mt-1 text-center">
                      {badge.name}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {badge.description}
                    </p>
                    <p className="text-xs mt-2">
                      {isEarned ? (
                        <span className="text-green-600 font-medium">획득 완료!</span>
                      ) : (
                        <span className="text-orange-600">아직 미획득</span>
                      )}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}

// 레벨 진행 바 컴포넌트
interface LevelProgressProps {
  currentLevel: number;
  currentPoints: number;
}

export function LevelProgress({ currentLevel, currentPoints }: LevelProgressProps) {
  const currentLevelData = USER_LEVELS.find(l => l.level === currentLevel);
  const nextLevelData = USER_LEVELS.find(l => l.level === currentLevel + 1);
  
  if (!currentLevelData) return null;

  const pointsInCurrentLevel = currentPoints - currentLevelData.min_points;
  const pointsNeededForLevel = currentLevelData.max_points - currentLevelData.min_points + 1;
  const progressPercentage = (pointsInCurrentLevel / pointsNeededForLevel) * 100;
  const pointsToNext = nextLevelData ? nextLevelData.min_points - currentPoints : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">레벨 진행도</h3>
        <div className="text-right">
          <p className="text-sm font-medium">{currentLevelData.title}</p>
          <p className="text-xs text-muted-foreground">
            {currentPoints.toLocaleString()} 포인트
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Lv.{currentLevel}</span>
          {nextLevelData && <span>Lv.{nextLevelData.level}</span>}
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${currentLevelData.color}`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        
        {nextLevelData && pointsToNext > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            다음 레벨까지 {pointsToNext.toLocaleString()} 포인트 필요
          </p>
        )}
      </div>

      {/* 현재 레벨 혜택 */}
      <div className="bg-muted p-3 rounded-lg">
        <p className="text-sm font-medium mb-2">현재 레벨 혜택:</p>
        <ul className="text-xs space-y-1">
          {currentLevelData.perks.map((perk, i) => (
            <li key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              {perk}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}