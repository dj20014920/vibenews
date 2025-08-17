import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, Send, Star, Bug, Lightbulb, Heart } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState("general")
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const feedbackTypes = [
    { value: "bug", label: "버그 신고", icon: <Bug className="h-4 w-4" /> },
    { value: "feature", label: "기능 제안", icon: <Lightbulb className="h-4 w-4" /> },
    { value: "general", label: "일반 피드백", icon: <MessageCircle className="h-4 w-4" /> },
    { value: "praise", label: "칭찬하기", icon: <Heart className="h-4 w-4" /> }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      toast({
        title: "메시지를 입력해주세요",
        description: "피드백 내용을 작성해주세요.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // 피드백을 reports 테이블에 저장 (임시 해결책)
      const { error } = await supabase.from('reports').insert({
        content_type: 'feedback',
        content_id: crypto.randomUUID(), // 임시 ID
        reason: feedbackType,
        description: `Rating: ${rating}/5\nMessage: ${message}\nEmail: ${email || 'Not provided'}`,
        reporter_id: user?.id || null
      })

      if (error) throw error

      toast({
        title: "피드백이 전송되었습니다!",
        description: "소중한 의견 감사합니다. 검토 후 반영하겠습니다."
      })

      // Reset form
      setMessage("")
      setEmail("")
      setRating(0)
      setFeedbackType("general")
      setIsOpen(false)
    } catch (error) {
      console.error('Feedback submission error:', error)
      toast({
        title: "전송 실패",
        description: "피드백 전송 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="fixed bottom-6 right-6 z-50 shadow-lg hover:shadow-xl transition-shadow"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          피드백
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            피드백 보내기
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type */}
          <div className="space-y-3">
            <Label>피드백 유형</Label>
            <RadioGroup 
              value={feedbackType} 
              onValueChange={setFeedbackType}
              className="grid grid-cols-2 gap-2"
            >
              {feedbackTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.value} id={type.value} />
                  <Label htmlFor={type.value} className="flex items-center gap-2 cursor-pointer">
                    {type.icon}
                    {type.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <Label>전체적인 만족도 (선택사항)</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRating(star)}
                  className="p-0 h-8 w-8"
                >
                  <Star 
                    className={`h-5 w-5 ${
                      star <= rating 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-muted-foreground"
                    }`} 
                  />
                </Button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <Label htmlFor="message">메시지 *</Label>
            <Textarea
              id="message"
              placeholder="어떤 부분이 좋았는지, 개선이 필요한 부분은 무엇인지 자유롭게 알려주세요..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-3">
            <Label htmlFor="email">이메일 (선택사항)</Label>
            <input
              id="email"
              type="email"
              placeholder="답변을 받고 싶으시면 이메일을 입력해주세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                "전송 중..."
              ) : (
                <>
                  전송하기
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}