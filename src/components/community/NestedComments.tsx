import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnonymousToggle } from '@/components/ui/anonymous-toggle';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageSquare, MoreHorizontal, Flag, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  anonymous_author_id: string | null;
  is_anonymous: boolean;
  anonymous_author_name: string | null;
  like_count: number;
  parent_id: string | null;
  is_edited: boolean;
  is_hidden: boolean;
  author?: {
    nickname: string;
    avatar_url: string | null;
  };
  children?: Comment[];
  user_liked?: boolean;
}

interface NestedCommentsProps {
  postId?: string;
  articleId?: string;
  maxDepth?: number;
}

export const NestedComments: React.FC<NestedCommentsProps> = ({
  postId,
  articleId,
  maxDepth = 20
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const { requireAuth, showAuthPrompt } = usePermissions();
  const { toast } = useToast();

  const contentId = postId || articleId;
  const contentType = postId ? 'post' : 'article';

  // 댓글 로드
  const loadComments = async () => {
    if (!contentId) return;

    try {
      setLoading(true);
      
      // 댓글과 작성자 정보를 함께 조회
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:users!left(nickname, avatar_url)
        `)
        .eq(postId ? 'post_id' : 'article_id', contentId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // 좋아요 상태 확인 (로그인된 사용자만)
      let likesData: any[] = [];
      if (user && commentsData?.length) {
        const { data } = await supabase
          .from('likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentsData.map(c => c.id));
        
        likesData = data || [];
      }

      // 댓글을 트리 구조로 변환
      const commentsWithLikes = commentsData?.map(comment => ({
        ...comment,
        user_liked: likesData.some(like => like.comment_id === comment.id)
      })) || [];

      const nestedComments = buildCommentTree(commentsWithLikes, maxDepth);
      setComments(nestedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "댓글 로딩 실패",
        description: "댓글을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 댓글 트리 구조 생성
  const buildCommentTree = (comments: Comment[], maxDepth: number, parentId: string | null = null, currentDepth = 0): Comment[] => {
    if (currentDepth >= maxDepth) return [];

    return comments
      .filter(comment => comment.parent_id === parentId)
      .map(comment => ({
        ...comment,
        children: buildCommentTree(comments, maxDepth, comment.id, currentDepth + 1)
      }));
  };

  // 댓글 작성
  const handleSubmitComment = async (parentId: string | null = null) => {
    if (!requireAuth('comment')) return;
    if (!newComment.trim()) {
      toast({
        title: "내용을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const commentData = {
        content: newComment.trim(),
        author_id: user!.id,
        is_anonymous: isAnonymous,
        anonymous_author_name: isAnonymous ? `익명${Math.floor(Math.random() * 9999)}` : null,
        parent_id: parentId,
        ...(postId ? { post_id: postId } : { article_id: articleId })
      };

      const { error } = await supabase
        .from('comments')
        .insert(commentData);

      if (error) throw error;

      setNewComment('');
      setReplyingTo(null);
      setIsAnonymous(false);
      
      toast({
        title: "댓글이 등록되었습니다",
      });

      // 댓글 목록 새로고침
      loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "댓글 등록 실패",
        description: "댓글을 등록하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 좋아요 토글
  const handleLikeToggle = async (commentId: string, isLiked: boolean) => {
    if (!requireAuth('like')) return;

    try {
      if (isLiked) {
        // 좋아요 취소
        await supabase
          .from('likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user!.id);
      } else {
        // 좋아요 추가
        await supabase
          .from('likes')
          .insert({
            comment_id: commentId,
            user_id: user!.id
          });
      }

      // 상태 업데이트
      setComments(prevComments => 
        updateCommentInTree(prevComments, commentId, (comment) => ({
          ...comment,
          like_count: comment.like_count + (isLiked ? -1 : 1),
          user_liked: !isLiked
        }))
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "좋아요 처리 실패",
        variant: "destructive",
      });
    }
  };

  // 댓글 신고
  const handleReport = async (commentId: string) => {
    if (!requireAuth('report')) return;

    try {
      await supabase
        .from('reports')
        .insert({
          comment_id: commentId,
          reporter_id: user!.id,
          reason: '부적절한 댓글',
          report_type: 'comment'
        });

      toast({
        title: "신고가 접수되었습니다",
        description: "관리자가 검토 후 조치할 예정입니다.",
      });
    } catch (error) {
      console.error('Error reporting comment:', error);
      toast({
        title: "신고 실패",
        variant: "destructive",
      });
    }
  };

  // 트리에서 댓글 업데이트
  const updateCommentInTree = (comments: Comment[], commentId: string, updateFn: (comment: Comment) => Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return updateFn(comment);
      }
      if (comment.children) {
        return {
          ...comment,
          children: updateCommentInTree(comment.children, commentId, updateFn)
        };
      }
      return comment;
    });
  };

  // 댓글 렌더링
  const renderComment = (comment: Comment, depth: number = 0) => {
    const authorName = comment.is_anonymous 
      ? comment.anonymous_author_name || '익명' 
      : comment.author?.nickname || '알 수 없음';

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 pl-4 border-l border-border' : ''}`}>
        <div className="flex space-x-3 p-4 bg-card rounded-lg">
          <Avatar className="h-8 w-8">
            {!comment.is_anonymous && comment.author?.avatar_url ? (
              <AvatarImage src={comment.author.avatar_url} />
            ) : null}
            <AvatarFallback>
              {comment.is_anonymous ? '익' : authorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{authorName}</span>
              {comment.is_anonymous && (
                <Badge variant="secondary" className="text-xs">익명</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { 
                  addSuffix: true,
                  locale: ko 
                })}
              </span>
              {comment.is_edited && (
                <Badge variant="outline" className="text-xs">수정됨</Badge>
              )}
            </div>
            
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 text-xs ${comment.user_liked ? 'text-red-500' : ''}`}
                onClick={() => handleLikeToggle(comment.id, comment.user_liked || false)}
              >
                <Heart className={`h-3 w-3 mr-1 ${comment.user_liked ? 'fill-current' : ''}`} />
                {comment.like_count || 0}
              </Button>
              
              {depth < maxDepth - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  답글
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleReport(comment.id)}>
                    <Flag className="h-3 w-3 mr-2" />
                    신고
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* 답글 작성 폼 */}
            {replyingTo === comment.id && (
              <div className="mt-4 space-y-3">
                <Textarea
                  placeholder="답글을 입력하세요..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <AnonymousToggle
                    isAnonymous={isAnonymous}
                    onToggle={setIsAnonymous}
                  />
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(null);
                        setNewComment('');
                        setIsAnonymous(false);
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSubmitComment(comment.id)}
                      disabled={submitting || !newComment.trim()}
                    >
                      {submitting ? '등록 중...' : '답글 달기'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 대댓글 렌더링 */}
        {comment.children && comment.children.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.children.map(child => renderComment(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (contentId) {
      loadComments();
    }
  }, [contentId, user]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex space-x-3 p-4">
              <div className="w-8 h-8 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 새 댓글 작성 */}
      {!replyingTo && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            댓글 {comments.length}개
          </h3>
          
          <div className="space-y-3">
            <Textarea
              placeholder={user ? "댓글을 입력하세요..." : "댓글을 작성하려면 로그인이 필요합니다."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              disabled={!user}
            />
            
            {user && (
              <div className="flex items-center justify-between">
                <AnonymousToggle
                  isAnonymous={isAnonymous}
                  onToggle={setIsAnonymous}
                />
                <Button
                  onClick={() => handleSubmitComment()}
                  disabled={submitting || !newComment.trim()}
                >
                  {submitting ? '등록 중...' : '댓글 등록'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            첫 번째 댓글을 남겨보세요!
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
};