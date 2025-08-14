import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowUp, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

interface HotContent {
  content_id: string
  content_type: string
  title: string
  hot_score: number
}

export const FloatingDiscoveryMenu = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [hotNews, setHotNews] = useState<HotContent[]>([])
  const [hotCommunity, setHotCommunity] = useState<HotContent[]>([])
  const [loading, setLoading] = useState(true)

  const handleScroll = () => {
    if (window.scrollY > 500) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchHotContent = async () => {
      try {
        setLoading(true)
        // Fetch news
        const { data: newsData } = await supabase
          .from('trending_scores')
          .select('content_id, content_type, hot_score, post:news_articles(title)')
          .eq('content_type', 'news_article')
          .order('hot_score', { ascending: false })
          .limit(5)

        const newsItems = newsData?.map(item => ({ ...item, title: item.post.title })) || []
        setHotNews(newsItems as HotContent[])

        // Fetch community
        const { data: communityData } = await supabase
          .from('trending_scores')
          .select('content_id, content_type, hot_score, post:community_posts(title)')
          .eq('content_type', 'community_post')
          .order('hot_score', { ascending: false })
          .limit(5)

        const communityItems = communityData?.map(item => ({ ...item, title: item.post.title })) || []
        setHotCommunity(communityItems as HotContent[])

      } catch (error) {
        console.error("Error fetching hot content:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHotContent()
    const interval = setInterval(fetchHotContent, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      <Card className="w-80 shadow-2xl border-2 border-primary/20 bg-background/80 backdrop-blur-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            실시간 인기 콘텐츠
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="community" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="community">커뮤니티</TabsTrigger>
              <TabsTrigger value="news">뉴스</TabsTrigger>
            </TabsList>
            <TabsContent value="community" className="p-4 space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">불러오는 중...</p>
              ) : (
                hotCommunity.map((item, index) => (
                  <Link
                    key={item.content_id}
                    to={`/community/post/${item.content_id}`}
                    className="block text-sm hover:text-primary truncate"
                  >
                    <span className="font-bold mr-2">{index + 1}.</span>{item.title}
                  </Link>
                ))
              )}
            </TabsContent>
            <TabsContent value="news" className="p-4 space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">불러오는 중...</p>
              ) : (
                hotNews.map((item, index) => (
                  <Link
                    key={item.content_id}
                    to={`/news/${item.content_id}`}
                    className="block text-sm hover:text-primary truncate"
                  >
                    <span className="font-bold mr-2">{index + 1}.</span>{item.title}
                  </Link>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Button
        size="icon"
        className="rounded-full shadow-lg w-12 h-12 ml-auto block"
        onClick={scrollToTop}
        aria-label="맨 위로 스크롤"
      >
        <ArrowUp className="h-6 w-6" />
      </Button>
    </div>
  )
}
