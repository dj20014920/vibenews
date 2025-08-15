import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Eye, ExternalLink, RefreshCw, Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source_url: string;
  thumbnail?: string;
  tags: string[];
  author?: string;
  published_at: string;
  like_count: number;
  view_count: number;
  is_featured: boolean;
}

interface InfiniteNewsListProps {
  searchQuery?: string;
  selectedTags?: string[];
  sortBy?: 'latest' | 'popular' | 'trending';
}

const ITEMS_PER_PAGE = 10;

export function InfiniteNewsList({ searchQuery, selectedTags, sortBy = 'latest' }: InfiniteNewsListProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const { requireAuth } = usePermissions();

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const fetchArticles = useCallback(async (pageNum: number, reset = false) => {
    try {
      setLoading(pageNum === 0);

      let query = supabase
        .from('news_articles')
        .select('*')
        .eq('is_hidden', false)
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

      // 검색 필터링
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%, summary.ilike.%${searchQuery}%`);
      }

      // 태그 필터링
      if (selectedTags && selectedTags.length > 0) {
        query = query.overlaps('tags', selectedTags);
      }

      // 정렬
      switch (sortBy) {
        case 'popular':
          query = query.order('like_count', { ascending: false });
          break;
        case 'trending':
          query = query.order('view_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      if (reset) {
        setArticles(data || []);
      } else {
        setArticles(prev => [...prev, ...(data || [])]);
      }

      // 사용자 북마크 동기화 (현재 페이지의 기사들만 조회)
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user && data && data.length > 0) {
        const ids = data.map((a) => a.id);
        const { data: marks, error: bmError } = await supabase
          .from('bookmarks')
          .select('article_id')
          .eq('user_id', user.id)
          .in('article_id', ids);
        if (!bmError) {
          setBookmarkedIds((prev) => {
            const s = reset ? new Set<string>() : new Set(prev);
            marks?.forEach((m: any) => s.add(m.article_id));
            return s;
          });
        }
      }

      setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: "오류",
        description: "뉴스를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedTags, sortBy]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await fetchArticles(0, true);
  };

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchArticles(nextPage);
    }
  }, [loading, hasMore, page, fetchArticles]);

  // 초기 로딩 및 필터 변경 시 리셋
  useEffect(() => {
    setPage(0);
    setArticles([]);
    fetchArticles(0, true);
  }, [searchQuery, selectedTags, sortBy]);

  // 무한 스크롤 트리거
  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView, loadMore]);

  const handleLike = async (articleId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "로그인 필요",
          description: "좋아요를 누르려면 로그인이 필요합니다.",
        });
        return;
      }

      // 좋아요 토글 로직
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('article_id', articleId)
        .maybeSingle();

      if (existingLike) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', articleId);
      } else {
        await supabase
          .from('likes')
          .insert({ user_id: user.id, article_id: articleId });
      }

      // UI 업데이트
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, like_count: existingLike ? article.like_count - 1 : article.like_count + 1 }
          : article
      ));

    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        title: "오류",
        description: "좋아요 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 조회수는 상세 페이지에서만 증가 처리하여 중복/경합 방지

  const handleBookmark = async (articleId: string) => {
    if (!requireAuth('bookmark')) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isBookmarked = bookmarkedIds.has(articleId);
      if (isBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', articleId);
        setBookmarkedIds((prev) => {
          const s = new Set(prev);
          s.delete(articleId);
          return s;
        });
        toast({ title: '북마크 취소', description: '북마크를 취소했습니다.' });
      } else {
        await supabase
          .from('bookmarks')
          .insert({ user_id: user.id, article_id: articleId });
        setBookmarkedIds((prev) => new Set(prev).add(articleId));
        toast({ title: '북마크 완료', description: '북마크에 저장했습니다.' });
      }
    } catch (error) {
      console.error('Error handling bookmark:', error);
      toast({ title: '오류', description: '북마크 처리 중 오류가 발생했습니다.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* 새로고침 버튼 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {searchQuery ? `"${searchQuery}" 검색 결과` : '최신 뉴스'}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 뉴스 리스트 */}
      <div className="space-y-4">
        {articles.map((article) => (
          <Card key={article.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight hover:text-primary cursor-pointer">
                    <a 
                      href={`/news/${article.id}`}
                    >
                      {article.title}
                    </a>
                  </CardTitle>
                  {article.is_featured && (
                    <Badge variant="secondary" className="mt-2">
                      추천
                    </Badge>
                  )}
                </div>
                {article.thumbnail && (
                  <img
                    src={article.thumbnail}
                    alt={article.title}
                    className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-muted-foreground mb-4 line-clamp-2">
                {article.summary}
              </p>
              
              {/* 태그 */}
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {article.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{article.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
              {/* 메타 정보 및 액션 */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{article.view_count.toLocaleString()}</span>
                  </div>
                  
                  <button
                    onClick={() => handleLike(article.id)}
                    className="flex items-center gap-1 hover:text-red-500 transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    <span>{article.like_count}</span>
                  </button>
                  
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>댓글</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBookmark(article.id)}
                    className={`flex items-center gap-1 transition-colors ${bookmarkedIds.has(article.id) ? 'text-primary' : 'hover:text-primary'}`}
                    aria-label={bookmarkedIds.has(article.id) ? '북마크 취소' : '북마크'}
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                  <span>{new Date(article.published_at).toLocaleDateString()}</span>
                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>원문</span>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* 로딩 스켈레톤 */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 더보기 트리거 */}
        <div ref={loadMoreRef} className="h-10" />

        {/* 끝 메시지 */}
        {!hasMore && articles.length > 0 && (
          <div className="text-center text-muted-foreground py-4">
            모든 뉴스를 불러왔습니다.
          </div>
        )}
      </div>
    </div>
  );
}