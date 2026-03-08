import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createSectionSchema = z.object({
  act: z.string().min(1, 'Act is required'),
  section: z.string().min(1, 'Section number is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  punishment: z.string().min(1, 'Punishment is required'),
  essentials: z.array(z.string()).min(1, 'At least one essential element is required'),
  category: z.string().min(1, 'Category is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  relatedSections: z.array(z.string()).default([]),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const act = searchParams.get('act')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit

    const where: any = {
      isActive: true,
    }
    
    if (act) {
      where.act = act
    }
    
    if (category) {
      where.category = category
    }
    
    if (search) {
      where.OR = [
        { section: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [sections, total] = await Promise.all([
      prisma.legalSection.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { act: 'asc' },
          { section: 'asc' },
        ],
        include: {
          _count: {
            select: {
              caseLaws: true,
              favorites: true,
            },
          },
        },
      }),
      prisma.legalSection.count({ where }),
    ])

    return NextResponse.json({
      sections,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get legal sections error:', error)
    
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
    
    // Only admins can create legal sections
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = createSectionSchema.parse(body)

    const section = await prisma.legalSection.create({
      data,
      include: {
        _count: {
          select: {
            caseLaws: true,
            favorites: true,
          },
        },
      },
    })

    return NextResponse.json(section, { status: 201 })
  } catch (error) {
    console.error('Create legal section error:', error)
    
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
