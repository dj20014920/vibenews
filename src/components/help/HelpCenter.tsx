import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, HelpCircle, ChevronDown, MessageCircle, Book, Users, Code, Star } from "lucide-react"
import { Link } from "react-router-dom"

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const faqCategories = [
    {
      title: "시작하기",
      icon: <Book className="h-5 w-5" />,
      items: [
        {
          question: "VibeNews는 어떤 서비스인가요?",
          answer: "VibeNews는 AI 코딩 도구와 관련된 최신 뉴스, 트렌드, 그리고 개발자 커뮤니티를 제공하는 플랫폼입니다. Cursor, Lovable, GitHub Copilot 등의 최신 소식을 한 곳에서 확인할 수 있습니다.",
          tags: ["소개", "플랫폼"]
        },
        {
          question: "회원가입은 어떻게 하나요?",
          answer: "우상단의 '로그인' 버튼을 클릭하고 '회원가입' 탭으로 이동한 후, 이메일과 비밀번호를 입력하여 가입할 수 있습니다. 가입 후 이메일 인증을 완료해주세요.",
          tags: ["회원가입", "인증"]
        },
        {
          question: "무료로 이용할 수 있나요?",
          answer: "네, 기본적인 뉴스 읽기, 커뮤니티 참여, 북마크 기능은 무료로 이용하실 수 있습니다. 프리미엄 구독을 통해 고급 AI 설명, 무제한 액세스 등 추가 기능을 이용할 수 있습니다.",
          tags: ["무료", "프리미엄"]
        }
      ]
    },
    {
      title: "커뮤니티",
      icon: <Users className="h-5 w-5" />,
      items: [
        {
          question: "커뮤니티에 글을 작성하려면 어떻게 해야 하나요?",
          answer: "로그인 후 '커뮤니티' 페이지에서 '글 작성' 버튼을 클릭하여 새 게시글을 작성할 수 있습니다. 제목, 내용, 태그, 사용한 도구 등을 입력할 수 있습니다.",
          tags: ["글작성", "커뮤니티"]
        },
        {
          question: "익명으로 글을 작성할 수 있나요?",
          answer: "네, 글 작성 시 '익명으로 작성' 옵션을 선택하면 익명으로 게시할 수 있습니다. 익명 게시글은 작성자 정보가 표시되지 않습니다.",
          tags: ["익명", "개인정보"]
        },
        {
          question: "부적절한 게시글은 어떻게 신고하나요?",
          answer: "각 게시글의 옵션 메뉴에서 '신고하기'를 선택하여 부적절한 콘텐츠를 신고할 수 있습니다. 신고된 내용은 관리자가 검토합니다.",
          tags: ["신고", "관리"]
        }
      ]
    },
    {
      title: "기능 사용법",
      icon: <Code className="h-5 w-5" />,
      items: [
        {
          question: "북마크 기능은 어떻게 사용하나요?",
          answer: "관심 있는 뉴스나 게시글의 북마크 아이콘을 클릭하여 저장할 수 있습니다. 저장된 항목은 '북마크' 페이지에서 확인할 수 있습니다.",
          tags: ["북마크", "저장"]
        },
        {
          question: "검색은 어떻게 하나요?",
          answer: "상단 메뉴의 '검색' 페이지에서 키워드를 입력하여 뉴스, 커뮤니티 게시글, 태그 등을 검색할 수 있습니다. 고급 필터 옵션도 제공됩니다.",
          tags: ["검색", "필터"]
        },
        {
          question: "AI 설명 기능이 무엇인가요?",
          answer: "복잡한 기술 용어나 개념을 AI가 쉽게 설명해주는 기능입니다. 프리미엄 사용자는 더 상세한 AI 설명을 받을 수 있습니다.",
          tags: ["AI", "설명"]
        }
      ]
    }
  ]

  const quickHelp = [
    {
      title: "시작 가이드",
      description: "처음 사용하시는 분들을 위한 단계별 가이드",
      icon: <Book className="h-6 w-6 text-blue-500" />,
      action: { text: "가이드 보기", link: "/learning" }
    },
    {
      title: "커뮤니티 가이드라인",
      description: "건전한 커뮤니티 문화를 위한 가이드라인",
      icon: <Users className="h-6 w-6 text-green-500" />,
      action: { text: "가이드라인 보기", link: "/community" }
    },
    {
      title: "프리미엄 기능",
      description: "프리미엄 구독의 혜택과 기능 소개",
      icon: <Star className="h-6 w-6 text-gold-500" />,
      action: { text: "프리미엄 보기", link: "/subscription" }
    }
  ]

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(category => category.items.length > 0)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="mr-2 h-4 w-4" />
          도움말
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            도움말 센터
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="궁금한 것을 검색해보세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Help */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickHelp.map((item, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <CardTitle className="text-sm">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-xs mb-3">
                    {item.description}
                  </CardDescription>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link to={item.action.link} onClick={() => setIsOpen(false)}>
                      {item.action.text}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">자주 묻는 질문</h3>
            {filteredFAQs.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {category.icon}
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <Collapsible key={itemIndex}>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between text-left h-auto p-3"
                        >
                          <span className="font-medium">{item.question}</span>
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-3 pb-3">
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.answer}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                원하는 답변을 찾지 못하셨나요?
              </p>
              <Button size="sm" onClick={() => setIsOpen(false)}>
                <MessageCircle className="mr-2 h-4 w-4" />
                피드백 보내기
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}