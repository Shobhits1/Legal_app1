/** Normalize search bar text for crime-chip matching (e.g. "Dowry Death", "murder"). */
function normalizeCrimeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Maps popular crime chips to extra phrases/sections so case rows match even when
 * category is "Criminal Appeal" and the body uses IPC wording (302, dishonest misappropriation, etc.).
 */
const CRIME_QUERY_EXPANSIONS: { labels: string[]; alsoSearch: string[] }[] = [
  {
    labels: ['theft'],
    alsoSearch: [
      'theft',
      'stealing',
      'stolen',
      'robbery',
      'burglary',
      'dishonest',
      'misappropriation',
      '379',
      'section 379',
      'extortion',
    ],
  },
  {
    labels: ['murder'],
    alsoSearch: ['murder', 'homicide', 'culpable homicide', '302', 'section 302', 'killing', 'death caused'],
  },
  {
    labels: ['assault'],
    alsoSearch: ['assault', 'hurt', 'grievous', '323', 'section 323', '325', '324', 'voluntarily causing hurt'],
  },
  {
    labels: ['cheating'],
    alsoSearch: ['cheating', 'cheat', 'misrepresentation', 'fraud', '420', 'section 420', 'deceit', 'dishonestly'],
  },
  {
    labels: ['dowry death', 'dowrydeath'],
    alsoSearch: [
      'dowry death',
      'dowry',
      '304-b',
      '304b',
      '498a',
      'section 304',
      'bride burning',
      'cruelty',
    ],
  },
  {
    labels: ['house trespass', 'housetrespass'],
    alsoSearch: [
      'house trespass',
      'trespass',
      'house-breaking',
      'house breaking',
      'breaking',
      '448',
      'section 448',
      'criminal trespass',
    ],
  },
]

function matchesCrimeLabel(norm: string, compact: string, label: string): boolean {
  const lc = label.toLowerCase().trim().replace(/\s+/g, ' ')
  const lcomp = lc.replace(/\s+/g, '')
  return norm === lc || compact === lcomp || norm.startsWith(`${lc} `) || norm.endsWith(` ${lc}`)
}

function crimeGroupMatchesQuery(norm: string, compact: string, labels: string[]): boolean {
  if (labels.some((l) => matchesCrimeLabel(norm, compact, l))) return true

  const tokens = new Set(norm.split(/\s+/).filter((w) => w.length > 1))
  for (const l of labels) {
    const parts = l.toLowerCase().trim().split(/\s+/).filter(Boolean)
    if (parts.length === 1 && tokens.has(parts[0])) return true
    if (parts.length > 1 && parts.every((p) => norm.includes(p))) return true
  }
  return false
}

/** All distinct terms to search (original query + IPC/legal synonyms when a crime chip matches). */
export function crimeExpandedSearchTerms(searchTerm: string): string[] {
  const raw = searchTerm.trim()
  const norm = normalizeCrimeQuery(raw)
  const compact = norm.replace(/\s+/g, '')

  const terms = new Set<string>()
  if (raw.length >= 2) terms.add(raw)

  for (const group of CRIME_QUERY_EXPANSIONS) {
    const hit = crimeGroupMatchesQuery(norm, compact, group.labels)
    if (hit) {
      group.alsoSearch.forEach((t) => {
        if (t.length >= 2) terms.add(t)
      })
    }
  }

  return [...terms]
}

/**
 * SQLite (Prisma) does not support `mode: 'insensitive'` on string filters — it throws at runtime.
 * We approximate case-insensitive matching by OR-ing common case variants of each term.
 */
function uniqueCaseVariants(s: string): string[] {
  const t = s.trim()
  if (!t) return []
  const out = new Set<string>([t, t.toLowerCase(), t.toUpperCase()])
  const lower = t.toLowerCase()
  const titledWords = lower
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  if (titledWords) out.add(titledWords)
  return [...out].filter((x) => x.length > 0)
}

/** Prisma SQLite: OR of (field contains variant) for every search term × case variant × field. */
export function buildInsensitiveFieldOr(
  terms: string[],
  fields: readonly string[]
): Record<string, { contains: string }>[] {
  const or: Record<string, { contains: string }>[] = []
  for (const term of terms) {
    for (const variant of uniqueCaseVariants(term)) {
      for (const f of fields) {
        or.push({ [f]: { contains: variant } })
      }
    }
  }
  return or
}
