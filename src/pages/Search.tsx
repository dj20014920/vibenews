import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search as SearchIcon, Filter } from "lucide-react"

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // 검색 로직 구현 예정
    console.log("Searching for:", searchQuery)
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
          />
        </div>
        <Button type="submit">
          검색
        </Button>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </form>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[600px] grid-cols-3">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="news">뉴스</TabsTrigger>
          <TabsTrigger value="community">커뮤니티</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          <div className="text-center py-12">
            <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">검색을 시작하세요</h3>
            <p className="text-muted-foreground">
              위 검색창에 키워드를 입력하여 원하는 내용을 찾아보세요
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="news" className="space-y-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">뉴스 검색 결과가 여기에 표시됩니다</p>
          </div>
        </TabsContent>
        
        <TabsContent value="community" className="space-y-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">커뮤니티 검색 결과가 여기에 표시됩니다</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}