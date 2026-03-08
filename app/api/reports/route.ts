import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get total FIRs count
    const totalFIRs = await prisma.fIR.count();

    // Get FIRs from last month for comparison
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthFIRs = await prisma.fIR.count({
      where: {
        createdAt: {
          gte: lastMonth,
        },
      },
    });

    // Calculate growth rate
    const growthRate = totalFIRs > 0 ? ((lastMonthFIRs / totalFIRs) * 100).toFixed(1) : 0;

    // Get accuracy rate (average confidence from AI analysis)
    const firsWithAnalysis = await prisma.fIR.findMany({
      where: {
        aiAnalysis: {
          not: null,
        },
      },
      select: {
        aiAnalysis: true,
      },
      take: 100, // Sample of last 100 FIRs
    });

    let totalConfidence = 0;
    let analyzedCount = 0;

    firsWithAnalysis.forEach(fir => {
      if (fir.aiAnalysis) {
        try {
          const analysis = JSON.parse(fir.aiAnalysis as string);
          if (analysis.confidence) {
            totalConfidence += analysis.confidence;
            analyzedCount++;
          }
        } catch (error) {
          // Skip invalid JSON
        }
      }
    });

    const accuracyRate = analyzedCount > 0 ? (totalConfidence / analyzedCount).toFixed(1) : 95;

    // Get processing time (mock calculation based on created/updated time difference)
    const avgProcessingTime = 8.2; // Mock value for now

    // Get active users (users who logged in recently)
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
      },
    });

    // Get FIR category distribution
    const firCategories = await prisma.fIR.findMany({
      select: {
        primarySections: true,
      },
    });

    const categoryCount: { [key: string]: number } = {};
    firCategories.forEach(fir => {
      if (fir.primarySections) {
        try {
          const sections = JSON.parse(fir.primarySections as string);
          sections.forEach((section: any) => {
            const category = section.section?.split(' ')[0] || 'Other';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
          });
        } catch (error) {
          // Skip invalid data
        }
      }
    });

    const totalCategories = Object.values(categoryCount).reduce((a, b) => a + b, 0);
    const categoryDistribution = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4)
      .map(([category, count]) => ({
        category,
        percentage: Math.round((count / totalCategories) * 100),
      }));

    // Get recent milestones
    const recentMilestones = [
      {
        title: `${totalFIRs}+ FIRs Processed`,
        description: "Total FIRs assisted by the system",
        type: "achievement",
        date: new Date().toISOString(),
      },
      {
        title: `${accuracyRate}% AI Accuracy`,
        description: "Average AI recommendation accuracy",
        type: "performance",
        date: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      totalFIRs,
      growthRate: parseFloat(growthRate),
      accuracyRate: parseFloat(accuracyRate),
      avgProcessingTime,
      activeUsers,
      categoryDistribution,
      recentMilestones,
    })
  } catch (error) {
    console.error('Error fetching reports data:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}