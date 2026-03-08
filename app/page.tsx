import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardContent } from "@/components/dashboard-content";
import { LandingPage } from "@/components/landing-page";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If user is authenticated, show dashboard
  if (session?.user) {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    );
  }

  // If not authenticated, show landing page
  return <LandingPage />;
}


function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Police Legal Assistant Dashboard
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
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">Loading data...</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
