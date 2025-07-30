import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, DollarSign, TrendingUp, Users, Code2, Zap } from 'lucide-react'

interface Tool {
  id: string
  tool_name: string
  category: string
  price_per_month: number | null
  features: any
  user_ratings: any
  last_updated: string
}

const sampleTools: Tool[] = [
  {
    id: '1',
    tool_name: 'Cursor',
    category: 'IDE',
    price_per_month: 25,
    features: {
      ai_completion: true,
      code_generation: true,
      debugging: true,
      collaboration: false,
      languages: ['JavaScript', 'TypeScript', 'Python', 'Go']
    },
    user_ratings: {
      overall: 4.8,
      ease_of_use: 4.7,
      performance: 4.9,
      value: 4.6
    },
    last_updated: '2025-01-28'
  },
  {
    id: '2',
    tool_name: 'Lovable',
    category: 'Web Development',
    price_per_month: 15,
    features: {
      ai_completion: true,
      code_generation: true,
      debugging: true,
      collaboration: true,
      languages: ['React', 'TypeScript', 'Tailwind CSS']
    },
    user_ratings: {
      overall: 4.9,
      ease_of_use: 4.9,
      performance: 4.8,
      value: 4.8
    },
    last_updated: '2025-01-28'
  },
  {
    id: '3',
    tool_name: 'Bolt.new',
    category: 'Full-Stack',
    price_per_month: 0,
    features: {
      ai_completion: true,
      code_generation: true,
      debugging: true,
      collaboration: true,
      languages: ['React', 'Vue', 'Node.js', 'Python']
    },
    user_ratings: {
      overall: 4.5,
      ease_of_use: 4.6,
      performance: 4.3,
      value: 4.9
    },
    last_updated: '2025-01-28'
  },
  {
    id: '4',
    tool_name: 'Vitara.ai',
    category: 'All-in-One',
    price_per_month: 20,
    features: {
      ai_completion: true,
      code_generation: true,
      debugging: true,
      collaboration: true,
      languages: ['All major languages']
    },
    user_ratings: {
      overall: 4.7,
      ease_of_use: 4.5,
      performance: 4.7,
      value: 4.6
    },
    last_updated: '2025-01-28'
  },
  {
    id: '5',
    tool_name: 'Windsurf',
    category: 'IDE',
    price_per_month: 30,
    features: {
      ai_completion: true,
      code_generation: true,
      debugging: true,
      collaboration: true,
      languages: ['JavaScript', 'TypeScript', 'Python', 'Rust']
    },
    user_ratings: {
      overall: 4.6,
      ease_of_use: 4.4,
      performance: 4.8,
      value: 4.3
    },
    last_updated: '2025-01-28'
  },
  {
    id: '6',
    tool_name: 'GitHub Copilot',
    category: 'Code Assistant',
    price_per_month: 10,
    features: {
      ai_completion: true,
      code_generation: true,
      debugging: false,
      collaboration: false,
      languages: ['All major languages']
    },
    user_ratings: {
      overall: 4.4,
      ease_of_use: 4.3,
      performance: 4.5,
      value: 4.2
    },
    last_updated: '2025-01-28'
  }
]

