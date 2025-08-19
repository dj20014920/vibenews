import React, { useEffect, useState } from 'react';
import { UserEquipment } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';

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
        // edge function을 통해 사용자 장착 데이터 가져오기
        const { data, error } = await supabase.functions.invoke('manage-store', {
          body: { action: 'get-user-equipment', user_id: userId }
        });

        if (error || !data?.success) {
          console.error('장착 아이템 조회 오류:', error);
          // 에러 시 기본값 설정
          setEquipment({
            name_color: '#000000',
            name_effect: 'none',
            equipped_animation: 'none',
            badge: {},
            frame: {}
          });
          return;
        }

        // 데이터가 있으면 사용, 없으면 기본값
        setEquipment({
          name_color: data.equipment?.name_color || '#000000',
          name_effect: data.equipment?.name_effect || 'none',
          equipped_animation: data.equipment?.equipped_animation || 'none',
          badge: data.equipment?.badge || {},
          frame: data.equipment?.frame || {}
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