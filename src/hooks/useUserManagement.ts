import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'user' | 'moderator';

interface ManagedUser {
  id: string;
  email: string;
  nickname: string;
  role: UserRole;
  created_at: string;
}

// Function to get all users (admin only)
const getUsers = async (): Promise<ManagedUser[]> => {
  const { data, error } = await supabase.functions.invoke('manage-users', {
    body: { action: 'list-users' },
  });

  if (error) throw new Error(error.message);
  if (!data.success) throw new Error(data.error || 'Failed to fetch users.');

  return data.users;
};

// Function to update a user's role
const updateUserRole = async ({ userId, newRole }: { userId: string, newRole: UserRole }) => {
  const { data, error } = await supabase.functions.invoke('manage-users', {
    body: { action: 'update-role', target_user_id: userId, new_role: newRole },
  });

  if (error) throw new Error(error.message);
  if (!data.success) throw new Error(data.error || 'Failed to update role.');

  return data;
};

export const useUserManagement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading, isError, error } = useQuery<ManagedUser[], Error>({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const { mutate: updateRole, isPending: isUpdatingRole } = useMutation({
    mutationFn: updateUserRole,
    onSuccess: (data) => {
      toast({
        title: 'Success!',
        description: `User ${data.updatedUser.nickname}'s role has been updated to ${data.updatedUser.role}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    users,
    isLoading,
    isError,
    error,
    updateRole,
    isUpdatingRole,
  };
};
