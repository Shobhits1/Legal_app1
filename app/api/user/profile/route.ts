import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  station: z.string().min(1, 'Station is required').optional(),
  rank: z.string().min(1, 'Rank is required').optional(),
  phone: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        badge: true,
        rank: true,
        station: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      user: updatedUser,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Profile update error:', error)

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

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        badge: user.badge,
        rank: user.rank,
        station: user.station,
        phone: user.phone,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Profile fetch error:', error)

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
