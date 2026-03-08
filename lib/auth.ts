import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { User } from '@prisma/client'
import { authOptions } from './auth-config'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured. Please set it in your .env.local file.')
  }
  return secret
}

const JWT_SECRET = getJwtSecret()

export interface AuthUser {
  id: string
  email: string
  name: string
  badge: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      badge: user.badge,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch (error) {
    return null
  }
}

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    // Try NextAuth session first
    const session = await getServerSession(authOptions)

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
      return user
    }

    // Fall back to JWT-based auth
    const token = request.cookies.get('auth-token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) return null

    const decoded = verifyToken(token)
    if (!decoded) return null

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await getCurrentUser(request)
  if (!user || !user.isActive) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireRole(request: NextRequest, allowedRoles: string[]): Promise<User> {
  const user = await requireAuth(request)
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }
  return user
}

export function createAuthResponse(user: User, token: string) {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      badge: user.badge,
      rank: user.rank,
      station: user.station,
      role: user.role,
    },
    token,
  }
}
