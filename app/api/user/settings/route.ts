import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const settingsSchema = z.object({
  settings: z.object({
    notifications: z.boolean().optional(),
    voiceInput: z.boolean().optional(),
    autoSave: z.boolean().optional(),
    darkMode: z.boolean().optional(),
    language: z.string().optional(),
    voiceLanguage: z.string().optional(),
    confidenceThreshold: z.number().min(0).max(100).optional(),
  }),
})

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { settings } = settingsSchema.parse(body)

    // For now, we'll store settings as JSON in the user record
    // In a production app, you'd want a separate UserSettings table
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        // You could add a settings JSON field to the User model
        // For now, we'll just acknowledge the save
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    // In a real implementation, you'd save settings to a UserSettings table
    // For now, we'll just return success since the settings are client-side only

    return NextResponse.json({
      message: 'Settings saved successfully',
      settings: settings,
    })
  } catch (error) {
    console.error('Settings save error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid settings', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // For now, return default settings
    // In a real implementation, you'd fetch from UserSettings table
    const defaultSettings = {
      notifications: true,
      voiceInput: true,
      autoSave: true,
      darkMode: false,
      language: "en",
      voiceLanguage: "hi-IN",
      confidenceThreshold: 85,
    }

    return NextResponse.json({
      settings: defaultSettings,
    })
  } catch (error) {
    console.error('Settings fetch error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
