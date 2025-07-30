import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const NewsCollector = () => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [lastCollection, setLastCollection] = useState<string | null>(null);
  const [collectionResult, setCollectionResult] = useState<{
    collected: number;
    saved: number;
    message: string;
  } | null>(null);
  const { toast } = useToast();

  const handleCollectNews = async () => {
    setIsCollecting(true);
    setCollectionResult(null);

    try {
      console.log('Starting news collection...');
      
      const { data, error } = await supabase.functions.invoke('news-collector', {
        body: { action: 'collect' }
      });

      if (error) throw error;

      if (data?.success) {
        setCollectionResult({
          collected: data.collected || 0,
          saved: data.saved || 0,
          message: data.message || '뉴스 수집이 완료되었습니다.'
        });
        setLastCollection(new Date().toLocaleString('ko-KR'));
        
        toast({
          title: "뉴스 수집 완료",
          description: data.message,
        });
      } else {
        throw new Error(data?.error || '뉴스 수집에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error collecting news:', error);
      toast({
        title: "수집 실패",
        description: error instanceof Error ? error.message : '뉴스 수집 중 오류가 발생했습니다.',
        variant: "destructive",
      });
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          뉴스 자동 수집 (임시 구현)
        </CardTitle>
        <CardDescription>
          n8n 워크플로우를 통한 뉴스 자동 수집 기능입니다. 현재는 RSS 피드를 통해 기술 뉴스를 수집합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">수집 소스</p>
            <p className="text-sm text-muted-foreground">
              TechCrunch, GitHub Blog, Dev.to
            </p>
          </div>
          <Button 
            onClick={handleCollectNews}
            disabled={isCollecting}
            className="ml-4"
          >
            {isCollecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                수집 중...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                뉴스 수집 시작
              </>
            )}
          </Button>
        </div>

        {lastCollection && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            마지막 수집: {lastCollection}
          </div>
        )}

        {collectionResult && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle className="h-4 w-4" />
              수집 완료
            </div>
            <div className="text-sm space-y-1">
              <p>총 수집된 기사: {collectionResult.collected}개</p>
              <p>새로 저장된 기사: {collectionResult.saved}개</p>
              <p className="text-muted-foreground">{collectionResult.message}</p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
          <p className="font-medium mb-1">🚧 임시 구현 안내</p>
          <ul className="space-y-1">
            <li>• 현재는 RSS 피드를 통한 기본 수집만 지원</li>
            <li>• 향후 고도화된 AI 필터링 및 품질 평가 추가 예정</li>
            <li>• n8n 워크플로우 연동 및 스케줄링 기능 추가 예정</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};