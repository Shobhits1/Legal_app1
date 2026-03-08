import { PrismaClient } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create demo admin user for testing (optional)
  const hashedPassword = await bcrypt.hash('tobito123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'demo@legalai.gov.in' },
    update: {},
    create: {
      email: 'demo@legalai.gov.in',
      name: 'Demo Administrator',
      badge: 'DEMO001',
      rank: 'ADMIN',
      station: 'Demo Station',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin user created for testing')

  // Create legal sections
  const legalSections = [
    {
      act: 'IPC',
      section: '379',
      title: 'Theft',
      description: 'Whoever intends to take dishonestly any movable property out of the possession of any person without that person\'s consent, moves that property in order to such taking, is said to commit theft.',
      punishment: 'Imprisonment of either description for a term which may extend to three years, or with fine, or with both.',
      essentials: JSON.stringify(['Dishonest intention', 'Movable property', 'Taking out of possession', 'Without consent', 'Moving the property']),
      category: 'Property Offences',
      frequency: 'Very High',
      relatedSections: JSON.stringify(['380', '381', '382']),
    },
    {
      act: 'IPC',
      section: '380',
      title: 'Theft in dwelling house, etc.',
      description: 'Whoever commits theft in any building, tent or vessel, which building, tent or vessel is used as a human dwelling, or used for the custody of property, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.',
      punishment: 'Imprisonment for up to 7 years and fine',
      essentials: JSON.stringify(['All essentials of theft under Section 379', 'Theft committed in dwelling house', 'Or in building used for custody of property']),
      category: 'Property Offences',
      frequency: 'High',
      relatedSections: JSON.stringify(['379', '381', '382']),
    },
    {
      act: 'IPC',
      section: '447',
      title: 'Criminal trespass',
      description: 'Whoever enters into or upon property in the possession of another with intent to commit an offence or to intimidate, insult or annoy any person in possession of such property, or having lawfully entered into or upon such property, unlawfully remains there with intent thereby to intimidate, insult or annoy any such person, or with intent to commit an offence, is said to commit criminal trespass.',
      punishment: 'Imprisonment of either description for a term which may extend to three months, or with fine which may extend to five hundred rupees, or with both.',
      essentials: JSON.stringify(['Entry into or upon property', 'Property in possession of another', 'Intent to commit offence or intimidate/insult/annoy', 'Or unlawful remaining with such intent']),
      category: 'Offences Against Property',
      frequency: 'High',
      relatedSections: JSON.stringify(['441', '448', '449', '450', '451', '452']),
    },
    {
      act: 'IPC',
      section: '304B',
      title: 'Dowry death',
      description: 'Where the death of a woman is caused by any burns or bodily injury or occurs otherwise than under normal circumstances within seven years of her marriage and it is shown that soon before her death she was subjected to cruelty or harassment by her husband or any relative of her husband for, or in connection with, any demand for dowry, such death shall be called "dowry death", and such husband or relative shall be deemed to have caused her death.',
      punishment: 'Imprisonment for a term which shall not be less than seven years but which may extend to imprisonment for life.',
      essentials: JSON.stringify(['Death of a woman', 'Within seven years of marriage', 'Death caused by burns or bodily injury', 'Soon before death subjected to cruelty or harassment', 'For or in connection with demand for dowry']),
      category: 'Offences Against Women',
      frequency: 'Medium',
      relatedSections: JSON.stringify(['498A', '113B']),
    },
    {
      act: 'IPC',
      section: '498A',
      title: 'Husband or relative of husband of a woman subjecting her to cruelty',
      description: 'Whoever, being the husband or the relative of the husband of a woman, subjects such woman to cruelty shall be punished with imprisonment for a term which may extend to three years and shall also be liable to fine.',
      punishment: 'Imprisonment for a term which may extend to three years and shall also be liable to fine.',
      essentials: JSON.stringify(['Husband or relative of husband', 'Subjecting woman to cruelty', 'Cruelty includes wilful conduct or harassment']),
      category: 'Offences Against Women',
      frequency: 'High',
      relatedSections: JSON.stringify(['304B', '113B']),
    },
  ]

  for (const section of legalSections) {
    await prisma.legalSection.upsert({
      where: { 
        act_section: {
          act: section.act,
          section: section.section
        }
      },
      update: {},
      create: section,
    })
  }

  // Create case laws
  const caseLaws = [
    {
      title: 'State of Maharashtra v. Mayer Hans George',
      citation: 'AIR 1965 SC 722',
      court: 'Supreme Court of India',
      date: new Date('1965-03-15'),
      category: 'Theft',
      summary: 'This landmark judgment clarified the definition of theft and the intention required for the offense. The court held that mere taking of property without the owner\'s consent constitutes theft if done dishonestly.',
      keyPoints: JSON.stringify([
        'Definition of dishonest intention in theft cases',
        'Distinction between theft and criminal breach of trust',
        'Burden of proof in theft cases'
      ]),
      rating: 5,
      relevance: 'High',
    },
    {
      title: 'Pyare Lal v. State of Rajasthan',
      citation: 'AIR 1963 SC 1094',
      court: 'Supreme Court of India',
      date: new Date('1963-08-20'),
      category: 'House Trespass',
      summary: 'This case established important precedents regarding house trespass and the circumstances that constitute criminal trespass with preparation for hurt, assault or wrongful restraint.',
      keyPoints: JSON.stringify([
        'Elements of house trespass',
        'Preparation for committing offense',
        'Distinction between simple and aggravated trespass'
      ]),
      rating: 4,
      relevance: 'Medium',
    },
    {
      title: 'Nathuni Yadav v. State of Bihar',
      citation: 'AIR 1998 SC 2213',
      court: 'Supreme Court of India',
      date: new Date('1998-11-12'),
      category: 'Dowry Death',
      summary: 'Landmark judgment on dowry death cases, establishing guidelines for investigation and prosecution. The court emphasized the importance of circumstantial evidence in such cases.',
      keyPoints: JSON.stringify([
        'Circumstantial evidence in dowry death',
        'Burden of proof under Section 113B Evidence Act',
        'Investigation guidelines for dowry death cases'
      ]),
      rating: 5,
      relevance: 'High',
    },
  ]

  for (const caseLaw of caseLaws) {
    await prisma.caseLaw.upsert({
      where: { citation: caseLaw.citation },
      update: {},
      create: caseLaw,
    })
  }

  // Optional: Create sample FIRs (commented out to keep database clean for new users)
  // Uncomment below if you want sample FIRs in the database

  /*
  const sampleFIRs = [
    {
      firNumber: 'FIR-2024-001247',
      title: 'House Breaking and Theft',
      description: 'On 15th January 2024, at around 10:30 PM, the complainant Mr. Raj Kumar reported that unknown persons broke into his house at 123 Main Street and stole jewelry worth Rs. 50,000, cash Rs. 10,000, and a laptop.',
      incidentDate: new Date('2024-01-15T22:30:00Z'),
      location: '123 Main Street, Central District',
      complainant: 'Raj Kumar',
      status: 'APPROVED',
      priority: 'HIGH',
      primarySections: JSON.stringify([
        { section: 'IPC 379', description: 'Theft', confidence: 95 },
        { section: 'IPC 380', description: 'Theft in dwelling house', confidence: 88 }
      ]),
      secondarySections: JSON.stringify([
        { section: 'IPC 447', description: 'Criminal trespass', confidence: 75 },
        { section: 'IPC 452', description: 'House-trespass after preparation', confidence: 70 }
      ]),
      aiAnalysis: JSON.stringify({
        confidence: 92,
        recommendations: [
          'Include witness statements from neighbors',
          'Document all stolen items with approximate values',
          'Check for CCTV footage in the vicinity',
          'Verify the complainant\'s ownership of stolen items'
        ]
      }),
      relevantCaseLaws: JSON.stringify([
        {
          title: 'State of Maharashtra v. Mayer Hans George',
          citation: 'AIR 1965 SC 722',
          relevance: 'Definition of theft and intention'
        }
      ]),
      createdBy: admin.id,
    }
  ]

  for (const fir of sampleFIRs) {
    await prisma.fIR.upsert({
      where: { firNumber: fir.firNumber },
      update: {},
      create: fir,
    })
  }
  */

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
