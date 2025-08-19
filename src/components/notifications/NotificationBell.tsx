import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell, Check, CheckCheck, Heart, MessageCircle, TrendingUp, User } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'news' | 'system'
  title: string
  message: string
  is_read: boolean
  created_at: string
  action_url?: string
}

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    try {
      // notifications 테이블이 없을 수 있으므로 edge function 사용
      const { data, error } = await supabase.functions.invoke('manage-notifications', {
        body: { action: 'get', limit: 10 }
      });

      if (error || !data.success) {
        console.error('Error loading notifications:', error);
        // 에러 시 빈 배열로 설정
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // notifications 데이터 변환
      const formattedNotifications: Notification[] = (data.notifications || []).map((notification: any) => ({
        id: notification.id,
        type: (notification.type as Notification['type']) || 'system',
        title: notification.title,
        message: notification.content || '',
        is_read: notification.is_read,
        created_at: notification.created_at,
        action_url: notification.data?.action_url || '/'
      }));

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      // edge function을 통해 알림을 읽음으로 표시
      const { data, error } = await supabase.functions.invoke('manage-notifications', {
        body: { action: 'mark_read', notification_id: notificationId }
      });

      if (error || !data?.success) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // edge function을 통해 모든 미읽은 알림을 읽음으로 표시
      const { data, error } = await supabase.functions.invoke('manage-notifications', {
        body: { action: 'mark_read', mark_all: true }
      });

      if (error || !data?.success) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      // 로컬 상태 업데이트
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'follow':
        return <User className="h-4 w-4 text-green-500" />
      case 'news':
        return <TrendingUp className="h-4 w-4 text-purple-500" />
      case 'system':
        return <Bell className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return '방금 전'
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`
    return `${Math.floor(diffInMinutes / 1440)}일 전`
  }

  if (!user) return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">알림</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                모두 읽음
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">알림이 없습니다</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <Card 
                    key={notification.id}
                    className={cn(
                      "p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      !notification.is_read && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                    )}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id)
                      }
                      if (notification.action_url) {
                        setIsOpen(false)
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium">{notification.title}</h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="text-center pt-2 border-t">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/notifications" onClick={() => setIsOpen(false)}>
                  모든 알림 보기
                </Link>
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}