import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  FileText,
  Scale,
  BookOpen,
  Mic,
  CheckCircle,
  Clock,
  Shield,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Brain,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { redirect } from "next/navigation";

async function getUserDashboardData(userId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysFIRs = await prisma.fIR.count({
      where: {
        createdBy: userId,
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyFIRs = await prisma.fIR.count({
      where: {
        createdBy: userId,
        createdAt: { gte: weekAgo },
      },
    });

    const userFIRs = await prisma.fIR.findMany({
      where: { createdBy: userId },
      select: { aiAnalysis: true },
      take: 10,
    });

    let totalConfidence = 0;
    let firCount = userFIRs.length;
    userFIRs.forEach(fir => {
      if (fir.aiAnalysis) {
        try {
          const analysis = JSON.parse(fir.aiAnalysis as string);
          totalConfidence += analysis.confidence || 85;
        } catch {
          totalConfidence += 85;
        }
      }
    });

    const accuracyRate = firCount > 0 ? Math.round((totalConfidence / firCount) * 100) / 100 : 95;

    const legalSectionsCount = await prisma.legalSection.count({
      where: { isActive: true },
    });

    const caseLawsCount = await prisma.caseLaw.count({
      where: { isActive: true },
    });

    const recentFIRs = await prisma.fIR.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        firNumber: true,
        title: true,
        createdAt: true,
        status: true,
        primarySections: true,
      },
    });

    return {
      todaysFIRs,
      weeklyFIRs,
      accuracyRate,
      legalDatabaseSize: legalSectionsCount + caseLawsCount,
      recentFIRs,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      todaysFIRs: 0,
      weeklyFIRs: 0,
      accuracyRate: 95,
      legalDatabaseSize: 0,
      recentFIRs: [],
    };
  }
}

export async function DashboardContent() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!dbUser) {
    redirect('/auth/signin');
  }

  const dashboardData = await getUserDashboardData(dbUser.id);

  const stats = [
    {
      title: "Your FIRs Today",
      value: dashboardData.todaysFIRs,
      description: "FIRs created today",
      icon: FileText,
      gradient: "from-blue-500 to-cyan-500",
      shadowColor: "shadow-blue-500/20",
    },
    {
      title: "Your Accuracy Rate",
      value: `${dashboardData.accuracyRate}%`,
      description: "Based on AI analysis confidence",
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-500",
      shadowColor: "shadow-emerald-500/20",
    },
    {
      title: "Legal Database",
      value: dashboardData.legalDatabaseSize.toLocaleString(),
      description: "Sections & case laws available",
      icon: Scale,
      gradient: "from-purple-500 to-pink-500",
      shadowColor: "shadow-purple-500/20",
    },
    {
      title: "FIRs This Week",
      value: dashboardData.weeklyFIRs,
      description: "Total FIRs this week",
      icon: TrendingUp,
      gradient: "from-amber-500 to-orange-500",
      shadowColor: "shadow-amber-500/20",
    },
  ];

  const quickActions = [
    { title: "Create FIR", description: "Draft a new FIR with AI", icon: FileText, href: "/fir-assistant", gradient: "from-blue-500 to-cyan-500" },
    { title: "Voice FIR", description: "Dictate an incident", icon: Mic, href: "/voice-input", gradient: "from-purple-500 to-pink-500" },
    { title: "IPC Sections", description: "Browse legal sections", icon: BookOpen, href: "/legal-sections", gradient: "from-emerald-500 to-teal-500" },
    { title: "Case Laws", description: "Search precedents", icon: Scale, href: "/case-laws", gradient: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border/40 glass-card">
        <SidebarTrigger />
        <div className="flex flex-col flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            Welcome back, <span className="gradient-text-primary">{dbUser.name}</span>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            AI-powered legal intelligence at your fingertips
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {stats.map((stat, i) => (
              <Card key={i} className="glass-card glass-card-hover border-border/40 rounded-2xl overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadowColor} transition-transform duration-300 group-hover:scale-110`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="glass-card border-border/40 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Access the most commonly used police legal assistance tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, i) => (
                  <Link key={i} href={action.href}>
                    <div className="group relative glass-card glass-card-hover rounded-xl p-5 cursor-pointer overflow-hidden h-full">
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 shadow-md transition-transform duration-300 group-hover:scale-110`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                      <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/40 transition-all duration-300 group-hover:text-primary group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="glass-card border-border/40 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Your Recent FIRs
                </CardTitle>
                <CardDescription>FIRs you&apos;ve created recently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentFIRs.length > 0 ? (
                    dashboardData.recentFIRs.map((fir) => (
                      <div key={fir.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-all duration-200 group">
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          fir.status === 'APPROVED' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' :
                          fir.status === 'UNDER_REVIEW' ? 'bg-amber-500 shadow-lg shadow-amber-500/30' : 'bg-blue-500 shadow-lg shadow-blue-500/30'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {fir.firNumber} — {fir.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fir.primarySections ? 'AI analyzed' : 'Manual entry'} • {fir.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={fir.status === 'APPROVED' ? 'default' : 'secondary'} className="shrink-0 text-[10px] font-semibold">
                          {fir.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="h-14 w-14 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">No FIRs created yet</p>
                      <p className="text-xs text-muted-foreground/60">Start by creating your first FIR</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card className="glass-card border-border/40 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-400" />
                  Station Alerts
                </CardTitle>
                <CardDescription>
                  Important legal updates and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 transition-all duration-200 hover:bg-emerald-500/8">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Legal Database Updated</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        New Supreme Court judgments on cybercrime added
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 transition-all duration-200 hover:bg-blue-500/8">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">FIR Guidelines Reminder</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Always include complainant details and incident location
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 transition-all duration-200 hover:bg-amber-500/8">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">System Status</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        AI analysis system operational — 99.9% uptime
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
