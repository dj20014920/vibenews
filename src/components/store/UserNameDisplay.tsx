import React, { useEffect, useState } from 'react';
import { UserEquipment } from '@/hooks/useStore';

interface UserNameDisplayProps {
  userId: string;
  nickname: string;
  className?: string;
  showBadge?: boolean;
}

const UserNameDisplay: React.FC<UserNameDisplayProps> = ({ 
  userId, 
  nickname, 
  className = '',
  showBadge = true 
}) => {
  const [equipment, setEquipment] = useState<UserEquipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        // 임시로 기본 장비 설정 사용 (데이터베이스 테이블이 준비될 때까지)
        setEquipment({
          name_color: '#000000',
          name_effect: 'none',
          equipped_animation: 'none',
          badge: {},
          frame: {}
        });
      } catch (error) {
        console.error('장착 아이템 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchEquipment();
    }
  }, [userId]);

  if (loading || !equipment) {
    return <span className={className}>{nickname}</span>;
  }

  const getNameStyle = () => {
    const styles: React.CSSProperties = {
      color: equipment.name_color || undefined,
      fontWeight: 'inherit',
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
          textShadow: '0 0 8px currentColor, 0 0 16px currentColor',
        };
      case 'shadow':
        return {
          ...styles,
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
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
      border: `1px ${frame.style || 'solid'} ${frame.color || '#e5e7eb'}`,
      borderRadius: frame.pattern === 'ornate' ? '6px' : '4px',
      padding: '2px 6px',
    };
  };

  return (
    <span 
      className={`inline-flex items-center gap-1 ${getAnimationClass()} ${className}`}
      style={getFrameStyle()}
    >
      {showBadge && equipment.badge?.metadata?.icon && (
        <span className="text-sm">{equipment.badge.metadata.icon}</span>
      )}
      <span style={getNameStyle()}>
        {nickname}
      </span>
    </span>
  );
};

export default UserNameDisplay;