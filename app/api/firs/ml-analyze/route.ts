import { NextRequest, NextResponse } from 'next/server';
import { predictFIRSections } from '@/lib/ml-service';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function analyzeWithGemini(incidentText: string) {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are an expert Indian criminal law analyst. Analyze the following incident and provide a structured legal analysis for FIR writing.

Incident: "${incidentText}"

Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact format:
{
  "success": true,
  "incident": "<the incident text>",
  "predicted_category": "<crime category like Theft, Assault, Dowry Death, Cheating, Murder, etc.>",
  "confidence": <number between 0 and 1>,
  "crime_type": "<type of crime>",
  "description": "<brief description of the crime>",
  "primary_sections": [
    {"section": "IPC 379", "title": "Theft", "description": "Whoever intending to take dishonestly...", "penalty": "Imprisonment up to 3 years, or fine, or both", "bailable": true, "confidence": 90}
  ],
  "secondary_sections": [
    {"section": "IPC 447", "title": "Criminal Trespass", "penalty": "Imprisonment up to 3 months, or fine up to Rs 500"}
  ],
  "similar_cases": [
    {"filename": "Case_Name_v_State", "year": 1998, "text_preview": "Brief description of the case...", "category": "Theft"}
  ],
  "fir_draft": "<A professionally written FIR draft paragraph based on the incident>",
  "all_categories": [{"label": "Theft", "confidence": 0.9}, {"label": "Criminal Trespass", "confidence": 0.6}],
  "used_keyword_matching": false
}

Be accurate with IPC sections and their descriptions. Include 2-4 primary sections and 1-3 secondary sections. Include 5-8 relevant landmark Supreme Court or High Court cases with accurate citations and years. Write a proper FIR draft.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean the response - remove markdown code fences if present
    const cleanedText = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

    return JSON.parse(cleanedText);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { incident_text } = body;

        if (!incident_text?.trim()) {
            return NextResponse.json(
                { error: 'Please provide an incident description' },
                { status: 400 }
            );
        }

        // Try ML service first
        const mlResult = await predictFIRSections(incident_text);

        if (mlResult) {
            return NextResponse.json(mlResult);
        }

        // Fallback to Gemini API
        console.log('ML service unavailable, falling back to Gemini API...');
        try {
            const geminiResult = await analyzeWithGemini(incident_text);
            return NextResponse.json(geminiResult);
        } catch (geminiError) {
            console.error('Gemini fallback also failed:', geminiError);
            return NextResponse.json(
                { error: 'Both ML service and Gemini AI are unavailable. Please try again later.' },
                { status: 503 }
            );
        }
    } catch (error) {
        console.error('ML FIR analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze incident' },
            { status: 500 }
        );
    }
}

