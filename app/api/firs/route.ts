import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { analyzeIncident } from '@/lib/ai'
import { z } from 'zod'

const createFIRSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  incidentDate: z.string().min(1, 'Incident date is required').refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid date format'),
  location: z.string().min(1, 'Location is required'),
  complainant: z.string().min(1, 'Complainant name is required'),
  accused: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { firNumber: { contains: search, mode: 'insensitive' } },
        { complainant: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Officers can only see their own FIRs, admins can see all
    if (user.role !== 'ADMIN') {
      where.OR = [
        { createdBy: user.id },
        { assignedTo: user.id },
      ]
    }

    const [firs, total] = await Promise.all([
      prisma.fIR.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              badge: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              badge: true,
            },
          },
          _count: {
            select: {
              documents: true,
            },
          },
        },
      }),
      prisma.fIR.count({ where }),
    ])

    // Parse JSON strings back to objects/arrays
    const parsedFirs = firs.map(fir => {
      let primarySections = [];
      let secondarySections = [];
      let relevantCaseLaws = [];
      let recommendations = [];
      let aiAnalysis = null;

      try {
        primarySections = fir.primarySections ? JSON.parse(fir.primarySections) : [];
        secondarySections = fir.secondarySections ? JSON.parse(fir.secondarySections) : [];
        relevantCaseLaws = fir.relevantCaseLaws ? JSON.parse(fir.relevantCaseLaws) : [];
        recommendations = fir.recommendations ? JSON.parse(fir.recommendations) : [];
        aiAnalysis = fir.aiAnalysis ? JSON.parse(fir.aiAnalysis) : null;
      } catch (parseError) {
        console.error('Error parsing JSON data for FIR:', fir.id, parseError);
      }

      return {
        ...fir,
        primarySections,
        secondarySections,
        relevantCaseLaws,
        recommendations,
        aiAnalysis,
      };
    })

    return NextResponse.json({
      firs: parsedFirs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get FIRs error:', error)
    
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const data = createFIRSchema.parse(body)

    // Generate FIR number
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    
    const count = await prisma.fIR.count({
      where: {
        createdAt: {
          gte: new Date(year, today.getMonth(), 1),
        },
      },
    })
    
    const firNumber = `FIR-${year}-${month}${day}-${String(count + 1).padStart(3, '0')}`

    // AI Analysis
    let aiAnalysis = null
    try {
      aiAnalysis = await analyzeIncident(data.description)
    } catch (aiError) {
      console.error('AI analysis failed:', aiError)
    }

    const fir = await prisma.fIR.create({
      data: {
        ...data,
        firNumber,
        incidentDate: new Date(data.incidentDate),
        createdBy: user.id,
        primarySections: JSON.stringify(aiAnalysis?.primarySections || []),
        secondarySections: JSON.stringify(aiAnalysis?.secondarySections || []),
        relevantCaseLaws: JSON.stringify(aiAnalysis?.relevantCaseLaws || []),
        recommendations: JSON.stringify(aiAnalysis?.recommendations || []),
        aiAnalysis: JSON.stringify(aiAnalysis),
        confidence: aiAnalysis?.confidence || 0,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            badge: true,
          },
        },
      },
    })

    // Parse JSON strings back to objects/arrays for response
    let primarySections = [];
    let secondarySections = [];
    let relevantCaseLaws = [];
    let recommendations = [];
    let parsedAiAnalysis = null;

    try {
      primarySections = fir.primarySections ? JSON.parse(fir.primarySections) : [];
      secondarySections = fir.secondarySections ? JSON.parse(fir.secondarySections) : [];
      relevantCaseLaws = fir.relevantCaseLaws ? JSON.parse(fir.relevantCaseLaws) : [];
      recommendations = fir.recommendations ? JSON.parse(fir.recommendations) : [];
      parsedAiAnalysis = fir.aiAnalysis ? JSON.parse(fir.aiAnalysis) : null;
    } catch (parseError) {
      console.error('Error parsing JSON data for created FIR:', fir.id, parseError);
    }

    const parsedFir = {
      ...fir,
      primarySections,
      secondarySections,
      relevantCaseLaws,
      recommendations,
      aiAnalysis: parsedAiAnalysis,
    }

    return NextResponse.json(parsedFir, { status: 201 })
  } catch (error) {
    console.error('Create FIR error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

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