export default function Tools() {
  const [tools, setTools] = useState<Tool[]>(sampleTools)
  const [filteredTools, setFilteredTools] = useState<Tool[]>(sampleTools)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('rating')

  const categories = ['all', ...Array.from(new Set(tools.map(tool => tool.category)))]
  const priceRanges = [
    { value: 'all', label: '모든 가격' },
    { value: 'free', label: '무료' },
    { value: 'low', label: '$1-10' },
    { value: 'medium', label: '$11-20' },
    { value: 'high', label: '$21+' }
  ]

  useEffect(() => {
    let filtered = tools

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(tool =>
        tool.tool_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(tool => tool.category === categoryFilter)
    }

    // Price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(tool => {
        const price = tool.price_per_month || 0
        switch (priceFilter) {
          case 'free':
            return price === 0
          case 'low':
            return price > 0 && price <= 10
          case 'medium':
            return price > 10 && price <= 20
          case 'high':
            return price > 20
          default:
            return true
        }
      })
    }

    // Sort
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.user_ratings?.overall || 0) - (a.user_ratings?.overall || 0)
        case 'price_low':
          return (a.price_per_month || 0) - (b.price_per_month || 0)
        case 'price_high':
          return (b.price_per_month || 0) - (a.price_per_month || 0)
        case 'name':
          return a.tool_name.localeCompare(b.tool_name)
        default:
          return 0
      }
    })

    setFilteredTools(filtered)
  }, [tools, searchQuery, categoryFilter, priceFilter, sortBy])

  const getRecommendation = (tool: Tool) => {
    const { tool_name, price_per_month, user_ratings } = tool
    
    if (tool_name === 'Lovable' && price_per_month === 15) {
      return { type: 'beginner', text: '초보자 추천' }
    }
    if (tool_name === 'Cursor' && (user_ratings?.overall || 0) >= 4.8) {
      return { type: 'pro', text: '전문가 추천' }
    }
    if (price_per_month === 0) {
      return { type: 'budget', text: '예산 친화적' }
    }
    if ((user_ratings?.overall || 0) >= 4.7) {
      return { type: 'popular', text: '인기' }
    }
    return null
  }

  const ToolCard = ({ tool }: { tool: Tool }) => {
    const recommendation = getRecommendation(tool)
    
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {tool.tool_name}
                {recommendation && (
                  <Badge variant={
                    recommendation.type === 'beginner' ? 'default' :
                    recommendation.type === 'pro' ? 'destructive' :
                    recommendation.type === 'budget' ? 'secondary' : 'outline'
                  }>
                    {recommendation.text}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{tool.category}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {tool.price_per_month === 0 ? '무료' : `$${tool.price_per_month}`}
              </div>
              {tool.price_per_month !== 0 && (
                <div className="text-sm text-muted-foreground">/월</div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rating */}
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{tool.user_ratings?.overall || 0}</span>
            <span className="text-sm text-muted-foreground">
              ({Math.floor(Math.random() * 1000 + 100)} 리뷰)
            </span>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <h4 className="font-medium">주요 기능</h4>
            <div className="flex flex-wrap gap-1">
              {tool.features?.ai_completion && <Badge variant="outline">AI 자동완성</Badge>}
              {tool.features?.code_generation && <Badge variant="outline">코드 생성</Badge>}
              {tool.features?.debugging && <Badge variant="outline">디버깅</Badge>}
              {tool.features?.collaboration && <Badge variant="outline">협업</Badge>}
            </div>
          </div>

          {/* Languages */}
          {tool.features?.languages && (
            <div className="space-y-2">
              <h4 className="font-medium">지원 언어</h4>
              <div className="flex flex-wrap gap-1">
                {tool.features.languages.slice(0, 3).map((lang: string) => (
                  <Badge key={lang} variant="secondary">{lang}</Badge>
                ))}
                {tool.features.languages.length > 3 && (
                  <Badge variant="secondary">+{tool.features.languages.length - 3}</Badge>
                )}
              </div>
            </div>
          )}

          <Button className="w-full">자세히 보기</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">AI 코딩 도구 비교</h1>
        <p className="text-muted-foreground">
          2025년 최신 바이브 코딩 도구들을 비교하고 프로젝트에 맞는 최적의 도구를 찾아보세요
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>필터 & 정렬</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="도구 이름으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? '모든 카테고리' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="가격대" />
              </SelectTrigger>
              <SelectContent>
                {priceRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">평점 높은 순</SelectItem>
                <SelectItem value="price_low">가격 낮은 순</SelectItem>
                <SelectItem value="price_high">가격 높은 순</SelectItem>
                <SelectItem value="name">이름순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">카드 보기</TabsTrigger>
          <TabsTrigger value="comparison">비교표</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>도구 비교표</CardTitle>
              <CardDescription>
                주요 기능과 가격을 한눈에 비교해보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">도구</th>
                      <th className="text-left p-2">카테고리</th>
                      <th className="text-left p-2">가격/월</th>
                      <th className="text-left p-2">평점</th>
                      <th className="text-left p-2">AI 완성</th>
                      <th className="text-left p-2">코드 생성</th>
                      <th className="text-left p-2">디버깅</th>
                      <th className="text-left p-2">협업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTools.map((tool) => (
                      <tr key={tool.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{tool.tool_name}</td>
                        <td className="p-2">{tool.category}</td>
                        <td className="p-2">
                          {tool.price_per_month === 0 ? '무료' : `$${tool.price_per_month}`}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {tool.user_ratings?.overall || 0}
                          </div>
                        </td>
                        <td className="p-2">
                          {tool.features?.ai_completion ? '✅' : '❌'}
                        </td>
                        <td className="p-2">
                          {tool.features?.code_generation ? '✅' : '❌'}
                        </td>
                        <td className="p-2">
                          {tool.features?.debugging ? '✅' : '❌'}
                        </td>
                        <td className="p-2">
                          {tool.features?.collaboration ? '✅' : '❌'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stats and Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 가격</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {Math.round(
                filteredTools.reduce((sum, tool) => sum + (tool.price_per_month || 0), 0) /
                filteredTools.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">월 평균 비용</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 평점</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                filteredTools.reduce((sum, tool) => sum + (tool.user_ratings?.overall || 0), 0) /
                filteredTools.length
              ).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">5점 만점</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">도구 수</CardTitle>
            <Code2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTools.length}</div>
            <p className="text-xs text-muted-foreground">검색 결과</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}