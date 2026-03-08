import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/signup',
  '/api/auth/[...nextauth]',
  '/api/health',
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    const response = NextResponse.next()

    // Add CSP header for development on public routes too
    if (process.env.NODE_ENV === 'development') {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https: http://localhost:5000 http://localhost:8000; frame-src 'self' https:"
      )
    }

    return response
  }

  // Check for NextAuth session cookie
  const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value

  // Check for JWT auth token
  const jwtToken = request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  // If authenticated, allow access
  if (sessionToken || jwtToken) {
    const response = NextResponse.next()

    // Add CSP header for development
    if (process.env.NODE_ENV === 'development') {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https: http://localhost:5000 http://localhost:8000; frame-src 'self' https:"
      )
    }

    return response
  }

  // For API routes, return 401
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // For frontend routes, redirect to sign-in
  const signInUrl = new URL('/auth/signin', request.url)
  signInUrl.searchParams.set('callbackUrl', pathname)
  return NextResponse.redirect(signInUrl)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
