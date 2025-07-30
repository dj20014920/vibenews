import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingUp, Users, Newspaper, Star } from "lucide-react"
import { Link } from "react-router-dom"

const Index = () => {
  const featuredNews = [
    {
      title: "AI 기술의 최신 동향과 미래 전망",
      summary: "인공지능 기술이 우리 생활에 미치는 영향과 앞으로의 발전 방향",
      category: "기술"
    },
    {
      title: "친환경 에너지 정책의 새로운 변화", 
      summary: "정부의 새로운 친환경 에너지 정책이 발표되면서 관련 업계에 큰 변화가 예상",
      category: "환경"
    }
  ]

  const trendingPosts = [
    {
      title: "프론트엔드 최신 트렌드 정리",
      author: "웹마스터",
      likes: 78
    },
    {
      title: "AI 개발 프로젝트 경험 공유",
      author: "AI개발자", 
      likes: 45
    }
  ]

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* 헤로 섹션 */}
      <section className="text-center space-y-4 py-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          VibeNews에 오신 것을 환영합니다
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          최신 뉴스와 개발자 커뮤니티가 만나는 곳. 
          트렌드를 확인하고 인사이트를 공유하세요.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild size="lg">
            <Link to="/news">
              뉴스 보기 <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/community">
              커뮤니티 참여
            </Link>
          </Button>
        </div>
      </section>

      {/* 주요 기능 소개 */}
      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Newspaper className="h-8 w-8 text-primary mb-2" />
            <CardTitle>최신 뉴스</CardTitle>
            <CardDescription>
              AI가 큐레이션한 최신 뉴스와 트렌드를 확인하세요
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-primary mb-2" />
            <CardTitle>활발한 커뮤니티</CardTitle>
            <CardDescription>
              개발자들과 경험을 나누고 함께 성장하세요
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <TrendingUp className="h-8 w-8 text-primary mb-2" />
            <CardTitle>트렌드 분석</CardTitle>
            <CardDescription>
              업계 트렌드와 인사이트를 한눈에 확인하세요
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* 추천 뉴스 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">추천 뉴스</h2>
          <Button variant="ghost" asChild>
            <Link to="/news">
              전체 보기 <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {featuredNews.map((news, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <Badge variant="secondary">{news.category}</Badge>
                </div>
                <CardTitle className="line-clamp-2">{news.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {news.summary}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* 인기 커뮤니티 글 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">인기 커뮤니티 글</h2>
          <Button variant="ghost" asChild>
            <Link to="/community">
              전체 보기 <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="space-y-3">
          {trendingPosts.map((post, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium line-clamp-1">{post.title}</h3>
                    <p className="text-sm text-muted-foreground">by {post.author}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    {post.likes}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
