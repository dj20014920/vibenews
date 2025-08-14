import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, ThumbsUp, Bookmark } from 'lucide-react';

// Basic types for the data we will fetch
interface MyPost {
  id: string;
  title: string;
  created_at: string;
  like_count: number;
  comment_count: number;
}

interface MyComment {
  id: string;
  content: string;
  created_at: string;
  post: {
    id: string;
    title: string;
  } | null;
}

interface MyBookmark {
  id: string;
  post: {
    id: string;
    title: string;
    created_at: string;
  } | null;
}

const MyPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [comments, setComments] = useState<MyComment[]>([]);
  const [bookmarks, setBookmarks] = useState<MyBookmark[]>([]);
  const [loading, setLoading] = useState<'posts' | 'comments' | 'bookmarks' | 'none'>('posts');

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    if (!user) return;
    setLoading('posts');
    const { data, error } = await supabase
      .from('v_community_posts')
      .select('id, title, created_at, like_count, comment_count')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setPosts(data);
    setLoading('none');
  };

  const fetchComments = async () => {
    if (!user) return;
    setLoading('comments');
    const { data, error } = await supabase
      .from('v_comments')
      .select('id, content, created_at, post:community_posts(id, title)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setComments(data as MyComment[]);
    setLoading('none');
  };

  const fetchBookmarks = async () => {
    if (!user) return;
    setLoading('bookmarks');
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id, post:community_posts(id, title, created_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setBookmarks(data as MyBookmark[]);
    setLoading('none');
  };

  const onTabChange = (tab: string) => {
    if (tab === 'posts') fetchPosts();
    if (tab === 'comments') fetchComments();
    if (tab === 'bookmarks') fetchBookmarks();
  };

  if (!user) {
    return (
      <div className="container-custom py-8 text-center">
        <p>마이페이지를 보려면 로그인이 필요합니다.</p>
        <Button asChild className="mt-4">
          <Link to="/auth">로그인</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.user_metadata?.avatar_url} />
          <AvatarFallback className="text-2xl">
            {user.user_metadata?.nickname?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{user.user_metadata?.nickname || '사용자'}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Tabs defaultValue="posts" onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">내 게시글</TabsTrigger>
          <TabsTrigger value="comments">내 댓글</TabsTrigger>
          <TabsTrigger value="bookmarks">북마크</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>작성한 게시글</CardTitle>
              <CardDescription>{posts.length}개의 게시글을 작성했습니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading === 'posts' ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                posts.map(post => (
                  <div key={post.id} className="p-3 rounded-lg hover:bg-muted">
                    <Link to={`/community/post/${post.id}`} className="font-semibold">{post.title}</Link>
                    <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> {post.like_count}</div>
                      <div className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {post.comment_count}</div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comments" className="mt-4">
           <Card>
            <CardHeader>
              <CardTitle>작성한 댓글</CardTitle>
              <CardDescription>{comments.length}개의 댓글을 작성했습니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading === 'comments' ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="p-3 rounded-lg hover:bg-muted">
                    <p className="italic">"{comment.content}"</p>
                    <Link to={`/community/post/${comment.post?.id}`} className="text-sm text-muted-foreground hover:underline">
                      - {comment.post?.title || '게시글'}에 작성된 댓글
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bookmarks" className="mt-4">
           <Card>
            <CardHeader>
              <CardTitle>북마크한 게시글</CardTitle>
              <CardDescription>{bookmarks.length}개의 게시글을 북마크했습니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading === 'bookmarks' ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                bookmarks.map(bookmark => (
                  <div key={bookmark.id} className="p-3 rounded-lg hover:bg-muted">
                     <Link to={`/community/post/${bookmark.post?.id}`} className="font-semibold">{bookmark.post?.title}</Link>
                     <p className="text-sm text-muted-foreground">{new Date(bookmark.post?.created_at || 0).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyPage;
