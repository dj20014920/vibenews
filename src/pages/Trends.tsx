import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus, Eye, Heart, MessageSquare, Share, Calendar, DollarSign } from 'lucide-react'

import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/integrations/supabase/types_updated'

// 🔧 Type-safe interface for trends_feed API response
interface TrendsFeedRow {
  id: string
  title: string
  category: 'tool' | 'technology' | 'framework' | 'news'
  metric_type: string
  metric_value: number
  yoy_delta: number
  source_name: string
  source_url: string | null
  capture_date: string | null
  tags: string[] | null
  description: string | null
  market_value: string | null
  user_count: number | null
  enterprise_count: number | null
  price_plan: string | null
  trending_score: number
}

interface TrendData {
  id: string
  title: string
  category: 'tool' | 'technology' | 'framework' | 'news'
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  views: number
  likes: number
  comments: number
  shares: number
  tags: string[]
  description: string
  timeframe: string
  marketValue?: string
  sourceUrl?: string
}

// 실제 트렌드 데이터는 Supabase의 trending_scores 기반 뷰/집계에서 가져옵니다.
// 초기 로드 시 Supabase에서 최신 데이터를 가져오고, 없으면 샘플 데이터로 폴백합니다.
const fallbackData: TrendData[] = [
  {
    id: '1',
    title: 'Cursor IDE 급성장',
    category: 'tool',
    trend: 'up',
    trendPercentage: 245,
    views: 15420,
    likes: 1247,
    comments: 234,
    shares: 89,
    tags: ['AI', 'IDE', 'Coding Assistant'],
    description: 'Cursor IDE가 지난 주 대비 245% 성장하며 AI 코딩 도구 시장을 선도하고 있습니다.',
    timeframe: '지난 7일',
    marketValue: '$25/월'
  },
  {
    id: '2',
    title: 'GitHub Copilot 업데이트',
    category: 'news',
    trend: 'up',
    trendPercentage: 89,
    views: 32150,
    likes: 2341,
    comments: 567,
    shares: 234,
    tags: ['GitHub', 'AI', 'Update'],
    description: 'GitHub Copilot의 최신 업데이트로 코드 생성 정확도가 대폭 향상되었습니다.',
    timeframe: '지난 3일',
    marketValue: '$10/월'
  },
  {
    id: '3',
    title: 'No-Code 플랫폼 성장',
    category: 'technology',
    trend: 'up',
    trendPercentage: 156,
    views: 8930,
    likes: 678,
    comments: 123,
    shares: 45,
    tags: ['No-Code', 'Low-Code', 'Development'],
    description: 'Lovable, Bolt.new 등 No-Code 플랫폼들이 빠른 성장세를 보이고 있습니다.',
    timeframe: '지난 14일'
  },
  {
    id: '4',
    title: 'React 19 안정화',
    category: 'framework',
    trend: 'stable',
    trendPercentage: 12,
    views: 45600,
    likes: 3421,
    comments: 890,
    shares: 456,
    tags: ['React', 'JavaScript', 'Frontend'],
    description: 'React 19가 안정화되면서 개발자들의 관심이 꾸준히 유지되고 있습니다.',
    timeframe: '지난 30일'
  },
  {
    id: '5',
    title: 'Windsurf 사용자 증가',
    category: 'tool',
    trend: 'up',
    trendPercentage: 67,
    views: 6780,
    likes: 456,
    comments: 78,
    shares: 23,
    tags: ['Windsurf', 'IDE', 'AI'],
    description: 'Windsurf의 고급 AI 기능으로 인해 사용자가 지속적으로 증가하고 있습니다.',
    timeframe: '지난 7일',
    marketValue: '$30/월'
  },
  {
    id: '6',
    title: 'TypeScript 관심도 하락',
    category: 'technology',
    trend: 'down',
    trendPercentage: -23,
    views: 23400,
    likes: 1234,
    comments: 345,
    shares: 123,
    tags: ['TypeScript', 'JavaScript', 'Programming'],
    description: 'AI 도구들의 자동 타입 추론 기능으로 TypeScript 관심도가 일시적으로 하락했습니다.',
    timeframe: '지난 14일'
  }
]

