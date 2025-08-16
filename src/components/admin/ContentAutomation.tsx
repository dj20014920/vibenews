import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Folder,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase as any;
interface AutomationStatus {
  qualityEvaluation: boolean;
  contentSimplification: boolean;
  trendingCalculation: boolean;
  isRunning: boolean;
  lastRun?: string;
  stats?: {
    processed: number;
    hidden: number;
    simplified: number;
    trending: number;
  };
}

export const ContentAutomation = () => {
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>({
    qualityEvaluation: true,
    contentSimplification: true,
    trendingCalculation: true,
    isRunning: false
  });
  
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const runQualityEvaluation = async () => {
    try {
      console.log('Starting content quality evaluation...');
      
      // 최근 평가되지 않은 콘텐츠 가져오기
      const { data: articles } = await sb
        .from('news_articles')
        .select('id, title, content, source_url')
        .is('is_hidden', null)
        .limit(10);

      const { data: posts } = await sb
        .from('community_posts')
        .select('id, title, content')
        .is('is_hidden', null)
        .limit(10);

      let processed = 0;
      const total = (articles?.length || 0) + (posts?.length || 0);

      // 뉴스 기사 평가
      for (const article of articles || []) {
        const { data, error } = await supabase.functions.invoke('content-quality-evaluator', {
          body: {
            content_id: article.id,
            content_type: 'news_article',
            title: article.title,
            content: article.content,
            source_url: article.source_url
          }
        });

        if (error) {
          console.error('Quality evaluation error:', error);
        } else {
          console.log('Quality evaluation result:', data);
        }

        processed++;
        setProgress((processed / total) * 100);
      }

      // 커뮤니티 포스트 평가
      for (const post of posts || []) {
        const { data, error } = await supabase.functions.invoke('content-quality-evaluator', {
          body: {
            content_id: post.id,
            content_type: 'community_post',
            title: post.title,
            content: post.content,
            source_url: ''
          }
        });

        if (error) {
          console.error('Quality evaluation error:', error);
        } else {
          console.log('Quality evaluation result:', data);
        }

        processed++;
        setProgress((processed / total) * 100);
      }

      return { processed, total };
    } catch (error) {
      console.error('Error in quality evaluation:', error);
      throw error;
    }
  };

  const runContentSimplification = async () => {
    try {
      console.log('Starting content simplification...');
      
      // 단순화되지 않은 콘텐츠 가져오기
      const { data: articles } = await sb
        .from('news_articles')
        .select('id, title, content, summary')
        .is('content_simplified', null)
        .eq('is_hidden', false)
        .limit(5);

      const { data: posts } = await sb
        .from('community_posts')
        .select('id, title, content')
        .is('content_simplified', null)
        .eq('is_hidden', false)
        .limit(5);

      let simplified = 0;

      // 뉴스 기사 단순화
      for (const article of articles || []) {
        const { data, error } = await supabase.functions.invoke('content-simplifier', {
          body: {
            content_id: article.id,
            content_type: 'news_article',
            title: article.title,
            content: article.content,
            summary: article.summary,
            target_level: 'general'
          }
        });

        if (!error) {
          simplified++;
        }
      }

      // 커뮤니티 포스트 단순화
      for (const post of posts || []) {
        const { data, error } = await supabase.functions.invoke('content-simplifier', {
          body: {
            content_id: post.id,
            content_type: 'community_post',
            title: post.title,
            content: post.content,
            summary: post.content.substring(0, 200),
            target_level: 'general'
          }
        });

        if (!error) {
          simplified++;
        }
      }

      return { simplified };
    } catch (error) {
      console.error('Error in content simplification:', error);
      throw error;
    }
  };

  const runTrendingCalculation = async () => {
    try {
      console.log('Starting trending calculation...');
      
      const { data, error } = await supabase.functions.invoke('trending-algorithm', {
        body: { action: 'calculate_all' }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error in trending calculation:', error);
      throw error;
    }
  };

  const runAutomation = async () => {
    setAutomationStatus(prev => ({ ...prev, isRunning: true }));
    setProgress(0);

    try {
      let stats = {
        processed: 0,
        hidden: 0,
        simplified: 0,
        trending: 0
      };

      // 1. 품질 평가
      if (automationStatus.qualityEvaluation) {
        toast({
          title: "품질 평가 시작",
          description: "AI가 콘텐츠 품질을 평가하고 있습니다...",
        });
        
        const qualityResult = await runQualityEvaluation();
        stats.processed = qualityResult.processed;
        setProgress(33);
      }

      // 2. 콘텐츠 단순화
      if (automationStatus.contentSimplification) {
        toast({
          title: "콘텐츠 단순화 시작",
          description: "AI가 콘텐츠를 이해하기 쉽게 변환하고 있습니다...",
        });
        
        const simplificationResult = await runContentSimplification();
        stats.simplified = simplificationResult.simplified;
        setProgress(66);
      }

      // 3. 트렌딩 계산
      if (automationStatus.trendingCalculation) {
        toast({
          title: "트렌딩 계산 시작",
          description: "트렌딩 알고리즘을 실행하고 있습니다...",
        });
        
        const trendingResult = await runTrendingCalculation();
        stats.trending = trendingResult?.processed_count || 0;
        setProgress(100);
      }

      setAutomationStatus(prev => ({
        ...prev,
        isRunning: false,
        lastRun: new Date().toLocaleString('ko-KR'),
        stats
      }));

      toast({
        title: "자동화 완료",
        description: `콘텐츠 자동화가 성공적으로 완료되었습니다. ${stats.processed}개 처리됨`,
      });

    } catch (error) {
      console.error('Automation error:', error);
      setAutomationStatus(prev => ({ ...prev, isRunning: false }));
      
      toast({
        title: "자동화 실패",
        description: "콘텐츠 자동화 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 자동화 제어 패널 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            콘텐츠 자동화 제어
          </CardTitle>
          <CardDescription>
            AI 기반 콘텐츠 품질 관리 및 최적화 시스템
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 자동화 옵션 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span className="font-medium">품질 평가</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI로 콘텐츠 품질 자동 평가
                </p>
              </div>
              <Switch
                checked={automationStatus.qualityEvaluation}
                onCheckedChange={(checked) =>
                  setAutomationStatus(prev => ({ ...prev, qualityEvaluation: checked }))
                }
                disabled={automationStatus.isRunning}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span className="font-medium">콘텐츠 단순화</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  비개발자용 버전 자동 생성
                </p>
              </div>
              <Switch
                checked={automationStatus.contentSimplification}
                onCheckedChange={(checked) =>
                  setAutomationStatus(prev => ({ ...prev, contentSimplification: checked }))
                }
                disabled={automationStatus.isRunning}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">트렌딩 계산</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  실시간 트렌딩 점수 계산
                </p>
              </div>
              <Switch
                checked={automationStatus.trendingCalculation}
                onCheckedChange={(checked) =>
                  setAutomationStatus(prev => ({ ...prev, trendingCalculation: checked }))
                }
                disabled={automationStatus.isRunning}
              />
            </div>
          </div>

          {/* 실행 버튼 및 진행률 */}
          <div className="space-y-4">
            <Button
              onClick={runAutomation}
              disabled={automationStatus.isRunning}
              className="w-full"
              size="lg"
            >
              {automationStatus.isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  자동화 실행 중...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  자동화 실행
                </>
              )}
            </Button>

            {automationStatus.isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>진행률</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </div>

          {/* 마지막 실행 정보 */}
          {automationStatus.lastRun && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-green-600" />
                마지막 실행: {automationStatus.lastRun}
              </div>
              
              {automationStatus.stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {automationStatus.stats.processed}
                    </div>
                    <div className="text-xs text-muted-foreground">처리됨</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {automationStatus.stats.hidden}
                    </div>
                    <div className="text-xs text-muted-foreground">숨김 처리</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {automationStatus.stats.simplified}
                    </div>
                    <div className="text-xs text-muted-foreground">단순화됨</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {automationStatus.stats.trending}
                    </div>
                    <div className="text-xs text-muted-foreground">트렌딩 계산</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 기능 설명 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI 품질 평가
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs">
              <Badge variant="outline">관련성 점수</Badge>
              <Badge variant="outline">기술적 깊이</Badge>
              <Badge variant="outline">신뢰성 평가</Badge>
              <Badge variant="outline">자동 필터링</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              이중 콘텐츠
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs">
              <Badge variant="outline">개발자용</Badge>
              <Badge variant="outline">비개발자용</Badge>
              <Badge variant="outline">용어 설명</Badge>
              <Badge variant="outline">난이도 조절</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              트렌딩 알고리즘
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs">
              <Badge variant="outline">참여도 분석</Badge>
              <Badge variant="outline">속도 계산</Badge>
              <Badge variant="outline">신선도 평가</Badge>
              <Badge variant="outline">실시간 업데이트</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Folder className="h-4 w-4" />
              스크랩 관리
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs">
              <Badge variant="outline">폴더 분류</Badge>
              <Badge variant="outline">태그 시스템</Badge>
              <Badge variant="outline">검색 필터</Badge>
              <Badge variant="outline">개인화</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 주의사항 */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            자동화 시스템 안내
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
          <p>• OpenAI API 키가 설정되어 있어야 품질 평가 및 콘텐츠 단순화가 작동합니다</p>
          <p>• 대량의 콘텐츠 처리 시 API 비용이 발생할 수 있습니다</p>
          <p>• 트렌딩 알고리즘은 실시간으로 계산되어 정확한 순위를 제공합니다</p>
          <p>• 자동화는 기존 콘텐츠의 품질을 향상시키고 사용자 경험을 개선합니다</p>
        </CardContent>
      </Card>
    </div>
  );
};