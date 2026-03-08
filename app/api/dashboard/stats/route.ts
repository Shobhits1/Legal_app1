import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Get date range for comparison (last 30 days vs previous 30 days)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const [
      // Current period stats
      currentFIRs,
      currentUsers,
      currentAccuracy,
      currentProcessingTime,
      
      // Previous period stats
      previousFIRs,
      previousUsers,
      previousAccuracy,
      previousProcessingTime,
      
      // Additional stats
      recentActivity,
      systemAlerts,
      categoryDistribution,
      topOfficers,
    ] = await Promise.all([
      // Current period
      prisma.fIR.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.user.count({
        where: {
          isActive: true,
        },
      }),
      calculateAccuracyRate(thirtyDaysAgo, now),
      calculateAverageProcessingTime(thirtyDaysAgo, now),
      
      // Previous period
      prisma.fIR.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
      }),
      prisma.user.count({
        where: {
          isActive: true,
          createdAt: { lt: thirtyDaysAgo },
        },
      }),
      calculateAccuracyRate(sixtyDaysAgo, thirtyDaysAgo),
      calculateAverageProcessingTime(sixtyDaysAgo, thirtyDaysAgo),
      
      // Additional data
      getRecentActivity(),
      getSystemAlerts(),
      getCategoryDistribution(thirtyDaysAgo, now),
      getTopOfficers(thirtyDaysAgo, now),
    ])

    // Calculate percentage changes
    const firChange = calculatePercentageChange(currentFIRs, previousFIRs)
    const accuracyChange = calculatePercentageChange(currentAccuracy, previousAccuracy)
    const processingTimeChange = calculatePercentageChange(previousProcessingTime, currentProcessingTime) // Inverted because lower is better

    const stats = {
      overview: {
        firsProcessed: {
          current: currentFIRs,
          previous: previousFIRs,
          change: firChange,
          trend: firChange > 0 ? 'up' : 'down',
        },
        accuracyRate: {
          current: currentAccuracy,
          previous: previousAccuracy,
          change: accuracyChange,
          trend: accuracyChange > 0 ? 'up' : 'down',
        },
        avgProcessingTime: {
          current: currentProcessingTime,
          previous: previousProcessingTime,
          change: processingTimeChange,
          trend: processingTimeChange > 0 ? 'down' : 'up', // Inverted because lower is better
        },
        activeUsers: {
          current: currentUsers,
          previous: previousUsers,
          change: calculatePercentageChange(currentUsers, previousUsers),
          trend: currentUsers > previousUsers ? 'up' : 'down',
        },
      },
      recentActivity,
      systemAlerts,
      categoryDistribution,
      topOfficers,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    
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

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100 * 100) / 100 // Round to 2 decimal places
}

async function calculateAccuracyRate(startDate: Date, endDate: Date): Promise<number> {
  // This would calculate actual AI accuracy based on manual reviews
  // For now, return a simulated value with some variation
  const baseAccuracy = 98.5
  const variation = Math.random() * 2 - 1 // -1 to 1
  return Math.round((baseAccuracy + variation) * 10) / 10
}

async function calculateAverageProcessingTime(startDate: Date, endDate: Date): Promise<number> {
  // This would calculate actual processing time from FIR creation to approval
  // For now, return a simulated value with some variation
  const baseTime = 8.2
  const variation = Math.random() * 2 - 1 // -1 to 1
  return Math.round((baseTime + variation) * 10) / 10
}

async function getRecentActivity() {
  const recentFIRs = await prisma.fIR.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firNumber: true,
      title: true,
      status: true,
      createdAt: true,
      creator: {
        select: {
          name: true,
          badge: true,
        },
      },
    },
  })

  return recentFIRs.map(fir => ({
    id: fir.id,
    type: 'fir',
    title: `${fir.firNumber} processed`,
    description: fir.title,
    timestamp: fir.createdAt,
    user: fir.creator.name,
    status: fir.status,
  }))
}

async function getSystemAlerts() {
  // This would check for actual system issues
  // For now, return simulated alerts
  return [
    {
      id: '1',
      type: 'success',
      title: 'System Update Complete',
      description: 'AI model updated with latest legal amendments',
      timestamp: new Date(),
    },
    {
      id: '2',
      type: 'info',
      title: 'New Legal Provisions',
      description: 'BNS 2023 sections added to database',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: '3',
      type: 'warning',
      title: 'Scheduled Maintenance',
      description: 'System maintenance on Sunday 2:00 AM',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
  ]
}

async function getCategoryDistribution(startDate: Date, endDate: Date) {
  const firs = await prisma.fIR.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      primarySections: true,
    },
  })

  // Analyze categories from primary sections
  const categoryCounts: Record<string, number> = {}
  
  firs.forEach(fir => {
    if (Array.isArray(fir.primarySections)) {
      fir.primarySections.forEach((section: any) => {
        const category = section.description || 'Unknown'
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      })
    }
  })

  const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)
  
  return Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // Top 5 categories
}

async function getTopOfficers(startDate: Date, endDate: Date) {
  const officers = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { not: 'ADMIN' },
    },
    select: {
      id: true,
      name: true,
      badge: true,
      _count: {
        select: {
          firs: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      },
    },
    orderBy: {
      firs: {
        _count: 'desc',
      },
    },
    take: 5,
  })

  return officers.map(officer => ({
    id: officer.id,
    name: officer.name,
    badge: officer.badge,
    firsProcessed: officer._count.firs,
    accuracy: 95 + Math.random() * 5, // Simulated accuracy
  }))
}
