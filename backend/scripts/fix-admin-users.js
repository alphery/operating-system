const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUsers() {
    console.log('🔧 Fixing Admin and Demo users...');

    try {
        // 1. Ensure AU000001 (Main Admin) has password 'admin123'
        const adminUser = await prisma.platformUser.findUnique({
            where: { customUid: 'AU000001' }
        });

        if (adminUser) {
            const settings = typeof adminUser.settings === 'string'
                ? JSON.parse(adminUser.settings)
                : (adminUser.settings || {});

            settings.password = 'admin123';

            await prisma.platformUser.update({
                where: { id: adminUser.id },
                data: { settings }
            });
            console.log('✅ Updated AU000001 password to: admin123');
        } else {
            console.log('⚠️  AU000001 not found. Creating it...');
            await prisma.platformUser.create({
                data: {
                    customUid: 'AU000001',
                    email: 'alpherymail@gmail.com',
                    firebaseUid: 'seed-admin-uid',
                    displayName: 'System Administrator',
                    isGod: true,
                    settings: { password: 'admin123' }
                }
            });
            console.log('✅ Created AU000001 with password: admin123');
        }

        // 2. Ensure "ADMIN" works (as some docs suggest)
        await prisma.platformUser.upsert({
            where: { customUid: 'ADMIN' },
            update: {
                settings: { password: 'admin123' }
            },
            create: {
                customUid: 'ADMIN',
                email: 'admin@alphery.os',
                firebaseUid: 'seed-admin-id-2',
                displayName: 'Administrator',
                isGod: true,
                settings: { password: 'admin123' }
            }
        });
        console.log('✅ Verified "ADMIN" user with password: admin123');

        // 3. Ensure "DEMO" works
        await prisma.platformUser.upsert({
            where: { customUid: 'DEMO' },
            update: {
                settings: { password: 'demo' }
            },
            create: {
                customUid: 'DEMO',
                email: 'demo@alphery.os',
                firebaseUid: 'seed-demo-uid',
                displayName: 'Demo User',
                isGod: false,
                settings: { password: 'demo' }
            }
        });
        console.log('✅ Verified "DEMO" user with password: demo');

    } catch (error) {
        console.error('❌ Error fixing users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixUsers();
