import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, generateToken, createAuthResponse } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password (check if user has a password for traditional auth)
    if (!user.password) {
      return NextResponse.json(
        { error: 'Please use Google sign-in for this account' },
        { status: 401 }
      )
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      badge: user.badge || '',
      role: user.role,
    })

    // For now, we'll just rely on the cookie-based session
    // without storing in database until the Prisma issue is resolved
    
    const response = NextResponse.json(
      createAuthResponse(user, token),
      { status: 200 }
    )

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    
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