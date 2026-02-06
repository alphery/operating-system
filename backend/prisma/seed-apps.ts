import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Alphery Access data...\n');

    // Seed Apps
    console.log('📱 Seeding apps...');
    const apps = [
        {
            id: 'crm-pro',
            code: 'crm-pro',
            name: 'CRM Pro',
            description: 'Customer Relationship Management',
            category: 'crm',
            iconUrl: '/icons/crm.svg',
            isCore: false,
            isActive: true,
        },
        {
            id: 'messenger',
            code: 'messenger',
            name: 'Messenger',
            description: 'Team communication',
            category: 'productivity',
            iconUrl: '/icons/messenger.svg',
            isCore: true,
            isActive: true,
        },
        {
            id: 'calendar',
            code: 'calendar',
            name: 'Calendar',
            description: 'Schedule and events',
            category: 'productivity',
            iconUrl: '/icons/calendar.svg',
            isCore: false,
            isActive: true,
        },
        {
            id: 'files',
            code: 'files',
            name: 'Files',
            description: 'Document management',
            category: 'productivity',
            iconUrl: '/icons/files.svg',
            isCore: true,
            isActive: true,
        },
        {
            id: 'settings',
            code: 'settings',
            name: 'Settings',
            description: 'System configuration',
            category: 'utility',
            iconUrl: '/icons/settings.svg',
            isCore: true,
            isActive: true,
        },
        {
            id: 'app-store',
            code: 'app-store',
            name: 'App Store',
            description: 'Manage applications',
            category: 'utility',
            iconUrl: '/icons/app-store.svg',
            isCore: true,
            isActive: true,
        },
        {
            id: 'weather',
            code: 'weather',
            name: 'Weather',
            description: 'Weather information',
            category: 'utility',
            iconUrl: '/icons/weather.svg',
            isCore: false,
            isActive: true,
        },
        {
            id: 'alphery-access',
            code: 'alphery-access',
            name: 'Alphery Access',
            description: 'User and permission management',
            category: 'admin',
            iconUrl: '/icons/alphery-access.svg',
            isCore: true,
            isActive: true,
        },
    ];

    for (const app of apps) {
        try {
            await prisma.app.upsert({
                where: { id: app.id },
                update: app,
                create: app,
            });
            console.log(`  ✅ ${app.name}`);
        } catch (error) {
            console.error(`  ❌ Failed to seed app ${app.name}:`, error.message);
        }
    }

    console.log('\n✅ Seeding complete!\n');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