// 🔧 SOLID/DRY: Clean data transformation function
function mapTrendsFeedToTrendData(feedRow: TrendsFeedRow): TrendData {
  const score = feedRow.trending_score
  const trend: TrendData['trend'] = score > 0.1 ? 'up' : score < -0.1 ? 'down' : 'stable'
  const trendPercentage = Math.round(score * 100)
  
  return {
    id: feedRow.id,
    title: feedRow.title,
    category: feedRow.category,
    trend,
    trendPercentage,
    views: feedRow.user_count || Math.round(feedRow.metric_value / 10) || 0,
    likes: Math.round((feedRow.metric_value || 0) / 10),
    comments: Math.round((feedRow.metric_value || 0) / 25),
    shares: Math.round((feedRow.metric_value || 0) / 50),
    tags: feedRow.tags || [],
    description: feedRow.description || '트렌드 데이터',
    timeframe: feedRow.capture_date || '최근',
    marketValue: feedRow.market_value || undefined,
    sourceUrl: feedRow.source_url || undefined,
  }
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-green-500" />
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-500" />
    default:
      return <Minus className="h-4 w-4 text-yellow-500" />
  }
}

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'up':
      return 'text-green-500'
    case 'down':
      return 'text-red-500'
    default:
      return 'text-yellow-500'
  }
}

const getCategoryBadgeVariant = (category: string) => {
  switch (category) {
    case 'tool':
      return 'default'
    case 'technology':
      return 'secondary'
    case 'framework':
      return 'outline'
    case 'news':
      return 'destructive'
    default:
      return 'outline'
  }
}

const getCategoryText = (category: string) => {
  switch (category) {
    case 'tool':
      return '도구'
    case 'technology':
      return '기술'
    case 'framework':
      return '프레임워크'
    case 'news':
      return '뉴스'
    default:
      return category
  }
}

