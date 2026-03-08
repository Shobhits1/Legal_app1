"use client"

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
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

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "FIR Assistant",
    url: "/fir-assistant",
    icon: FileText,
  },
  {
    title: "Case Classifier",
    url: "/classifier",
    icon: Brain,
  },
  {
    title: "Case Laws",
    url: "/case-laws",
    icon: Scale,
  },
  {
    title: "Legal Sections",
    url: "/legal-sections",
    icon: BookOpen,
  },
  {
    title: "Voice Input",
    url: "/voice-input",
    icon: Mic,
  },
];

const toolsItems = [
  {
    title: "Search",
    url: "/search",
    icon: Search,
  },
  {
    title: "My Favorites",
    url: "/favorites",
    icon: Heart,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { data: session } = useSession()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
      // NextAuth sign out
      await signOut({ callbackUrl: '/auth/signin' })
    } else {
      // JWT-based sign out
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/auth/signin'
    }
  }
  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">NyayaMitra</span>
            <span className="text-xs text-muted-foreground">
              AI Legal Assistant
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Features</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Tools & Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <User className="h-4 w-4" />
                  <span>
                    {loading ? 'Loading...' : user?.name || 'Unknown User'}
                  </span>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
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
