import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { z } from 'zod'

const transcribeSchema = z.object({
  language: z.string().default('hi-IN'),
  confidence: z.number().min(0).max(1).default(0.8),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const language = formData.get('language') as string || 'hi-IN'
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an audio file.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'voice')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `voice_${user.id}_${timestamp}.${audioFile.name.split('.').pop()}`
    const filepath = join(uploadsDir, filename)

    // Save file
    const bytes = await audioFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Save recording metadata to database
    const recording = await prisma.voiceRecording.create({
      data: {
        filename,
        originalName: audioFile.name,
        mimeType: audioFile.type,
        size: audioFile.size,
        path: filepath,
        language,
        processedBy: user.id,
      },
    })

    // Simulate transcription (in real implementation, use speech-to-text service)
    const transcript = await simulateTranscription(audioFile, language)

    // Update recording with transcript
    await prisma.voiceRecording.update({
      where: { id: recording.id },
      data: {
        transcript,
        confidence: 0.95, // Simulated confidence
      },
    })

    return NextResponse.json({
      id: recording.id,
      transcript,
      confidence: 0.95,
      language,
      duration: audioFile.size / 1000, // Rough estimate
    })
  } catch (error) {
    console.error('Voice transcription error:', error)
    
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

async function simulateTranscription(audioFile: File, language: string): Promise<string> {
  // This is a simulation. In real implementation, you would:
  // 1. Use Google Cloud Speech-to-Text API
  // 2. Use Azure Speech Services
  // 3. Use AWS Transcribe
  // 4. Use OpenAI Whisper API
  
  const sampleTranscripts = {
    'hi-IN': 'आज दिनांक 15 जनवरी 2024 को रात्रि लगभग 10:30 बजे शिकायतकर्ता श्री राज कुमार निवासी 123 मुख्य मार्ग ने रिपोर्ट दी कि अज्ञात व्यक्तियों ने उनके घर में सेंध लगाकर 50,000 रुपये के गहने, 10,000 रुपये नकद और एक लैपटॉप चुराया है। यह घटना तब हुई जब परिवार एक शादी में गया हुआ था।',
    'en-IN': 'On 15th January 2024, at around 10:30 PM, the complainant Mr. Raj Kumar, resident of 123 Main Street, reported that unknown persons broke into his house and stole jewelry worth Rs. 50,000, cash Rs. 10,000, and a laptop. This incident occurred when the family was away attending a wedding.',
    'mr-IN': '15 जानेवारी 2024 रोजी रात्री सुमारे 10:30 वाजता तक्रारदार श्री राज कुमार यांनी 123 मुख्य रस्ता येथे राहत असून अहवाल दिला की अज्ञात व्यक्तींनी त्यांच्या घरात सेंध घालून 50,000 रुपयांचे दागिने, 10,000 रुपये रोख आणि एक लॅपटॉप चोरले. ही घटना तेव्हा घडली जेव्हा कुटुंब लग्नात गेले होते.',
  }

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  return sampleTranscripts[language as keyof typeof sampleTranscripts] || sampleTranscripts['en-IN']
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const skip = (page - 1) * limit

    const [recordings, total] = await Promise.all([
      prisma.voiceRecording.findMany({
        where: { processedBy: user.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          originalName: true,
          language: true,
          transcript: true,
          confidence: true,
          size: true,
          createdAt: true,
        },
      }),
      prisma.voiceRecording.count({
        where: { processedBy: user.id },
      }),
    ])

    return NextResponse.json({
      recordings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get voice recordings error:', error)
    
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
