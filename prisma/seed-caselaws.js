const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Proper CSV parser that handles quoted fields with commas, newlines, etc.
 */
function parseCSV(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log('  File not found:', filePath);
        return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // Parse into records handling quoted fields properly
    const records = [];
    let current = '';
    let inQuotes = false;
    let fields = [];

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            fields.push(current);
            current = '';
        } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
            fields.push(current);
            current = '';
            if (fields.length > 1) {
                records.push(fields);
            }
            fields = [];
            if (char === '\r') i++; // skip \n after \r
        } else {
            current += char;
        }
    }
    // Last record
    if (current.length > 0 || fields.length > 0) {
        fields.push(current);
        if (fields.length > 1) {
            records.push(fields);
        }
    }

    return records;
}

function formatCaseTitle(filename) {
    return filename.replace(/\.PDF$/i, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

function inferCourt(text) {
    const snippet = (text || '').toLowerCase().substring(0, 500);
    if (snippet.includes('supreme court')) return 'Supreme Court of India';
    if (snippet.includes('high court')) {
        const match = (text || '').match(/([\w\s]+)\s*High\s*Court/i);
        if (match) return match[1].trim() + ' High Court';
        return 'High Court';
    }
    if (snippet.includes('district court')) return 'District Court';
    return 'Supreme Court of India';
}

function extractCitation(text, filename) {
    const patterns = [
        /AIR\s*\d{4}\s*SC\s*\d+/i,
        /\(\d{4}\)\s*\d+\s*SCC\s*\d+/i,
        /AIRONLINE\s*\d{4}\s*SC\s*\d+/i,
    ];
    const snippet = (text || '').substring(0, 500);
    for (const p of patterns) {
        const m = snippet.match(p);
        if (m) return m[0];
    }
    return filename.substring(0, 60);
}

function generateSummary(text) {
    const cleaned = (text || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.length > 300 ? cleaned.substring(0, 297) + '...' : cleaned;
}

// The 9 valid categories from the ML model
const VALID_CATEGORIES = new Set([
    'Criminal Appeal', 'Bail Application', 'Constitutional Matter',
    'Contract Law', 'Property Dispute', 'Taxation Matter',
    'Service Matter', 'Family Law', 'Corporate Law'
]);

async function main() {
    console.log('=== Re-seeding Case Laws (Fixed CSV Parser) ===\n');

    // Step 1: Delete all existing seeded case laws (keep the original 3 from seed.ts)
    const originalCitations = ['AIR 1965 SC 722', 'AIR 1963 SC 1094', 'AIR 1998 SC 2213'];
    const deleted = await prisma.caseLaw.deleteMany({
        where: {
            citation: { notIn: originalCitations }
        }
    });
    console.log(`Deleted ${deleted.count} old seeded records.\n`);

    const dataDir = path.join(process.cwd(), 'ml-service', 'data');

    // Load and parse datasets
    console.log('Loading dataset_2020_2025_improved.csv ...');
    const records1 = parseCSV(path.join(dataDir, 'dataset_2020_2025_improved.csv'));
    console.log(`  Parsed ${records1.length} records (including header)`);

    console.log('Loading dataset_2000_2019_labeled.csv ...');
    const records2 = parseCSV(path.join(dataDir, 'dataset_2000_2019_labeled.csv'));
    console.log(`  Parsed ${records2.length} records (including header)`);

    // Process each dataset
    async function processRecords(records, datasetName) {
        if (records.length < 2) return 0;

        const header = records[0].map(h => h.toLowerCase().trim());
        const yearIdx = header.indexOf('year');
        const filenameIdx = header.indexOf('filename');
        const textIdx = header.indexOf('text');
        const labelIdx = header.indexOf('label');

        if (textIdx === -1 || labelIdx === -1) {
            console.log(`  Missing columns in ${datasetName}. Headers: ${header.join(', ')}`);
            return 0;
        }

        console.log(`  Columns: year=${yearIdx}, filename=${filenameIdx}, text=${textIdx}, label=${labelIdx}`);

        // Deduplicate by filename
        const uniqueCases = new Map();
        for (let i = 1; i < records.length; i++) {
            const row = records[i];
            if (row.length <= Math.max(textIdx, labelIdx)) continue;

            const label = row[labelIdx].trim();
            if (!label || label === 'Uncategorized' || !VALID_CATEGORIES.has(label)) continue;

            const filename = filenameIdx >= 0 ? row[filenameIdx].trim() : `Case_${i}`;
            if (!filename || uniqueCases.has(filename)) continue;

            uniqueCases.set(filename, {
                year: yearIdx >= 0 ? row[yearIdx].trim() : '',
                filename,
                text: row[textIdx] || '',
                label,
            });
        }

        console.log(`  Valid unique cases: ${uniqueCases.size}`);

        // Insert cases
        let inserted = 0;
        let errors = 0;
        const existingCitations = new Set();

        for (const [, row] of uniqueCases) {
            try {
                const title = formatCaseTitle(row.filename);
                const citation = extractCitation(row.text, row.filename);

                if (existingCitations.has(citation)) continue;

                const year = parseInt(row.year) || 2020;
                const court = inferCourt(row.text);
                const summary = generateSummary(row.text);

                await prisma.caseLaw.create({
                    data: {
                        title,
                        citation,
                        court,
                        date: new Date(year, 5, 15), // June 15 of that year
                        category: row.label,
                        summary,
                        keyPoints: JSON.stringify([
                            'Category: ' + row.label,
                            'Year: ' + year,
                            'Court: ' + court,
                        ]),
                        rating: Math.floor(Math.random() * 2) + 4,
                        relevance: 'High',
                    },
                });

                existingCitations.add(citation);
                inserted++;
                if (inserted % 500 === 0) console.log(`    Inserted ${inserted}...`);
            } catch (e) {
                if (e.code !== 'P2002') { // Skip unique constraint errors silently
                    errors++;
                    if (errors <= 3) console.error(`    Error: ${e.message.substring(0, 100)}`);
                }
            }
        }

        console.log(`  Done: ${inserted} inserted, ${errors} errors\n`);
        return inserted;
    }

    const count1 = await processRecords(records1, '2020-2025');
    const count2 = await processRecords(records2, '2000-2019');

    const total = await prisma.caseLaw.count();
    console.log(`=== Complete ===`);
    console.log(`Total inserted: ${count1 + count2}`);
    console.log(`Total case laws in DB: ${total}`);

    // Verify categories
    const cats = await prisma.$queryRawUnsafe('SELECT DISTINCT category, COUNT(*) as cnt FROM case_laws GROUP BY category ORDER BY cnt DESC');
    console.log('\nCategories in DB:');
    for (const c of cats) {
        console.log(`  ${c.category}: ${Number(c.cnt)} cases`);
    }
}

main()
    .catch(e => { console.error('Fatal:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
