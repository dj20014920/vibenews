import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { TrendingUp, ChevronDown, Flame } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface HotContent {
  content_id: string
  content_type: string
  title: string
  hot_score: number
}

export const FloatingDiscoveryMenu = () => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [hotNews, setHotNews] = useState<HotContent[]>([])
  const [hotCommunity, setHotCommunity] = useState<HotContent[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [position, setPosition] = useState({ x: 0.85, y: 0.15 }) // Viewport relative position (0-1)
  const [isDragging, setIsDragging] = useState(false)

  // Check if device is mobile and set initial position
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Set initial position if not set (viewport relative: 0-1)
      if (!position.x && !position.y) {
        setPosition({
          x: 0.9, // 90% from left (center of menu near right edge)
          y: 0.2  // 20% from top (center of menu)
        })
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [position])

  // Load position and expanded state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('floatingMenu_expanded')
    const savedPosition = localStorage.getItem('floatingMenu_position')
    
    if (savedState !== null) {
      try {
        setIsExpanded(JSON.parse(savedState))
      } catch (error) {
        setIsExpanded(true)
      }
    }
    
    if (savedPosition !== null) {
      try {
        const pos = JSON.parse(savedPosition)
        setPosition(pos)
      } catch (error) {
        // Keep default position
      }
    }
  }, [])

  // Save expanded state and position to localStorage
  const toggleExpanded = useCallback(() => {
    const newState = !isExpanded
    setIsExpanded(newState)
    localStorage.setItem('floatingMenu_expanded', JSON.stringify(newState))
  }, [isExpanded])

  const updatePosition = useCallback((newPosition: { x: number; y: number }) => {
    setPosition(newPosition)
    localStorage.setItem('floatingMenu_position', JSON.stringify(newPosition))
  }, [])

  // Calculate actual pixel position from viewport relative position
  const getActualPosition = useCallback(() => {
    const collapsedSize = isMobile ? 60 : 70
    const expandedWidth = isMobile ? 288 : 320
    const expandedHeight = isMobile ? 350 : 400
    
    // Get current viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Always use collapsed button as the anchor point
    // This ensures the same clickable area regardless of expanded state
    const anchorLeft = position.x * viewportWidth - collapsedSize / 2
    const anchorTop = position.y * viewportHeight - collapsedSize / 2
    
    let left, top
    
    if (isExpanded) {
      // For expanded state, position menu so the toggle button area overlaps with collapsed position
      // The toggle button in expanded state is at the right edge of header (with padding)
      const headerPadding = isMobile ? 12 : 16 // p-3 = 12px, p-4 = 16px
      const toggleButtonSize = 24 // sm button size approximately
      const toggleButtonCenter = expandedWidth - headerPadding - toggleButtonSize / 2
      
      // Position the expanded menu so its toggle button center aligns with collapsed button center
      left = anchorLeft - toggleButtonCenter + collapsedSize / 2
      top = anchorTop - headerPadding - toggleButtonSize / 2 + collapsedSize / 2
    } else {
      // For collapsed state, use anchor position directly
      left = anchorLeft
      top = anchorTop
    }
    
    // Get current menu dimensions for boundary checks
    const menuWidth = isExpanded ? expandedWidth : collapsedSize
    const menuHeight = isExpanded ? expandedHeight : collapsedSize
    
    // Ensure menu stays within viewport bounds
    left = Math.max(20, Math.min(left, viewportWidth - menuWidth - 20))
    top = Math.max(20, Math.min(top, viewportHeight - menuHeight - 20))
    
    return { left, top }
  }, [position, isExpanded, isMobile])

  // Drag functionality for both mouse and touch
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    
    const actualPos = getActualPosition()
    const startX = e.clientX - actualPos.left
    const startY = e.clientY - actualPos.top

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate new pixel position
      const newLeft = e.clientX - startX
      const newTop = e.clientY - startY
      
      // Always calculate relative position based on collapsed button center
      const collapsedSize = isMobile ? 60 : 70
      
      // Find where the collapsed button center would be
      let buttonCenterX, buttonCenterY
      
      if (isExpanded) {
        // If currently expanded, find where the collapsed button equivalent would be
        const expandedWidth = isMobile ? 288 : 320
        const headerPadding = isMobile ? 12 : 16
        const toggleButtonSize = 24
        const toggleButtonCenter = expandedWidth - headerPadding - toggleButtonSize / 2
        
        buttonCenterX = newLeft + toggleButtonCenter
        buttonCenterY = newTop + headerPadding + toggleButtonSize / 2
      } else {
        // If currently collapsed, use direct center
        buttonCenterX = newLeft + collapsedSize / 2
        buttonCenterY = newTop + collapsedSize / 2
      }
      
      // Convert to viewport relative position (0-1)
      const newX = buttonCenterX / window.innerWidth
      const newY = buttonCenterY / window.innerHeight
      
      // Clamp to valid range
      const clampedX = Math.max(0, Math.min(1, newX))
      const clampedY = Math.max(0, Math.min(1, newY))
      
      updatePosition({ x: clampedX, y: clampedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [getActualPosition, updatePosition])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    
    const touch = e.touches[0]
    const actualPos = getActualPosition()
    const startX = touch.clientX - actualPos.left
    const startY = touch.clientY - actualPos.top

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const newLeft = touch.clientX - startX
      const newTop = touch.clientY - startY
      
      // Always calculate relative position based on collapsed button center
      const collapsedSize = isMobile ? 60 : 70
      
      // Find where the collapsed button center would be
      let buttonCenterX, buttonCenterY
      
      if (isExpanded) {
        // If currently expanded, find where the collapsed button equivalent would be
        const expandedWidth = isMobile ? 288 : 320
        const headerPadding = isMobile ? 12 : 16
        const toggleButtonSize = 24
        const toggleButtonCenter = expandedWidth - headerPadding - toggleButtonSize / 2
        
        buttonCenterX = newLeft + toggleButtonCenter
        buttonCenterY = newTop + headerPadding + toggleButtonSize / 2
      } else {
        // If currently collapsed, use direct center
        buttonCenterX = newLeft + collapsedSize / 2
        buttonCenterY = newTop + collapsedSize / 2
      }
      
      // Convert to viewport relative position (0-1)
      const newX = buttonCenterX / window.innerWidth
      const newY = buttonCenterY / window.innerHeight
      
      // Clamp to valid range
      const clampedX = Math.max(0, Math.min(1, newX))
      const clampedY = Math.max(0, Math.min(1, newY))
      
      updatePosition({ x: clampedX, y: clampedY })
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  }, [getActualPosition, updatePosition])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Removed scroll event handler - menu is now always visible

  useEffect(() => {
    const fetchHotContent = async () => {
      try {
        setLoading(true)
        // Fetch news directly from news_articles
        const { data: newsData } = await supabase
          .from('news_articles')
          .select('id, title, view_count')
          .order('view_count', { ascending: false })
          .limit(5)

        const newsItems = newsData?.map(item => ({ 
          content_id: item.id, 
          content_type: 'news_article', 
          title: item.title, 
          hot_score: item.view_count 
        })) || []
        setHotNews(newsItems as HotContent[])

        // Fetch community directly from community_posts
        const { data: communityData } = await supabase
          .from('community_posts')
          .select('id, title, view_count')
          .order('view_count', { ascending: false })
          .limit(5)

        const communityItems = communityData?.map(item => ({ 
          content_id: item.id, 
          content_type: 'community_post', 
          title: item.title, 
          hot_score: item.view_count 
        })) || []
        setHotCommunity(communityItems as HotContent[])

        // Calculate total count for collapsed state
        setTotalCount(newsItems.length + communityItems.length)

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

  // Get the actual pixel position from viewport relative position
  const actualPosition = getActualPosition()

  // Collapsed state - show only floating button with counter
  if (!isExpanded) {
    return (
      <div 
        className="fixed z-50 cursor-move"
        style={{ 
          top: actualPosition.top,
          left: actualPosition.left,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <Button
          onClick={(e) => {
            e.stopPropagation()
            toggleExpanded()
          }}
          size={isMobile ? "sm" : "default"}
          className={cn(
            "rounded-full shadow-2xl border-2 border-primary/20 bg-primary/90 backdrop-blur-sm hover:bg-primary",
            "transition-all duration-300 ease-in-out transform hover:scale-105",
            isMobile ? "h-12 w-12" : "h-14 w-14",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          aria-label="인기 콘텐츠 메뉴 펼치기"
        >
          <div className="flex flex-col items-center">
            <Flame className={cn("text-white", isMobile ? "h-4 w-4" : "h-5 w-5")} />
            {totalCount > 0 && (
              <span className={cn(
                "text-white font-bold leading-none",
                isMobile ? "text-xs" : "text-sm"
              )}>
                {totalCount}
              </span>
            )}
          </div>
        </Button>
      </div>
    )
  }

  // Expanded state - full menu
  return (
    <div 
      className="fixed z-50"
      style={{ 
        top: actualPosition.top,
        left: actualPosition.left,
      }}
    >
      <Card className={cn(
        "shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm",
        "transition-all duration-300 ease-in-out transform",
        isMobile ? "w-72" : "w-80",
        isDragging ? "cursor-grabbing" : "cursor-default"
      )}>
        <CardHeader 
          className={cn(
            "flex flex-row items-center justify-between cursor-move",
            isMobile ? "p-3" : "p-4"
          )}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <CardTitle className={cn("flex items-center gap-2", isMobile ? "text-base" : "text-lg")}>
            <TrendingUp className={cn("text-primary", isMobile ? "h-4 w-4" : "h-5 w-5")} />
            실시간 인기 콘텐츠
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              toggleExpanded()
            }}
            className="p-1 h-auto"
            aria-label="메뉴 접기"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="community" className="w-full">
            <TabsList className={cn("grid w-full grid-cols-2", isMobile ? "h-8" : "h-10")}>
              <TabsTrigger value="community" className={isMobile ? "text-xs" : "text-sm"}>
                커뮤니티
              </TabsTrigger>
              <TabsTrigger value="news" className={isMobile ? "text-xs" : "text-sm"}>
                뉴스
              </TabsTrigger>
            </TabsList>
            <TabsContent value="community" className={cn("space-y-2", isMobile ? "p-3" : "p-4")}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">불러오는 중...</p>
                </div>
              ) : (
                hotCommunity.map((item, index) => (
                  <Link
                    key={item.content_id}
                    to={`/community/post/${item.content_id}`}
                    className="block group"
                  >
                    <div className={cn(
                      "flex items-start space-x-2 p-2 rounded-lg hover:bg-primary/5 transition-colors",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      <span className="flex-shrink-0 font-bold text-primary w-4">
                        {index + 1}.
                      </span>
                      <span className="group-hover:text-primary truncate leading-tight">
                        {item.title}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </TabsContent>
            <TabsContent value="news" className={cn("space-y-2", isMobile ? "p-3" : "p-4")}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">불러오는 중...</p>
                </div>
              ) : (
                hotNews.map((item, index) => (
                  <Link
                    key={item.content_id}
                    to={`/news/${item.content_id}`}
                    className="block group"
                  >
                    <div className={cn(
                      "flex items-start space-x-2 p-2 rounded-lg hover:bg-primary/5 transition-colors",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      <span className="flex-shrink-0 font-bold text-primary w-4">
                        {index + 1}.
                      </span>
                      <span className="group-hover:text-primary truncate leading-tight">
                        {item.title}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
