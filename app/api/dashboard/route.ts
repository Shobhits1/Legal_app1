import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get user's FIRs count for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaysFIRs = await prisma.fIR.count({
      where: {
        createdBy: user.id,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    // Get user's total FIRs this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const weeklyFIRs = await prisma.fIR.count({
      where: {
        createdBy: user.id,
        createdAt: {
          gte: weekAgo,
        },
      },
    })

    // Get user's FIRs with AI analysis for accuracy calculation
    const userFIRs = await prisma.fIR.findMany({
      where: { createdBy: user.id },
      select: { aiAnalysis: true },
      take: 20, // Last 20 FIRs for accuracy calculation
    })

    // Calculate accuracy rate based on AI confidence scores
    let totalConfidence = 0
    let firCount = userFIRs.length
    userFIRs.forEach(fir => {
      if (fir.aiAnalysis) {
        try {
          const analysis = JSON.parse(fir.aiAnalysis as string)
          totalConfidence += analysis.confidence || 85
        } catch {
          totalConfidence += 85 // Default confidence if parsing fails
        }
      } else {
        totalConfidence += 85 // Default confidence for manual FIRs
      }
    })

    const accuracyRate = firCount > 0 ? Math.round((totalConfidence / firCount) * 100) / 100 : 95

    // Get total legal sections available
    const legalSectionsCount = await prisma.legalSection.count({
      where: { isActive: true },
    })

    // Get total case laws available
    const caseLawsCount = await prisma.caseLaw.count({
      where: { isActive: true },
    })

    // Get recent FIRs by this user
    const recentFIRs = await prisma.fIR.findMany({
      where: { createdBy: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        firNumber: true,
        title: true,
        createdAt: true,
        status: true,
        primarySections: true,
        complainant: true,
      },
    })

    // Get user's profile info
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      badge: user.badge,
      rank: user.rank,
      station: user.station,
      role: user.role,
    }

    return NextResponse.json({
      user: userProfile,
      stats: {
        todaysFIRs,
        weeklyFIRs,
        totalFIRs: await prisma.fIR.count({ where: { createdBy: user.id } }),
        accuracyRate,
        legalDatabaseSize: legalSectionsCount + caseLawsCount,
      },
      recentFIRs: recentFIRs.map(fir => ({
        id: fir.id,
        firNumber: fir.firNumber,
        title: fir.title,
        complainant: fir.complainant,
        status: fir.status,
        createdAt: fir.createdAt,
        hasAIAnalysis: !!fir.primarySections,
      })),
    })
  } catch (error) {
    console.error('Dashboard API error:', error)

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
