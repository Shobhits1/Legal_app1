import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createCaseLawSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  citation: z.string().min(1, 'Citation is required'),
  court: z.string().min(1, 'Court is required'),
  date: z.string().datetime(),
  category: z.string().min(1, 'Category is required'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  keyPoints: z.array(z.string()).min(1, 'At least one key point is required'),
  fullText: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
  relevance: z.string().min(1, 'Relevance is required'),
  sections: z.array(z.string()).default([]),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const court = searchParams.get('court')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: any = {
      isActive: true,
    }

    if (court) {
      where.court = { contains: court }
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { citation: { contains: search } },
        { summary: { contains: search } },
        { category: { contains: search } },
        { court: { contains: search } },
      ]
    }

    const orderBy: any = {}
    if (sortBy === 'date') {
      orderBy.date = sortOrder
    } else if (sortBy === 'rating') {
      orderBy.rating = sortOrder
    } else if (sortBy === 'title') {
      orderBy.title = sortOrder
    } else {
      orderBy.date = 'desc'
    }

    const [caseLaws, total] = await Promise.all([
      prisma.caseLaw.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          sections: {
            include: {
              legalSection: {
                select: {
                  id: true,
                  act: true,
                  section: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
      prisma.caseLaw.count({ where }),
    ])

    return NextResponse.json({
      caseLaws,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get case laws error:', error)

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

    // Only admins can create case laws
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = createCaseLawSchema.parse(body)

    const { sections, ...caseLawData } = data

    const caseLaw = await prisma.caseLaw.create({
      data: {
        ...caseLawData,
        keyPoints: data.keyPoints.join('\n'), // DB expects string
        date: new Date(data.date),
      },
      include: {
        sections: {
          include: {
            legalSection: {
              select: {
                id: true,
                act: true,
                section: true,
                title: true,
              },
            },
          },
        },
      },
    })

    // Create relationships with legal sections if provided
    if (data.sections.length > 0) {
      await Promise.all(
        data.sections.map((sectionId) =>
          prisma.caseLawSection.create({
            data: {
              caseLawId: caseLaw.id,
              sectionId,
            },
          })
        )
      )
    }

    return NextResponse.json(caseLaw, { status: 201 })
  } catch (error) {
    console.error('Create case law error:', error)

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
