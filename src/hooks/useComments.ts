import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface Comment {
  id: string;
  content: string;
  author_id?: string;
  anonymous_author_id?: string;
  anonymous_author_name?: string;
  is_anonymous: boolean;
  parent_id?: string;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  like_count: number;
  is_hidden: boolean;
}

export const useComments = (contentType: 'news_article' | 'community_post', contentId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { requireAuth } = usePermissions();

  const loadComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-comments', {
        body: {
          action: 'get',
          content_type: contentType,
          content_id: contentId,
          limit: 100
        }
      });

      if (error) throw error;

      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Load comments error:', error);
      toast({
        title: "오류",
        description: "댓글을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [contentType, contentId]);

  const createComment = async (
    content: string,
    options?: {
      parent_id?: string;
      is_anonymous?: boolean;
      anonymous_author_name?: string;
    }
  ) => {
    if (!requireAuth('comment')) return null;

    try {
      setSubmitting(true);
      const { data, error } = await supabase.functions.invoke('manage-comments', {
        body: {
          action: 'create',
          content_type: contentType,
          content_id: contentId,
          content,
          ...options
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "댓글 작성 완료",
          description: "댓글이 성공적으로 작성되었습니다.",
        });
        await loadComments(); // Reload comments
        return data.comment;
      } else {
        throw new Error(data.message || '댓글 작성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Create comment error:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "댓글 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const updateComment = async (commentId: string, content: string) => {
    if (!requireAuth('comment')) return null;

    try {
      setSubmitting(true);
      const { data, error } = await supabase.functions.invoke('manage-comments', {
        body: {
          action: 'update',
          comment_id: commentId,
          content
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "댓글 수정 완료",
          description: "댓글이 성공적으로 수정되었습니다.",
        });
        await loadComments(); // Reload comments
        return data.comment;
      } else {
        throw new Error(data.message || '댓글 수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Update comment error:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "댓글 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!requireAuth('comment')) return null;

    try {
      setSubmitting(true);
      const { data, error } = await supabase.functions.invoke('manage-comments', {
        body: {
          action: 'delete',
          comment_id: commentId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "댓글 삭제 완료",
          description: "댓글이 성공적으로 삭제되었습니다.",
        });
        await loadComments(); // Reload comments
        return true;
      } else {
        throw new Error(data.message || '댓글 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "댓글 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Group comments by parent/child relationships
  const groupedComments = comments.reduce((acc, comment) => {
    if (!comment.parent_id) {
      // Top-level comment
      acc.push({
        ...comment,
        replies: comments.filter(c => c.parent_id === comment.id)
      });
    }
    return acc;
  }, [] as (Comment & { replies: Comment[] })[]);

  return {
    comments: groupedComments,
    loading,
    submitting,
    createComment,
    updateComment,
    deleteComment,
    reloadComments: loadComments
  };
};