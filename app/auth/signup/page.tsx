'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { GoogleSignInButton } from '@/components/google-signin-button'
import { toast } from 'sonner'
import Link from 'next/link'

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Create your police officer account to access the Legal AI system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google OAuth Button */}
          <GoogleSignInButton className="w-full" disabled={loading} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Or create account manually
              </span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="badge">Badge Number *</Label>
                <Input
                  id="badge"
                  name="badge"
                  type="text"
                  value={formData.badge}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="ABC123"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="officer@policestation.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rank">Rank</Label>
                <Input
                  id="rank"
                  name="rank"
                  type="text"
                  value={formData.rank}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Constable"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="station">Station</Label>
                <Input
                  id="station"
                  name="station"
                  type="text"
                  value={formData.station}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Main Station"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Re-enter password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
