const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding database...');

    // 1. Create a default God User (required as owner)
    const godUser = await prisma.platformUser.upsert({
        where: { email: 'admin@alphery.com' },
        update: {},
        create: {
            id: 'default-admin-id',
            email: 'admin@alphery.com',
            firebaseUid: 'default-admin-uid',
            displayName: 'System Admin',
            isGod: true
        }
    });

    console.log('✅ Admin user created/verified');

    // 2. Create or update default tenant linked to the owner
    await prisma.tenant.upsert({
        where: { id: 'default-tenant' },
        update: {
            ownerUserId: godUser.id
        },
        create: {
            id: 'default-tenant',
            name: 'Default Organization',
            subdomain: 'default',
            plan: 'pro',
            ownerUserId: godUser.id
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
