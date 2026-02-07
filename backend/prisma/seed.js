const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding database...');

    // 1. Create a default God User (alpherymail@gmail.com)
    const godUser = await prisma.platformUser.upsert({
        where: { email: 'alpherymail@gmail.com' },
        update: {
            isGod: true,
            isActive: true
        },
        create: {
            email: 'alpherymail@gmail.com',
            firebaseUid: 'alpherymail-default-uid', // This will update once they log in via Firebase
            displayName: 'Alphery Admin',
            isGod: true,
            isActive: true
        }
    });

    console.log(`✅ Admin user verified: ${godUser.email} (isGod: ${godUser.isGod})`);

    // 2. Create or update default tenant linked to the owner
    const tenant = await prisma.tenant.upsert({
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

    console.log(`✅ Default tenant verified: ${tenant.name} (Owned by: ${godUser.email})`);

    // 3. Seed Standard Apps
    const standardApps = [
        { id: 'messenger', code: 'messenger', name: 'Messenger', category: 'communication', isCore: true },
        { id: 'alphery-access', code: 'alphery-access', name: 'Alphery Access', category: 'system', isCore: true },
        { id: 'projects', code: 'projects', name: 'CRM Pro', category: 'productivity', isCore: false },
        { id: 'app-store', code: 'app-store', name: 'App Store', category: 'system', isCore: true },
        { id: 'settings', code: 'settings', name: 'Settings', category: 'system', isCore: true },
        { id: 'files', code: 'files', name: 'Files', category: 'utility', isCore: true },
        { id: 'todo', code: 'todo', name: 'To-Do', category: 'productivity', isCore: false },
        { id: 'weather', code: 'weather', name: 'Weather', category: 'utility', isCore: false },
        { id: 'calendar', code: 'calendar', name: 'Calendar', category: 'productivity', isCore: false }
    ];

    for (const app of standardApps) {
        await prisma.app.upsert({
            where: { id: app.id },
            update: app,
            create: app
        });

        // Enable for default tenant
        await prisma.tenantApp.upsert({
            where: {
                id: `default-tenant-${app.id}`
            },
            update: { enabled: true },
            create: {
                id: `default-tenant-${app.id}`,
                tenantId: 'default-tenant',
                appId: app.id,
                enabled: true
            }
        });
    }

    console.log('✅ Standard apps seeded and enabled for default tenant');

    await prisma.$disconnect();
}

seed()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    });
