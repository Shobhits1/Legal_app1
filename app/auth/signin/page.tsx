'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { GoogleSignInButton } from '@/components/google-signin-button'
import { toast } from 'sonner'
import Link from 'next/link'
import { AlertCircle, Shield, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'

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

function SignInContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="w-full max-w-md relative animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">NyayaMitra</span>
          </Link>
          <p className="text-muted-foreground text-sm">Sign in to your legal intelligence dashboard</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 border border-border/50">
          {/* Auth Error Alert */}
          {errorMessage && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 mb-6 animate-slide-up">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Google OAuth Button */}
          <GoogleSignInButton className="w-full" disabled={loading} />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Traditional Login Form */}
          <form onSubmit={handleTraditionalLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="officer@station.gov.in"
                className="h-11 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  className="h-11 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:shadow-indigo-500/30 hover:-translate-y-0.5 font-medium"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          <div className="text-center text-sm mt-6 text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Create account here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
