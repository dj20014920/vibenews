import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, UserMinus, Users, Heart, Eye } from 'lucide-react';

interface UserProfile {
  id: string;
  nickname: string;
  bio?: string;
  avatar_url?: string;
  follower_count: number;
  following_count: number;
  post_count: number;
  expertise_areas?: string[];
  is_following?: boolean;
}

interface FollowSystemProps {
  userId?: string;
  showFollowButton?: boolean;
  showStats?: boolean;
}

export const FollowSystem = ({ userId, showFollowButton = true, showStats = true }: FollowSystemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [showFollowModal, setShowFollowModal] = useState<'followers' | 'following' | null>(null);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchUserProfile();
      if (user && targetUserId !== user.id) {
        checkFollowStatus();
      }
    }
  }, [targetUserId, user]);

  const fetchUserProfile = async () => {
    if (!targetUserId) return;

    try {
      // 사용자 기본 정보 가져오기
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, nickname, bio, avatar_url')
        .eq('id', targetUserId)
        .single();

      if (userError) throw userError;

      // 팔로워 수 가져오기
      const { count: followerCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact' })
        .eq('following_id', targetUserId);

      // 팔로잉 수 가져오기
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact' })
        .eq('follower_id', targetUserId);

      // 포스트 수 가져오기
      const { count: postCount } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact' })
        .eq('author_id', targetUserId)
        .eq('is_hidden', false);

      // 멘토 프로필이 있다면 전문 분야 가져오기
      const { data: mentorData } = await supabase
        .from('mentor_profiles')
        .select('expertise_areas')
        .eq('user_id', targetUserId)
        .single();

      setUserProfile({
        ...userData,
        follower_count: followerCount || 0,
        following_count: followingCount || 0,
        post_count: postCount || 0,
        expertise_areas: mentorData?.expertise_areas
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      // 팔로우 관계가 없으면 에러가 발생하는데, 이는 정상적인 상황
      setIsFollowing(false);
    }
  };

  const toggleFollow = async () => {
    if (!user || !targetUserId || targetUserId === user.id) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        // 언팔로우
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;

        setIsFollowing(false);
        setUserProfile(prev => prev ? { ...prev, follower_count: prev.follower_count - 1 } : null);
        
        toast({
          title: "팔로우 취소",
          description: "팔로우를 취소했습니다.",
        });
      } else {
        // 팔로우
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });

        if (error) throw error;

        setIsFollowing(true);
        setUserProfile(prev => prev ? { ...prev, follower_count: prev.follower_count + 1 } : null);
        
        toast({
          title: "팔로우 완료",
          description: "새로운 사용자를 팔로우했습니다.",
        });

        // 팔로우 알림 생성
        await supabase
          .from('notifications')
          .insert({
            user_id: targetUserId,
            type: 'follow',
            title: '새로운 팔로워',
            content: `${user.user_metadata?.nickname || user.email}님이 회원님을 팔로우했습니다.`,
            data: { follower_id: user.id }
          });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "오류",
        description: "팔로우 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowers = async () => {
    if (!targetUserId) return;

    try {
      // 팔로워 ID 목록을 먼저 가져옴
      const { data: followData, error: followError } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', targetUserId);

      if (followError) throw followError;

      if (!followData || followData.length === 0) {
        setFollowers([]);
        return;
      }

      // 팔로워 사용자 정보 조회
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, nickname, bio, avatar_url')
        .in('id', followData.map(f => f.follower_id));

      if (usersError) throw usersError;

      const followersData = usersData?.map(user => ({
        ...user,
        follower_count: 0,
        following_count: 0,
        post_count: 0
      })) || [];

      setFollowers(followersData);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchFollowing = async () => {
    if (!targetUserId) return;

    try {
      // 팔로잉 ID 목록을 먼저 가져옴
      const { data: followData, error: followError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', targetUserId);

      if (followError) throw followError;

      if (!followData || followData.length === 0) {
        setFollowing([]);
        return;
      }

      // 팔로잉 사용자 정보 조회
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, nickname, bio, avatar_url')
        .in('id', followData.map(f => f.following_id));

      if (usersError) throw usersError;

      const followingData = usersData?.map(user => ({
        ...user,
        follower_count: 0,
        following_count: 0,
        post_count: 0
      })) || [];

      setFollowing(followingData);
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 사용자 프로필 카드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {userProfile.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt={userProfile.nickname}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8" />
                </div>
              )}
              <div>
                <CardTitle className="text-xl">{userProfile.nickname}</CardTitle>
                {userProfile.bio && (
                  <p className="text-muted-foreground mt-1">{userProfile.bio}</p>
                )}
                {userProfile.expertise_areas && userProfile.expertise_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {userProfile.expertise_areas.map(area => (
                      <Badge key={area} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {showFollowButton && user && targetUserId !== user.id && (
              <Button
                onClick={toggleFollow}
                disabled={isLoading}
                variant={isFollowing ? "outline" : "default"}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  "처리중..."
                ) : isFollowing ? (
                  <>
                    <UserMinus className="mr-2 h-4 w-4" />
                    언팔로우
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    팔로우
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        {showStats && (
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <button
                onClick={() => {
                  fetchFollowers();
                  setShowFollowModal('followers');
                }}
                className="hover:bg-muted rounded-lg p-2 transition-colors"
              >
                <div className="text-2xl font-bold text-primary">{userProfile.follower_count}</div>
                <div className="text-sm text-muted-foreground">팔로워</div>
              </button>
              
              <button
                onClick={() => {
                  fetchFollowing();
                  setShowFollowModal('following');
                }}
                className="hover:bg-muted rounded-lg p-2 transition-colors"
              >
                <div className="text-2xl font-bold text-primary">{userProfile.following_count}</div>
                <div className="text-sm text-muted-foreground">팔로잉</div>
              </button>
              
              <div className="p-2">
                <div className="text-2xl font-bold text-primary">{userProfile.post_count}</div>
                <div className="text-sm text-muted-foreground">게시글</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 팔로워/팔로잉 모달 */}
      {showFollowModal && (
        <Card className="absolute z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 max-h-96 overflow-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {showFollowModal === 'followers' ? '팔로워' : '팔로잉'} 목록
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFollowModal(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(showFollowModal === 'followers' ? followers : following).map(user => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.nickname}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{user.nickname}</div>
                      {user.bio && (
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {user.bio}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    프로필 보기
                  </Button>
                </div>
              ))}
              
              {(showFollowModal === 'followers' ? followers : following).length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  {showFollowModal === 'followers' 
                    ? '아직 팔로워가 없습니다.' 
                    : '아직 팔로잉하는 사용자가 없습니다.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};