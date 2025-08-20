import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Eye, 
  Heart, 
  MessageSquare, 
  Share, 
  ExternalLink,
  Star,
  Users,
  Building,
  DollarSign,
  Terminal,
  Code2,
  Layers,
  Network,
  Sparkles
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/integrations/supabase/client'

// 트렌드 데이터 인터페이스
interface TrendData {
  id: string
  title: string
  category: 'cli' | 'ide' | 'saas' | 'mcp' | 'framework'
  description: string
  trending_score: number
  developer_rating: number
  github_stars: number
  reddit_mentions: number
  stackoverflow_mentions: number
  user_count: number
  enterprise_count: number
  source_url: string | null
  official_website: string | null
  pricing_model: string | null
  market_value: string | null
  ai_features: any
  integration_count: number
  tags: string[]
  source_name: string
  capture_date: string | null
}

// 상세보기 인터페이스
interface TrendDetail extends TrendData {
  related_news?: any[]
}

// 실제 데이터를 가져오지 못할 경우 사용할 fallback 데이터
const fallbackTrendData: TrendData[] = [
  {
    id: '1',
    title: 'Cursor IDE',
    category: 'ide',
    description: 'AI-powered code editor with excellent CLI integration',
    trending_score: 2.45,
    developer_rating: 95,
    github_stars: 15000,
    reddit_mentions: 850,
    stackoverflow_mentions: 320,
    user_count: 50000,
    enterprise_count: 1200,
    source_url: 'https://cursor.sh',
    official_website: 'https://cursor.sh',
    pricing_model: 'freemium',
    market_value: '$20/month',
    ai_features: { ai_completion: true, context_aware: true, multi_language: true },
    integration_count: 25,
    tags: ['CLI', 'IDE', 'AI', 'Coding Assistant'],
    source_name: 'GitHub Trending',
    capture_date: '2025-08-19'
  },
  {
    id: '2',
    title: 'Windsurf IDE',
    category: 'ide',
    description: 'Advanced AI IDE with powerful CLI tools',
    trending_score: 1.78,
    developer_rating: 89,
    github_stars: 8500,
    reddit_mentions: 640,
    stackoverflow_mentions: 280,
    user_count: 35000,
    enterprise_count: 800,
    source_url: 'https://codeium.com/windsurf',
    official_website: 'https://codeium.com/windsurf',
    pricing_model: 'freemium',
    market_value: '$30/month',
    ai_features: { ai_completion: true, multi_agent: true, code_generation: true },
    integration_count: 18,
    tags: ['CLI', 'IDE', 'AI'],
    source_name: 'Dev Community',
    capture_date: '2025-08-19'
  },
  {
    id: '3',
    title: 'Aider CLI',
    category: 'cli',
    description: 'Terminal-based AI coding assistant',
    trending_score: 1.56,
    developer_rating: 78,
    github_stars: 12000,
    reddit_mentions: 420,
    stackoverflow_mentions: 190,
    user_count: 25000,
    enterprise_count: 450,
    source_url: 'https://aider.chat',
    official_website: 'https://aider.chat',
    pricing_model: 'freemium',
    market_value: 'Free/Pro $20',
    ai_features: { terminal_integration: true, git_integration: true, ai_pair_programming: true },
    integration_count: 12,
    tags: ['CLI', 'AI', 'Terminal'],
    source_name: 'Reddit r/programming',
    capture_date: '2025-08-19'
  },
  {
    id: '4',
    title: 'Vercel',
    category: 'saas',
    description: 'Frontend cloud platform for deployment',
    trending_score: 1.56,
    developer_rating: 88,
    github_stars: 25000,
    reddit_mentions: 890,
    stackoverflow_mentions: 650,
    user_count: 500000,
    enterprise_count: 15000,
    source_url: 'https://vercel.com',
    official_website: 'https://vercel.com',
    pricing_model: 'freemium',
    market_value: '$20+/month',
    ai_features: { ai_optimization: true, edge_functions: true, performance: true },
    integration_count: 50,
    tags: ['SaaS', 'Deployment', 'Frontend'],
    source_name: 'Vercel',
    capture_date: '2025-08-19'
  },
  {
    id: '5',
    title: 'MCP Protocol',
    category: 'mcp',
    description: 'Model Context Protocol for AI tool integration',
    trending_score: 2.45,
    developer_rating: 86,
    github_stars: 8900,
    reddit_mentions: 340,
    stackoverflow_mentions: 180,
    user_count: 15000,
    enterprise_count: 300,
    source_url: 'https://modelcontextprotocol.io',
    official_website: 'https://modelcontextprotocol.io',
    pricing_model: 'open_source',
    market_value: 'Open Source',
    ai_features: { tool_integration: true, context_sharing: true, standardization: true },
    integration_count: 20,
    tags: ['MCP', 'Protocol', 'AI'],
    source_name: 'Anthropic',
    capture_date: '2025-08-19'
  },
  {
    id: '6',
    title: 'React 19',
    category: 'framework',
    description: 'Latest React version with concurrent features',
    trending_score: 0.67,
    developer_rating: 82,
    github_stars: 180000,
    reddit_mentions: 1500,
    stackoverflow_mentions: 2200,
    user_count: 2000000,
    enterprise_count: 100000,
    source_url: 'https://react.dev',
    official_website: 'https://react.dev',
    pricing_model: 'open_source',
    market_value: 'Free',
    ai_features: { concurrent_features: true, performance: true, dev_experience: true },
    integration_count: 80,
    tags: ['Framework', 'Frontend', 'JavaScript'],
    source_name: 'Meta',
    capture_date: '2025-08-19'
  }
]

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'cli':
      return <Terminal className="h-4 w-4" />
    case 'ide':
      return <Code2 className="h-4 w-4" />
    case 'saas':
      return <Layers className="h-4 w-4" />
    case 'mcp':
      return <Network className="h-4 w-4" />
    case 'framework':
      return <Sparkles className="h-4 w-4" />
    default:
      return <Code2 className="h-4 w-4" />
  }
}

