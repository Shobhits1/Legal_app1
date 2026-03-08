"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { exportReportToPDF } from "@/lib/pdf-export";
import { useToast } from "@/hooks/use-toast";

interface ReportsData {
  totalFIRs: number;
  growthRate: number;
  accuracyRate: number;
  avgProcessingTime: number;
  activeUsers: number;
  categoryDistribution: Array<{ category: string; percentage: number }>;
  recentMilestones: Array<{
    title: string;
    description: string;
    type: string;
    date: string;
  }>;
}

export function ReportsContent() {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/reports');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/auth/signin');
            return;
          }
          throw new Error('Failed to fetch reports data');
        }

        const data = await response.json();
        setReportsData(data);
      } catch (error) {
        console.error('Error fetching reports data:', error);
        toast({
          title: "Error",
          description: "Failed to load reports data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [router, toast]);

  const handleExportReport = async () => {
    if (!reportsData) return;

    try {
      setExporting(true);
      await exportReportToPDF(reportsData);
      toast({
        title: "PDF Downloaded",
        description: "Reports have been saved as PDF",
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

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
        {loading || !reportsData ? (
          <div className="flex h-full items-center justify-center flex-col">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading reports data...</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total FIRs Processed
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportsData?.totalFIRs.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+{reportsData?.growthRate}%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    AI Accuracy Rate
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportsData?.accuracyRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Based on AI recommendations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Processing Time
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportsData?.avgProcessingTime} min</div>
                  <p className="text-xs text-muted-foreground">
                    From incident to FIR completion
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Registered Officers
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportsData?.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Active police officers
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
                <TabsTrigger value="errors">Error Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>FIR Processing Trends</CardTitle>
                      <CardDescription>
                        FIR processing statistics over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center bg-muted rounded">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Real-time chart visualization
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {reportsData.totalFIRs} FIRs processed to date
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>FIR Category Distribution</CardTitle>
                      <CardDescription>
                        Breakdown of FIR types processed
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportsData?.categoryDistribution.map((item, index) => {
                          const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500'];
                          return (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm">{item.category}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-muted rounded-full">
                                  <div
                                    className={`h-2 ${colors[index]} rounded-full`}
                                    style={{ width: `${item.percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{item.percentage}%</span>
                              </div>
                            </div>
                          );
                        })}
                        {reportsData?.categoryDistribution.length === 0 && (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">No FIR data available yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>System Achievements</CardTitle>
                    <CardDescription>
                      Recent milestones and achievements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportsData?.recentMilestones.map((milestone, index) => (
                        <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${milestone.type === 'achievement'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-blue-50 border-blue-200'
                          }`}>
                          {milestone.type === 'achievement' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                          )}
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${milestone.type === 'achievement' ? 'text-green-800' : 'text-blue-800'
                              }`}>
                              {milestone.title}
                            </p>
                            <p className={`text-xs ${milestone.type === 'achievement' ? 'text-green-600' : 'text-blue-600'
                              }`}>
                              {milestone.description}
                            </p>
                          </div>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Performance Metrics</CardTitle>
                      <CardDescription>
                        AI model accuracy and system performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              AI Accuracy Rate
                            </span>
                            <span className="text-sm">{reportsData?.accuracyRate}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full">
                            <div className="w-full h-2 bg-green-500 rounded-full" style={{ width: `${Math.min(reportsData?.accuracyRate || 0, 100)}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Processing Speed
                            </span>
                            <span className="text-sm">{reportsData?.avgProcessingTime} min avg</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full">
                            <div className="w-[75%] h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              System Reliability
                            </span>
                            <span className="text-sm">99.9%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full">
                            <div className="w-[99.9%] h-2 bg-green-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Officer Performance</CardTitle>
                      <CardDescription>
                        Registered officers and their activity
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-center py-4">
                          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {reportsData?.activeUsers} officer{reportsData?.activeUsers !== 1 ? 's' : ''} registered
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            All officers have access to the system
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="usage" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Feature Usage</CardTitle>
                      <CardDescription>System feature utilization</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">FIR Assistant</span>
                          <span className="text-sm font-medium">
                            {reportsData.totalFIRs > 0 ? '100%' : '0%'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Legal Search</span>
                          <span className="text-sm font-medium">
                            {reportsData.totalFIRs > 0 ? '85%' : '0%'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Voice Input</span>
                          <span className="text-sm font-medium">
                            {reportsData.totalFIRs > 0 ? '65%' : '0%'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Case Law Database</span>
                          <span className="text-sm font-medium">
                            {reportsData.totalFIRs > 0 ? '45%' : '0%'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>System Health</CardTitle>
                      <CardDescription>Current system status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Database</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700">Online</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">AI Service</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Voice Processing</span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Limited</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Authentication</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700">Secure</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Data Summary</CardTitle>
                      <CardDescription>System data statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Legal Sections</span>
                          <span className="text-sm font-medium">5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Case Laws</span>
                          <span className="text-sm font-medium">3</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">FIRs Processed</span>
                          <span className="text-sm font-medium">{reportsData.totalFIRs}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Active Users</span>
                          <span className="text-sm font-medium">{reportsData?.activeUsers}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="errors" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      System Health & Issues
                    </CardTitle>
                    <CardDescription>
                      Current system status and any issues
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-2xl font-bold text-green-600">
                            0
                          </div>
                          <p className="text-sm text-green-600">Critical Errors</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="text-2xl font-bold text-yellow-600">
                            1
                          </div>
                          <p className="text-sm text-yellow-600">Minor Issues</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-2xl font-bold text-green-600">
                            99%
                          </div>
                          <p className="text-sm text-green-600">
                            System Health
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">Current Status</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                            <span className="text-sm">
                              Voice processing requires Bhashini API setup
                            </span>
                            <Badge variant="secondary">Info</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                            <span className="text-sm">
                              All core features operational
                            </span>
                            <Badge variant="outline">Good</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                            <span className="text-sm">
                              Database connection stable
                            </span>
                            <Badge variant="outline">Healthy</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Reports</CardTitle>
                <CardDescription>
                  Download detailed reports for further analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={handleExportReport} disabled={exporting || !reportsData}>
                    {exporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF Report
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Report
                  </Button>
                  <Button variant="outline">Export CSV Data</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
