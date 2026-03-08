import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './db'
import { Adapter } from 'next-auth/adapters'

const providers = []

// Only add Google provider if credentials are available
if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  )
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          // Check if user already exists (e.g. from email/password signup)
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          })

          if (existingUser) {
            // Update existing user's name from Google profile if needed
            await prisma.user.update({
              where: { email: user.email! },
              data: {
                name: user.name || existingUser.name,
              },
            })
          }
          // If user doesn't exist, PrismaAdapter will create them automatically.
          // The events.createUser hook below will set app-specific defaults.

          return true
        } catch (error) {
          console.error('Error during Google sign-in:', error)
          return false
        }
      }
      return true
    },
    async session({ session, user }) {
      if (session?.user?.email) {
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
          },
        })

        if (dbUser) {
          // Extend the session user object with additional properties
          ;(session.user as any).id = dbUser.id
          ;(session.user as any).badge = dbUser.badge
          ;(session.user as any).rank = dbUser.rank
          ;(session.user as any).station = dbUser.station
          ;(session.user as any).role = dbUser.role
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  events: {
    // Called when PrismaAdapter creates a new user (e.g. first Google sign-in)
    async createUser({ user }) {
      try {
        const userCount = await prisma.user.count()
        const badge = `AUTO-${String(userCount).padStart(4, '0')}`

        await prisma.user.update({
          where: { id: user.id },
          data: {
            badge,
            rank: 'Constable',
            station: 'Main Station',
            role: 'OFFICER',
            isActive: true,
          },
        })
      } catch (error) {
        console.error('Error setting defaults for new OAuth user:', error)
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
  },
  secret: process.env.NEXTAUTH_SECRET,
}