/**
 * Script to seed the CaseLaw table from the ML training CSV datasets.
 * Reads `ml-service/data/dataset_2020_2025_improved.csv` and
 * `ml-service/data/dataset_2000_2019_labeled.csv`, extracts unique cases,
 * and inserts them into the SQLite database via Prisma.
 *
 * Usage: npx ts-node prisma/seed-caselaws.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface CSVRow {
    year: string
    filename: string
    text: string
    label: string
}

function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
            inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }
    result.push(current.trim())
    return result
}

function readCSV(filePath: string): CSVRow[] {
    if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  File not found: ${filePath}`)
        return []
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').filter(l => l.trim().length > 0)

    if (lines.length < 2) return []

    const headerLine = lines[0]
    const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim())

    const yearIdx = headers.indexOf('year')
    const filenameIdx = headers.indexOf('filename')
    const textIdx = headers.indexOf('text')
    const labelIdx = headers.indexOf('label')

    if (textIdx === -1 || labelIdx === -1) {
        console.log(`  ⚠️  Missing required columns in ${filePath}. Headers: ${headers.join(', ')}`)
        return []
    }

    const rows: CSVRow[] = []

    for (let i = 1; i < lines.length; i++) {
        try {
            const fields = parseCSVLine(lines[i])
            if (fields.length <= Math.max(textIdx, labelIdx)) continue

            const label = fields[labelIdx]
            if (!label || label === 'Uncategorized') continue

            rows.push({
                year: yearIdx >= 0 ? fields[yearIdx] : '',
                filename: filenameIdx >= 0 ? fields[filenameIdx] : `Case_${i}`,
                text: fields[textIdx] || '',
                label: label,
            })
        } catch (e) {
            // Skip malformed rows
        }
    }

    return rows
}

function formatCaseTitle(filename: string): string {
    return filename
        .replace(/\.PDF$/i, '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function inferCourt(text: string): string {
    const lowerText = text.toLowerCase().substring(0, 500)
    if (lowerText.includes('supreme court')) return 'Supreme Court of India'
    if (lowerText.includes('high court')) {
        // Try to find which high court
        const match = text.match(/([\w\s]+)\s*High\s*Court/i)
        if (match) return `${match[1].trim()} High Court`
        return 'High Court'
    }
    if (lowerText.includes('district court')) return 'District Court'
    if (lowerText.includes('sessions court')) return 'Sessions Court'
    if (lowerText.includes('tribunal')) return 'Tribunal'
    return 'Supreme Court of India'
}

function extractCitation(text: string, filename: string): string {
    // Try to find citation patterns
    const patterns = [
        /AIR\s*\d{4}\s*SC\s*\d+/i,
        /\(\d{4}\)\s*\d+\s*SCC\s*\d+/i,
        /SCC\s*\(\w+\)\s*\d+/i,
        /AIRONLINE\s*\d{4}\s*SC\s*\d+/i,
        /\d{4}\s*\(\d+\)\s*SCR\s*\d+/i,
    ]

    const textSnippet = text.substring(0, 300)
    for (const pattern of patterns) {
        const match = textSnippet.match(pattern)
        if (match) return match[0]
    }

    // Generate a unique citation from filename
    return `${filename.replace(/_/g, '/').substring(0, 40)}`
}

function generateSummary(text: string, category: string): string {
    // Take first 300 meaningful characters as summary
    const cleaned = text
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    if (cleaned.length > 300) {
        return cleaned.substring(0, 297) + '...'
    }
    return cleaned || `Legal case related to ${category}`
}

async function main() {
    console.log('📚 Seeding Case Laws from ML Training Data...\n')

    const dataDir = path.join(process.cwd(), 'ml-service', 'data')

    // Read both datasets
    console.log('📖 Loading dataset_2020_2025_improved.csv ...')
    const rows2020 = readCSV(path.join(dataDir, 'dataset_2020_2025_improved.csv'))
    console.log(`   Found ${rows2020.length} rows`)

    console.log('📖 Loading dataset_2000_2019_labeled.csv ...')
    const rows2000 = readCSV(path.join(dataDir, 'dataset_2000_2019_labeled.csv'))
    console.log(`   Found ${rows2000.length} rows`)

    const allRows = [...rows2020, ...rows2000]
    console.log(`\n📊 Total rows: ${allRows.length}`)

    // Deduplicate by filename (each filename = unique case)
    const uniqueCases = new Map<string, CSVRow>()
    for (const row of allRows) {
        if (!row.filename || row.filename === 'Unknown Case') continue
        if (!uniqueCases.has(row.filename)) {
            uniqueCases.set(row.filename, row)
        }
    }

    console.log(`🔍 Unique cases by filename: ${uniqueCases.size}`)

    // We'll import up to 500 representative cases to keep the DB practical
    const MAX_CASES = 500
    const casesArray = Array.from(uniqueCases.values())

    // Sample evenly across categories
    const byCategory = new Map<string, CSVRow[]>()
    for (const row of casesArray) {
        const existing = byCategory.get(row.label) || []
        existing.push(row)
        byCategory.set(row.label, existing)
    }

    console.log(`\n📁 Categories found:`)
    for (const [cat, rows] of byCategory) {
        console.log(`   ${cat}: ${rows.length} cases`)
    }

    // Pick proportionally from each category
    const selected: CSVRow[] = []
    const totalUnique = casesArray.length
    for (const [cat, rows] of byCategory) {
        const proportion = rows.length / totalUnique
        const count = Math.max(5, Math.min(rows.length, Math.round(proportion * MAX_CASES)))

        // Shuffle and take 'count' items
        const shuffled = rows.sort(() => Math.random() - 0.5)
        selected.push(...shuffled.slice(0, count))
    }

    console.log(`\n⬆️  Inserting ${selected.length} case laws into database...\n`)

    // Get existing citations to avoid duplicates
    const existingCitations = new Set(
        (await prisma.caseLaw.findMany({ select: { citation: true } })).map(c => c.citation)
    )

    let inserted = 0
    let skipped = 0
    let errors = 0

    for (const row of selected) {
        try {
            const title = formatCaseTitle(row.filename)
            const citation = extractCitation(row.text, row.filename)

            // Skip if citation already exists
            if (existingCitations.has(citation)) {
                skipped++
                continue
            }

            const year = parseInt(row.year) || 2020
            const court = inferCourt(row.text)
            const summary = generateSummary(row.text, row.label)

            await prisma.caseLaw.create({
                data: {
                    title,
                    citation,
                    court,
                    date: new Date(`${year}-06-15`),
                    category: row.label,
                    summary,
                    keyPoints: JSON.stringify([
                        `Category: ${row.label}`,
                        `Year: ${year}`,
                        `Court: ${court}`,
                    ]),
                    rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
                    relevance: 'High',
                },
            })

            existingCitations.add(citation)
            inserted++

            if (inserted % 50 === 0) {
                console.log(`   ✅ Inserted ${inserted} cases...`)
            }
        } catch (e: any) {
            if (e.code === 'P2002') {
                // Unique constraint violation — citation exists
                skipped++
            } else {
                errors++
                if (errors <= 3) {
                    console.error(`   ❌ Error inserting ${row.filename}: ${e.message}`)
                }
            }
        }
    }

    console.log(`\n🎉 Seeding complete!`)
    console.log(`   ✅ Inserted: ${inserted}`)
    console.log(`   ⏭️  Skipped (duplicate): ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)

    // Verify total
    const total = await prisma.caseLaw.count()
    console.log(`\n📊 Total case laws in database: ${total}`)
}

main()
    .catch((e) => {
        console.error('❌ Fatal error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
