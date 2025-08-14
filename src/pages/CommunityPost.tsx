import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, Clock, Eye, Pin, Star, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedAction, GuestPrompt } from "@/components/auth/ProtectedAction";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


interface CommunityPost {
  id: string;
  title: string;
  content: string;
  content_simplified?: string;
  author_id?: string;
  anonymous_author_id?: string;
  is_anonymous: boolean;
  tags: string[];
  tools_used: string[];
  created_at: string;
  updated_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_featured: boolean;
  is_pinned: boolean;
  author?: {
    nickname: string;
    avatar_url?: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id?: string;
  anonymous_author_id?: string;
  is_anonymous: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  like_count: number;
  parent_id?: string;
  author?: {
    nickname: string;
    avatar_url?: string;
  };
  replies: { count: number }[];
}

const CommunityPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const { canLike, canComment, canBookmark, requireAuth } = usePermissions();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadPost();
      loadComments();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      const { data, error } = await supabase
        .from('v_community_posts')
        .select(`
          *,
          author:users(nickname, avatar_url)
        `)
        .eq('id', id)
        .eq('is_hidden', false)
        .single();

      if (error) throw error;
      if (data) {
        const postWithAuthor = {
          ...data,
          author_id: data.author_id_visible, // Use the visible author_id from the view
          author: data.author || { nickname: '익명', avatar_url: '' }
        };
        setPost(postWithAuthor);
        // Securely increment view count via RPC
        await supabase.rpc('increment_view_count', { content_type: 'community_post', content_id: id });
      }
    } catch (error) {
      console.error('Error loading post:', error);
      toast({
        title: "오류",
        description: "게시글을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('v_comments')
        .select(`
          *,
          author:users(nickname, avatar_url),
          replies:comments(count)
        `)
        .eq('post_id', id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const commentsWithAuthor = data?.map(comment => ({
        ...comment,
        author_id: comment.author_id_visible, // Use the visible author_id from the view
        author: comment.author || { nickname: '익명', avatar_url: '' }
      })) || [];
      setComments(commentsWithAuthor);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!requireAuth('like') || !post) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        await supabase.from('likes').delete().match({ id: existingLike.id });
        setPost(p => p ? { ...p, like_count: p.like_count - 1 } : null);
        toast({ title: "좋아요 취소" });
      } else {
        await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
        setPost(p => p ? { ...p, like_count: p.like_count + 1 } : null);
        toast({ title: "좋아요!" });
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        title: "오류",
        description: "좋아요 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleBookmark = async () => {
    if (!requireAuth('bookmark') || !post) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: existingBookmark } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingBookmark) {
        await supabase.from('bookmarks').delete().match({ id: existingBookmark.id });
        toast({ title: "북마크 취소" });
      } else {
        await supabase.from('bookmarks').insert({ post_id: post.id, user_id: user.id, tags: post.tags });
        toast({ title: "북마크 완료" });
      }
    } catch (error) {
      console.error('Error handling bookmark:', error);
      toast({
        title: "오류",
        description: "북마크 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleCommentSubmit = async () => {
    if (!requireAuth('comment') || !newComment.trim() || !post) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          post_id: post.id,
          author_id: isAnonymous ? null : user.id,
          anonymous_author_id: isAnonymous ? `익명_${user.id.slice(0, 8)}` : null,
          is_anonymous: isAnonymous,
        });
      setNewComment("");
      loadComments(); // The trigger will update the count, so we just need to reload.
      toast({ title: "댓글 작성 완료" });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "오류",
        description: "댓글 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    try {
      const { error } = await supabase.rpc('delete_post_and_comments', { post_id_in: post.id });
      if (error) throw error;
      toast({ title: "게시글 삭제 완료", description: "게시글과 관련 댓글이 모두 삭제되었습니다." });
      navigate('/community');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({ title: "삭제 실패", description: "게시글 삭제 중 오류가 발생했습니다.", variant: 'destructive' });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', commentId);
      if (error) throw error;
      loadComments(); // Reload comments to show the "deleted" state
      toast({ title: "댓글 삭제 완료" });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({ title: "삭제 실패", description: "댓글 삭제 중 오류가 발생했습니다.", variant: 'destructive' });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.content.slice(0, 100),
          url: window.location.href,
        });
      } catch (error) {
        // 사용자가 공유를 취소한 경우
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "링크 복사됨",
        description: "링크가 클립보드에 복사되었습니다.",
      });
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container-custom py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">게시글을 찾을 수 없습니다</h1>
          <Button asChild>
            <Link to="/community">
              <ArrowLeft className="h-4 w-4 mr-2" />
              커뮤니티로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 space-y-6">
      {/* 뒤로 가기 버튼 */}
      <Button variant="ghost" asChild>
        <Link to="/community">
          <ArrowLeft className="h-4 w-4 mr-2" />
          커뮤니티로
        </Link>
      </Button>

      {/* 게시글 본문 */}
      <Card className="content-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                {post.is_anonymous ? "익" : post.author?.nickname?.charAt(0) || "U"}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {post.is_anonymous ? "익명 사용자" : post.author?.nickname || "사용자"}
                </p>
                <div className="flex items-center text-xs text-muted-foreground space-x-2">
                  <span>{new Date(post.created_at).toLocaleString('ko-KR')}</span>
                  <div className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    {post.view_count.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {post.is_pinned && <Pin className="h-4 w-4 text-muted-foreground" />}
              {post.is_featured && <Star className="h-4 w-4 text-yellow-500" />}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold leading-tight">{post.title}</h1>
            {user?.id === post.author_id && (
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" disabled={post.comment_count > 0} title={post.comment_count > 0 ? "댓글이 달려 수정할 수 없습니다." : "수정"}>
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="삭제">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>정말로 게시글을 삭제하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        이 작업은 되돌릴 수 없습니다. 게시글과 모든 댓글이 영구적으로 삭제됩니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeletePost}>삭제</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
          
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="tag-secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* 본문 */}
            <div className="prose max-w-none">
              <div style={{ whiteSpace: 'pre-wrap' }}>{post.content}</div>
            </div>
            
            {/* 사용 도구 */}
            {post.tools_used.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">사용한 도구:</p>
                <div className="flex flex-wrap gap-2">
                  {post.tools_used.map((tool, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* 액션 버튼들 */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <ProtectedAction
                  fallback={
                    <Button variant="ghost" size="sm" disabled>
                      <Heart className="h-4 w-4 mr-2" />
                      {post.like_count}
                    </Button>
                  }
                >
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleLike}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    {post.like_count}
                  </Button>
                </ProtectedAction>

                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  댓글 {comments.filter(c => !c.is_deleted).length}
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  공유
                </Button>

                <ProtectedAction
                  fallback={
                    <Button variant="ghost" size="sm" disabled>
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  }
                >
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleBookmark}
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </ProtectedAction>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <div id="comments" className="space-y-6">
        <h2 className="text-2xl font-bold">댓글 {comments.filter(c => !c.is_deleted).length}개</h2>

        <GuestPrompt 
          message="댓글을 작성하려면 로그인하세요"
          actionText="로그인하기"
        />

        <ProtectedAction>
          <Card>
            <CardContent className="p-4 space-y-4">
              <Textarea
                placeholder="댓글을 작성하세요..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">익명으로 작성</span>
                </label>
                <Button 
                  onClick={handleCommentSubmit}
                  disabled={!newComment.trim()}
                >
                  댓글 작성
                </Button>
              </div>
            </CardContent>
          </Card>
        </ProtectedAction>

        <div className="space-y-4">
          {comments.map((comment) => (
            comment.is_deleted ? (
              <Card key={comment.id} className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground italic">삭제된 댓글입니다.</p>
                </CardContent>
              </Card>
            ) : (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {comment.is_anonymous ? "익" : comment.author?.nickname?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-medium">
                        {comment.is_anonymous ? "익명 사용자" : comment.author?.nickname || "사용자"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                   {user?.id === comment.author_id && (
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" disabled={comment.replies[0]?.count > 0} title={comment.replies[0]?.count > 0 ? "답글이 달려 수정할 수 없습니다." : "수정"}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="삭제">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>정말로 댓글을 삭제하시겠습니까?</AlertDialogTitle>
                            <AlertDialogDescription>
                              이 작업은 되돌릴 수 없습니다. 댓글 내용이 "삭제된 댓글입니다."로 변경됩니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>삭제</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
                <p className="text-sm leading-relaxed mb-3">{comment.content}</p>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Heart className="h-3 w-3 mr-1" />
                    {comment.like_count}
                  </Button>
                  <Button variant="ghost" size="sm">
                    답글
                  </Button>
                </div>
              </CardContent>
            </Card>
            )
          ))}
        </div>

        {comments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPost;