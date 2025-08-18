import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, ShoppingCart, Check, Sparkles } from 'lucide-react';
import { StoreItem } from '@/hooks/useStore';

interface ItemCardProps {
  item: StoreItem;
  isOwned: boolean;
  isEquipped: boolean;
  onPurchase: () => void;
  onEquip: () => void;
  isPurchasing: boolean;
  isEquipping: boolean;
  userPoints?: number;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isOwned,
  isEquipped,
  onPurchase,
  onEquip,
  isPurchasing,
  isEquipping,
  userPoints = 0,
}) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '👑';
      case 'epic': return '💎';
      case 'rare': return '⭐';
      default: return '🔸';
    }
  };

  const getPreviewStyle = () => {
    const { metadata } = item;
    
    switch (item.item_type) {
      case 'name_color':
        return { color: metadata.color };
      case 'name_effect':
        if (metadata.effect === 'rainbow') {
          return {
            background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
            backgroundSize: '400% 400%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'rainbow 3s ease-in-out infinite'
          };
        } else if (metadata.effect === 'glow') {
          return {
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor',
            color: '#3b82f6'
          };
        } else if (metadata.effect === 'shadow') {
          return {
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            color: '#1f2937'
          };
        }
        break;
      default:
        return {};
    }
  };

  const canAfford = userPoints >= item.price;

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
      isEquipped ? 'ring-2 ring-primary shadow-md' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>{getRarityIcon(item.rarity)}</span>
              {item.item_type === 'name_color' || item.item_type === 'name_effect' ? (
                <span style={getPreviewStyle()}>{item.name}</span>
              ) : (
                item.name
              )}
            </CardTitle>
            <Badge className={getRarityColor(item.rarity)}>{item.rarity}</Badge>
          </div>
          {isEquipped && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              장착중
            </Badge>
          )}
        </div>
        <CardDescription className="text-sm">{item.description}</CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>타입: {item.item_type.replace('_', ' ')}</span>
          </div>
          
          {/* 아이템별 미리보기 */}
          {item.item_type === 'badge' && item.metadata?.icon && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <span className="text-lg">{item.metadata.icon}</span>
              <span className="text-sm">뱃지 미리보기</span>
            </div>
          )}
          
          {item.item_type === 'animation' && (
            <div className="p-2 bg-muted rounded text-center">
              <span className={
                item.metadata?.type === 'pulse' ? 'animate-pulse' : 
                item.metadata?.type === 'sparkle' ? 'animate-bounce' : ''
              }>
                애니메이션 미리보기
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-yellow-600" />
              <span className="font-semibold">{item.price.toLocaleString()}</span>
            </div>
            {!canAfford && !isOwned && (
              <span className="text-xs text-destructive">포인트 부족</span>
            )}
          </div>
          
          {!isOwned ? (
            <Button 
              onClick={onPurchase}
              disabled={isPurchasing || !canAfford}
              className="w-full"
              variant={canAfford ? "default" : "outline"}
            >
              {isPurchasing ? (
                '구매 중...'
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  구매하기
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={onEquip}
              disabled={isEquipping || isEquipped}
              variant={isEquipped ? "secondary" : "default"}
              className="w-full"
            >
              {isEquipping ? (
                '장착 중...'
              ) : isEquipped ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  장착됨
                </>
              ) : (
                '장착하기'
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ItemCard;