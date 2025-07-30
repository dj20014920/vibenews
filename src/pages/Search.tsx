import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Search as SearchIcon, Filter, Calendar, Heart, Eye, MessageCircle, ExternalLink } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

interface SearchResult {
  id: string
  type: 'news' | 'community'
  title: string
  snippet: string
  author?: string
  author_name?: string
  tags: string[]
  created_at: string
  published_at?: string
  view_count: number
  like_count: number
  comment_count?: number
  thumbnail?: string
  source_url?: string
  relevance_score: number
}

interface SearchResponse {
  success: boolean
  results: SearchResult[]
  total_count: number
  query: string
  type: string
  sort_by: string
  has_more: boolean
}

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [sortBy, setSortBy] = useState("relevance")
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const { user } = useAuth()

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast.error("검색어는 최소 2글자 이상 입력해주세요")
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const { data, error } = await supabase.functions.invoke('search-content', {
        body: {
          query: searchQuery.trim(),
          type: activeTab,
          tags: selectedTags,
          sortBy,
          limit: 20,
          offset: 0
        }
      })

      if (error) throw error

      const response: SearchResponse = data
      setSearchResults(response.results || [])
      setTotalCount(response.total_count || 0)
      
    } catch (error) {
      console.error('Search error:', error)
      toast.error("검색 중 오류가 발생했습니다")
      setSearchResults([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Search when tab or sort changes
  useEffect(() => {
    if (hasSearched && searchQuery.trim()) {
      handleSearch()
    }
  }, [activeTab, sortBy])

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">검색</h1>
        <p className="text-muted-foreground">
          뉴스와 커뮤니티 글을 검색하세요
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="검색어를 입력하세요..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "검색 중..." : "검색"}
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-primary/10" : ""}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </form>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">정렬 기준</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">관련성</SelectItem>
                  <SelectItem value="date">최신순</SelectItem>
                  <SelectItem value="popularity">인기순</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedTags.length > 0 && (
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">선택된 태그</label>
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center">
          <TabsList className="grid grid-cols-3 w-full max-w-[400px]">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="news">뉴스</TabsTrigger>
            <TabsTrigger value="community">커뮤니티</TabsTrigger>
          </TabsList>
          
          {hasSearched && (
            <div className="text-sm text-muted-foreground">
              총 {totalCount}개 결과
            </div>
          )}
        </div>
        
        {/* Search Results */}
        <div className="mt-6">
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
          ) : hasSearched ? (
            searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <Card key={`${result.type}-${result.id}`} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={result.type === 'news' ? 'default' : 'secondary'}>
                              {result.type === 'news' ? '뉴스' : '커뮤니티'}
                            </Badge>
                            {result.type === 'news' && result.source_url && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-auto p-1"
                                asChild
                              >
                                <a href={result.source_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                          <CardTitle className="text-lg leading-tight">
                            <a 
                              href={result.type === 'news' ? `/news/${result.id}` : `/community/post/${result.id}`}
                              className="hover:text-primary transition-colors"
                            >
                              {result.title}
                            </a>
                          </CardTitle>
                        </div>
                        {result.thumbnail && (
                          <img 
                            src={result.thumbnail} 
                            alt="" 
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div 
                        className="text-sm text-muted-foreground mb-3 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: result.snippet }}
                      />
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(result.published_at || result.created_at)}
                        </div>
                        
                        {result.author_name && (
                          <div>작성자: {result.author_name}</div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {result.view_count}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {result.like_count}
                        </div>
                        
                        {result.comment_count !== undefined && (
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {result.comment_count}
                          </div>
                        )}
                      </div>
                      
                      {result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {result.tags.slice(0, 5).map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-primary/10"
                              onClick={() => handleTagToggle(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {result.tags.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{result.tags.length - 5}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">검색 결과가 없습니다</h3>
                <p className="text-muted-foreground">
                  다른 키워드로 검색해보세요
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">검색을 시작하세요</h3>
              <p className="text-muted-foreground">
                위 검색창에 키워드를 입력하여 원하는 내용을 찾아보세요
              </p>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  )
}