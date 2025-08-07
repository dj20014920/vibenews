import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserLevels, UserBadge, UserLevel } from '@/hooks/useUserLevels';
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
  Zap,
  Folder
} from 'lucide-react';

interface UserBadgeSystemProps {
  userId?: string;
  showLevel?: boolean;
  showBadges?: boolean;
  maxBadges?: number;
  size?: 'sm' | 'md' | 'lg';
}

const getBadgeIcon = (iconName: string, size = 16) => {
  const iconProps = { size, className: "inline" };
  
  switch (iconName.toLowerCase()) {
    case 'crown': return <Crown {...iconProps} />;
    case 'star': return <Star {...iconProps} />;
    case 'award': return <Award {...iconProps} />;
    case 'shield': return <Shield {...iconProps} />;
    case 'heart': return <Heart {...iconProps} />;
    case 'message-square': return <MessageSquare {...iconProps} />;
    case 'trending-up': return <TrendingUp {...iconProps} />;
    case 'users': return <Users {...iconProps} />;
    case 'code': return <Code {...iconProps} />;
    case 'zap': return <Zap {...iconProps} />;
    case 'folder': return <Folder {...iconProps} />;
    default: return <Star {...iconProps} />;
  }
};

const getLevelColor = (level: number): string => {
  const colorMap: Record<number, string> = {
    1: "bg-green-500",
    2: "bg-blue-500", 
    3: "bg-purple-500",
    4: "bg-orange-500",
    5: "bg-red-500",
    6: "bg-gradient-to-r from-yellow-400 to-orange-500"
  };
  return colorMap[level] || "bg-gray-500";
};

const getLevelTitle = (level: number): string => {
  const titleMap: Record<number, string> = {
    1: "코딩 입문자",
    2: "코딩 탐험가",
    3: "개발 마니아", 
    4: "코딩 전문가",
    5: "개발 구루",
    6: "코딩 마스터"
  };
  return titleMap[level] || "개발자";
};

const getBadgeColorClass = (color: string): string => {
  const colorMap: Record<string, string> = {
    'gray': 'bg-gray-500 text-white',
    'green': 'bg-green-500 text-white',
    'blue': 'bg-blue-500 text-white',
    'purple': 'bg-purple-500 text-white',
    'orange': 'bg-orange-500 text-white',
    'red': 'bg-red-500 text-white',
    'yellow': 'bg-yellow-500 text-white',
  };
  return colorMap[color] || "bg-gray-500 text-white";
};

