import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Eye, Heart, MessageSquare, Clock, TrendingUp, Sparkles, Code2, Users, Crown, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SEO } from '@/components/seo/SEO'

interface NewsArticle {
  id: string
  title: string
  summary: string
  thumbnail: string
  author: string
  tags: string[]
  published_at: string
  view_count: number
  like_count: number
}

interface CommunityPost {
  id: string
  title: string
  content: string
  tags: string[]
  tools_used: string[]
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  anonymous_author_id: string
  is_anonymous: boolean
}

export default function Index() {
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([])
  const [popularPosts, setPopularPosts] = useState<CommunityPost[]>([])
  const [trendingTags, setTrendingTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHomeData()
  }, [])

  const fetchHomeData = async () => {
    try {
      setLoading(true)
      
      // Fetch latest news
      const { data: newsData } = await supabase
        .from('news_articles')
        .select('id, title, summary, thumbnail, author, tags, published_at, view_count, like_count')
        .eq('is_hidden', false)
        .order('published_at', { ascending: false })
        .limit(6)

      // Fetch popular community posts
      const { data: postsData } = await supabase
        .from('community_posts')
        .select('id, title, content, tags, tools_used, view_count, like_count, comment_count, created_at, anonymous_author_id, is_anonymous')
        .eq('is_hidden', false)
        .order('like_count', { ascending: false })
        .limit(4)

      setLatestNews((newsData || []) as any)
      setPopularPosts((postsData || []) as any)

      // Generate trending tags from both news and posts
      const allTags = [
        ...(newsData?.flatMap(article => Array.isArray(article.tags) ? article.tags as string[] : []) || []),
        ...(postsData?.flatMap((post: any) => Array.isArray(post.tags) ? post.tags as string[] : []) || [])
      ]
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const trending = Object.entries(tagCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 8)
        .map(([tag]) => tag)
      
      setTrendingTags(trending)
    } catch (error) {
      console.error('Error fetching home data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return '방금 전'
    if (diffInHours < 24) return `${diffInHours}시간 전`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  const NewsCard = ({ article }: { article: NewsArticle }) => (
    <Link to={`/news/${article.id}`} className="block" aria-label={`${article.title} 상세 보기`}>
      <Card className="content-card group hover:shadow-lg transition-shadow">
        <div className="relative overflow-hidden">
          <img
            src={article.thumbnail}
            alt={article.title}
            className="content-image"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(article.published_at)}
            </div>
          </div>
        </div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </CardTitle>
          </div>
          <CardDescription className="line-clamp-2">
            {article.summary}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="tag-secondary text-xs">
                {tag}
              </Badge>
            ))}
            {article.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{article.tags.length - 3}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-medium">{article.author}</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.view_count.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {article.like_count}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )

  const CommunityCard = ({ post }: { post: CommunityPost }) => (
    <Card className="content-card group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {post.title}
            </CardTitle>
            <CardDescription className="line-clamp-3">
              {post.content}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1">
          {post.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="tag-secondary text-xs">
              {tag}
            </Badge>
          ))}
          {post.tools_used.slice(0, 1).map((tool) => (
            <Badge key={tool} variant="default" className="tag-primary text-xs">
              {tool}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-medium">
            {post.is_anonymous ? post.anonymous_author_id : '사용자'}
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.view_count}
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {post.like_count}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {post.comment_count}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="container-custom py-8 space-y-8">
        {/* Loading skeleton */}
        <div className="space-y-4">
          <div className="h-12 bg-muted rounded-lg loading-shimmer" />
          <div className="h-6 bg-muted rounded loading-shimmer w-2/3" />
        </div>
        <div className="grid grid-auto-fit gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-video bg-muted rounded-xl loading-shimmer" />
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded loading-shimmer" />
                <div className="h-4 bg-muted rounded loading-shimmer w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO
        title="VibeNews – 바이브 코딩 트렌드 뉴스 & 커뮤니티"
        description="AI 코딩 도구 뉴스와 커뮤니티. Cursor, Lovable, GitHub Copilot 등 최신 트렌드를 한 곳에서."
      />
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10" />
        <div className="container-custom relative">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              2025년 최신 바이브 코딩 트렌드
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-gradient">AI 코딩의 미래</span>
              <br />
              지금 시작하세요
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Cursor, Lovable, GitHub Copilot 등 최신 AI 도구들의 소식과 트렌드를 실시간으로 만나보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="btn-gradient">
                <Link to="/news">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  최신 뉴스 보기
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="btn-glass">
                <Link to="/community">
                  <Users className="mr-2 h-5 w-5" />
                  커뮤니티 참여
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container-custom py-8 space-y-12">
        {/* Latest News Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">최신 뉴스</h2>
              <p className="text-muted-foreground">
                AI 코딩 도구와 관련된 최신 소식을 확인하세요
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/news">
                전체 보기
                <TrendingUp className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-auto-fit gap-6">
            {latestNews.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>

        <Separator className="my-12" />

        {/* Popular Community Posts */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">인기 커뮤니티 글</h2>
              <p className="text-muted-foreground">
                개발자들이 가장 많이 관심을 가지는 글들입니다
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/community">
                전체 보기
                <Users className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {popularPosts.map((post) => (
              <CommunityCard key={post.id} post={post} />
            ))}
          </div>
        </section>

        <Separator className="my-12" />

        {/* Trending Tags */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">트렌딩 태그</h2>
            <p className="text-muted-foreground">
              지금 가장 인기 있는 기술과 도구들입니다
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {trendingTags.map((tag, index) => (
              <Button
                key={tag}
                variant="outline"
                className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:scale-105",
                  index < 3 && "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                )}
                asChild
              >
                <Link to={`/search?q=${encodeURIComponent(tag)}`}>
                  <Code2 className="mr-2 h-4 w-4" />
                  {tag}
                  {index < 3 && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-bl-md">
                      HOT
                    </div>
                  )}
                </Link>
              </Button>
            ))}
          </div>
        </section>

        {/* Premium Features Section */}
        <section className="text-center py-12 space-y-8 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-3xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Crown className="h-4 w-4" />
              Premium 기능
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              AI 코딩의 새로운 차원을 경험하세요
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              프리미엄 구독으로 더 강력한 AI 기능과 무제한 액세스를 누려보세요
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">고급 AI 설명</h3>
              <p className="text-sm text-muted-foreground">
                복잡한 코드도 쉽게 이해할 수 있는 상세한 AI 설명
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">무제한 액세스</h3>
              <p className="text-sm text-muted-foreground">
                모든 기능에 무제한으로 액세스하고 제한 없이 사용
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gold-100 text-gold-600 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">우선 지원</h3>
              <p className="text-sm text-muted-foreground">
                전담 팀의 빠른 응답과 개인화된 지원 서비스
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button asChild size="lg" className="btn-gradient">
              <Link to="/subscription">
                <Crown className="mr-2 h-5 w-5" />
                프리미엄 시작하기
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">
                무료로 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <Separator className="my-12" />

        {/* Call to Action */}
        <section className="text-center py-16 space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              바이브 코딩 커뮤니티에 합류하세요
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              최신 AI 코딩 도구를 배우고, 경험을 공유하며, 함께 성장하는 개발자가 되어보세요
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="btn-gradient">
              <Link to="/auth">
                지금 시작하기
                <Sparkles className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/learning">
                학습 경로 보기
                <Code2 className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
    </>
  )
}