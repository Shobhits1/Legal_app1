import { Suspense } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Calendar,
  Loader2,
} from "lucide-react";
import { ReportsContent } from "@/components/reports-content";

export default function Reports() {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsContent />
    </Suspense>
  );
}

function ReportsSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive analytics and reporting for FIR processing and system usage
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Key Metrics */}
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
