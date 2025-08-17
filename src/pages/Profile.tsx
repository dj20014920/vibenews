import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { User, Settings, Heart, MessageSquare, Bookmark, Users } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  nickname: string
  avatar_url?: string
  bio?: string
  website_url?: string
  github_username?: string
  twitter_username?: string
  created_at: string
}

interface UserStats {
  posts: number
  comments: number
  likes: number
  followers: number
  following: number
}

export default function Profile() {
  const { user } = useAuth()
  const { userId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats>({ posts: 0, comments: 0, likes: 0, followers: 0, following: 0 })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  
  // Edit form states
  const [editForm, setEditForm] = useState({
    nickname: '',
    bio: '',
    website_url: '',
    github_username: '',
    twitter_username: ''
  })

  const isOwnProfile = !userId || userId === user?.id
  const targetUserId = userId || user?.id

  useEffect(() => {
    if (!user && isOwnProfile) {
      navigate('/auth')
      return
    }
    
    if (targetUserId) {
      fetchProfile()
    }
  }, [user, targetUserId, isOwnProfile])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single()

      if (profileError) throw profileError
      
      setProfile(profileData)
      setEditForm({
        nickname: (profileData as any).nickname || '',
        bio: (profileData as any).bio || '',
        website_url: (profileData as any).website_url || '',
        github_username: (profileData as any).github_username || '',
        twitter_username: (profileData as any).twitter_username || ''
      })

      // Fetch user stats
      const [postsResult, commentsResult, likesResult, followersResult, followingResult] = await Promise.all([
        supabase.from('community_posts').select('id', { count: 'exact' }).eq('author_id', targetUserId),
        supabase.from('comments').select('id', { count: 'exact' }).eq('author_id', targetUserId),
        supabase.from('likes').select('id', { count: 'exact' }).eq('user_id', targetUserId),
        supabase.from('user_follows').select('id', { count: 'exact' }).eq('following_id', targetUserId),
        supabase.from('user_follows').select('id', { count: 'exact' }).eq('follower_id', targetUserId)
      ])

      setStats({
        posts: postsResult.count || 0,
        comments: commentsResult.count || 0,
        likes: likesResult.count || 0,
        followers: followersResult.count || 0,
        following: followingResult.count || 0
      })

      // Check if current user is following this profile
      if (user && !isOwnProfile) {
        const { data: followData } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .maybeSingle()
        
        setIsFollowing(!!followData)
      }
    } catch (error: any) {
      toast({
        title: "프로필 로드 실패",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user || !isOwnProfile) return

    try {
      const { error } = await supabase
        .from('users')
        .update(editForm)
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => prev ? { ...prev, ...editForm } : null)
      setEditing(false)
      
      toast({
        title: "프로필 업데이트 완료",
        description: "프로필이 성공적으로 업데이트되었습니다.",
      })
    } catch (error: any) {
      toast({
        title: "프로필 업데이트 실패",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleFollowToggle = async () => {
    if (!user || isOwnProfile) return

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)

        if (error) throw error
        setIsFollowing(false)
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }))
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          })

        if (error) throw error
        setIsFollowing(true)
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }))
      }
    } catch (error: any) {
      toast({
        title: "팔로우 처리 실패",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-6 text-center">
        <h1 className="text-2xl font-bold mb-2">프로필을 찾을 수 없습니다</h1>
        <p className="text-muted-foreground">사용자가 존재하지 않거나 접근할 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} alt={profile.nickname} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{profile.nickname}</h1>
                {!isOwnProfile && user && (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? "언팔로우" : "팔로우"}
                  </Button>
                )}
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(!editing)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {editing ? "취소" : "편집"}
                  </Button>
                )}
              </div>
              
              {profile.bio && (
                <p className="text-muted-foreground mb-3">{profile.bio}</p>
              )}
              
              <div className="flex gap-4 text-sm">
                <span><strong>{stats.followers}</strong> 팔로워</span>
                <span><strong>{stats.following}</strong> 팔로잉</span>
                <span><strong>{stats.posts}</strong> 게시글</span>
                <span><strong>{stats.likes}</strong> 좋아요</span>
              </div>
              
              {(profile.website_url || profile.github_username || profile.twitter_username) && (
                <div className="flex gap-2 mt-3">
                  {profile.website_url && (
                    <Badge variant="secondary">웹사이트</Badge>
                  )}
                  {profile.github_username && (
                    <Badge variant="secondary">GitHub</Badge>
                  )}
                  {profile.twitter_username && (
                    <Badge variant="secondary">Twitter</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        {editing && (
          <CardContent className="border-t">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">프로필 편집</h3>
              
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="nickname">닉네임</Label>
                  <Input
                    id="nickname"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="bio">소개</Label>
                  <Textarea
                    id="bio"
                    placeholder="자신을 소개해보세요..."
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="website">웹사이트</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://your-website.com"
                    value={editForm.website_url}
                    onChange={(e) => setEditForm(prev => ({ ...prev, website_url: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="github">GitHub 사용자명</Label>
                  <Input
                    id="github"
                    placeholder="github-username"
                    value={editForm.github_username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, github_username: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="twitter">Twitter 사용자명</Label>
                  <Input
                    id="twitter"
                    placeholder="twitter-username"
                    value={editForm.twitter_username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, twitter_username: e.target.value }))}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile}>저장</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>취소</Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Profile Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList>
          <TabsTrigger value="posts">게시글</TabsTrigger>
          <TabsTrigger value="comments">댓글</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="bookmarks">북마크</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>작성한 게시글</CardTitle>
              <CardDescription>
                {profile.nickname}님이 작성한 커뮤니티 게시글들입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                게시글 목록 기능은 곧 구현됩니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>작성한 댓글</CardTitle>
              <CardDescription>
                {profile.nickname}님이 작성한 댓글들입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                댓글 목록 기능은 곧 구현됩니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {isOwnProfile && (
          <TabsContent value="bookmarks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>북마크</CardTitle>
                <CardDescription>
                  저장한 뉴스와 게시글입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  북마크 목록 기능은 곧 구현됩니다.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}