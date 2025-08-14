import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, Code2, ExternalLink, Globe } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface ManagedTool {
  id: string
  name: string
  description: string
  url?: string
  logo_url?: string
  category: 'IDE' | 'CLI' | 'SaaS'
  popularity_sources?: { [key: string]: string }
  created_at: string
}

export default function Tools() {
  const [tools, setTools] = useState<ManagedTool[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    const fetchTools = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('managed_tools')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error("Error fetching tools:", error)
      } else {
        setTools(data as ManagedTool[])
      }
      setLoading(false)
    }
    fetchTools()
  }, [])

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
      const matchesSearch = searchQuery === '' ||
                            tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [tools, activeCategory, searchQuery]);

  const groupedTools = useMemo(() => {
    return filteredTools.reduce((acc, tool) => {
      (acc[tool.category] = acc[tool.category] || []).push(tool);
      return acc;
    }, {} as Record<string, ManagedTool[]>);
  }, [filteredTools]);

  const categories = ['IDE', 'CLI', 'SaaS'];

  const ToolCard = ({ tool }: { tool: ManagedTool }) => (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-start gap-4">
        <img src={tool.logo_url || '/placeholder.svg'} alt={`${tool.name} logo`} className="w-12 h-12 rounded-lg border" />
        <div>
          <CardTitle>{tool.name}</CardTitle>
          <CardDescription>{tool.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{tool.category}</Badge>
          {tool.popularity_sources && Object.keys(tool.popularity_sources).map(source => (
            <Badge key={source} variant="outline" className="capitalize">{source}</Badge>
          ))}
        </div>
      </CardContent>
      <div className="p-6 pt-0">
        {tool.url && (
          <Button asChild className="w-full">
            <a href={tool.url} target="_blank" rel="noopener noreferrer">
              웹사이트 방문 <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">개발 도구 목록</h1>
        <p className="text-muted-foreground">
          VibeNews에서 추천하는 다양한 개발 도구들을 만나보세요.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex gap-4">
          <Input
            placeholder="도구 이름 또는 설명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow"
          />
          <Select value={activeCategory} onValueChange={setActiveCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 카테고리</SelectItem>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-full flex flex-col">
              <CardHeader className="flex-row items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
              <div className="p-6 pt-0">
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTools).length > 0 ? (
            Object.entries(groupedTools).map(([category, toolsInCategory]) => (
              <section key={category}>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Globe className="h-6 w-6" />
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {toolsInCategory.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">해당하는 도구가 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}