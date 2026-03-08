import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

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
    console.error('Error getting current user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}