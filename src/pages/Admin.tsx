import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Brain, 
  Shield,
  Search
} from 'lucide-react'
import { NewsCollector } from '@/components/admin/NewsCollector'
import { ContentAutomation } from '@/components/admin/ContentAutomation'

interface GlossaryTerm {
  id: string
  term: string
  definition: string
  explanation_simple: string | null
  explanation_detailed: string | null
  category: string | null
  difficulty_level: number
  related_terms: string[] | null
  usage_examples: any[] | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export default function Admin() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    term: '',
    definition: '',
    explanation_simple: '',
    explanation_detailed: '',
    category: '',
    difficulty_level: 1,
    related_terms: '',
    usage_examples: '',
    is_active: true
  })

  const categories = [
    'AI 도구',
    'React',
    'TypeScript',
    'Next.js',
    'Node.js',
    'Database',
    'DevOps',
    'UI/UX',
    '백엔드',
    '프론트엔드',
    '기타'
  ]

  useEffect(() => {
    fetchTerms()
  }, [])

  const fetchTerms = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tech_glossary' as any)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTerms((data as unknown as GlossaryTerm[]) || [])
    } catch (error) {
      console.error('Error fetching terms:', error)
      toast({
        title: '오류',
        description: '용어를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const termData = {
        ...formData,
        related_terms: formData.related_terms 
          ? formData.related_terms.split(',').map(s => s.trim()) 
          : [],
        usage_examples: formData.usage_examples 
          ? JSON.parse(`[${formData.usage_examples}]`) 
          : [],
      }

      if (editingTerm) {
        const { error } = await supabase
          .from('tech_glossary' as any)
          .update(termData)
          .eq('id', editingTerm.id)
        
        if (error) throw error
        
        toast({
          title: '성공',
          description: '용어가 성공적으로 수정되었습니다.',
        })
      } else {
        const { error } = await supabase
          .from('tech_glossary' as any)
          .insert([termData])
        
        if (error) throw error
        
        toast({
          title: '성공',
          description: '새 용어가 성공적으로 추가되었습니다.',
        })
      }

      resetForm()
      setIsDialogOpen(false)
      fetchTerms()
    } catch (error) {
      console.error('Error saving term:', error)
      toast({
        title: '오류',
        description: '용어 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      term: '',
      definition: '',
      explanation_simple: '',
      explanation_detailed: '',
      category: '',
      difficulty_level: 1,
      related_terms: '',
      usage_examples: '',
      is_active: true
    })
    setEditingTerm(null)
  }

  const handleEdit = (term: GlossaryTerm) => {
    setEditingTerm(term)
    setFormData({
      term: term.term,
      definition: term.definition,
      explanation_simple: term.explanation_simple || '',
      explanation_detailed: term.explanation_detailed || '',
      category: term.category || '',
      difficulty_level: term.difficulty_level,
      related_terms: term.related_terms?.join(', ') || '',
      usage_examples: JSON.stringify(term.usage_examples || []),
      is_active: term.is_active
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 용어를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('tech_glossary' as any)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      toast({
        title: '성공',
        description: '용어가 성공적으로 삭제되었습니다.',
      })
      
      fetchTerms()
    } catch (error) {
      console.error('Error deleting term:', error)
      toast({
        title: '오류',
        description: '용어 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tech_glossary' as any)
        .update({ is_active: !currentStatus })
        .eq('id', id)
      
      if (error) throw error
      
      toast({
        title: '성공',
        description: `용어가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`,
      })
      
      fetchTerms()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: '오류',
        description: '상태 변경 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  const filteredTerms = terms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         term.definition.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Check if user has admin permissions
  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              접근 권한 필요
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>관리자 페이지에 접근하려면 로그인이 필요합니다.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Content Automation */}
      <ContentAutomation />

      {/* News Collector */}
      <NewsCollector />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            관리자 대시보드
          </h1>
          <p className="text-muted-foreground">
            콘텐츠 자동화 및 기술 용어 사전을 관리하세요
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              새 용어 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTerm ? '용어 수정' : '새 용어 추가'}
              </DialogTitle>
              <DialogDescription>
                기술 용어의 정보를 입력하세요. 모든 필드를 정확히 작성해주세요.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="term">용어 *</Label>
                  <Input
                    id="term"
                    value={formData.term}
                    onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
                    placeholder="예: React"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="definition">정의 *</Label>
                <Textarea
                  id="definition"
                  value={formData.definition}
                  onChange={(e) => setFormData(prev => ({ ...prev, definition: e.target.value }))}
                  placeholder="기술적이고 정확한 정의를 입력하세요"
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation_simple">간단한 설명</Label>
                <Textarea
                  id="explanation_simple"
                  value={formData.explanation_simple}
                  onChange={(e) => setFormData(prev => ({ ...prev, explanation_simple: e.target.value }))}
                  placeholder="비개발자도 이해할 수 있는 쉬운 설명"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation_detailed">상세한 설명</Label>
                <Textarea
                  id="explanation_detailed"
                  value={formData.explanation_detailed}
                  onChange={(e) => setFormData(prev => ({ ...prev, explanation_detailed: e.target.value }))}
                  placeholder="개발자를 위한 상세하고 기술적인 설명"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty_level">난이도 (1-5)</Label>
                  <Select
                    value={formData.difficulty_level.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - 초급</SelectItem>
                      <SelectItem value="2">2 - 초중급</SelectItem>
                      <SelectItem value="3">3 - 중급</SelectItem>
                      <SelectItem value="4">4 - 중고급</SelectItem>
                      <SelectItem value="5">5 - 고급</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="related_terms">관련 용어</Label>
                  <Input
                    id="related_terms"
                    value={formData.related_terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, related_terms: e.target.value }))}
                    placeholder="React, Component, JSX (쉼표로 구분)"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  취소
                </Button>
                <Button type="submit">
                  {editingTerm ? '수정' : '추가'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="용어 또는 정의로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="카테고리 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 카테고리</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Terms Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            용어 목록 ({filteredTerms.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : filteredTerms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>용어</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>난이도</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTerms.map((term) => (
                    <TableRow key={term.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{term.term}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {term.definition}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {term.category && (
                          <Badge variant="outline">{term.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={term.difficulty_level <= 2 ? 'default' : 
                                  term.difficulty_level <= 3 ? 'secondary' : 'destructive'}
                        >
                          Level {term.difficulty_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(term.id, term.is_active)}
                          className={term.is_active ? 'text-green-600' : 'text-red-600'}
                        >
                          {term.is_active ? '활성' : '비활성'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(term)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(term.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}