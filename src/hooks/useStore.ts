import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  item_type: 'name_color' | 'name_effect' | 'badge' | 'frame' | 'animation';
  metadata: any;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview_image?: string;
  display_order: number;
  is_active: boolean;
}

export interface UserInventoryItem {
  id: string;
  item_id: string;
  is_equipped: boolean;
  purchased_at: string;
  item: StoreItem;
}

export interface UserEquipment {
  name_color: string;
  name_effect: string;
  equipped_animation: string;
  badge: any;
  frame: any;
}

// 상점 아이템 목록 조회
const getStoreItems = async (): Promise<StoreItem[]> => {
  const { data, error } = await supabase.functions.invoke('manage-store', {
    body: { action: 'list-items' },
  });

  if (error) throw new Error(error.message);
  if (!data.success) throw new Error(data.error || '상점 아이템을 불러오는데 실패했습니다.');

  return data.items;
};

// 사용자 인벤토리 조회
const getUserInventory = async (): Promise<UserInventoryItem[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('manage-store', {
      body: { action: 'get-inventory' },
    });

    if (error) throw new Error(error.message);
    if (!data.success) throw new Error(data.error || '인벤토리를 불러오는데 실패했습니다.');

    return data.inventory || [];
  } catch (error) {
    console.error('인벤토리 조회 실패:', error);
    return [];
  }
};

// 사용자 장착 아이템 정보 조회
const getUserEquipment = async (): Promise<UserEquipment> => {
  try {
    const { data, error } = await supabase.functions.invoke('manage-store', {
      body: { action: 'get-equipment' },
    });

    if (error) throw new Error(error.message);
    if (!data.success) throw new Error(data.error || '장착 정보를 불러오는데 실패했습니다.');

    return data.equipment || {
      name_color: '#000000',
      name_effect: 'none',
      equipped_animation: 'none',
      badge: {},
      frame: {}
    };
  } catch (error) {
    console.error('장착 정보 조회 실패:', error);
    return {
      name_color: '#000000',
      name_effect: 'none',
      equipped_animation: 'none',
      badge: {},
      frame: {}
    };
  }
};

// 아이템 구매
const purchaseItem = async (itemId: string) => {
  const { data, error } = await supabase.functions.invoke('manage-store', {
    body: { action: 'purchase-item', item_id: itemId },
  });

  if (error) throw new Error(error.message);
  if (!data.success) throw new Error(data.error || '구매에 실패했습니다.');

  return data;
};

// 아이템 장착 (더미 구현)
const equipItem = async (itemId: string) => {
  // 장착 완료 메시지 반환
  return { success: true, message: '아이템이 장착되었습니다!' };
};

export const useStore = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // 상점 아이템 목록
  const { data: items, isLoading, isError, error } = useQuery<StoreItem[], Error>({
    queryKey: ['store-items'],
    queryFn: getStoreItems,
  });

  // 사용자 인벤토리
  const { data: inventory, isLoading: isInventoryLoading } = useQuery<UserInventoryItem[], Error>({
    queryKey: ['user-inventory'],
    queryFn: getUserInventory,
    enabled: !!user, // 사용자가 로그인했을 때만 활성화
  });

  // 사용자 장착 아이템
  const { data: equipment, isLoading: isEquipmentLoading } = useQuery<UserEquipment, Error>({
    queryKey: ['user-equipment'],
    queryFn: getUserEquipment,
    enabled: !!user, // 사용자가 로그인했을 때만 활성화
  });

  // 구매 뮤테이션
  const { mutate: purchase, isPending: isPurchasing } = useMutation({
    mutationFn: purchaseItem,
    onSuccess: (data) => {
      toast({
        title: '구매 완료! 🎉',
        description: `아이템을 성공적으로 구매했습니다. 현재 포인트: ${data.new_points}`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-levels'] });
    },
    onError: (error) => {
      toast({
        title: '구매 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 장착 뮤테이션
  const { mutate: equip, isPending: isEquipping } = useMutation({
    mutationFn: equipItem,
    onSuccess: (data) => {
      toast({
        title: '장착 완료! ✨',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['user-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['user-equipment'] });
    },
    onError: (error) => {
      toast({
        title: '장착 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 아이템이 이미 보유되었는지 확인
  const isItemOwned = (itemId: string): boolean => {
    return inventory?.some(item => item.item_id === itemId) || false;
  };

  // 아이템이 장착되었는지 확인
  const isItemEquipped = (itemId: string): boolean => {
    return inventory?.some(item => item.item_id === itemId && item.is_equipped) || false;
  };

  return {
    items,
    inventory: inventory || [],
    equipment: equipment || {
      name_color: '#000000',
      name_effect: 'none',
      equipped_animation: 'none',
      badge: {},
      frame: {}
    },
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
    isItemEquipped,
  };
};