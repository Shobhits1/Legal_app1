import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateSectionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  punishment: z.string().min(1).optional(),
  essentials: z.array(z.string()).min(1).optional(),
  category: z.string().min(1).optional(),
  frequency: z.string().min(1).optional(),
  relatedSections: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    const { id } = params

    const section = await prisma.legalSection.findUnique({
      where: { id },
      include: {
        caseLaws: {
          include: {
            caseLaw: {
              select: {
                id: true,
                title: true,
                citation: true,
                court: true,
                date: true,
                rating: true,
                relevance: true,
              },
            },
          },
        },
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    })

    if (!section) {
      return NextResponse.json(
        { error: 'Legal section not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(section)
  } catch (error) {
    console.error('Get legal section error:', error)
    
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const { id } = params
    const body = await request.json()
    const data = updateSectionSchema.parse(body)

    // Only admins can update legal sections
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const section = await prisma.legalSection.findUnique({
      where: { id },
    })

    if (!section) {
      return NextResponse.json(
        { error: 'Legal section not found' },
        { status: 404 }
      )
    }

    const updatedSection = await prisma.legalSection.update({
      where: { id },
      data,
      include: {
        caseLaws: {
          include: {
            caseLaw: {
              select: {
                id: true,
                title: true,
                citation: true,
                court: true,
                date: true,
                rating: true,
                relevance: true,
              },
            },
          },
        },
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    })

    return NextResponse.json(updatedSection)
  } catch (error) {
    console.error('Update legal section error:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const { id } = params

    // Only admins can delete legal sections
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const section = await prisma.legalSection.findUnique({
      where: { id },
    })

    if (!section) {
      return NextResponse.json(
        { error: 'Legal section not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting isActive to false
    await prisma.legalSection.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json(
      { message: 'Legal section deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete legal section error:', error)
    
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
