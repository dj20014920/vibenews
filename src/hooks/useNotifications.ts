import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  data: any;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadNotifications = async (unreadOnly = false) => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-notifications', {
        body: {
          action: 'get',
          limit: 50,
          offset: 0,
          unread_only: unreadOnly
        }
      });

      if (error) throw error;

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Load notifications error:', error);
      toast({
        title: "오류",
        description: "알림을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const markAsRead = async (notificationId?: string, markAll = false) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-notifications', {
        body: {
          action: 'mark_read',
          notification_id: notificationId,
          mark_all: markAll
        }
      });

      if (error) throw error;

      if (data.success) {
        // Update local state
        if (markAll) {
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
          setUnreadCount(0);
        } else if (notificationId) {
          setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Mark as read error:', error);
      toast({
        title: "오류",
        description: "알림 읽음 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (notificationId?: string, deleteAllRead = false) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-notifications', {
        body: {
          action: 'delete',
          notification_id: notificationId,
          delete_all_read: deleteAllRead
        }
      });

      if (error) throw error;

      if (data.success) {
        // Update local state
        if (deleteAllRead) {
          setNotifications(prev => prev.filter(n => !n.is_read));
        } else if (notificationId) {
          setNotifications(prev => prev.filter(n => n.id !== notificationId));
        }
        
        toast({
          title: "삭제 완료",
          description: "알림이 삭제되었습니다.",
        });
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      toast({
        title: "오류",
        description: "알림 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const createNotification = async (type: string, title: string, content?: string, data?: any) => {
    if (!user) return;

    try {
      const { data: response, error } = await supabase.functions.invoke('manage-notifications', {
        body: {
          action: 'create',
          type,
          title,
          content,
          data
        }
      });

      if (error) throw error;

      if (response.success) {
        setNotifications(prev => [response.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        return response.notification;
      }
    } catch (error) {
      console.error('Create notification error:', error);
      return null;
    }
  };

  // Set up realtime subscription for notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.content,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    deleteNotification,
    createNotification,
    reloadNotifications: () => loadNotifications()
  };
};