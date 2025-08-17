import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Code2, Users, TrendingUp, ArrowRight, X } from "lucide-react"
import { Link } from "react-router-dom"

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  isFirstVisit?: boolean
}

export function WelcomeModal({ isOpen, onClose, isFirstVisit = false }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const features = [
    {
      icon: <TrendingUp className="h-8 w-8 text-blue-500" />,
      title: "최신 AI 코딩 뉴스",
      description: "Cursor, Lovable, GitHub Copilot 등 최신 AI 도구 소식을 실시간으로 받아보세요",
      action: { text: "뉴스 보기", link: "/news" }
    },
    {
      icon: <Users className="h-8 w-8 text-purple-500" />,
      title: "개발자 커뮤니티",
      description: "경험을 공유하고, 질문하고, 함께 배우는 개발자 커뮤니티에 참여하세요",
      action: { text: "커뮤니티 참여", link: "/community" }
    },
    {
      icon: <Code2 className="h-8 w-8 text-green-500" />,
      title: "도구 & 리소스",
      description: "개발 생산성을 높이는 도구들과 학습 자료를 발견하세요",
      action: { text: "도구 탐색", link: "/tools" }
    }
  ]

  const handleNext = () => {
    if (currentStep < features.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6">
          <DialogHeader className="text-center space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                VibeNews에 오신 걸 환영합니다!
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogTitle className="text-2xl font-bold">
              AI 코딩의 새로운 경험을 시작하세요
            </DialogTitle>
            <DialogDescription className="text-lg">
              최신 기술 트렌드와 개발자 커뮤니티를 한 곳에서 만나보세요
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 space-y-6">
            {/* Progress Indicator */}
            <div className="flex justify-center space-x-2">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    index <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Feature Card */}
            <Card className="border-2 border-primary/20">
              <CardContent className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  {features[currentStep].icon}
                </div>
                <h3 className="text-xl font-semibold">
                  {features[currentStep].title}
                </h3>
                <p className="text-muted-foreground">
                  {features[currentStep].description}
                </p>
                <Button asChild className="w-full">
                  <Link to={features[currentStep].action.link} onClick={onClose}>
                    {features[currentStep].action.text}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleSkip}>
                건너뛰기
              </Button>
              <Button onClick={handleNext}>
                {currentStep < features.length - 1 ? "다음" : "시작하기"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}