export function UserBadgeSystem({ userId, showLevel = true, showBadges = true, maxBadges = 3, size = 'md' }: UserBadgeSystemProps) {
  const { userStats, loading, calculateLevel, USER_LEVELS } = useUserLevels();
  
  if (loading || !userStats) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-6 w-16 bg-muted animate-pulse rounded" />
        <div className="h-6 w-6 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const levelInfo = calculateLevel(userStats.points);
  
  const sizeClasses = {
    sm: { 
      badge: "h-6 text-xs", 
      icon: 12, 
      text: "text-xs",
      container: "gap-1"
    },
    md: { 
      badge: "h-7 text-sm", 
      icon: 14, 
      text: "text-sm",
      container: "gap-2"
    },
    lg: { 
      badge: "h-8 text-base", 
      icon: 16, 
      text: "text-base",
      container: "gap-3"
    }
  };

  const currentSize = sizeClasses[size];
  const displayBadges = userStats.badges.slice(0, maxBadges);

  return (
    <div className={`flex items-center ${currentSize.container}`}>
      <TooltipProvider>
        {showLevel && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="secondary" 
                className={`${currentSize.badge} ${getLevelColor(userStats.level)} flex items-center gap-1`}
              >
                {getBadgeIcon('crown', currentSize.icon)}
                <span className={currentSize.text}>
                  Lv.{userStats.level} {levelInfo.title}
                </span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-semibold">{levelInfo.title}</p>
                <p className="text-sm text-muted-foreground">포인트: {userStats.points}</p>
                <p className="text-xs text-muted-foreground">
                  다음 레벨: {levelInfo.level < USER_LEVELS.length ? USER_LEVELS[levelInfo.level].min_points - userStats.points : 0}P
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {showBadges && displayBadges.map((badge) => (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`${currentSize.badge} ${getBadgeColorClass(badge.badge_color)} flex items-center gap-1`}
              >
                {getBadgeIcon(badge.badge_icon, currentSize.icon)}
                <span className={currentSize.text}>{badge.badge_name}</span>
                {badge.badge_level && (
                  <span className={`${currentSize.text} opacity-75`}>
                    Lv.{badge.badge_level}
                  </span>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-semibold">{badge.badge_name}</p>
                <p className="text-sm text-muted-foreground">{badge.badge_description}</p>
                <p className="text-xs text-muted-foreground">
                  획득일: {new Date(badge.earned_at).toLocaleDateString()}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {userStats.badges.length > maxBadges && (
          <Badge variant="outline" className={`${currentSize.badge} opacity-60`}>
            <span className={currentSize.text}>+{userStats.badges.length - maxBadges}</span>
          </Badge>
        )}
      </TooltipProvider>
    </div>
  );
}

// 배지 진행도 컴포넌트
interface BadgeProgressProps {
  badges: UserBadge[];
  availableBadges: UserBadge[];
}

export function BadgeProgress({ badges, availableBadges }: BadgeProgressProps) {
  const progressPercentage = Math.round((badges.length / availableBadges.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">배지 컬렉션</h3>
        <span className="text-sm text-muted-foreground">
          {badges.length}/{availableBadges.length}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {availableBadges.map((badge) => {
          const isEarned = badges.some(b => b.badge_id === badge.badge_id);
          
          return (
            <TooltipProvider key={badge.id}>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className={`
                      flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200
                      ${isEarned 
                        ? `${getBadgeColorClass(badge.badge_color)} border-current` 
                        : 'bg-gray-100 border-gray-300 opacity-50'
                      }
                    `}
                  >
                    {getBadgeIcon(badge.badge_icon, 24)}
                    <span className="text-xs font-medium mt-1 text-center">
                      {badge.badge_name}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <p className="font-semibold">{badge.badge_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {badge.badge_description}
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

// 레벨 진행도 컴포넌트
interface LevelProgressProps {
  currentLevel: number;
  currentPoints: number;
}

export function LevelProgress({ currentLevel, currentPoints }: LevelProgressProps) {
  const { USER_LEVELS } = useUserLevels();
  const levelInfo = USER_LEVELS.find(level => level.level === currentLevel) || USER_LEVELS[0];
  const nextLevel = USER_LEVELS.find(level => level.level === currentLevel + 1);
  
  const progressInCurrentLevel = nextLevel 
    ? Math.round(((currentPoints - levelInfo.min_points) / (nextLevel.min_points - levelInfo.min_points)) * 100)
    : 100;

  const pointsToNext = nextLevel ? nextLevel.min_points - currentPoints : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">레벨 진행도</h3>
        <div className="text-right">
          <p className="text-sm font-medium">{levelInfo.title}</p>
          <p className="text-xs text-muted-foreground">
            {currentPoints.toLocaleString()} 포인트
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Lv.{currentLevel}</span>
          {nextLevel && <span>Lv.{nextLevel.level}</span>}
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progressInCurrentLevel, 100)}%` }}
          />
        </div>
        
        {nextLevel && pointsToNext > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            다음 레벨까지 {pointsToNext.toLocaleString()} 포인트 필요
          </p>
        )}
      </div>

      <div className="bg-muted p-3 rounded-lg">
        <p className="text-sm font-medium mb-2">현재 레벨 혜택:</p>
        <ul className="text-xs space-y-1">
          {levelInfo.perks.map((perk, i) => (
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