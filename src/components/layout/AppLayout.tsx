import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { SEO, defaultSiteJsonLd } from "@/components/seo/SEO"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Link, useNavigate } from "react-router-dom"
import { User, LogOut, Settings } from "lucide-react"
import { FloatingDiscoveryMenu } from "./FloatingDiscoveryMenu"
import { ScrollToTopButton } from "./ScrollToTopButton"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { HelpCenter } from "@/components/help/HelpCenter"
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <SEO jsonLd={defaultSiteJsonLd()} />
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <h2 className="text-lg font-semibold"><Link to="/" aria-label="메인 화면으로 이동" className="hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">VibeNews</Link></h2>
              </div>
              
              <div className="flex items-center space-x-4">
                <HelpCenter />
                <NotificationBell />
                <ThemeToggle />
                
                {loading ? (
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse" aria-hidden="true" />
                ) : user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuItem asChild>
                        <Link to="/profile">
                          <User className="mr-2 h-4 w-4" />
                          프로필
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          설정
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        로그아웃
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild size="sm">
                    <Link to="/auth">로그인</Link>
                  </Button>
                )}
              </div>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
        </div>
        <FeedbackWidget />
        <FloatingDiscoveryMenu />
        <ScrollToTopButton />
      </div>
    </SidebarProvider>
  )
}