import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MessageCircle, Eye, ExternalLink } from "lucide-react"

// 더미 데이터 - 실제로는 Supabase에서 가져올 예정
const dummyArticles = [
  {
    id: "1",
    title: "AI 기술의 최신 동향과 미래 전망",
    summary: "인공지능 기술이 우리 생활에 미치는 영향과 앞으로의 발전 방향에 대해 살펴봅니다.",
    content: "최근 AI 기술의 발전이 가속화되면서...",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop",
    author: "AI 뉴스팀",
    source_url: "https://example.com/news/1",
    published_at: "2024-01-20",
    tags: ["AI", "기술", "미래"],
    view_count: 1240,
    like_count: 89,
    is_featured: true
  },
  {
    id: "2", 
    title: "친환경 에너지 정책의 새로운 변화",
    summary: "정부의 새로운 친환경 에너지 정책이 발표되면서 관련 업계에 큰 변화가 예상됩니다.",
    content: "정부가 발표한 신재생 에너지 로드맵에 따르면...",
    thumbnail: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=200&fit=crop",
    author: "환경 뉴스팀",
    source_url: "https://example.com/news/2", 
    published_at: "2024-01-19",
    tags: ["환경", "에너지", "정책"],
    view_count: 856,
    like_count: 67,
    is_featured: false
  },
  {
    id: "3",
    title: "글로벌 경제 시장의 최근 동향 분석",
    summary: "세계 경제의 불확실성 속에서 주요 지표들의 변화를 분석해봅니다.",
    content: "글로벌 경제 전문가들은 현재 시장 상황에 대해...",
    thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
    author: "경제 뉴스팀",
    source_url: "https://example.com/news/3",
    published_at: "2024-01-18", 
    tags: ["경제", "시장", "분석"],
    view_count: 2103,
    like_count: 156,
    is_featured: true
  }
]

export default function News() {
  const [activeTab, setActiveTab] = useState("featured")

  const featuredArticles = dummyArticles.filter(article => article.is_featured)
  const allArticles = dummyArticles

  const ArticleCard = ({ article }: { article: typeof dummyArticles[0] }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video overflow-hidden">
        <img 
          src={article.thumbnail} 
          alt={article.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
        />
      </div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{article.author}</Badge>
          <span className="text-sm text-muted-foreground">{article.published_at}</span>
        </div>
        <CardTitle className="line-clamp-2">{article.title}</CardTitle>
        <CardDescription className="line-clamp-3">{article.summary}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {article.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {article.view_count.toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {article.like_count}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              0
            </div>
          </div>
          
          <Button variant="outline" size="sm" asChild>
            <a href={article.source_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              원문 보기
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">뉴스</h1>
        <p className="text-muted-foreground">
          최신 뉴스와 트렌드를 확인하세요
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="featured">추천 뉴스</TabsTrigger>
          <TabsTrigger value="all">전체 뉴스</TabsTrigger>
        </TabsList>
        
        <TabsContent value="featured" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="all" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}