import React, { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { useUserLevels } from '@/hooks/useUserLevels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Package, User, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ItemCard from '@/components/store/ItemCard';
import UserPreview from '@/components/store/UserPreview';

const Store: React.FC = () => {
  const { 
    items, 
    inventory, 
    equipment,
    isLoading, 
    isInventoryLoading,
    isEquipmentLoading,
    isError, 
    error, 
    purchase, 
    isPurchasing,
    equip,
    isEquipping,
    isItemOwned,
    isItemEquipped 
  } = useStore();
  const { userStats } = useUserLevels();
  
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');

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

  const filteredItems = items?.filter(item => {
    const typeMatch = filterType === 'all' || item.item_type === filterType;
    const rarityMatch = filterRarity === 'all' || item.rarity === filterRarity;
    return typeMatch && rarityMatch;
  }).sort((a, b) => a.display_order - b.display_order) || [];

  const groupedInventory = inventory?.reduce((acc, item) => {
    const type = item.item.item_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, typeof inventory>) || {};

  const userPoints = userStats?.points || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          포인트 상점 ✨
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          활동으로 얻은 포인트로 특별한 아이템을 구매하고, 나만의 개성을 표현해보세요!
        </p>
        <div className="flex items-center justify-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <Coins className="h-5 w-5 text-yellow-600" />
          <span className="font-semibold text-yellow-800 dark:text-yellow-200">
            현재 포인트: {userPoints.toLocaleString()}
          </span>
        </div>
      </div>

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="store" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            상점
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            인벤토리
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            미리보기
          </TabsTrigger>
        </TabsList>

        {/* 상점 탭 */}
        <TabsContent value="store" className="space-y-6">
          {/* 필터 */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">필터:</span>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="아이템 타입" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 타입</SelectItem>
                <SelectItem value="name_color">이름 색상</SelectItem>
                <SelectItem value="name_effect">이름 효과</SelectItem>
                <SelectItem value="badge">뱃지</SelectItem>
                <SelectItem value="frame">프레임</SelectItem>
                <SelectItem value="animation">애니메이션</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRarity} onValueChange={setFilterRarity}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="희귀도" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 희귀도</SelectItem>
                <SelectItem value="common">일반</SelectItem>
                <SelectItem value="rare">희귀</SelectItem>
                <SelectItem value="epic">에픽</SelectItem>
                <SelectItem value="legendary">전설</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 상점 아이템 목록 */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>{renderSkeleton()}</div>
              ))}
            </div>
          )}

          {isError && (
            <Card className="p-6 text-center">
              <CardContent>
                <p className="text-destructive">상점을 불러오는데 실패했습니다: {error?.message}</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && !isError && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isOwned={isItemOwned(item.id)}
                  isEquipped={isItemEquipped(item.id)}
                  onPurchase={() => purchase(item.id)}
                  onEquip={() => equip(item.id)}
                  isPurchasing={isPurchasing}
                  isEquipping={isEquipping}
                  userPoints={userPoints}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* 인벤토리 탭 */}
        <TabsContent value="inventory" className="space-y-6">
          {isInventoryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
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
                  <h3 className="text-xl font-semibold mb-4 capitalize">
                    {type.replace('_', ' ')} ({items.length})
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

export default Store;
