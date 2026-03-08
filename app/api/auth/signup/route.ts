import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  badge: z.string().min(1, 'Badge number is required').max(20, 'Badge number too long'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rank: z.string().optional(),
  station: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, badge, password, rank, station } = signupSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { badge },
        ],
      },
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        )
      }
      if (existingUser.badge === badge) {
        return NextResponse.json(
          { error: 'Badge number already registered' },
          { status: 409 }
        )
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        badge,
        password: hashedPassword,
        rank: rank || 'Constable',
        station: station || 'Main Station',
        role: 'OFFICER', // Default role for new signups
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        badge: true,
        rank: true,
        station: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          badge: user.badge,
          rank: user.rank,
          station: user.station,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
