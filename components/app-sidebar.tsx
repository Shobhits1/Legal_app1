"use client"

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  FileText,
  Scale,
  BookOpen,
  Mic,
  Search,
  BarChart3,
  Settings,
  User,
  ChevronUp,
  Shield,
  LogOut,
  Heart,
  Brain,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/10" },
  { title: "FIR Assistant", url: "/fir-assistant", icon: FileText, iconColor: "text-blue-400", iconBg: "bg-blue-500/10" },
  { title: "Case Classifier", url: "/classifier", icon: Brain, iconColor: "text-amber-400", iconBg: "bg-amber-500/10" },
  { title: "Case Laws", url: "/case-laws", icon: Scale, iconColor: "text-purple-400", iconBg: "bg-purple-500/10" },
  { title: "Legal Sections", url: "/legal-sections", icon: BookOpen, iconColor: "text-pink-400", iconBg: "bg-pink-500/10" },
  { title: "Voice Input", url: "/voice-input", icon: Mic, iconColor: "text-indigo-400", iconBg: "bg-indigo-500/10" },
];

const toolsItems = [
  { title: "Search", url: "/search", icon: Search, iconColor: "text-cyan-400", iconBg: "bg-cyan-500/10" },
  { title: "My Favorites", url: "/favorites", icon: Heart, iconColor: "text-rose-400", iconBg: "bg-rose-500/10" },
  { title: "Reports", url: "/reports", icon: BarChart3, iconColor: "text-violet-400", iconBg: "bg-violet-500/10" },
  { title: "Settings", url: "/settings", icon: Settings, iconColor: "text-slate-400", iconBg: "bg-slate-500/10" },
];

export function AppSidebar() {
  const { data: session } = useSession()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (session?.user) {
          setUser(session.user)
        } else {
          // Try JWT-based auth
          const response = await fetch('/api/auth/user')
          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [session])

  const handleSignOut = async () => {
    if (session) {
      await signOut({ callbackUrl: '/auth/signin' })
    } else {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/auth/signin'
    }
  }

  const isActive = (url: string) => {
    if (url === '/') return pathname === '/'
    return pathname?.startsWith(url)
  }

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Shield className="h-4.5 w-4.5 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">NyayaMitra</span>
              <span className="text-[11px] text-muted-foreground font-medium">
                AI Legal Assistant
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-3 mb-1">
            Main Features
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const active = isActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className={`
                      relative rounded-xl transition-all duration-200 h-10 mb-0.5
                      ${active 
                        ? 'bg-primary/10 text-primary font-medium shadow-sm' 
                        : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                      }
                    `}>
                      <Link href={item.url} className="flex items-center gap-3">
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                        )}
                        <div className={`w-7 h-7 rounded-lg ${active ? item.iconBg : 'bg-transparent'} flex items-center justify-center transition-all duration-200`}>
                          <item.icon className={`h-4 w-4 transition-colors duration-200 ${active ? item.iconColor : ''}`} />
                        </div>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-3 my-2" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-3 mb-1">
            Tools & Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => {
                const active = isActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className={`
                      relative rounded-xl transition-all duration-200 h-10 mb-0.5
                      ${active 
                        ? 'bg-primary/10 text-primary font-medium shadow-sm' 
                        : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                      }
                    `}>
                      <Link href={item.url} className="flex items-center gap-3">
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                        )}
                        <div className={`w-7 h-7 rounded-lg ${active ? item.iconBg : 'bg-transparent'} flex items-center justify-center transition-all duration-200`}>
                          <item.icon className={`h-4 w-4 transition-colors duration-200 ${active ? item.iconColor : ''}`} />
                        </div>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full rounded-xl h-12 hover:bg-accent/50 transition-all duration-200">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {loading ? 'Loading...' : user?.name || 'Unknown User'}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {user?.email || 'Officer'}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width] glass-card border-border/50"
              >
                <DropdownMenuItem className="rounded-lg cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="rounded-lg cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
