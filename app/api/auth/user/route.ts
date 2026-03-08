import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Try NextAuth session first
    const session = await getServerSession(authOptions)
    
    if (session?.user?.email) {
      // Get full user data from database
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          name: true,
          badge: true,
          rank: true,
          station: true,
          role: true,
          isActive: true,
        },
      })

      if (dbUser && dbUser.isActive) {
        return NextResponse.json({
          user: dbUser,
          isOAuth: true,
        })
      }
    }

    // Fall back to JWT-based auth
    const user = await getCurrentUser(request)
    
    if (user && user.isActive) {
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          badge: user.badge,
          rank: user.rank,
          station: user.station,
          role: user.role,
        },
        isOAuth: false,
      })
    }

    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Error getting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}