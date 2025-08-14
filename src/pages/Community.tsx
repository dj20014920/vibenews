import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Eye, Pin, Star, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/seo/SEO";

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  content_simplified?: string;
  author_id?: string | null;
  anonymous_author_id?: string | null;
  is_anonymous: boolean;
  tags: string[];
  tools_used: string[];
  created_at: string;
  updated_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_featured: boolean;
  is_pinned: boolean;
  author?: {
    nickname: string;
    avatar_url?: string;
  };
}

export default function Community() {
  const [activeTab, setActiveTab] = useState("popular");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState<string>('all');

  const rooms = [
    { value: "all", label: "전체" },
    { value: "room:info", label: "정보방" },
    { value: "room:hiring", label: "구인방" },
    { value: "room:promo", label: "홍보방" },
    { value: "room:general", label: "자유토론" },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Use the view to get author info
        let query = supabase
          .from('v_community_posts')
          .select(`
            *,
            author:users(nickname, avatar_url)
          `)
          .eq('is_hidden', false);

        if (activeRoom !== 'all') {
          query = query.contains('tags', [activeRoom]);
        }

        if (activeTab === 'featured') {
          query = query.eq('is_featured', true).order('created_at', { ascending: false });
        } else if (activeTab === 'popular') {
          query = query.order('like_count', { ascending: false }).order('view_count', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query.limit(30);
        if (error) throw error;
        setPosts(data || []);
      } catch (e) {
        console.error('Failed to load community posts', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTab, activeRoom]);

  const PostCard = ({ post }: { post: CommunityPost }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link to={!post.is_anonymous && post.author_id ? `/profile/${post.author_id}` : '#'} className={`flex items-center gap-3 ${!post.is_anonymous && post.author_id ? '' : 'pointer-events-none'}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={!post.is_anonymous ? post.author?.avatar_url : ''} />
                <AvatarFallback>
                  {post.is_anonymous ? '익' : post.author?.nickname?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {post.is_anonymous ? "익명 사용자" : post.author?.nickname || "사용자"}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            {post.is_pinned && <Pin className="h-4 w-4 text-muted-foreground" />}
            {post.is_featured && <Star className="h-4 w-4 text-yellow-500" />}
          </div>
        </div>

        <Link to={`/community/post/${post.id}`}>
          <CardTitle className="line-clamp-2 hover:text-primary transition-colors cursor-pointer">
            {post.title}
          </CardTitle>
        </Link>
        <p className="line-clamp-3 text-muted-foreground">
          {post.content_simplified || post.content}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {post.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {post.tools_used?.length > 0 && (
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
                {post.view_count?.toLocaleString?.() || 0}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {post.like_count || 0}
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {post.comment_count || 0}
              </div>
            </div>

            <Button variant="ghost" size="sm" asChild>
              <Link to={`/community/post/${post.id}`}>자세히 보기</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <SEO
        title="커뮤니티 - 인기/최신/추천 글 | VibeNews"
        description="개발자 커뮤니티의 인기글, 최신글, 추천글을 한 곳에서. 경험을 공유하고 토론에 참여하세요."
        canonicalUrl={`${window.location.origin}/community`}
      />
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">커뮤니티</h1>
          <p className="text-muted-foreground">개발자들과 소통하고 경험을 나누세요</p>
        </div>

        <Button asChild>
          <Link to="/community/write">
            <Plus className="h-4 w-4 mr-2" />
            새 글 작성
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-[600px] grid-cols-3">
            <TabsTrigger value="popular">인기글</TabsTrigger>
            <TabsTrigger value="recent">최신글</TabsTrigger>
            <TabsTrigger value="featured">추천글</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 flex-wrap border-b pb-4">
          <span className="text-sm font-semibold mr-2">카테고리:</span>
          {rooms.map(room => (
            <Button
              key={room.value}
              variant={activeRoom === room.value ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveRoom(room.value)}
            >
              {room.label}
            </Button>
          ))}
        </div>

        <div className="space-y-6">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">불러오는 중...</div>
            ) : (
              <div className="space-y-4">
                {posts.length > 0 ? posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                )) : (
                  <div className="text-center text-muted-foreground py-8">
                    이 카테고리에는 아직 글이 없습니다.
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
