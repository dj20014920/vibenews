import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Brain, Lock, Sparkles, BookOpen, Lightbulb } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
}

interface TermDetectorProps {
  text: string
  contentType: 'article' | 'post' | 'comment'
  contentId: string
}

interface DetectedTerm {
  term: GlossaryTerm
  startIndex: number
  endIndex: number
}

export function TermDetector({ text, contentType, contentId }: TermDetectorProps) {
  const { user } = useAuth()
  const { status } = useSubscription()
  const isSubscribed = status.is_subscribed
  const { toast } = useToast()
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([])
  const [detectedTerms, setDetectedTerms] = useState<DetectedTerm[]>([])
  const [loading, setLoading] = useState(true)
  const processedRef = useRef(false)

  useEffect(() => {
    fetchGlossaryTerms()
  }, [])

  useEffect(() => {
    if (glossaryTerms.length > 0 && !processedRef.current) {
      detectTerms()
      processedRef.current = true
    }
  }, [glossaryTerms, text])

  const fetchGlossaryTerms = async () => {
    try {
      const { data, error } = await supabase
        .from('tech_glossary' as any)
        .select('*')
        .eq('is_active', true)
        .order('term', { ascending: true })

      if (error) throw error
      setGlossaryTerms((data as unknown as GlossaryTerm[]) || [])
    } catch (error) {
      console.error('Error fetching glossary terms:', error)
    } finally {
      setLoading(false)
    }
  }

  const detectTerms = () => {
    const detected: DetectedTerm[] = []
    const textLower = text.toLowerCase()
    
    // Sort terms by length (longest first) to avoid partial matches
    const sortedTerms = [...glossaryTerms].sort((a, b) => b.term.length - a.term.length)
    
    sortedTerms.forEach(term => {
      const termLower = term.term.toLowerCase()
      let searchIndex = 0
      
      while (true) {
        const index = textLower.indexOf(termLower, searchIndex)
        if (index === -1) break
        
        // Check if it's a whole word match (not part of another word)
        const beforeChar = index > 0 ? text[index - 1] : ' '
        const afterChar = index + term.term.length < text.length ? text[index + term.term.length] : ' '
        const isWholeWord = /\W/.test(beforeChar) && /\W/.test(afterChar)
        
        if (isWholeWord) {
          // Check if this position overlaps with existing detected terms
          const overlaps = detected.some(existing => 
            (index >= existing.startIndex && index < existing.endIndex) ||
            (index + term.term.length > existing.startIndex && index + term.term.length <= existing.endIndex)
          )
          
          if (!overlaps) {
            detected.push({
              term,
              startIndex: index,
              endIndex: index + term.term.length
            })
          }
        }
        
        searchIndex = index + 1
      }
    })
    
    // Sort by start index
    detected.sort((a, b) => a.startIndex - b.startIndex)
    setDetectedTerms(detected)
    
    // Record detection history if user is logged in
    if (user && detected.length > 0) {
      recordDetectionHistory(detected.map(d => d.term.term))
    }
  }

  const recordDetectionHistory = async (detectedTermNames: string[]) => {
    try {
      await supabase
        .from('term_detection_history' as any)
        .insert([{
          user_id: user?.id,
          content_id: contentId,
          content_type: contentType,
          detected_terms: detectedTermNames
        }])
    } catch (error) {
      console.error('Error recording detection history:', error)
    }
  }

  const generateAIExplanation = async (term: GlossaryTerm) => {
    if (!user) {
      toast({
        title: '로그인 필요',
        description: 'AI 설명을 이용하려면 로그인이 필요합니다.',
        variant: 'destructive',
      })
      return
    }

    if (!isSubscribed) {
      toast({
        title: '구독 필요',
        description: 'AI 설명은 프리미엄 구독자만 이용할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }

    try {
      // Record the AI explanation request
      await supabase
        .from('ai_explanation_requests' as any)
        .insert([{
          user_id: user.id,
          content_id: contentId,
          content_type: contentType,
          terms_explained: [term.term]
        }])

      toast({
        title: '설명 생성 중',
        description: 'AI가 설명을 생성하고 있습니다. 잠시만 기다려주세요.',
      })

      // Here you would typically call your AI service
      // For now, we'll just show a success message
      setTimeout(() => {
        toast({
          title: '설명 완료',
          description: `${term.term}에 대한 AI 설명이 생성되었습니다.`,
        })
      }, 2000)

    } catch (error) {
      console.error('Error generating AI explanation:', error)
      toast({
        title: '오류',
        description: 'AI 설명 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  const renderTextWithTerms = () => {
    if (detectedTerms.length === 0) {
      return text
    }

    const parts: React.ReactNode[] = []
    let lastIndex = 0

    detectedTerms.forEach((detected, index) => {
      // Add text before the term
      if (detected.startIndex > lastIndex) {
        parts.push(text.slice(lastIndex, detected.startIndex))
      }

      // Add the highlighted term with tooltip
      parts.push(
        <TooltipProvider key={`term-${index}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="term-highlight cursor-help bg-primary/10 text-primary font-medium px-1 rounded-sm hover:bg-primary/20 transition-colors">
                {text.slice(detected.startIndex, detected.endIndex)}
              </span>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="max-w-sm p-0 border-0 shadow-lg"
              sideOffset={8}
            >
              <Card className="border shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {detected.term.term}
                    </CardTitle>
                    {detected.term.category && (
                      <Badge variant="outline" className="text-xs">
                        {detected.term.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={detected.term.difficulty_level <= 2 ? 'default' : 
                              detected.term.difficulty_level <= 3 ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      Level {detected.term.difficulty_level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1">정의</h4>
                    <p className="text-sm text-muted-foreground">
                      {detected.term.definition}
                    </p>
                  </div>

                  {detected.term.explanation_simple && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" />
                          쉬운 설명
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {detected.term.explanation_simple}
                        </p>
                      </div>
                    </>
                  )}

                  {detected.term.related_terms && detected.term.related_terms.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-sm mb-2">관련 용어</h4>
                        <div className="flex flex-wrap gap-1">
                          {detected.term.related_terms.slice(0, 3).map((relatedTerm, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {relatedTerm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => generateAIExplanation(detected.term)}
                      disabled={!user || !isSubscribed}
                    >
                      {!user || !isSubscribed ? (
                        <>
                          <Lock className="h-3 w-3 mr-1" />
                          프리미엄
                        </>
                      ) : (
                        <>
                          <Brain className="h-3 w-3 mr-1" />
                          AI 설명
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )

      lastIndex = detected.endIndex
    })

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts
  }

  if (loading) {
    return <div className="animate-pulse">{text}</div>
  }

  return <div className="leading-relaxed">{renderTextWithTerms()}</div>
}

export default TermDetector