import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, nickname: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  signInWithProvider: (provider: 'google' | 'github') => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Create user profile if new user
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            try {
              const { data: existingProfile } = await supabase
                .from('users')
                .select('id')
                .eq('id', session.user.id)
                .maybeSingle()

              if (!existingProfile) {
                await supabase.from('users').insert({
                  id: session.user.id,
                  email: session.user.email!,
                  nickname: session.user.user_metadata?.nickname || session.user.email?.split('@')[0] || 'User',
                  provider: session.user.app_metadata?.provider || 'email',
                  avatar_url: session.user.user_metadata?.avatar_url
                })
              }
            } catch (error) {
              console.error('Error creating user profile:', error)
            }
          }, 0)
        }
      }
    )

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, nickname: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nickname: nickname
          }
        }
      })

      if (error) {
        toast({
          title: "회원가입 실패",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "회원가입 성공",
          description: "이메일을 확인하여 계정을 활성화하세요.",
        })
      }

      return { error }
    } catch (error: any) {
      toast({
        title: "회원가입 실패",
        description: error.message,
        variant: "destructive",
      })
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast({
          title: "로그인 실패",
          description: error.message,
          variant: "destructive",
        })
      }

      return { error }
    } catch (error: any) {
      toast({
        title: "로그인 실패",
        description: error.message,
        variant: "destructive",
      })
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "로그아웃 완료",
        description: "성공적으로 로그아웃되었습니다.",
      })
    } catch (error: any) {
      toast({
        title: "로그아웃 실패",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const signInWithProvider = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })

      if (error) {
        toast({
          title: "소셜 로그인 실패",
          description: error.message,
          variant: "destructive",
        })
      }

      return { error }
    } catch (error: any) {
      toast({
        title: "소셜 로그인 실패",
        description: error.message,
        variant: "destructive",
      })
      return { error }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      signInWithProvider
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}