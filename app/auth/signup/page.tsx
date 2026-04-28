'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { GoogleSignInButton } from '@/components/google-signin-button'
import { toast } from 'sonner'
import Link from 'next/link'
import { Shield, ArrowRight, Eye, EyeOff, User, BadgeCheck, MapPin, Award } from 'lucide-react'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    badge: '',
    password: '',
    confirmPassword: '',
    rank: '',
    station: '',
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.email || !formData.badge || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          badge: formData.badge,
          password: formData.password,
          rank: formData.rank || 'Constable',
          station: formData.station || 'Main Station',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Account created successfully! Please sign in.')
        router.push('/auth/signin')
      } else {
        toast.error(data.error || 'Failed to create account')
      }
    } catch (error) {
      toast.error('An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="w-full max-w-lg relative animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">NyayaMitra</span>
          </Link>
          <p className="text-muted-foreground text-sm">Create your officer account to access the AI legal system</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 border border-border/50">
          {/* Google OAuth Button */}
          <GoogleSignInButton className="w-full" disabled={loading} />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">
                Or create account manually
              </span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="John Doe"
                  className="h-11 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="badge" className="text-sm font-medium flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  Badge Number *
                </Label>
                <Input
                  id="badge"
                  name="badge"
                  type="text"
                  value={formData.badge}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="ABC123"
                  className="h-11 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="officer@policestation.gov.in"
                className="h-11 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rank" className="text-sm font-medium flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-muted-foreground" />
                  Rank
                </Label>
                <Input
                  id="rank"
                  name="rank"
                  type="text"
                  value={formData.rank}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Constable"
                  className="h-11 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="station" className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Station
                </Label>
                <Input
                  id="station"
                  name="station"
                  type="text"
                  value={formData.station}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Main Station"
                  className="h-11 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="Minimum 6 characters"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Re-enter password"
                className="h-11 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:shadow-indigo-500/30 hover:-translate-y-0.5 font-medium mt-2"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          <div className="text-center text-sm mt-6 text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
