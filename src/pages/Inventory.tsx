import React from 'react';
import { useStore } from '@/hooks/useStore';
import { useUserLevels } from '@/hooks/useUserLevels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Crown, Zap, Palette, Frame, Star } from 'lucide-react';
import ItemCard from '@/components/store/ItemCard';
import UserPreview from '@/components/store/UserPreview';

const Inventory: React.FC = () => {
  const { 
    inventory, 
    equipment,
    isInventoryLoading,
    isEquipmentLoading,
    equip,
    isEquipping,
  } = useStore();
  const { userStats } = useUserLevels();

  const renderSkeleton = () => (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="w-2/3 h-6 bg-muted rounded"></div>
        <div className="w-full h-4 bg-muted rounded mt-2"></div>
      </CardHeader>
      <CardContent>
        <div className="w-1/4 h-4 bg-muted rounded"></div>
      </CardContent>
    </Card>
  );

  const groupedInventory = inventory?.reduce((acc, item) => {
    const type = item.item.item_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, typeof inventory>) || {};

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'name_color': return <Palette className="h-5 w-5" />;
      case 'name_effect': return <Zap className="h-5 w-5" />;
      case 'badge': return <Crown className="h-5 w-5" />;
      case 'frame': return <Frame className="h-5 w-5" />;
      case 'animation': return <Star className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'name_color': return '이름 색상';
      case 'name_effect': return '이름 효과';
      case 'badge': return '뱃지';
      case 'frame': return '프레임';
      case 'animation': return '애니메이션';
      default: return type;
    }
  };

  const userPoints = userStats?.points || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          내 아이템 🎒
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          구매한 아이템들을 관리하고 장착해보세요!
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            전체
          </TabsTrigger>
          <TabsTrigger value="name_color" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            색상
          </TabsTrigger>
          <TabsTrigger value="name_effect" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            효과
          </TabsTrigger>
          <TabsTrigger value="badge" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            뱃지
          </TabsTrigger>
          <TabsTrigger value="frame" className="flex items-center gap-2">
            <Frame className="h-4 w-4" />
            프레임
          </TabsTrigger>
          <TabsTrigger value="animation" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            애니메이션
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            미리보기
          </TabsTrigger>
        </TabsList>

        {/* 전체 탭 */}
        <TabsContent value="all" className="space-y-6">
          {isInventoryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>{renderSkeleton()}</div>
              ))}
            </div>
          ) : !inventory || inventory.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent>
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">인벤토리가 비어있습니다</h3>
                <p className="text-muted-foreground">상점에서 아이템을 구매해보세요!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedInventory).map(([type, items]) => (
                <div key={type}>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    {getTypeIcon(type)}
                    {getTypeLabel(type)} ({items.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map((inventoryItem) => (
                      <ItemCard
                        key={inventoryItem.id}
                        item={inventoryItem.item}
                        isOwned={true}
                        isEquipped={inventoryItem.is_equipped}
                        onPurchase={() => {}}
                        onEquip={() => equip(inventoryItem.item_id)}
                        isPurchasing={false}
                        isEquipping={isEquipping}
                        userPoints={userPoints}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 타입별 탭들 */}
        {Object.keys(groupedInventory).map(type => (
          <TabsContent key={type} value={type} className="space-y-6">
            {groupedInventory[type] && groupedInventory[type].length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedInventory[type].map((inventoryItem) => (
                  <ItemCard
                    key={inventoryItem.id}
                    item={inventoryItem.item}
                    isOwned={true}
                    isEquipped={inventoryItem.is_equipped}
                    onPurchase={() => {}}
                    onEquip={() => equip(inventoryItem.item_id)}
                    isPurchasing={false}
                    isEquipping={isEquipping}
                    userPoints={userPoints}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <CardContent>
                  {getTypeIcon(type)}
                  <h3 className="text-lg font-semibold mb-2 mt-4">
                    {getTypeLabel(type)} 아이템이 없습니다
                  </h3>
                  <p className="text-muted-foreground">상점에서 구매해보세요!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}

        {/* 미리보기 탭 */}
        <TabsContent value="preview" className="space-y-6">
          <div className="flex justify-center">
            {isEquipmentLoading ? (
              <Card className="w-full max-w-md">
                <CardHeader>
                  <div className="w-1/2 h-6 bg-muted rounded"></div>
                  <div className="w-full h-4 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-muted rounded"></div>
                    <div className="w-3/4 h-4 bg-muted rounded"></div>
                    <div className="w-1/2 h-4 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ) : equipment ? (
              <UserPreview equipment={equipment} />
            ) : (
              <Card className="w-full max-w-md p-6 text-center">
                <CardContent>
                  <p className="text-muted-foreground">미리보기를 불러올 수 없습니다</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;