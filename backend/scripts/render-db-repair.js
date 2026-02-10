const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function repair() {
    console.log('🚀 Starting Database Repair for Render (Supabase)...');

    try {
        // 1. Ensure AU000001 exists and has password 'admin123'
        const adminSettings = { password: 'admin123' };

        const mainAdmin = await prisma.platformUser.upsert({
            where: { customUid: 'AU000001' },
            update: {
                settings: adminSettings,
                isActive: true,
                isGod: true
            },
            create: {
                customUid: 'AU000001',
                email: 'alpherymail@gmail.com',
                firebaseUid: 'seed-admin-uid-1',
                displayName: 'Main Administrator',
                isGod: true,
                isActive: true,
                settings: adminSettings
            }
        });
        console.log('✅ Main Admin (AU000001) verified. Password: admin123');

        // 2. Ensure "ADMIN" (shorthand) exists
        await prisma.platformUser.upsert({
            where: { customUid: 'ADMIN' },
            update: {
                settings: adminSettings,
                isActive: true
            },
            create: {
                customUid: 'ADMIN',
                email: 'admin@alphery.os',
                firebaseUid: 'seed-admin-uid-2',
                displayName: 'Administrator',
                isGod: true,
                isActive: true,
                settings: adminSettings
            }
        });
        console.log('✅ Shorthand Admin (ADMIN) verified. Password: admin123');

        // 3. Ensure "DEMO" exists
        await prisma.platformUser.upsert({
            where: { customUid: 'DEMO' },
            update: {
                settings: { password: 'demo' },
                isActive: true
            },
            create: {
                customUid: 'DEMO',
                email: 'demo@alphery.os',
                firebaseUid: 'seed-demo-uid',
                displayName: 'Demo User',
                isGod: false,
                isActive: true,
                settings: { password: 'demo' }
            }
        });
        console.log('✅ Demo User (DEMO) verified. Password: demo');

        // 4. Ensure Default Tenant exists and relates to AU000001
        await prisma.tenant.upsert({
            where: { id: 'default-tenant' },
            update: { ownerUserId: mainAdmin.id },
            create: {
                id: 'default-tenant',
                name: 'Alphery Systems',
                subdomain: 'default',
                ownerUserId: mainAdmin.id,
                plan: 'pro'
            }
        });
        console.log('✅ Default Tenant verified.');

        // 5. Connect Main Admin to Default Tenant
        await prisma.tenantUser.upsert({
            where: {
                tenantId_userId: {
                    tenantId: 'default-tenant',
                    userId: mainAdmin.id
                }
            },
            update: { role: 'owner', isActive: true },
            create: {
                tenantId: 'default-tenant',
                userId: mainAdmin.id,
                role: 'owner',
                isActive: true
            }
        });
        console.log('✅ Admin linked to Default Tenant.');

        console.log('\n✨ Database repair complete! Use these credentials:');
        console.log('User ID: ADMIN  | Pwd: admin123');
        console.log('User ID: DEMO   | Pwd: demo');

    } catch (error) {
        console.error('❌ Repair failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

repair();
