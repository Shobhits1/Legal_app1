import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { analyzeIncident } from '@/lib/ai'
import { buildInsensitiveFieldOr, crimeExpandedSearchTerms } from '@/lib/crime-search-terms'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

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
    const expandedTerms = crimeExpandedSearchTerms(searchTerm)
    const startTime = Date.now()
    const results: any = {
      sections: [],
      caseLaws: [],
      firs: [],
    }

    // Search legal sections
    if (type === 'all' || type === 'sections') {
      const sectionOr = buildInsensitiveFieldOr(expandedTerms, [
        'section',
        'title',
        'description',
        'category',
        'act',
        'punishment',
      ])
      const sections = await prisma.legalSection.findMany({
        where: {
          isActive: true,
          OR: sectionOr,
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
        relevance: Math.max(
          ...expandedTerms.map((t) =>
            calculateRelevance(
              t,
              [section.act, section.section, section.title, section.description, section.category, section.punishment].join(' ')
            )
          )
        ),
      }))
    }

    // Search case laws
    if (type === 'all' || type === 'caseLaws') {
      const caseLawOr = buildInsensitiveFieldOr(expandedTerms, [
        'title',
        'citation',
        'summary',
        'category',
        'court',
        'keyPoints',
        'fullText',
        'relevance',
      ])
      const caseLawTake =
        expandedTerms.length > 1 ? Math.min(Math.max(limit, 28), 60) : limit

      const caseLaws = await prisma.caseLaw.findMany({
        where: {
          isActive: true,
          OR: caseLawOr,
        },
        take: caseLawTake,
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
          keyPoints: true,
          fullText: true,
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
        relevance: Math.max(
          ...expandedTerms.map((t) =>
            calculateRelevance(
              t,
              [caseLaw.title, caseLaw.summary, caseLaw.category, caseLaw.court, caseLaw.citation, caseLaw.keyPoints, caseLaw.fullText || '', caseLaw.relevance].join(' ')
            )
          )
        ),
      }))
    }

    // Search FIRs (same visibility as /api/firs: officers see own/assigned only)
    if (type === 'all' || type === 'firs') {
      const firTextOr = buildInsensitiveFieldOr(expandedTerms, [
        'title',
        'firNumber',
        'description',
        'complainant',
        'location',
        'accused',
        'primarySections',
        'secondarySections',
        'aiAnalysis',
        'recommendations',
        'relevantCaseLaws',
      ])
      const firConditions: object[] = [
        {
          OR: firTextOr,
        },
      ]

      if (user.role !== 'ADMIN') {
        firConditions.push({
          OR: [{ createdBy: user.id }, { assignedTo: user.id }],
        })
      }

      const firs = await prisma.fIR.findMany({
        where: { AND: firConditions },
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
          accused: true,
          primarySections: true,
          secondarySections: true,
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
        date: fir.incidentDate.toISOString(),
        incidentDate: fir.incidentDate.toISOString(),
        location: fir.location,
        complainant: fir.complainant,
        status: fir.status,
        priority: fir.priority,
        relevance: Math.max(
          ...expandedTerms.map((t) =>
            calculateRelevance(
              t,
              [fir.title, fir.description, fir.firNumber, fir.complainant, fir.location, fir.accused || '', fir.primarySections, fir.secondarySections || ''].join(' ')
            )
          )
        ),
      }))
    }

    // Combine and sort all results by relevance
    let allResults = [
      ...results.sections,
      ...results.caseLaws,
      ...results.firs,
    ].sort((a, b) => b.relevance - a.relevance)

    let fallback = false
    let fallbackWidened = false

    if (allResults.length === 0) {
      fallback = true
      allResults = await fetchSearchFallback(user, type, limit, searchTerm)
    }

    if (allResults.length === 0 && type !== 'all') {
      fallbackWidened = true
      allResults = await fetchSearchFallback(user, 'all', limit, searchTerm)
    }

    const searchTimeMs = Date.now() - startTime

    const counts = {
      sections: allResults.filter((r) => r.type === 'section').length,
      caseLaws: allResults.filter((r) => r.type === 'caseLaw').length,
      firs: allResults.filter((r) => r.type === 'fir').length,
      total: allResults.length,
    }

    return NextResponse.json({
      query: searchTerm,
      results: allResults,
      counts,
      searchTimeMs,
      fallback,
      fallbackWidened,
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

/** When nothing matches the query, return popular items so the search page is never empty (unless the DB is empty). */
async function fetchSearchFallback(
  user: User,
  type: string,
  perTypeLimit: number,
  searchTerm: string
) {
  const cap = (n: number) => Math.max(3, Math.min(n, perTypeLimit))
  const sectionsTake = type === 'all' ? cap(6) : cap(perTypeLimit)
  const lawsTake = type === 'all' ? cap(10) : cap(perTypeLimit)
  const firsTake = type === 'all' ? cap(5) : cap(perTypeLimit)

  const out: any[] = []

  if (type === 'all' || type === 'sections') {
    const sections = await prisma.legalSection.findMany({
      where: { isActive: true },
      take: sectionsTake,
      orderBy: [{ frequency: 'desc' }, { section: 'asc' }],
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

    for (const section of sections) {
      const haystack = [section.act, section.section, section.title, section.description, section.category, section.punishment].join(' ')
      out.push({
        id: section.id,
        type: 'section',
        title: `${section.act} Section ${section.section} - ${section.title}`,
        description: section.description,
        category: section.category,
        frequency: section.frequency,
        relevance: Math.min(45, Math.max(8, calculateRelevance(searchTerm, haystack))),
        isSuggestion: true,
      })
    }
  }

  if (type === 'all' || type === 'caseLaws') {
    const caseLaws = await prisma.caseLaw.findMany({
      where: { isActive: true },
      take: lawsTake,
      orderBy: [{ rating: 'desc' }, { date: 'desc' }],
      select: {
        id: true,
        title: true,
        citation: true,
        court: true,
        date: true,
        category: true,
        summary: true,
        keyPoints: true,
        fullText: true,
        rating: true,
        relevance: true,
      },
    })

    for (const caseLaw of caseLaws) {
      const haystack = [caseLaw.title, caseLaw.summary, caseLaw.category, caseLaw.court, caseLaw.citation, caseLaw.keyPoints, caseLaw.fullText || '', caseLaw.relevance].join(' ')
      out.push({
        id: caseLaw.id,
        type: 'caseLaw',
        title: caseLaw.title,
        description: caseLaw.summary,
        citation: caseLaw.citation,
        court: caseLaw.court,
        date: caseLaw.date,
        category: caseLaw.category,
        rating: caseLaw.rating,
        relevance: Math.min(45, Math.max(8, calculateRelevance(searchTerm, haystack))),
        isSuggestion: true,
      })
    }
  }

  if (type === 'all' || type === 'firs') {
    const firWhere =
      user.role !== 'ADMIN'
        ? { OR: [{ createdBy: user.id }, { assignedTo: user.id }] }
        : {}

    const firs = await prisma.fIR.findMany({
      where: firWhere,
      take: firsTake,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firNumber: true,
        title: true,
        description: true,
        incidentDate: true,
        location: true,
        complainant: true,
        accused: true,
        primarySections: true,
        secondarySections: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    })

    for (const fir of firs) {
      const haystack = [fir.title, fir.description, fir.firNumber, fir.complainant, fir.location, fir.accused || '', fir.primarySections, fir.secondarySections || ''].join(' ')
      out.push({
        id: fir.id,
        type: 'fir',
        title: `${fir.firNumber} - ${fir.title}`,
        description: fir.description,
        firNumber: fir.firNumber,
        date: fir.incidentDate.toISOString(),
        incidentDate: fir.incidentDate.toISOString(),
        location: fir.location,
        complainant: fir.complainant,
        status: fir.status,
        priority: fir.priority,
        relevance: Math.min(45, Math.max(8, calculateRelevance(searchTerm, haystack))),
        isSuggestion: true,
      })
    }
  }

  return out.sort((a, b) => b.relevance - a.relevance)
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
