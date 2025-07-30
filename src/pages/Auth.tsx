import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Github } from 'lucide-react'

export default function Auth() {
  const { user, signUp, signIn, signInWithProvider } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  // Form states
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpNickname, setSignUpNickname] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await signIn(signInEmail, signInPassword)
      if (!error) {
        navigate('/')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await signUp(signUpEmail, signUpPassword, signUpNickname)
      if (!error) {
        // Don't navigate immediately, user needs to verify email
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setLoading(true)
    try {
      await signInWithProvider(provider)
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">VibeNews에 오신 것을 환영합니다</CardTitle>
          <CardDescription>
            바이브 코딩 트렌드와 커뮤니티에 참여하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">이메일</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">비밀번호</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '로그인 중...' : '로그인'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nickname">닉네임</Label>
                  <Input
                    id="signup-nickname"
                    type="text"
                    placeholder="닉네임을 입력하세요"
                    value={signUpNickname}
                    onChange={(e) => setSignUpNickname(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">이메일</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">비밀번호</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="최소 6자 이상"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '가입 중...' : '회원가입'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="my-6">
            <Separator />
          </div>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 로그인
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSocialLogin('github')}
              disabled={loading}
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub로 로그인
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}