import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserEquipment } from '@/hooks/useStore';
import { useAuth } from '@/contexts/AuthContext';

interface UserPreviewProps {
  equipment: UserEquipment;
}

const UserPreview: React.FC<UserPreviewProps> = ({ equipment }) => {
  const { user } = useAuth();

  const getNameStyle = () => {
    const styles: React.CSSProperties = {
      color: equipment.name_color || '#000000',
      fontWeight: 'bold',
      fontSize: '1.2rem',
    };

    switch (equipment.name_effect) {
      case 'rainbow':
        return {
          ...styles,
          background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
          backgroundSize: '400% 400%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'rainbow 3s ease-in-out infinite'
        };
      case 'glow':
        return {
          ...styles,
          textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
        };
      case 'shadow':
        return {
          ...styles,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        };
      default:
        return styles;
    }
  };

  const getAnimationClass = () => {
    switch (equipment.equipped_animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'sparkle':
        return 'animate-bounce';
      default:
        return '';
    }
  };

  const getFrameStyle = () => {
    if (!equipment.frame?.metadata) return {};
    
    const frame = equipment.frame.metadata;
    return {
      border: `${frame.width || '2px'} ${frame.style || 'solid'} ${frame.color || '#e5e7eb'}`,
      borderRadius: frame.pattern === 'ornate' ? '12px' : '8px',
    };
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>미리보기</CardTitle>
        <CardDescription>현재 장착한 아이템들의 모습을 확인해보세요</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 사용자 이름 미리보기 */}
          <div 
            className={`p-4 bg-muted rounded-lg text-center transition-all duration-300 ${getAnimationClass()}`}
            style={getFrameStyle()}
          >
            <div className="flex items-center justify-center gap-2">
              {equipment.badge?.metadata?.icon && (
                <span className="text-lg">{equipment.badge.metadata.icon}</span>
              )}
              <span style={getNameStyle()}>
                {user?.user_metadata?.nickname || user?.email?.split('@')[0] || '사용자'}
              </span>
            </div>
          </div>

          {/* 장착 아이템 목록 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">장착 아이템</h4>
            <div className="space-y-1">
              {equipment.name_color !== '#000000' && (
                <Badge variant="outline" className="w-full justify-start">
                  🎨 이름 색상: <span style={{ color: equipment.name_color, marginLeft: '4px' }}>●</span>
                </Badge>
              )}
              {equipment.name_effect !== 'none' && (
                <Badge variant="outline" className="w-full justify-start">
                  ✨ 이름 효과: {equipment.name_effect}
                </Badge>
              )}
              {equipment.badge?.name && (
                <Badge variant="outline" className="w-full justify-start">
                  {equipment.badge.metadata?.icon} 뱃지: {equipment.badge.name}
                </Badge>
              )}
              {equipment.frame?.name && (
                <Badge variant="outline" className="w-full justify-start">
                  🖼️ 프레임: {equipment.frame.name}
                </Badge>
              )}
              {equipment.equipped_animation !== 'none' && (
                <Badge variant="outline" className="w-full justify-start">
                  🎬 애니메이션: {equipment.equipped_animation}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// CSS 애니메이션 추가 (글로벌 스타일에 추가)
const rainbowKeyframes = `
@keyframes rainbow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`;

// 스타일 주입
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = rainbowKeyframes;
  document.head.appendChild(style);
}

export default UserPreview;