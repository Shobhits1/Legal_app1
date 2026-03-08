import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateFIRSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  incidentDate: z.string().datetime().optional(),
  location: z.string().min(1).optional(),
  complainant: z.string().min(1).optional(),
  accused: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional(),
  reviewedBy: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const { id } = params

    const fir = await prisma.fIR.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            badge: true,
            rank: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            badge: true,
            rank: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            badge: true,
            rank: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!fir) {
      return NextResponse.json(
        { error: 'FIR not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (user.role !== 'ADMIN' && fir.createdBy !== user.id && fir.assignedTo !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(fir)
  } catch (error) {
    console.error('Get FIR error:', error)
    
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
    const data = updateFIRSchema.parse(body)

    // Check if FIR exists
    const existingFIR = await prisma.fIR.findUnique({
      where: { id },
    })

    if (!existingFIR) {
      return NextResponse.json(
        { error: 'FIR not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (user.role !== 'ADMIN' && existingFIR.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Handle status changes
    const updateData: any = { ...data }
    
    if (data.status && data.status !== existingFIR.status) {
      if (data.status === 'UNDER_REVIEW' || data.status === 'APPROVED' || data.status === 'REJECTED') {
        updateData.reviewedBy = user.id
        updateData.reviewedAt = new Date()
      }
    }

    if (data.incidentDate) {
      updateData.incidentDate = new Date(data.incidentDate)
    }

    const fir = await prisma.fIR.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            badge: true,
            rank: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            badge: true,
            rank: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            badge: true,
            rank: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return NextResponse.json(fir)
  } catch (error) {
    console.error('Update FIR error:', error)
    
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

    // Only admins can delete FIRs
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const fir = await prisma.fIR.findUnique({
      where: { id },
    })

    if (!fir) {
      return NextResponse.json(
        { error: 'FIR not found' },
        { status: 404 }
      )
    }

    await prisma.fIR.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'FIR deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete FIR error:', error)
    
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
