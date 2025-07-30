import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function Settings() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-muted-foreground">
          앱 환경을 설정하세요
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>테마 설정</CardTitle>
            <CardDescription>
              앱의 모양을 원하는 대로 변경하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-toggle">테마 변경</Label>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
            <CardDescription>
              받고 싶은 알림을 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="news-notifications">뉴스 알림</Label>
              <Switch id="news-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="community-notifications">커뮤니티 알림</Label>
              <Switch id="community-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">이메일 알림</Label>
              <Switch id="email-notifications" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>개인정보</CardTitle>
            <CardDescription>
              계정 정보를 관리하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              개인정보 설정은 추후 구현 예정입니다
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}