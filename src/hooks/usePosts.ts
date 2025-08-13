import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface CreatePostData {
  title: string;
  content: string;
  tags?: string[];
  tools_used?: string[];
  is_anonymous?: boolean;
  anonymous_author_name?: string;
}

interface UpdatePostData {
  title?: string;
  content?: string;
  tags?: string[];
  tools_used?: string[];
}

export const usePosts = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { requireAuth } = usePermissions();

  const createPost = async (postData: CreatePostData) => {
    if (!requireAuth('write')) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-posts', {
        body: {
          action: 'create',
          ...postData
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "게시글 작성 완료",
          description: "게시글이 성공적으로 작성되었습니다.",
        });
        return data.post;
      } else {
        throw new Error(data.message || '게시글 작성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Create post error:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "게시글 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async (postId: string, updateData: UpdatePostData) => {
    if (!requireAuth('write')) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-posts', {
        body: {
          action: 'update',
          post_id: postId,
          ...updateData
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "게시글 수정 완료",
          description: "게시글이 성공적으로 수정되었습니다.",
        });
        return data.post;
      } else {
        throw new Error(data.message || '게시글 수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Update post error:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "게시글 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!requireAuth('write')) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-posts', {
        body: {
          action: 'delete',
          post_id: postId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "게시글 삭제 완료",
          description: "게시글이 성공적으로 삭제되었습니다.",
        });
        return true;
      } else {
        throw new Error(data.message || '게시글 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Delete post error:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "게시글 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getPost = async (postId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-posts', {
        body: {
          action: 'get',
          post_id: postId
        }
      });

      if (error) throw error;

      if (data.success) {
        return data.post;
      } else {
        throw new Error(data.message || '게시글을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Get post error:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "게시글을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createPost,
    updatePost,
    deletePost,
    getPost,
    loading
  };
};