export default function Trends() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [timeframe, setTimeframe] = useState<string>('week')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [trendingData, setTrendingData] = useState<TrendData[]>([])

  useEffect(() => {
    let isMounted = true
    
    const fetchTrends = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // 🔧 KISS/SOLID: Type-safe Supabase query with proper error handling
        const { data: feedData, error: feedError } = await supabase
          .from('trends_feed')
          .select('*')
          .order('trending_score', { ascending: false })
          .limit(50)
        
        if (feedError) {
          console.error('Trends feed query error:', feedError)
          throw new Error(`데이터베이스 쿼리 실패: ${feedError.message}`)
        }

        if (!feedData || feedData.length === 0) {
          console.warn('No data from trends_feed, using fallback data')
          if (isMounted) {
            setTrendingData(fallbackData)
          }
          return
        }

        // 🔧 DRY: Clean data transformation
        const transformedData = feedData.map(mapTrendsFeedToTrendData)
        
        if (isMounted) {
          setTrendingData(transformedData)
          console.log(`✅ Successfully loaded ${transformedData.length} trends from database`)
        }
        
      } catch (e: any) {
        console.error('Failed to load trends:', e)
        const errorMessage = e?.message || '트렌드 데이터를 불러오지 못했습니다'
        
        if (isMounted) {
          setError(errorMessage)
          // 🔧 YAGNI: Simple fallback strategy
          setTrendingData(fallbackData)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    fetchTrends()
    return () => { isMounted = false }
  }, [])

  const filteredData = trendingData.filter(item =>
    selectedCategory === 'all' || item.category === selectedCategory
  )

  const upTrends = trendingData.filter(item => item.trend === 'up').length
  const downTrends = trendingData.filter(item => item.trend === 'down').length
  const stableTrends = trendingData.filter(item => item.trend === 'stable').length

  const topTrend = [...trendingData].sort((a, b) => b.trendPercentage - a.trendPercentage)[0]

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">바이브 코딩 트렌드</h1>
        <p className="text-muted-foreground">
          실시간으로 업데이트되는 AI 코딩 도구와 기술 트렌드를 확인하세요
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">상승 트렌드</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{upTrends}</div>
            <p className="text-xs text-muted-foreground">개의 항목</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">하락 트렌드</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{downTrends}</div>
            <p className="text-xs text-muted-foreground">개의 항목</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">안정 트렌드</CardTitle>
            <Minus className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stableTrends}</div>
            <p className="text-xs text-muted-foreground">개의 항목</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최고 상승률</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topTrend?.trendPercentage}%</div>
            <p className="text-xs text-muted-foreground">{topTrend?.title}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="tool">도구</TabsTrigger>
          <TabsTrigger value="technology">기술</TabsTrigger>
          <TabsTrigger value="framework">프레임워크</TabsTrigger>
          <TabsTrigger value="news">뉴스</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {loading && (
            <div className="text-sm text-muted-foreground">로딩 중…</div>
          )}
          {!loading && filteredData.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <Badge variant={getCategoryBadgeVariant(item.category)}>
                        {getCategoryText(item.category)}
                      </Badge>
                    </div>
                    <CardDescription>{item.description}</CardDescription>
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor(item.trend)}`}>
                      {getTrendIcon(item.trend)}
                      {Math.abs(item.trendPercentage)}%
                    </div>
                    <div className="text-xs text-muted-foreground">{item.timeframe}</div>
                    {item.marketValue && (
                      <div className="text-xs font-medium">{item.marketValue}</div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Trend Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>트렌드 지수</span>
                      <span>{Math.abs(item.trendPercentage)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(Math.abs(item.trendPercentage), 100)} 
                      className="w-full"
                    />
                  </div>

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {item.views.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {item.likes.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {item.comments.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Share className="h-4 w-4" />
                      {item.shares.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">상세보기</Button>
                    <Button size="sm" variant="outline">관련 뉴스</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        {['tool', 'technology', 'framework', 'news'].map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            {loading && (
              <div className="text-sm text-muted-foreground">로딩 중…</div>
            )}
            {!loading && trendingData.filter(item => item.category === category).map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor(item.trend)}`}>
                        {getTrendIcon(item.trend)}
                        {Math.abs(item.trendPercentage)}%
                      </div>
                      <div className="text-xs text-muted-foreground">{item.timeframe}</div>
                      {item.marketValue && (
                        <div className="text-xs font-medium">{item.marketValue}</div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>트렌드 지수</span>
                        <span>{Math.abs(item.trendPercentage)}%</span>
                      </div>
                      <Progress 
                        value={Math.min(Math.abs(item.trendPercentage), 100)} 
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {item.views.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {item.likes.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {item.comments.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Share className="h-4 w-4" />
                        {item.shares.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {item.sourceUrl && (
                        <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline">출처 열기</Button>
                        </a>
                      )}
                      <Button size="sm" variant="outline">관련 뉴스</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <CardTitle>시장 인사이트</CardTitle>
          <CardDescription>
            현재 바이브 코딩 시장의 주요 동향과 분석
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">주요 트렌드</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• AI 코딩 도구 시장 급성장 (전년 대비 340%)</li>
                <li>• No-Code/Low-Code 플랫폼 주류화</li>
                <li>• 개발자 생산성 도구 투자 증가</li>
                <li>• 협업 중심 개발 환경 확산</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">예측 및 전망</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 2025년 AI 코딩 도구 시장 $50B 돌파 예상</li>
                <li>• 개발자 95%가 AI 도구 사용 예측</li>
                <li>• 코드 생성 정확도 90% 이상 달성</li>
                <li>• 전통적 IDE의 AI 통합 가속화</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}