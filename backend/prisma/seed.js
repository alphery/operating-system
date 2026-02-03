const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding default tenant...');

    // Create or update default tenant
    await prisma.tenant.upsert({
        where: { id: 'default-tenant' },
        update: {},
        create: {
            id: 'default-tenant',
            name: 'Default Organization',
            subdomain: 'default',
            plan: 'pro'
        }
    });

    console.log('✅ Default tenant created/verified');
    await prisma.$disconnect();
}

seed()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    });
