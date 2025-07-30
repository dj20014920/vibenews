import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Bookmark, Clock, Eye, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedAction, GuestPrompt } from "@/components/auth/ProtectedAction";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";

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

const News = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { canLike, canBookmark, requireAuth } = usePermissions();
  const { toast } = useToast();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('is_hidden', false)
        .order('published_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast({
        title: "오류",
        description: "뉴스를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (articleId: string) => {
    if (!requireAuth('like')) return;

    // TODO: 좋아요 기능 구현
    toast({
      title: "좋아요!",
      description: "기능 구현 예정입니다.",
    });
  };

  const handleBookmark = async (articleId: string) => {
    if (!requireAuth('bookmark')) return;

    // TODO: 북마크 기능 구현
    toast({
      title: "스크랩 완료",
      description: "기능 구현 예정입니다.",
    });
  };

  const handleShare = async (article: NewsArticle) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: window.location.href,
        });
      } catch (error) {
        // 사용자가 공유를 취소한 경우
      }
    } else {
      // Web Share API가 지원되지 않는 경우 클립보드에 복사
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
          <p className="text-muted-foreground">뉴스를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 space-y-6">
      {/* 헤더 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">바이브 코딩 뉴스</h1>
        <p className="text-muted-foreground">
          최신 AI 코딩 도구와 개발 트렌드를 확인하세요
        </p>
      </div>

      {/* 비회원 유도 메시지 */}
      <GuestPrompt 
        message="뉴스에 좋아요, 댓글, 스크랩하려면 회원가입하세요"
        actionText="무료 회원가입"
      />

      {/* 뉴스 목록 */}
      <div className="grid gap-6">
        {articles.map((article) => (
          <Card key={article.id} className="content-card group">
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
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <Link to={`/news/${article.id}`}>
                    <h2 className="text-xl font-semibold leading-tight group-hover:text-primary transition-colors cursor-pointer">
                      {article.title}
                    </h2>
                  </Link>
                  {article.source_url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={article.source_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>

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
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 요약 */}
              <p className="text-muted-foreground leading-relaxed">
                {article.summary}
              </p>

              {/* 액션 버튼들 */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-1">
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
                      onClick={() => handleLike(article.id)}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      {article.like_count}
                    </Button>
                  </ProtectedAction>

                  <ProtectedAction
                    fallback={
                      <Button variant="ghost" size="sm" disabled>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        댓글
                      </Button>
                    }
                  >
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      댓글
                    </Button>
                  </ProtectedAction>
                </div>

                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleShare(article)}
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
                      onClick={() => handleBookmark(article.id)}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </ProtectedAction>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">아직 등록된 뉴스가 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default News;