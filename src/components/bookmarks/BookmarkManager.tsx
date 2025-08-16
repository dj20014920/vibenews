import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase as any;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Folder, 
  FolderPlus, 
  Tag, 
  Search, 
  Edit2, 
  Trash2, 
  BookmarkPlus,
  Filter,
  Star,
  Archive
} from 'lucide-react';

interface BookmarkFolder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  bookmark_count: number;
  created_at: string;
}

interface Bookmark {
  id: string;
  folder_name: string;
  tags: string[];
  notes?: string;
  created_at: string;
  article_id?: string;
  post_id?: string;
  // Related content
  article?: {
    id: string;
    title: string;
    summary: string;
    thumbnail?: string;
    author?: string;
    published_at: string;
  };
  post?: {
    id: string;
    title: string;
    content: string;
    author_id?: string;
    created_at: string;
  };
}

export const BookmarkManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 새 폴더 생성 상태
  const [newFolder, setNewFolder] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  const folderColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  const allTags = Array.from(
    new Set(bookmarks.flatMap(bookmark => bookmark.tags))
  ).sort();

  useEffect(() => {
    if (user) {
      fetchFolders();
      fetchBookmarks();
    }
  }, [user]);

  const fetchFolders = async () => {
    try {
      // 폴더별 북마크 수를 계산하기 위한 쿼리
      const { data, error } = await sb
        .from('bookmarks')
        .select('folder_name')
        .eq('user_id', user?.id);

      if (error) throw error;

      // 폴더별 북마크 수 계산
      const folderCounts = (data || []).reduce((acc: Record<string, number>, bookmark) => {
        const folderName = bookmark.folder_name || 'default';
        acc[folderName] = (acc[folderName] || 0) + 1;
        return acc;
      }, {});

      // 기본 폴더들 생성
      const defaultFolders: BookmarkFolder[] = [
        {
          id: 'default',
          name: '기본 폴더',
          description: '기본 북마크 폴더',
          color: '#3b82f6',
          icon: 'folder',
          bookmark_count: folderCounts['default'] || 0,
          created_at: new Date().toISOString()
        },
        {
          id: 'favorites',
          name: '즐겨찾기',
          description: '중요한 북마크들',
          color: '#ef4444',
          icon: 'star',
          bookmark_count: folderCounts['favorites'] || 0,
          created_at: new Date().toISOString()
        },
        {
          id: 'reading-list',
          name: '읽을 목록',
          description: '나중에 읽을 콘텐츠',
          color: '#10b981',
          icon: 'archive',
          bookmark_count: folderCounts['reading-list'] || 0,
          created_at: new Date().toISOString()
        }
      ];

      setFolders(defaultFolders);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({
        title: '오류',
        description: '폴더를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const { data, error } = await sb
        .from('bookmarks')
        .select(`
          *,
          article:news_articles(id, title, summary, thumbnail, author, published_at),
          post:community_posts(id, title, content, author_id, created_at)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookmarks((data as any) || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast({
        title: '오류',
        description: '북마크를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolder.name.trim()) {
      toast({
        title: '오류',
        description: '폴더 이름을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // 실제 구현에서는 별도의 folders 테이블이 필요할 수 있습니다
      // 현재는 클라이언트 상태로만 관리
      const newFolderData: BookmarkFolder = {
        id: Date.now().toString(),
        name: newFolder.name,
        description: newFolder.description,
        color: newFolder.color,
        bookmark_count: 0,
        created_at: new Date().toISOString()
      };

      setFolders(prev => [...prev, newFolderData]);
      setNewFolder({ name: '', description: '', color: '#3b82f6' });
      setIsCreateFolderOpen(false);

      toast({
        title: '성공',
        description: '새 폴더가 생성되었습니다.',
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: '오류',
        description: '폴더 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const moveToFolder = async (bookmarkId: string, folderName: string) => {
    try {
      const { error } = await sb
        .from('bookmarks')
        .update({ folder_name: folderName })
        .eq('id', bookmarkId);

      if (error) throw error;

      await fetchBookmarks();
      await fetchFolders();

      toast({
        title: '성공',
        description: '북마크가 이동되었습니다.',
      });
    } catch (error) {
      console.error('Error moving bookmark:', error);
      toast({
        title: '오류',
        description: '북마크 이동 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const deleteBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await sb
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;

      await fetchBookmarks();
      await fetchFolders();

      toast({
        title: '성공',
        description: '북마크가 삭제되었습니다.',
      });
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast({
        title: '오류',
        description: '북마크 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const updateTags = async (bookmarkId: string, newTags: string[]) => {
    try {
      const { error } = await sb
        .from('bookmarks')
        .update({ tags: newTags })
        .eq('id', bookmarkId);

      if (error) throw error;

      await fetchBookmarks();

      toast({
        title: '성공',
        description: '태그가 업데이트되었습니다.',
      });
    } catch (error) {
      console.error('Error updating tags:', error);
      toast({
        title: '오류',
        description: '태그 업데이트 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 필터링된 북마크
  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesFolder = selectedFolder === 'all' || bookmark.folder_name === selectedFolder;
    const matchesSearch = !searchQuery || 
      (bookmark.article?.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (bookmark.post?.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (bookmark.notes?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => bookmark.tags.includes(tag));
    
    return matchesFolder && matchesSearch && matchesTags;
  });

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>로그인 필요</CardTitle>
        </CardHeader>
        <CardContent>
          <p>북마크 관리 기능을 사용하려면 로그인이 필요합니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Folder className="h-6 w-6" />
            북마크 관리
          </h2>
          <p className="text-muted-foreground">
            저장된 콘텐츠를 폴더와 태그로 체계적으로 관리하세요
          </p>
        </div>

        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
          <DialogTrigger asChild>
            <Button>
              <FolderPlus className="mr-2 h-4 w-4" />
              새 폴더
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 폴더 만들기</DialogTitle>
              <DialogDescription>
                북마크를 정리할 새 폴더를 만듭니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">폴더 이름</label>
                <Input
                  value={newFolder.name}
                  onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="폴더 이름을 입력하세요"
                />
              </div>
              <div>
                <label className="text-sm font-medium">설명 (선택사항)</label>
                <Input
                  value={newFolder.description}
                  onChange={(e) => setNewFolder(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="폴더에 대한 설명"
                />
              </div>
              <div>
                <label className="text-sm font-medium">색상</label>
                <div className="flex gap-2 mt-2">
                  {folderColors.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newFolder.color === color ? 'border-gray-400' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewFolder(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                  취소
                </Button>
                <Button onClick={createFolder}>
                  생성
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 폴더 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">폴더</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <button
              onClick={() => setSelectedFolder('all')}
              className={`p-4 rounded-lg border transition-colors ${
                selectedFolder === 'all' 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'hover:bg-muted'
              }`}
            >
              <div className="text-center">
                <Archive className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">전체</div>
                <div className="text-sm text-muted-foreground">
                  {bookmarks.length}개
                </div>
              </div>
            </button>
            
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.name)}
                className={`p-4 rounded-lg border transition-colors ${
                  selectedFolder === folder.name 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'hover:bg-muted'
                }`}
              >
                <div className="text-center">
                  <div 
                    className="w-6 h-6 mx-auto mb-2 rounded flex items-center justify-center"
                    style={{ backgroundColor: folder.color }}
                  >
                    {folder.icon === 'star' ? (
                      <Star className="h-4 w-4 text-white" />
                    ) : (
                      <Folder className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="font-medium">{folder.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {folder.bookmark_count}개
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            검색 및 필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="제목, 내용, 노트로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {allTags.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">태그 필터</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag)
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 북마크 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            북마크 ({filteredBookmarks.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {bookmarks.length === 0 
                  ? '저장된 북마크가 없습니다.' 
                  : '검색 조건에 맞는 북마크가 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookmarks.map(bookmark => (
                <div key={bookmark.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {bookmark.article?.title || bookmark.post?.title || '제목 없음'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {bookmark.article?.summary || 
                         (bookmark.post?.content?.substring(0, 100) + '...') || 
                         '내용 없음'}
                      </p>
                      {bookmark.notes && (
                        <p className="text-sm text-blue-600 mt-2">
                          📝 {bookmark.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Select
                        value={bookmark.folder_name}
                        onValueChange={(value) => moveToFolder(bookmark.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {folders.map(folder => (
                            <SelectItem key={folder.id} value={folder.name}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBookmark(bookmark.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {bookmark.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {new Date(bookmark.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};