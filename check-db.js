const { PrismaClient } = require('@prisma/client');

async function checkDB() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking database contents...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        badge: true,
        role: true,
        password: true,
      },
    });

    console.log(`👥 Total users: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Badge: ${user.badge}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Has Password: ${user.password ? 'Yes' : 'No (OAuth only)'}\n`);
    });

    const legalSections = await prisma.legalSection.count();
    const caseLaws = await prisma.caseLaw.count();
    const firs = await prisma.fIR.count();

    console.log(`📋 Legal Sections: ${legalSections}`);
    console.log(`⚖️ Case Laws: ${caseLaws}`);
    console.log(`📄 FIRs: ${firs}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