const getCategoryText = (category: string) => {
  switch (category) {
    case 'cli':
      return 'CLI 도구'
    case 'ide':
      return 'IDE'
    case 'saas':
      return 'SaaS'
    case 'mcp':
      return 'MCP'
    case 'framework':
      return '프레임워크'
    default:
      return category
  }
}

const getCategoryBadgeVariant = (category: string) => {
  switch (category) {
    case 'cli':
      return 'default' as const
    case 'ide':
      return 'secondary' as const
    case 'saas':
      return 'outline' as const
    case 'mcp':
      return 'destructive' as const
    case 'framework':
      return 'default' as const
    default:
      return 'outline' as const
  }
}

const getTrendIcon = (score: number) => {
  if (score > 1) return <TrendingUp className="h-4 w-4 text-green-500" />
  if (score < -0.5) return <TrendingDown className="h-4 w-4 text-red-500" />
  return <Minus className="h-4 w-4 text-yellow-500" />
}

const getTrendColor = (score: number) => {
  if (score > 1) return 'text-green-500'
  if (score < -0.5) return 'text-red-500'
  return 'text-yellow-500'
}

export default function Trends() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [trendingData, setTrendingData] = useState<TrendData[]>([])
  const [selectedTrend, setSelectedTrend] = useState<TrendDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState<boolean>(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTrends()
  }, [])

  const fetchTrends = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 기본적으로 fallback 데이터를 사용하되, 나중에 실제 데이터로 교체할 수 있도록 구조화
      console.log('✅ 트렌드 데이터를 로드했습니다 (현재 샘플 데이터 사용)')
      setTrendingData(fallbackTrendData)
      
    } catch (e: any) {
      console.error('트렌드 로드 실패:', e)
      const errorMessage = e?.message || '트렌드 데이터를 불러오지 못했습니다'
      setError(errorMessage)
      toast({
        title: "오류",
        description: errorMessage,
        variant: "destructive",
      })
      // 오류가 발생해도 fallback 데이터 사용
      setTrendingData(fallbackTrendData)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrendDetails = async (trendId: string) => {
    try {
      setDetailLoading(true)
      
      // fallback 데이터에서 상세 정보 찾기
      const trendData = fallbackTrendData.find(item => item.id === trendId)
      
      if (!trendData) {
        throw new Error('트렌드 데이터를 찾을 수 없습니다')
      }

      // 관련 뉴스 시뮬레이션 (실제로는 데이터베이스에서 가져올 것)
      const mockRelatedNews = [
        {
          id: '1',
          title: `${trendData.title} 최신 업데이트 소식`,
          summary: `${trendData.title}의 새로운 기능과 개선사항에 대한 최신 소식입니다.`,
          source_url: trendData.source_url,
          published_at: '2025-08-19T00:00:00Z'
        }
      ]

      setSelectedTrend({
        ...trendData,
        related_news: mockRelatedNews
      })

    } catch (e: any) {
      console.error('상세 정보 로드 실패:', e)
      toast({
        title: "오류",
        description: e?.message || '상세 정보를 불러올 수 없습니다',
        variant: "destructive",
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleShareTrend = async (trend: TrendData) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trend.title,
          text: trend.description,
          url: trend.official_website || trend.source_url || window.location.href,
        })
      } catch (err) {
        console.log('공유 취소됨')
      }
    } else {
      // 클립보드에 복사
      const shareText = `${trend.title}\n${trend.description}\n${trend.official_website || trend.source_url || window.location.href}`
      await navigator.clipboard.writeText(shareText)
      toast({
        title: "링크 복사됨",
        description: "트렌드 정보가 클립보드에 복사되었습니다.",
      })
    }
  }

  const filteredData = trendingData.filter(item =>
    selectedCategory === 'all' || item.category === selectedCategory
  )

  const categoryStats = {
    cli: trendingData.filter(item => item.category === 'cli').length,
    ide: trendingData.filter(item => item.category === 'ide').length,
    saas: trendingData.filter(item => item.category === 'saas').length,
    mcp: trendingData.filter(item => item.category === 'mcp').length,
    framework: trendingData.filter(item => item.category === 'framework').length,
  }

  const topTrend = [...trendingData].sort((a, b) => b.trending_score - a.trending_score)[0]

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">개발자 도구 트렌드</h1>
        <p className="text-muted-foreground">
          실시간으로 업데이트되는 CLI, IDE, SaaS, MCP, 프레임워크 트렌드를 확인하세요
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</div>
      )}

      {/* 통계 개요 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CLI 도구</CardTitle>
            <Terminal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.cli}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IDE</CardTitle>
            <Code2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.ide}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SaaS</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.saas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MCP</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.mcp}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">프레임워크</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.framework}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최고 상승률</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topTrend ? `+${Math.round(topTrend.trending_score * 100)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {topTrend?.title}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="cli">CLI</TabsTrigger>
          <TabsTrigger value="ide">IDE</TabsTrigger>
          <TabsTrigger value="saas">SaaS</TabsTrigger>
          <TabsTrigger value="mcp">MCP</TabsTrigger>
          <TabsTrigger value="framework">프레임워크</TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedCategory} className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">데이터를 불러오는 중...</span>
            </div>
          )}
          
          {!loading && filteredData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              표시할 트렌드 데이터가 없습니다.
            </div>
          )}

          {!loading && filteredData.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(item.category)}
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <Badge variant={getCategoryBadgeVariant(item.category)}>
                        {getCategoryText(item.category)}
                      </Badge>
                    </div>
                    <CardDescription>{item.description}</CardDescription>
                    <div className="flex flex-wrap gap-1">
                      {item.tags?.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor(item.trending_score)}`}>
                      {getTrendIcon(item.trending_score)}
                      +{Math.round(item.trending_score * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">{item.capture_date}</div>
                    {item.market_value && (
                      <div className="text-xs font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {item.market_value}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 트렌드 진행률 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>트렌드 지수</span>
                      <span>+{Math.round(item.trending_score * 100)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(Math.abs(item.trending_score * 100), 100)} 
                      className="w-full"
                    />
                  </div>

                  {/* 참여도 통계 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">사용자</span>
                      <span className="font-medium">{item.user_count?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">GitHub</span>
                      <span className="font-medium">{item.github_stars?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Reddit</span>
                      <span className="font-medium">{item.reddit_mentions?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">기업</span>
                      <span className="font-medium">{item.enterprise_count?.toLocaleString() || '0'}</span>
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => fetchTrendDetails(item.id)}
                        >
                          상세보기
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {getCategoryIcon(item.category)}
                            {item.title}
                          </DialogTitle>
                          <DialogDescription>
                            {item.description}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {detailLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span className="ml-2">상세 정보를 불러오는 중...</span>
                          </div>
                        ) : selectedTrend && (
                          <div className="space-y-4">
                            {/* AI 기능 */}
                            {selectedTrend.ai_features && Object.keys(selectedTrend.ai_features).length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">AI 기능</h4>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(selectedTrend.ai_features).map(([key, value]) => (
                                    value && (
                                      <Badge key={key} variant="secondary">
                                        {key.replace(/_/g, ' ')}
                                      </Badge>
                                    )
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* 통계 정보 */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">개발자 평점</span>
                                  <span className="font-medium">{selectedTrend.developer_rating}/100</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">통합 수</span>
                                  <span className="font-medium">{selectedTrend.integration_count}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">StackOverflow</span>
                                  <span className="font-medium">{selectedTrend.stackoverflow_mentions}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">가격 모델</span>
                                  <span className="font-medium">{selectedTrend.pricing_model}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">데이터 출처</span>
                                  <span className="font-medium">{selectedTrend.source_name}</span>
                                </div>
                              </div>
                            </div>

                            {/* 관련 뉴스 */}
                            {selectedTrend.related_news && selectedTrend.related_news.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">관련 뉴스</h4>
                                <div className="space-y-2">
                                  {selectedTrend.related_news.map((news: any) => (
                                    <div key={news.id} className="border rounded p-2">
                                      <h5 className="font-medium text-sm">{news.title}</h5>
                                      <p className="text-xs text-muted-foreground">{news.summary}</p>
                                      {news.source_url && (
                                        <a 
                                          href={news.source_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                        >
                                          원문 보기 <ExternalLink className="h-3 w-3" />
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* 링크들 */}
                            <div className="flex gap-2">
                              {selectedTrend.official_website && (
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => window.open(selectedTrend.official_website!, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  공식 사이트
                                </Button>
                              )}
                              {selectedTrend.source_url && selectedTrend.source_url !== selectedTrend.official_website && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => window.open(selectedTrend.source_url!, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  출처
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`/search?q=${encodeURIComponent(item.title)}`, '_blank')}
                    >
                      관련 뉴스
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleShareTrend(item)}
                    >
                      <Share className="h-4 w-4 mr-1" />
                      공유
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}