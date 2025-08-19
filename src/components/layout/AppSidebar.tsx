import { Home, Newspaper, Users, Search, Bookmark, Settings, TrendingUp, Shield, Crown, Store, BookText, Package } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  const mainItems = [
    { title: t('sidebar.news'), url: "/news", icon: Newspaper },
    { title: t('sidebar.community'), url: "/community", icon: Users },
    { title: t('sidebar.search'), url: "/search", icon: Search },
    { title: t('sidebar.store'), url: "/store", icon: Store },
    { title: "인벤토리", url: "/inventory", icon: Package },
    { title: "트렌드", url: "/trends", icon: TrendingUp },
  ]

  const userItems = [
    { title: t('sidebar.bookmarks'), url: "/bookmarks", icon: Bookmark },
    { title: "구독", url: "/subscription", icon: Crown },
    { title: "설정", url: "/settings", icon: Settings },
  ]

  const adminItems = [
    { title: "사용자 관리", url: "/admin/users", icon: Users },
    { title: "기술 용어 관리", url: "/admin", icon: BookText },
  ]

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50"

  return (
    <Sidebar
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메인</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" end className={getNavCls}>
                    <Home className="mr-2 h-4 w-4" />
                    {state !== "collapsed" && <span>홈</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>사용자</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>관리</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}