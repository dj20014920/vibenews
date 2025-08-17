import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Show button when user scrolls down 300px
  const handleScroll = useCallback(() => {
    if (window.scrollY > 300) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <Button
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 z-40 rounded-full shadow-lg",
        "transition-all duration-300 ease-in-out transform hover:scale-110",
        isMobile ? "w-12 h-12" : "w-14 h-14"
      )}
      onClick={scrollToTop}
      aria-label="맨 위로 스크롤"
    >
      <ArrowUp className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
    </Button>
  )
}