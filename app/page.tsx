import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardContent } from "@/components/dashboard-content";
import { LandingPage } from "@/components/landing-page";
import { Shield } from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    );
  }

  return <LandingPage />;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border/40 glass-card">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Loading Dashboard...
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered legal assistance system
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="glass-card border-border/40 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    <div className="h-4 w-24 rounded-md animate-shimmer" />
                  </CardTitle>
                  <div className="h-9 w-9 rounded-xl animate-shimmer" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 rounded-md animate-shimmer mb-2" />
                  <div className="h-3 w-32 rounded-md animate-shimmer" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
