import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { analyzeIncident } from '@/lib/ai'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    const searchTerm = query.trim()
    const startTime = Date.now()
    const results: any = {
      sections: [],
      caseLaws: [],
      firs: [],
    }

    // Search legal sections
    if (type === 'all' || type === 'sections') {
      const sections = await prisma.legalSection.findMany({
        where: {
          isActive: true,
          OR: [
            { section: { contains: searchTerm } },
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } },
            { category: { contains: searchTerm } },
            { act: { contains: searchTerm } },
          ],
        },
        take: limit,
        orderBy: [
          { frequency: 'desc' },
          { section: 'asc' },
        ],
        select: {
          id: true,
          act: true,
          section: true,
          title: true,
          description: true,
          category: true,
          frequency: true,
          punishment: true,
        },
      })

      results.sections = sections.map(section => ({
        id: section.id,
        type: 'section',
        title: `${section.act} Section ${section.section} - ${section.title}`,
        description: section.description,
        category: section.category,
        frequency: section.frequency,
        relevance: calculateRelevance(searchTerm, section.title + ' ' + section.description),
      }))
    }

    // Search case laws
    if (type === 'all' || type === 'caseLaws') {
      const caseLaws = await prisma.caseLaw.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: searchTerm } },
            { citation: { contains: searchTerm } },
            { summary: { contains: searchTerm } },
            { category: { contains: searchTerm } },
            { court: { contains: searchTerm } },
          ],
        },
        take: limit,
        orderBy: [
          { rating: 'desc' },
          { date: 'desc' },
        ],
        select: {
          id: true,
          title: true,
          citation: true,
          court: true,
          date: true,
          category: true,
          summary: true,
          rating: true,
          relevance: true,
        },
      })

      results.caseLaws = caseLaws.map(caseLaw => ({
        id: caseLaw.id,
        type: 'caseLaw',
        title: caseLaw.title,
        description: caseLaw.summary,
        citation: caseLaw.citation,
        court: caseLaw.court,
        date: caseLaw.date,
        category: caseLaw.category,
        rating: caseLaw.rating,
        relevance: calculateRelevance(searchTerm, caseLaw.title + ' ' + caseLaw.summary),
      }))
    }

    // Search FIRs (only for authorized users)
    if (type === 'all' || type === 'firs') {
      const firs = await prisma.fIR.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm } },
            { firNumber: { contains: searchTerm } },
            { description: { contains: searchTerm } },
            { complainant: { contains: searchTerm } },
            { location: { contains: searchTerm } },
          ],
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firNumber: true,
          title: true,
          description: true,
          incidentDate: true,
          location: true,
          complainant: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      })

      results.firs = firs.map(fir => ({
        id: fir.id,
        type: 'fir',
        title: `${fir.firNumber} - ${fir.title}`,
        description: fir.description,
        firNumber: fir.firNumber,
        incidentDate: fir.incidentDate,
        location: fir.location,
        complainant: fir.complainant,
        status: fir.status,
        priority: fir.priority,
        relevance: calculateRelevance(searchTerm, fir.title + ' ' + fir.description),
      }))
    }

    // Combine and sort all results by relevance
    const allResults = [
      ...results.sections,
      ...results.caseLaws,
      ...results.firs,
    ].sort((a, b) => b.relevance - a.relevance)

    const searchTimeMs = Date.now() - startTime

    return NextResponse.json({
      query: searchTerm,
      results: allResults,
      counts: {
        sections: results.sections.length,
        caseLaws: results.caseLaws.length,
        firs: results.firs.length,
        total: allResults.length,
      },
      searchTimeMs,
    })
  } catch (error) {
    console.error('Search error:', error)

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

function calculateRelevance(query: string, text: string): number {
  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()

  let score = 0

  // Exact match gets highest score
  if (textLower.includes(queryLower)) {
    score += 100
  }

  // Word matches
  const queryWords = queryLower.split(/\s+/)
  const textWords = textLower.split(/\s+/)

  queryWords.forEach(queryWord => {
    textWords.forEach(textWord => {
      if (textWord.includes(queryWord)) {
        score += 10
      }
      if (textWord === queryWord) {
        score += 20
      }
    })
  })

  // Title matches get bonus
  if (textLower.startsWith(queryLower)) {
    score += 50
  }

  return Math.min(score, 100)
}

const incidentAnalysisSchema = z.object({
  query: z.string().min(10, 'Query must be at least 10 characters'),
  type: z.literal('incident_analysis'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { query, type } = incidentAnalysisSchema.parse(body)

    if (type !== 'incident_analysis') {
      return NextResponse.json(
        { error: 'Invalid analysis type' },
        { status: 400 }
      )
    }

    // Analyze the incident using AI
    const analysis = await analyzeIncident(query)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Incident analysis error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
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
