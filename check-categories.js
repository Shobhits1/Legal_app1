const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const cats = await p.$queryRawUnsafe('SELECT category, COUNT(*) as cnt FROM case_laws GROUP BY category ORDER BY cnt DESC');
    for (const c of cats) {
        console.log(c.category + ': ' + Number(c.cnt));
    }
    const total = await p.caseLaw.count();
    console.log('\nTotal: ' + total);
    await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
