import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tag, Plus, Minus, Search, TrendingUp } from 'lucide-react';

interface TagFollowData {
  tag_name: string;
  follower_count: number;
  post_count: number;
  recent_activity: number;
  is_following: boolean;
}

export const TagFollowSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [followedTags, setFollowedTags] = useState<TagFollowData[]>([]);
  const [popularTags, setPopularTags] = useState<TagFollowData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TagFollowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFollowedTags();
      fetchPopularTags();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.length > 1) {
      searchTags();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchFollowedTags = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tag_follows')
        .select('tag_name')
        .eq('user_id', user.id);

      if (error) throw error;

      const tagStats = await Promise.all(
        (data || []).map(async (tag) => {
          const stats = await getTagStats(tag.tag_name);
          return {
            ...stats,
            is_following: true
          };
        })
      );

      setFollowedTags(tagStats);
    } catch (error) {
      console.error('Error fetching followed tags:', error);
    }
  };

  const fetchPopularTags = async () => {
    try {
      // 최근 30일간 가장 많이 사용된 태그들을 가져오기
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 뉴스 기사의 태그들
      const { data: newsData } = await supabase
        .from('news_articles')
        .select('tags')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('is_hidden', false);

      // 커뮤니티 포스트의 태그들
      const { data: postsData } = await supabase
        .from('community_posts')
        .select('tags')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('is_hidden', false);

      // 모든 태그를 수집하고 빈도 계산
      const allTags: string[] = [];
      newsData?.forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          allTags.push(...(item.tags as string[]));
        }
      });
      postsData?.forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          allTags.push(...(item.tags as string[]));
        }
      });

      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 상위 20개 태그
      const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([tagName]) => tagName);

      const tagStats = await Promise.all(
        topTags.map(async (tagName) => {
          const stats = await getTagStats(tagName);
          const isFollowing = await checkIfFollowing(tagName);
          return {
            ...stats,
            is_following: isFollowing
          };
        })
      );

      setPopularTags(tagStats);
    } catch (error) {
      console.error('Error fetching popular tags:', error);
    }
  };

  const getTagStats = async (tagName: string): Promise<Omit<TagFollowData, 'is_following'>> => {
    try {
      // 팔로워 수
      const { count: followerCount } = await supabase
        .from('tag_follows')
        .select('*', { count: 'exact' })
        .eq('tag_name', tagName);

      // 최근 30일간 이 태그가 사용된 포스트 수
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: newsCount } = await supabase
        .from('news_articles')
        .select('*', { count: 'exact' })
        .contains('tags', [tagName])
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('is_hidden', false);

      const { count: postCount } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact' })
        .contains('tags', [tagName])
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('is_hidden', false);

      // 최근 7일간 활동 (더 높은 가중치)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentNewsCount } = await supabase
        .from('news_articles')
        .select('*', { count: 'exact' })
        .contains('tags', [tagName])
        .gte('created_at', sevenDaysAgo.toISOString())
        .eq('is_hidden', false);

      const { count: recentPostCount } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact' })
        .contains('tags', [tagName])
        .gte('created_at', sevenDaysAgo.toISOString())
        .eq('is_hidden', false);

      return {
        tag_name: tagName,
        follower_count: followerCount || 0,
        post_count: (newsCount || 0) + (postCount || 0),
        recent_activity: (recentNewsCount || 0) + (recentPostCount || 0)
      };
    } catch (error) {
      console.error('Error getting tag stats:', error);
      return {
        tag_name: tagName,
        follower_count: 0,
        post_count: 0,
        recent_activity: 0
      };
    }
  };

  const checkIfFollowing = async (tagName: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('tag_follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('tag_name', tagName)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  };

  const searchTags = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // 태그 이름이 검색어를 포함하는 태그들 찾기
      const { data: newsData } = await supabase
        .from('news_articles')
        .select('tags')
        .eq('is_hidden', false);

      const { data: postsData } = await supabase
        .from('community_posts')
        .select('tags')
        .eq('is_hidden', false);

      const allTags: string[] = [];
      newsData?.forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          allTags.push(...(item.tags as string[]));
        }
      });
      postsData?.forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          allTags.push(...(item.tags as string[]));
        }
      });

      const uniqueTags = Array.from(new Set(allTags));
      const matchingTags = uniqueTags.filter(tag => 
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10);

      const tagStats = await Promise.all(
        matchingTags.map(async (tagName) => {
          const stats = await getTagStats(tagName);
          const isFollowing = await checkIfFollowing(tagName);
          return {
            ...stats,
            is_following: isFollowing
          };
        })
      );

      setSearchResults(tagStats);
    } catch (error) {
      console.error('Error searching tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTagFollow = async (tagName: string, isCurrentlyFollowing: boolean) => {
    if (!user) return;

    try {
      if (isCurrentlyFollowing) {
        // 언팔로우
        const { error } = await supabase
          .from('tag_follows')
          .delete()
          .eq('user_id', user.id)
          .eq('tag_name', tagName);

        if (error) throw error;

        // 상태 업데이트
        setFollowedTags(prev => prev.filter(tag => tag.tag_name !== tagName));
        setPopularTags(prev => prev.map(tag => 
          tag.tag_name === tagName 
            ? { ...tag, is_following: false, follower_count: tag.follower_count - 1 }
            : tag
        ));
        setSearchResults(prev => prev.map(tag => 
          tag.tag_name === tagName 
            ? { ...tag, is_following: false, follower_count: tag.follower_count - 1 }
            : tag
        ));

        toast({
          title: "태그 팔로우 취소",
          description: `#${tagName} 태그 팔로우를 취소했습니다.`,
        });
      } else {
        // 팔로우
        const { error } = await supabase
          .from('tag_follows')
          .insert({
            user_id: user.id,
            tag_name: tagName
          });

        if (error) throw error;

        // 태그 통계 가져오기
        const stats = await getTagStats(tagName);
        const newTagData = { ...stats, is_following: true };

        // 상태 업데이트
        setFollowedTags(prev => [...prev, newTagData]);
        setPopularTags(prev => prev.map(tag => 
          tag.tag_name === tagName 
            ? { ...tag, is_following: true, follower_count: tag.follower_count + 1 }
            : tag
        ));
        setSearchResults(prev => prev.map(tag => 
          tag.tag_name === tagName 
            ? { ...tag, is_following: true, follower_count: tag.follower_count + 1 }
            : tag
        ));

        toast({
          title: "태그 팔로우",
          description: `#${tagName} 태그를 팔로우했습니다.`,
        });
      }
    } catch (error) {
      console.error('Error toggling tag follow:', error);
      toast({
        title: "오류",
        description: "태그 팔로우 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const TagCard = ({ tag }: { tag: TagFollowData }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4 text-primary" />
            <span className="font-medium">#{tag.tag_name}</span>
          </div>
          <Button
            size="sm"
            variant={tag.is_following ? "outline" : "default"}
            onClick={() => toggleTagFollow(tag.tag_name, tag.is_following)}
          >
            {tag.is_following ? (
              <><Minus className="h-3 w-3 mr-1" />언팔로우</>
            ) : (
              <><Plus className="h-3 w-3 mr-1" />팔로우</>
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-medium text-primary">{tag.follower_count}</div>
            <div className="text-muted-foreground">팔로워</div>
          </div>
          <div>
            <div className="font-medium text-primary">{tag.post_count}</div>
            <div className="text-muted-foreground">게시글</div>
          </div>
          <div>
            <div className="font-medium text-primary">{tag.recent_activity}</div>
            <div className="text-muted-foreground">최근 활동</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>로그인 필요</CardTitle>
        </CardHeader>
        <CardContent>
          <p>태그 팔로우 기능을 사용하려면 로그인이 필요합니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 태그 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            태그 검색
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="관심 있는 태그를 검색하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.map(tag => (
                <TagCard key={tag.tag_name} tag={tag} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 팔로우 중인 태그 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            팔로우 중인 태그 ({followedTags.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {followedTags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {followedTags.map(tag => (
                <TagCard key={tag.tag_name} tag={tag} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 팔로우하는 태그가 없습니다.</p>
              <p className="text-sm">관심 있는 태그를 검색해서 팔로우해보세요!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 인기 태그 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            인기 태그
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {popularTags.map(tag => (
              <TagCard key={tag.tag_name} tag={tag} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};