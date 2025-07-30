import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Eye, Pin, Star, Plus } from "lucide-react"

// 더미 데이터
const dummyPosts = [
  {
    id: "1",
    title: "AI 개발 프로젝트 경험 공유",
    content: "최근 머신러닝 프로젝트를 진행하면서 얻은 인사이트들을 공유하고 싶습니다...",
    content_simplified: "머신러닝 프로젝트 경험담과 얻은 교훈들을 정리했습니다.",
    author_id: "user1",
    anonymous_author_id: null,
    is_anonymous: false,
    tags: ["AI", "머신러닝", "프로젝트"],
    tools_used: ["Python", "TensorFlow", "Jupyter"],
    created_at: "2024-01-20",
    updated_at: "2024-01-20",
    view_count: 892,
    like_count: 45,
    comment_count: 12,
    is_featured: true,
    is_pinned: false,
    author: {
      nickname: "AI개발자",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
    }
  },
  {
    id: "2", 
    title: "프론트엔드 최신 트렌드 정리",
    content: "2024년 프론트엔드 개발 트렌드와 주목해야 할 기술들을 정리해봤습니다...",
    content_simplified: "올해 프론트엔드 개발에서 주목받는 기술들과 트렌드를 소개합니다.",
    author_id: "user2",
    anonymous_author_id: null,
    is_anonymous: false,
    tags: ["프론트엔드", "웹개발", "트렌드"],
    tools_used: ["React", "Next.js", "TypeScript"],
    created_at: "2024-01-19",
    updated_at: "2024-01-19", 
    view_count: 1456,
    like_count: 78,
    comment_count: 23,
    is_featured: false,
    is_pinned: true,
    author: {
      nickname: "웹마스터",
      avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b1e0?w=40&h=40&fit=crop&crop=face"
    }
  },
  {
    id: "3",
    title: "백엔드 아키텍처 설계 고민",
    content: "마이크로서비스 아키텍처 도입을 고려하고 있는데, 어떤 점들을 주의해야 할까요?",
    content_simplified: "마이크로서비스 아키텍처 도입 시 고려사항에 대한 질문입니다.",
    author_id: null,
    anonymous_author_id: "익명_user123",
    is_anonymous: true,
    tags: ["백엔드", "아키텍처", "마이크로서비스"],
    tools_used: ["Node.js", "Docker", "Kubernetes"],
    created_at: "2024-01-18",
    updated_at: "2024-01-18",
    view_count: 634,
    like_count: 29,
    comment_count: 8,
    is_featured: false,
    is_pinned: false,
    author: null
  }
]

export default function Community() {
  const [activeTab, setActiveTab] = useState("popular")

  const popularPosts = dummyPosts.sort((a, b) => b.like_count - a.like_count)
  const recentPosts = dummyPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const featuredPosts = dummyPosts.filter(post => post.is_featured)

  const PostCard = ({ post }: { post: typeof dummyPosts[0] }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {post.is_anonymous ? (
              <Avatar className="h-8 w-8">
                <AvatarFallback>익명</AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.author?.avatar_url} />
                <AvatarFallback>
                  {post.author?.nickname.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="text-sm font-medium">
                {post.is_anonymous ? "익명 사용자" : post.author?.nickname}
              </p>
              <p className="text-xs text-muted-foreground">{post.created_at}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {post.is_pinned && <Pin className="h-4 w-4 text-muted-foreground" />}
            {post.is_featured && <Star className="h-4 w-4 text-yellow-500" />}
          </div>
        </div>
        
        <CardTitle className="line-clamp-2">{post.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {post.content_simplified}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          {post.tools_used.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">사용 도구:</span>
              {post.tools_used.slice(0, 3).map((tool) => (
                <Badge key={tool} variant="outline" className="text-xs">
                  {tool}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.view_count.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {post.like_count}
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {post.comment_count}
              </div>
            </div>
            
            <Button variant="ghost" size="sm">
              자세히 보기
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">커뮤니티</h1>
          <p className="text-muted-foreground">
            개발자들과 소통하고 경험을 나누세요
          </p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          새 글 작성
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[600px] grid-cols-3">
          <TabsTrigger value="popular">인기글</TabsTrigger>
          <TabsTrigger value="recent">최신글</TabsTrigger>
          <TabsTrigger value="featured">추천글</TabsTrigger>
        </TabsList>
        
        <TabsContent value="popular" className="space-y-6">
          <div className="space-y-4">
            {popularPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-6">
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="featured" className="space-y-6">
          <div className="space-y-4">
            {featuredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}