import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, Clock, Eye, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedAction, GuestPrompt } from "@/components/auth/ProtectedAction";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import TermDetector from "@/components/glossary/TermDetector";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  content_simplified?: string;
  summary: string;
  source_url: string;
  thumbnail?: string;
  author?: string;
  tags: string[];
  published_at: string;
  view_count: number;
  like_count: number;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id?: string;
  anonymous_author_id?: string;
  is_anonymous: boolean;
  like_count: number;
  parent_id?: string;
  author?: {
    nickname: string;
    avatar_url?: string;
  };
}

const NewsDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [simplifiedMode, setSimplifiedMode] = useState(false);
  const { canLike, canComment, canBookmark, requireAuth } = usePermissions();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadArticle();
      loadComments();
    }
  }, [id]);

  const loadArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('id', id)
        .eq('is_hidden', false)
        .single();

      if (error) throw error;
      if (data) {
        setArticle(data);
        // 조회수 증가
        await supabase
          .from('news_articles')
          .update({ view_count: data.view_count + 1 })
          .eq('id', id);
      }
    } catch (error) {
      console.error('Error loading article:', error);
      toast({
        title: "오류",
        description: "기사를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:users(nickname, avatar_url)
        `)
        .eq('article_id', id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!requireAuth('like') || !article) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 이미 좋아요 했는지 확인
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('article_id', article.id)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // 좋아요 취소
        await supabase
          .from('likes')
          .delete()
          .eq('article_id', article.id)
          .eq('user_id', user.id);
        
        toast({
          title: "좋아요 취소",
          description: "좋아요를 취소했습니다.",
        });
      } else {
        // 좋아요 추가
        await supabase
          .from('likes')
          .insert({
            article_id: article.id,
            user_id: user.id,
          });

        toast({
          title: "좋아요!",
          description: "좋아요를 눌렀습니다.",
        });
      }

      // 기사 다시 로드하여 좋아요 수 업데이트
      loadArticle();
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
    if (!requireAuth('bookmark') || !article) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 이미 북마크 했는지 확인
      const { data: existingBookmark } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('article_id', article.id)
        .eq('user_id', user.id)
        .single();

      if (existingBookmark) {
        // 북마크 취소
        await supabase
          .from('bookmarks')
          .delete()
          .eq('article_id', article.id)
          .eq('user_id', user.id);
        
        toast({
          title: "북마크 취소",
          description: "북마크를 취소했습니다.",
        });
      } else {
        // 북마크 추가
        await supabase
          .from('bookmarks')
          .insert({
            article_id: article.id,
            user_id: user.id,
            tags: article.tags,
          });

        toast({
          title: "북마크 완료",
          description: "북마크에 저장했습니다.",
        });
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
    if (!requireAuth('comment') || !newComment.trim() || !article) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          article_id: article.id,
          author_id: isAnonymous ? null : user.id,
          anonymous_author_id: isAnonymous ? `익명_${user.id.slice(0, 8)}` : null,
          is_anonymous: isAnonymous,
        });

      setNewComment("");
      loadComments();
      toast({
        title: "댓글 작성 완료",
        description: "댓글이 작성되었습니다.",
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "오류",
        description: "댓글 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.summary,
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
          <p className="text-muted-foreground">기사를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container-custom py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">기사를 찾을 수 없습니다</h1>
          <Button asChild>
            <Link to="/news">
              <ArrowLeft className="h-4 w-4 mr-2" />
              뉴스 목록으로 돌아가기
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
        <Link to="/news">
          <ArrowLeft className="h-4 w-4 mr-2" />
          뉴스 목록으로
        </Link>
      </Button>

      {/* 기사 본문 */}
      <Card className="content-card">
        <CardHeader className="space-y-4">
          {/* 썸네일 */}
          {article.thumbnail && (
            <div className="relative overflow-hidden rounded-lg">
              <img 
                src={article.thumbnail} 
                alt={article.title}
                className="content-image"
              />
            </div>
          )}

          {/* 제목과 메타 정보 */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold leading-tight">{article.title}</h1>

            {/* 태그 */}
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="tag-secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* 메타 정보 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-muted-foreground space-x-4">
                {article.author && (
                  <span>작성자: {article.author}</span>
                )}
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(article.published_at).toLocaleDateString('ko-KR')}
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {article.view_count.toLocaleString()}
                </div>
              </div>

              {article.source_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={article.source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    원문 보기
                  </a>
                </Button>
              )}
            </div>

            {/* 콘텐츠 모드 토글 */}
            {article.content_simplified && (
              <div className="flex items-center space-x-2">
                <Button
                  variant={simplifiedMode ? "outline" : "default"}
                  size="sm"
                  onClick={() => setSimplifiedMode(false)}
                >
                  개발자 모드
                </Button>
                <Button
                  variant={simplifiedMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSimplifiedMode(true)}
                >
                  비개발자 모드
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 요약 */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">요약</h3>
            <TermDetector 
              text={article.summary} 
              contentType="article" 
              contentId={article.id} 
            />
          </div>

          {/* 본문 */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <TermDetector 
              text={simplifiedMode && article.content_simplified 
                ? article.content_simplified 
                : article.content} 
              contentType="article" 
              contentId={article.id} 
            />
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center space-x-2">
              <ProtectedAction
                fallback={
                  <Button variant="ghost" size="sm" disabled>
                    <Heart className="h-4 w-4 mr-2" />
                    {article.like_count}
                  </Button>
                }
              >
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLike}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  {article.like_count}
                </Button>
              </ProtectedAction>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                댓글 {comments.length}
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
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <div id="comments" className="space-y-6">
        <h2 className="text-2xl font-bold">댓글 {comments.length}개</h2>

        {/* 비회원 유도 메시지 */}
        <GuestPrompt 
          message="댓글을 작성하려면 로그인하세요"
          actionText="로그인하기"
        />

        {/* 댓글 작성 */}
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

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {comments.map((comment) => (
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

export default NewsDetail;