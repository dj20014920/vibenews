import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { 
  Bookmark as BookmarkIcon, 
  Search, 
  Filter, 
  FolderPlus, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Calendar,
  Heart,
  Eye,
  MessageCircle,
  StickyNote
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

interface BookmarkItem {
  id: string
  article_id?: string
  post_id?: string
  folder_name: string
  tags: string[]
  notes?: string
  created_at: string
  // Joined data
  title?: string
  summary?: string
  content?: string
  thumbnail?: string
  source_url?: string
  author_name?: string
  view_count?: number
  like_count?: number
  comment_count?: number
  published_at?: string
  type: 'news' | 'community'
}

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFolder, setSelectedFolder] = useState("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<BookmarkItem | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editFolderName, setEditFolderName] = useState("")
  const [editTags, setEditTags] = useState<string[]>([])
  const { user } = useAuth()

  const loadBookmarks = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Load bookmarks with article/post data
      const { data: bookmarkData, error } = await supabase
        .from('bookmarks')
        .select(`
          *,
          article:news_articles(
            id, title, summary, thumbnail, source_url, author, 
            view_count, like_count, published_at, created_at
          ),
          post:community_posts(
            id, title, content, author_id, is_anonymous, anonymous_author_id,
            view_count, like_count, comment_count, created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process and combine data
      const processedBookmarks: BookmarkItem[] = await Promise.all(
        (bookmarkData || []).map(async (bookmark: any) => {
          let processedItem: BookmarkItem = {
            id: bookmark.id,
            article_id: bookmark.article_id,
            post_id: bookmark.post_id,
            folder_name: bookmark.folder_name || 'default',
            tags: bookmark.tags || [],
            notes: bookmark.notes,
            created_at: bookmark.created_at,
            type: bookmark.article_id ? 'news' : 'community'
          }

          if (bookmark.article_id && bookmark.article) {
            // News article
            processedItem = {
              ...processedItem,
              title: bookmark.article.title,
              summary: bookmark.article.summary,
              thumbnail: bookmark.article.thumbnail,
              source_url: bookmark.article.source_url,
              author_name: bookmark.article.author,
              view_count: bookmark.article.view_count,
              like_count: bookmark.article.like_count,
              published_at: bookmark.article.published_at,
            }
          } else if (bookmark.post_id && bookmark.post) {
            // Community post
            let authorName = '익명'
            
            if (!bookmark.post.is_anonymous && bookmark.post.author_id) {
              const { data: author } = await supabase
                .from('users')
                .select('nickname')
                .eq('id', bookmark.post.author_id)
                .single()
              
              authorName = author?.nickname || '사용자'
            } else if (bookmark.post.anonymous_author_id) {
              authorName = `익명${bookmark.post.anonymous_author_id.slice(-4)}`
            }

            processedItem = {
              ...processedItem,
              title: bookmark.post.title,
              summary: bookmark.post.content?.slice(0, 200) + '...',
              author_name: authorName,
              view_count: bookmark.post.view_count,
              like_count: bookmark.post.like_count,
              comment_count: bookmark.post.comment_count,
              published_at: bookmark.post.created_at,
            }
          }

          return processedItem
        })
      )

      setBookmarks(processedBookmarks)
    } catch (error) {
      console.error('Error loading bookmarks:', error)
      toast.error("북마크를 불러오는 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadBookmarks()
    }
  }, [user])

  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', user?.id)

      if (error) throw error

      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
      toast.success("북마크가 삭제되었습니다")
    } catch (error) {
      console.error('Error deleting bookmark:', error)
      toast.error("북마크 삭제 중 오류가 발생했습니다")
    }
  }

  const handleUpdateBookmark = async () => {
    if (!editingBookmark) return

    try {
      const { error } = await supabase
        .from('bookmarks')
        .update({
          folder_name: editFolderName,
          tags: editTags,
          notes: editNotes
        })
        .eq('id', editingBookmark.id)
        .eq('user_id', user?.id)

      if (error) throw error

      setBookmarks(prev => prev.map(b => 
        b.id === editingBookmark.id 
          ? { ...b, folder_name: editFolderName, tags: editTags, notes: editNotes }
          : b
      ))
      
      setEditingBookmark(null)
      toast.success("북마크가 수정되었습니다")
    } catch (error) {
      console.error('Error updating bookmark:', error)
      toast.error("북마크 수정 중 오류가 발생했습니다")
    }
  }

  const openEditDialog = (bookmark: BookmarkItem) => {
    setEditingBookmark(bookmark)
    setEditFolderName(bookmark.folder_name)
    setEditTags(bookmark.tags)
    setEditNotes(bookmark.notes || "")
  }

  // Filter bookmarks
  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = !searchQuery || 
      bookmark.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFolder = selectedFolder === "all" || bookmark.folder_name === selectedFolder
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => bookmark.tags.includes(tag))
    
    return matchesSearch && matchesFolder && matchesTags
  })

  // Get unique folders and tags
  const folders = [...new Set(bookmarks.map(b => b.folder_name))].filter(Boolean)
  const allTags = [...new Set(bookmarks.flatMap(b => b.tags))].filter(Boolean)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center py-12">
          <BookmarkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">로그인이 필요합니다</h3>
          <p className="text-muted-foreground">
            북마크를 보려면 로그인해주세요
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">북마크</h1>
        <p className="text-muted-foreground">
          저장한 뉴스와 게시글을 확인하세요
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="북마크 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-primary/10" : ""}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">폴더</label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder} value={folder}>
                      {folder}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">태그</label>
              <div className="flex flex-wrap gap-1">
                {allTags.slice(0, 10).map(tag => (
                  <Badge 
                    key={tag} 
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      )
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          총 {filteredBookmarks.length}개의 북마크
        </div>
        {folders.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {folders.length}개 폴더
          </div>
        )}
      </div>

      {/* Bookmarks List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredBookmarks.length > 0 ? (
        <div className="space-y-4">
          {filteredBookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={bookmark.type === 'news' ? 'default' : 'secondary'}>
                        {bookmark.type === 'news' ? '뉴스' : '커뮤니티'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {bookmark.folder_name}
                      </Badge>
                      {bookmark.type === 'news' && bookmark.source_url && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-1"
                          asChild
                        >
                          <a href={bookmark.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-tight">
                      <a 
                        href={bookmark.type === 'news' ? `/news/${bookmark.article_id}` : `/community/post/${bookmark.post_id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {bookmark.title}
                      </a>
                    </CardTitle>
                  </div>
                  {bookmark.thumbnail && (
                    <img 
                      src={bookmark.thumbnail} 
                      alt="" 
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {bookmark.summary && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {bookmark.summary}
                  </p>
                )}
                
                {bookmark.notes && (
                  <div className="bg-muted/50 p-3 rounded-md mb-3">
                    <div className="flex items-center gap-1 mb-1">
                      <StickyNote className="h-3 w-3" />
                      <span className="text-xs font-medium">메모</span>
                    </div>
                    <p className="text-sm">{bookmark.notes}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(bookmark.published_at || bookmark.created_at)}
                  </div>
                  
                  {bookmark.author_name && (
                    <div>작성자: {bookmark.author_name}</div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {bookmark.view_count || 0}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {bookmark.like_count || 0}
                  </div>
                  
                  {bookmark.comment_count !== undefined && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {bookmark.comment_count}
                    </div>
                  )}
                  
                  <div className="text-muted-foreground">
                    북마크: {formatDate(bookmark.created_at)}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex flex-wrap gap-1">
                    {bookmark.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(bookmark)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBookmark(bookmark.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookmarkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || selectedFolder !== "all" || selectedTags.length > 0
              ? "조건에 맞는 북마크가 없습니다"
              : "저장된 북마크가 없습니다"
            }
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedFolder !== "all" || selectedTags.length > 0
              ? "다른 조건으로 검색해보세요"
              : "관심 있는 뉴스나 게시글을 북마크하여 나중에 다시 볼 수 있습니다"
            }
          </p>
        </div>
      )}

      {/* Edit Bookmark Dialog */}
      <Dialog open={!!editingBookmark} onOpenChange={() => setEditingBookmark(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>북마크 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">폴더명</label>
              <Input
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                placeholder="폴더명"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">태그 (쉼표로 구분)</label>
              <Input
                value={editTags.join(', ')}
                onChange={(e) => setEditTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="태그1, 태그2, 태그3"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">메모</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="이 북마크에 대한 메모를 작성하세요"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingBookmark(null)}>
                취소
              </Button>
              <Button onClick={handleUpdateBookmark}>
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}