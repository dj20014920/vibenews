import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

export const useContentActions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { requireAuth } = usePermissions();

  const likeContent = async (contentType: 'news_article' | 'community_post' | 'comment', contentId: string) => {
    if (!requireAuth('like')) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('like-content', {
        body: {
          content_type: contentType,
          content_id: contentId,
          action: 'like'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "좋아요!",
          description: "좋아요를 눌렀습니다.",
        });
        return data;
      } else {
        throw new Error(data.message || '좋아요 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Like error:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "좋아요 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const unlikeContent = async (contentType: 'news_article' | 'community_post' | 'comment', contentId: string) => {
    if (!requireAuth('like')) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('like-content', {
        body: {
          content_type: contentType,
          content_id: contentId,
          action: 'unlike'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "좋아요 취소",
          description: "좋아요를 취소했습니다.",
        });
        return data;
      } else {
        throw new Error(data.message || '좋아요 취소 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Unlike error:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "좋아요 취소 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const bookmarkContent = async (
    contentType: 'news_article' | 'community_post', 
    contentId: string,
    options?: {
      folder_name?: string;
      notes?: string;
      tags?: string[];
    }
  ) => {
    if (!requireAuth('bookmark')) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('bookmark-content', {
        body: {
          content_type: contentType,
          content_id: contentId,
          action: 'bookmark',
          ...options
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "스크랩 완료",
          description: "콘텐츠를 스크랩했습니다.",
        });
        return data;
      } else {
        throw new Error(data.message || '스크랩 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "스크랩 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const unbookmarkContent = async (contentType: 'news_article' | 'community_post', contentId: string) => {
    if (!requireAuth('bookmark')) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('bookmark-content', {
        body: {
          content_type: contentType,
          content_id: contentId,
          action: 'unbookmark'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "스크랩 취소",
          description: "스크랩을 취소했습니다.",
        });
        return data;
      } else {
        throw new Error(data.message || '스크랩 취소 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Unbookmark error:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "스크랩 취소 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reportContent = async (
    contentType: 'news_article' | 'community_post' | 'comment',
    contentId: string,
    reason: string,
    details?: any,
    reportedUserId?: string
  ) => {
    if (!requireAuth('report')) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('submit-report', {
        body: {
          content_type: contentType,
          content_id: contentId,
          reason,
          report_details: details,
          reported_user_id: reportedUserId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "신고 완료",
          description: data.message || "신고가 접수되었습니다. 빠른 시일 내에 검토하겠습니다.",
        });
        return data;
      } else {
        throw new Error(data.message || '신고 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Report error:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "신고 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const trackView = async (contentType: 'news_article' | 'community_post', contentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('track-views', {
        body: {
          content_type: contentType,
          content_id: contentId
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Track view error:', error);
      // Don't show error toast for view tracking
      return null;
    }
  };

  return {
    likeContent,
    unlikeContent,
    bookmarkContent,
    unbookmarkContent,
    reportContent,
    trackView,
    loading
  };
};