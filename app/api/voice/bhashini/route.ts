import { NextRequest, NextResponse } from 'next/server'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000'

/**
 * POST /api/voice/bhashini
 * Proxies voice input to the ML service's Bhashini integration for
 * speech-to-text and translation across 10 Indian languages.
 *
 * Body: { audio_base64: string, source_lang: string }
 * Response: { success, original_text, translated_text, ... }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { audio_base64, source_lang } = body

        if (!audio_base64 || !source_lang) {
            return NextResponse.json(
                { success: false, error: 'audio_base64 and source_lang are required' },
                { status: 400 }
            )
        }

        // Forward to ML service's Bhashini voice processing endpoint
        const response = await fetch(`${ML_SERVICE_URL}/api/voice/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio_base64, source_lang }),
        })

        if (!response.ok) {
            // Try the direct Bhashini process_audio endpoint as fallback
            const fallbackResponse = await fetch(`${ML_SERVICE_URL}/process_audio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio_base64, source_lang }),
            })

            if (!fallbackResponse.ok) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `ML service returned ${response.status}. Ensure the ML service is running on ${ML_SERVICE_URL}`,
                    },
                    { status: 502 }
                )
            }

            const fallbackData = await fallbackResponse.json()
            return NextResponse.json(fallbackData)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Bhashini voice API error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to connect to Bhashini voice service. Is the ML service running?',
            },
            { status: 503 }
        )
    }
}
