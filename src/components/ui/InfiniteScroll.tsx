import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface InfiniteScrollProps<T> {
  fetchData: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean; total?: number }>;
  renderItem: (item: T, index: number) => React.ReactNode;
  pageSize?: number;
  mode?: 'infinite' | 'pagination';
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  threshold?: number; // 무한 스크롤 트리거 임계값 (px)
}

export function InfiniteScroll<T extends { id: string }>({
  fetchData,
  renderItem,
  pageSize = 20,
  mode = 'infinite',
  className = '',
  loadingComponent,
  emptyComponent,
  errorComponent,
  threshold = 200
}: InfiniteScrollProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const isInitialMount = useRef(true);

  // 데이터 로딩 함수
  const loadData = useCallback(async (page: number, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      const result = await fetchData(page, pageSize);
      
      if (append) {
        setItems(prev => [...prev, ...result.data]);
      } else {
        setItems(result.data);
      }
      
      setHasMore(result.hasMore);
      setTotal(result.total);
      
      if (result.hasMore && mode === 'infinite') {
        setCurrentPage(page + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [fetchData, pageSize, mode]);

  // 초기 데이터 로드
  useEffect(() => {
    if (isInitialMount.current) {
      loadData(1);
      isInitialMount.current = false;
    }
  }, [loadData]);

  // 무한 스크롤 옵저버 설정
  useEffect(() => {
    if (mode !== 'infinite') return;

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
        loadData(currentPage, true);
      }
    };

    if (loadingRef.current) {
      observerRef.current = new IntersectionObserver(handleObserver, {
        threshold: 0,
        rootMargin: `${threshold}px`
      });
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [mode, hasMore, isLoadingMore, isLoading, currentPage, loadData, threshold]);

  // 페이지네이션 모드 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadData(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = total ? Math.ceil(total / pageSize) : 0;

  // 로딩 컴포넌트
  const defaultLoadingComponent = (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-6 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // 빈 상태 컴포넌트
  const defaultEmptyComponent = (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="text-muted-foreground">
          <div className="text-lg font-medium mb-2">데이터가 없습니다</div>
          <div className="text-sm">표시할 항목이 없습니다.</div>
        </div>
      </CardContent>
    </Card>
  );

  // 에러 컴포넌트
  const defaultErrorComponent = (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="text-destructive">
          <div className="text-lg font-medium mb-2">오류가 발생했습니다</div>
          <div className="text-sm mb-4">{error}</div>
          <Button onClick={() => loadData(currentPage)} variant="outline">
            다시 시도
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (error && items.length === 0) {
    return errorComponent || defaultErrorComponent;
  }

  if (isLoading && items.length === 0) {
    return loadingComponent || defaultLoadingComponent;
  }

  if (items.length === 0) {
    return emptyComponent || defaultEmptyComponent;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 아이템 목록 */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="animate-fade-in">
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* 무한 스크롤 모드 */}
      {mode === 'infinite' && (
        <>
          {/* 더 로딩 중 표시 */}
          {isLoadingMore && (
            <Card>
              <CardContent className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">더 많은 콘텐츠를 불러오는 중...</div>
              </CardContent>
            </Card>
          )}

          {/* 모든 데이터 로드 완료 */}
          {!hasMore && items.length > 0 && (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground">
                  모든 콘텐츠를 불러왔습니다 ({items.length}개)
                </div>
              </CardContent>
            </Card>
          )}

          {/* 옵저버 타겟 */}
          <div ref={loadingRef} className="h-4" />
        </>
      )}

      {/* 페이지네이션 모드 */}
      {mode === 'pagination' && totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                전체 {total}개 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, total || 0)}개 표시
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  이전
                </Button>
                
                {/* 페이지 번호 */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isLoading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                >
                  다음
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}