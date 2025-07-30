import { useEffect, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export interface RealtimeUpdateHandlers {
  onNewsArticleUpdate?: (payload: any) => void
  onCommunityPostUpdate?: (payload: any) => void
  onCommentUpdate?: (payload: any) => void
  onLikeUpdate?: (payload: any) => void
  onBookmarkUpdate?: (payload: any) => void
  onNotificationUpdate?: (payload: any) => void
}

/**
 * Hook for handling real-time updates across the application
 * Uses Supabase realtime to listen for database changes
 */
export const useRealtimeUpdates = (handlers: RealtimeUpdateHandlers = {}) => {
  const { user } = useAuth()
  const channelsRef = useRef<any[]>([])

  useEffect(() => {
    if (!user) return

    const channels: any[] = []

    // Listen to news articles updates
    if (handlers.onNewsArticleUpdate) {
      const newsChannel = supabase
        .channel('news-articles-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'news_articles',
            filter: 'is_hidden=eq.false'
          },
          (payload) => {
            console.log('News article update:', payload)
            handlers.onNewsArticleUpdate?.(payload)
            
            if (payload.eventType === 'INSERT') {
              toast.info('새로운 뉴스가 업데이트되었습니다', {
                action: {
                  label: '확인',
                  onClick: () => window.location.reload()
                }
              })
            }
          }
        )
        .subscribe()
      
      channels.push(newsChannel)
    }

    // Listen to community posts updates
    if (handlers.onCommunityPostUpdate) {
      const communityChannel = supabase
        .channel('community-posts-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'community_posts',
            filter: 'is_hidden=eq.false'
          },
          (payload) => {
            console.log('Community post update:', payload)
            handlers.onCommunityPostUpdate?.(payload)
            
            if (payload.eventType === 'INSERT') {
              toast.info('새로운 커뮤니티 글이 등록되었습니다')
            }
          }
        )
        .subscribe()
      
      channels.push(communityChannel)
    }

    // Listen to comments updates
    if (handlers.onCommentUpdate) {
      const commentsChannel = supabase
        .channel('comments-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: 'is_hidden=eq.false'
          },
          (payload) => {
            console.log('Comment update:', payload)
            handlers.onCommentUpdate?.(payload)
          }
        )
        .subscribe()
      
      channels.push(commentsChannel)
    }

    // Listen to likes updates
    if (handlers.onLikeUpdate) {
      const likesChannel = supabase
        .channel('likes-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'likes'
          },
          (payload) => {
            console.log('Like update:', payload)
            handlers.onLikeUpdate?.(payload)
          }
        )
        .subscribe()
      
      channels.push(likesChannel)
    }

    // Listen to user's bookmarks updates
    if (handlers.onBookmarkUpdate && user) {
      const bookmarksChannel = supabase
        .channel('bookmarks-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Bookmark update:', payload)
            handlers.onBookmarkUpdate?.(payload)
          }
        )
        .subscribe()
      
      channels.push(bookmarksChannel)
    }

    // Listen to user's notifications
    if (handlers.onNotificationUpdate && user) {
      const notificationsChannel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Notification update:', payload)
            handlers.onNotificationUpdate?.(payload)
            
            if (payload.eventType === 'INSERT' && payload.new) {
              toast.info(payload.new.title, {
                description: payload.new.content,
                action: {
                  label: '확인',
                  onClick: () => {
                    // Mark notification as read
                    supabase
                      .from('notifications')
                      .update({ is_read: true })
                      .eq('id', payload.new.id)
                      .then(() => {
                        handlers.onNotificationUpdate?.({
                          ...payload,
                          new: { ...payload.new, is_read: true }
                        })
                      })
                  }
                }
              })
            }
          }
        )
        .subscribe()
      
      channels.push(notificationsChannel)
    }

    channelsRef.current = channels

    return () => {
      // Cleanup all channels
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
      channelsRef.current = []
    }
  }, [user, handlers])

  return {
    isConnected: channelsRef.current.length > 0
  }
}

/**
 * Hook specifically for real-time presence tracking
 * Useful for showing online users, typing indicators, etc.
 */
export const useRealtimePresence = (roomId: string, userStatus?: any) => {
  const { user } = useAuth()
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!user || !roomId) return

    const channel = supabase.channel(`presence-${roomId}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        console.log('Presence sync:', newState)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return

        if (userStatus) {
          const trackStatus = await channel.track({
            user_id: user.id,
            nickname: user.user_metadata?.nickname || 'Anonymous',
            ...userStatus,
            online_at: new Date().toISOString(),
          })
          console.log('Presence track status:', trackStatus)
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user, roomId, userStatus])

  const updatePresence = async (newStatus: any) => {
    if (channelRef.current && user) {
      return await channelRef.current.track({
        user_id: user.id,
        nickname: user.user_metadata?.nickname || 'Anonymous',
        ...newStatus,
        online_at: new Date().toISOString(),
      })
    }
  }

  const getPresenceState = () => {
    return channelRef.current?.presenceState() || {}
  }

  return {
    updatePresence,
    getPresenceState,
    isConnected: !!channelRef.current
  }
}