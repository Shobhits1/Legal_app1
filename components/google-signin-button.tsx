'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { FcGoogle } from 'react-icons/fc'
import { AlertTriangle } from 'lucide-react'

interface GoogleSignInButtonProps {
  className?: string
  disabled?: boolean
}

export function GoogleSignInButton({ className, disabled }: GoogleSignInButtonProps) {
  // Check if Google OAuth is configured
  const isGoogleConfigured = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
                            (typeof window !== 'undefined' && window.localStorage.getItem('google_oauth_configured'))

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' })
  }

  if (!isGoogleConfigured) {
    return (
      <div className="w-full p-4 border border-orange-200 rounded-lg bg-orange-50">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">
              Google Sign-In Not Configured
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Please configure Google OAuth credentials in your environment variables to enable Google sign-in.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleSignIn}
      disabled={disabled}
      className={className}
    >
      <FcGoogle className="mr-2 h-4 w-4" />
      Continue with Google
    </Button>
  )
}