'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { GoogleSignInButton } from '@/components/google-signin-button'
import { toast } from 'sonner'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

const authErrorMessages: Record<string, string> = {
  OAuthAccountNotLinked: 'This email is already registered. Please sign in with your original method, or try again.',
  OAuthSignin: 'Could not start the Google sign-in flow. Please try again.',
  OAuthCallback: 'Google sign-in failed. Please try again.',
  OAuthCreateAccount: 'Could not create your account. Please try again.',
  Callback: 'Authentication callback error. Please try again.',
  AccessDenied: 'Access denied. You do not have permission to sign in.',
  Configuration: 'Server configuration error. Please contact support.',
  Default: 'An unexpected error occurred. Please try again.',
}

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams?.get('error')
  const errorMessage = errorParam
    ? authErrorMessages[errorParam] || authErrorMessages.Default
    : null

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        toast.success('Signed in successfully!')
        router.push('/')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Sign in failed')
      }
    } catch (error) {
      toast.error('An error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Sign in to access your Legal AI dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auth Error Alert */}
          {errorMessage && (
            <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Google OAuth Button */}
          <GoogleSignInButton className="w-full" disabled={loading} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Traditional Login Form */}
          <form onSubmit={handleTraditionalLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-sm">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Create account here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
