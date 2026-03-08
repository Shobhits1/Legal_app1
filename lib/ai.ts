"use server";

import { GoogleGenerativeAI } from '@google/generative-ai'

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY || ''
  if (!apiKey) throw new Error('Gemini API key is not configured')
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
}

export interface LegalAnalysis {
  primarySections: Array<{
    section: string
    description: string
    confidence: number
  }>
  secondarySections: Array<{
    section: string
    description: string
    confidence: number
  }>
  relevantCaseLaws: Array<{
    title: string
    citation: string
    relevance: string
  }>
  recommendations: string[]
  confidence: number
}

export async function analyzeIncident(incidentDescription: string): Promise<LegalAnalysis> {
  try {
    const prompt = `
    Analyze the following incident description and provide legal analysis for FIR writing:

    Incident: ${incidentDescription}

    Please provide:
    1. Primary legal sections (IPC/BNS) that most likely apply (with confidence scores 0-100)
    2. Secondary legal sections that might apply (with confidence scores 0-100)
    3. Relevant case laws with citations
    4. Investigation recommendations
    5. Overall confidence score

    Respond EXACTLY in JSON format with this structure ONLY (no markdown fences, no explanatory text):
    {
      "primarySections": [{"section": "IPC 379", "description": "Theft", "confidence": 95}],
      "secondarySections": [{"section": "IPC 447", "description": "Criminal trespass", "confidence": 75}],
      "relevantCaseLaws": [{"title": "Case Name", "citation": "Citation", "relevance": "Why relevant"}],
      "recommendations": ["Recommendation 1", "Recommendation 2"],
      "confidence": 92
    }
    `

    const model = getGeminiModel();
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    if (!responseText) {
      throw new Error('No response from AI')
    }

    const cleanedText = responseText
      .replace(/\`\`\`json\s*/g, '')
      .replace(/\`\`\`\s*/g, '')
      .trim();

    return JSON.parse(cleanedText) as LegalAnalysis;
  } catch (error) {
    console.error('AI Analysis Error:', error)
    // Fallback analysis for common cases
    return getFallbackAnalysis(incidentDescription)
  }
}

function getFallbackAnalysis(incidentDescription: string): LegalAnalysis {
  const description = incidentDescription.toLowerCase()

  // Simple keyword-based fallback
  if (description.includes('theft') || description.includes('stole') || description.includes('stolen')) {
    return {
      primarySections: [
        { section: 'IPC 379', description: 'Theft', confidence: 85 },
        { section: 'IPC 380', description: 'Theft in dwelling house', confidence: 80 }
      ],
      secondarySections: [
        { section: 'IPC 447', description: 'Criminal trespass', confidence: 70 }
      ],
      relevantCaseLaws: [
        { title: 'State of Maharashtra v. Mayer Hans George', citation: 'AIR 1965 SC 722', relevance: 'Definition of theft and intention' }
      ],
      recommendations: [
        'Document all stolen items with values',
        'Collect witness statements',
        'Check for CCTV footage',
        'Verify ownership of stolen items'
      ],
      confidence: 75
    }
  }

  if (description.includes('dowry') || description.includes('cruelty') || description.includes('harassment')) {
    return {
      primarySections: [
        { section: 'IPC 498A', description: 'Cruelty by husband or relatives', confidence: 90 },
        { section: 'IPC 304B', description: 'Dowry death', confidence: 70 }
      ],
      secondarySections: [],
      relevantCaseLaws: [
        { title: 'Nathuni Yadav v. State of Bihar', citation: 'AIR 1998 SC 2213', relevance: 'Dowry death guidelines' }
      ],
      recommendations: [
        'Medical examination of complainant',
        'Collect evidence of dowry demands',
        'Record statements of witnesses',
        'Check for previous complaints'
      ],
      confidence: 80
    }
  }

  // Default fallback
  return {
    primarySections: [
      { section: 'IPC 447', description: 'Criminal trespass', confidence: 60 }
    ],
    secondarySections: [],
    relevantCaseLaws: [],
    recommendations: [
      'Conduct thorough investigation',
      'Collect all available evidence',
      'Record detailed statements',
      'Consult with legal experts if needed'
    ],
    confidence: 50
  }
}

export async function generateFIRSummary(incidentData: any): Promise<string> {
  try {
    const prompt = `
    Generate a professional FIR summary for the following incident data:
    
    ${JSON.stringify(incidentData, null, 2)}
    
    Create a concise, professional summary suitable for official documentation.
    `

    const model = getGeminiModel();
    const result = await model.generateContent(prompt);

    return result.response.text() || 'Unable to generate summary'
  } catch (error) {
    console.error('FIR Summary Generation Error:', error)
    return 'Summary generation failed. Please review manually.'
  }
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    const prompt = `
    Translate the following text to ${targetLanguage}:
    
    ${text}
    
    Provide only the translation without any additional text.
    `

    const model = getGeminiModel();
    const result = await model.generateContent(prompt);

    return result.response.text() || text
  } catch (error) {
    console.error('Translation Error:', error)
    return text
  }
}
