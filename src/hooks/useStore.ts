import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define the types for store items based on the database schema
interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  item_type: string;
  metadata: any;
}

// Function to get all store items
const getStoreItems = async (): Promise<StoreItem[]> => {
  const { data, error } = await supabase.functions.invoke('manage-store', {
    body: { action: 'list-items' },
  });

  if (error) throw new Error(error.message);
  if (!data.success) throw new Error(data.error || 'Failed to fetch store items.');

  return data.items;
};

// Function to purchase an item
const purchaseItem = async (itemId: string) => {
  const { data, error } = await supabase.functions.invoke('manage-store', {
    body: { action: 'purchase-item', item_id: itemId },
  });

  if (error) throw new Error(error.message);
  if (!data.success) throw new Error(data.error || 'Purchase failed.');

  return data;
};

export const useStore = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: items, isLoading, isError, error } = useQuery<StoreItem[], Error>({
    queryKey: ['store-items'],
    queryFn: getStoreItems,
  });

  const { mutate: purchase, isPending: isPurchasing } = useMutation({
    mutationFn: purchaseItem,
    onSuccess: (data) => {
      toast({
        title: 'Purchase Successful!',
        description: `You have successfully purchased an item. Your new balance is ${data.new_points} points.`,
      });
      // Invalidate queries to refetch fresh data
      // This will update the user's points display if it's based on a query with this key
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-inventory'] });
    },
    onError: (error) => {
      toast({
        title: 'Purchase Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    items,
    isLoading,
    isError,
    error,
    purchase,
    isPurchasing,
  };
};
