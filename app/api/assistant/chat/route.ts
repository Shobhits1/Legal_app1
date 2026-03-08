import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const SYSTEM_PROMPT = `You are **NyayaMitra AI**, a highly knowledgeable Indian legal voice assistant built into the NyayaMitra platform – an AI-powered legal information system used by police officers, lawyers, and citizens.

YOUR CAPABILITIES:
1. **Legal Analysis** – Explain IPC sections, BNS sections, CrPC provisions, Evidence Act, and other Indian laws in simple language.
2. **FIR Guidance** – Help draft FIRs, suggest applicable legal sections for incidents, and guide procedural steps.
3. **Case Law References** – Reference landmark Supreme Court and High Court judgments when relevant.
4. **Platform Navigation** – Guide users to the right feature:
   - "FIR Assistant" → /fir-assistant (AI-powered FIR writing assistance)
   - "Case Classifier" → /classifier (classify legal cases)
   - "Case Laws" → /case-laws (search landmark judgments)
   - "Legal Sections" → /legal-sections (browse IPC/BNS/CrPC sections)
   - "Voice Input" → /voice-input (dictate content)
   - "Search" → /search (universal search)
   - "Reports" → /reports (analytics & reports)
   - "Settings" → /settings (app configuration)
5. **General Legal Knowledge** – Answer questions about legal rights, procedures, bail, FIR filing process, etc.

RESPONSE GUIDELINES:
- Be concise but thorough. Use bullet points for clarity.
- When suggesting legal sections, mention both old (IPC) and new (BNS) provisions when applicable.
- If a user describes an incident, immediately suggest applicable legal sections and next steps.
- For platform navigation questions, respond with the feature name and what it does.
- Always be professional, empathetic, and helpful.
- If unsure, say so honestly and suggest consulting a qualified lawyer.
- Respond in the same language the user speaks in. If they speak Hindi, respond in Hindi. If English, respond in English.
- Keep responses under 300 words unless the user asks for detailed explanations.`

export async function POST(request: NextRequest) {
    try {
        const { message, history } = await request.json()

        if (!message?.trim()) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            )
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'Gemini API key not configured' },
                { status: 500 }
            )
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        // Build conversation history for context
        const chatHistory = (history || []).map((msg: { role: string; content: string }) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }))

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: 'You are NyayaMitra AI. Follow these instructions for all responses:\n' + SYSTEM_PROMPT }] },
                { role: 'model', parts: [{ text: 'Understood! I am NyayaMitra AI, your Indian legal voice assistant. I\'m ready to help with legal queries, FIR guidance, case laws, platform navigation, and general legal knowledge. How can I assist you today?' }] },
                ...chatHistory,
            ],
        })

        const result = await chat.sendMessage(message)
        const response = await result.response
        const text = response.text()

        return NextResponse.json({
            success: true,
            response: text,
            timestamp: new Date().toISOString(),
        })
    } catch (error: any) {
        console.error('Assistant chat error:', error)

        if (error?.status === 429) {
            return NextResponse.json(
                { error: 'Too many requests. Please wait a moment and try again.' },
                { status: 429 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to process your request. Please try again.' },
            { status: 500 }
        )
    }
}
