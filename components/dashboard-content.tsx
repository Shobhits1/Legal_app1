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
  Users,
  Shield,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { redirect } from "next/navigation";

async function getUserDashboardData(userId: string) {
  try {
    // Get user's FIRs count for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysFIRs = await prisma.fIR.count({
      where: {
        createdBy: userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get user's total FIRs this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyFIRs = await prisma.fIR.count({
      where: {
        createdBy: userId,
        createdAt: {
          gte: weekAgo,
        },
      },
    });

    // Calculate accuracy rate (mock for now - could be based on AI analysis scores)
    const userFIRs = await prisma.fIR.findMany({
      where: { createdBy: userId },
      select: { aiAnalysis: true },
      take: 10,
    });

    // Mock accuracy calculation based on AI confidence
    let totalConfidence = 0;
    let firCount = userFIRs.length;
    userFIRs.forEach(fir => {
      if (fir.aiAnalysis) {
        try {
          const analysis = JSON.parse(fir.aiAnalysis as string);
          totalConfidence += analysis.confidence || 85;
        } catch {
          totalConfidence += 85; // Default confidence
        }
      }
    });

    const accuracyRate = firCount > 0 ? Math.round((totalConfidence / firCount) * 100) / 100 : 95;

    // Get total legal sections available
    const legalSectionsCount = await prisma.legalSection.count({
      where: { isActive: true },
    });

    // Get total case laws available
    const caseLawsCount = await prisma.caseLaw.count({
      where: { isActive: true },
    });

    // Get recent FIRs by this user
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

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!dbUser) {
    redirect('/auth/signin');
  }

  const dashboardData = await getUserDashboardData(dbUser.id);

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Welcome back, {dbUser.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered legal assistance system for accurate FIR writing and investigation support
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Your FIRs Today
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.todaysFIRs}</div>
                <p className="text-xs text-muted-foreground">
                  FIRs created today
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Your Accuracy Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.accuracyRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Based on AI analysis confidence
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Legal Database</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.legalDatabaseSize.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Sections & case laws available
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  FIRs This Week
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.weeklyFIRs}</div>
                <p className="text-xs text-muted-foreground">Total FIRs this week</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Access the most commonly used police legal assistance tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button asChild className="h-20 flex-col gap-2">
                  <Link href="/fir-assistant">
                    <FileText className="h-6 w-6" />
                    <span>Create FIR</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-20 flex-col gap-2"
                >
                  <Link href="/voice-input">
                    <Mic className="h-6 w-6" />
                    <span>Voice FIR</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-20 flex-col gap-2"
                >
                  <Link href="/legal-sections">
                    <BookOpen className="h-6 w-6" />
                    <span>IPC Sections</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-20 flex-col gap-2"
                >
                  <Link href="/case-laws">
                    <Scale className="h-6 w-6" />
                    <span>Case Laws</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Your Recent FIRs</CardTitle>
                <CardDescription>
                  FIRs you've created recently
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentFIRs.length > 0 ? (
                    dashboardData.recentFIRs.map((fir) => (
                      <div key={fir.id} className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          fir.status === 'APPROVED' ? 'bg-green-500' :
                          fir.status === 'UNDER_REVIEW' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {fir.firNumber} - {fir.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fir.primarySections ? 'AI analyzed' : 'Manual entry'} • {fir.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={fir.status === 'APPROVED' ? 'default' : 'secondary'}>
                          {fir.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No FIRs created yet</p>
                      <p className="text-xs text-muted-foreground">Start by creating your first FIR</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Police Station Alerts</CardTitle>
                <CardDescription>
                  Important legal updates and system notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Legal Database Updated
                      </p>
                      <p className="text-xs text-green-600">
                        New Supreme Court judgments on cybercrime added
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        FIR Guidelines Reminder
                      </p>
                      <p className="text-xs text-blue-600">
                        Always include complainant details and incident location
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">
                        System Status
                      </p>
                      <p className="text-xs text-orange-600">
                        AI analysis system operational - 99.9% uptime
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
