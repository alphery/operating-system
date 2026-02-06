import { PrismaClient } from '@prisma/client';
import { db } from '../../config/firebase'; // Firestore
import * as admin from 'firebase-admin';

/**
 * FIRESTORE → POSTGRES MIGRATION SCRIPT
 * 
 * Purpose: Migrate email-based Firestore users to UUID-based PostgreSQL
 * 
 * Steps:
 * 1. Read all users from Firestore 'users' collection
 * 2. Create corresponding platform_users entries
 * 3. Create tenants for users with role='TENANT'
 * 4. Create tenant_users memberships
 * 5. Migrate allowedApps → user_app_permissions
 * 
 * CRITICAL: Run this AFTER new schema is deployed but BEFORE deprecating Firestore
 */

const prisma = new PrismaClient();

interface FirestoreUser {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    role?: string;
    parentUserId?: string;
    allowedApps?: string[];
    approvalStatus?: string;
    createdAt?: string;
}

async function migrateFirestoreToPostgres() {
    console.log('🚀 Starting Firestore → PostgreSQL migration...\n');

    try {
        // Step 1: Fetch all Firestore users
        const usersSnapshot = await db.collection('users').get();
        console.log(`📊 Found ${usersSnapshot.size} users in Firestore\n`);

        const userMap = new Map<string, { platformUserId: string; tenantId?: string }>();

        // Step 2: Create platform_users
        console.log('👤 Creating platform users...');
        for (const doc of usersSnapshot.docs) {
            const firestoreData = doc.data() as FirestoreUser;
            const email = doc.id; // Old system: email was the doc ID

            // Skip if not approved (we only migrate whitelisted users)
            if (firestoreData.approvalStatus !== 'approved') {
                console.log(`  ⏭️  Skipped ${email} (status: ${firestoreData.approvalStatus})`);
                continue;
            }

            try {
                const platformUser = await prisma.platformUser.upsert({
                    where: { email: email.toLowerCase() },
                    update: {
                        displayName: firestoreData.displayName || null,
                        photoUrl: firestoreData.photoURL || null,
                    },
                    create: {
                        firebaseUid: firestoreData.uid || `migrated-${Date.now()}-${Math.random()}`,
                        email: email.toLowerCase(),
                        displayName: firestoreData.displayName || email.split('@')[0],
                        photoUrl: firestoreData.photoURL || null,
                        isGod: ['alpherymail@gmail.com', 'aksnetlink@gmail.com'].includes(email.toLowerCase()),
                        isActive: true,
                    },
                });

                userMap.set(email, { platformUserId: platformUser.id });
                console.log(`  ✅ ${email} → ${platformUser.id}`);
            } catch (error) {
                console.error(`  ❌ Failed to migrate ${email}:`, error.message);
            }
        }

        // Step 3: Create tenants for TENANT role users
        console.log('\n🏢 Creating tenants...');
        for (const doc of usersSnapshot.docs) {
            const firestoreData = doc.data() as FirestoreUser;
            const email = doc.id;

            if (firestoreData.role === 'TENANT' && firestoreData.approvalStatus === 'approved') {
                const userData = userMap.get(email);
                if (!userData) continue;

                try {
                    const tenant = await prisma.tenant.create({
                        data: {
                            name: `${firestoreData.displayName || email.split('@')[0]}'s Workspace`,
                            ownerUserId: userData.platformUserId,
                            plan: 'free',
                            isActive: true,
                        },
                    });

                    // Add owner to their own tenant
                    await prisma.tenantUser.create({
                        data: {
                            tenantId: tenant.id,
                            userId: userData.platformUserId,
                            role: 'owner',
                            isActive: true,
                        },
                    });

                    userMap.set(email, { ...userData, tenantId: tenant.id });
                    console.log(`  ✅ Created tenant: ${tenant.name} (${tenant.id})`);
                } catch (error) {
                    console.error(`  ❌ Failed to create tenant for ${email}:`, error.message);
                }
            }
        }

        // Step 4: Create tenant memberships for child users
        console.log('\n👥 Creating tenant memberships...');
        for (const doc of usersSnapshot.docs) {
            const firestoreData = doc.data() as FirestoreUser;
            const email = doc.id;

            // Only process users who have a parentUserId (employees)
            if (firestoreData.parentUserId && firestoreData.approvalStatus === 'approved') {
                const employeeData = userMap.get(email);
                const parentData = userMap.get(firestoreData.parentUserId);

                if (!employeeData || !parentData?.tenantId) {
                    console.log(`  ⏭️  Skipped ${email} (parent not found or no tenant)`);
                    continue;
                }

                try {
                    await prisma.tenantUser.create({
                        data: {
                            tenantId: parentData.tenantId,
                            userId: employeeData.platformUserId,
                            role: firestoreData.role === 'team' ? 'member' : 'viewer',
                            isActive: true,
                        },
                    });
                    console.log(`  ✅ Added ${email} to tenant ${parentData.tenantId}`);
                } catch (error) {
                    console.error(`  ❌ Failed to add ${email} to tenant:`, error.message);
                }
            }
        }

        // Step 5: Seed default apps
        console.log('\n📱 Seeding default apps...');
        const defaultApps = [
            { id: 'crm-pro', code: 'crm-pro', name: 'CRM Pro', category: 'crm', isCore: false },
            { id: 'messenger', code: 'messenger', name: 'Messenger', category: 'productivity', isCore: true },
            { id: 'settings', code: 'settings', name: 'Settings', category: 'utility', isCore: true },
            { id: 'app-store', code: 'app-store', name: 'App Store', category: 'utility', isCore: true },
            { id: 'calendar', code: 'calendar', name: 'Calendar', category: 'productivity', isCore: false },
            { id: 'weather', code: 'weather', name: 'Weather', category: 'utility', isCore: false },
            { id: 'files', code: 'files', name: 'Files', category: 'productivity', isCore: true },
        ];

        for (const app of defaultApps) {
            try {
                await prisma.app.upsert({
                    where: { id: app.id },
                    update: {},
                    create: app,
                });
                console.log(`  ✅ App: ${app.name}`);
            } catch (error) {
                console.error(`  ❌ Failed to seed app ${app.name}:`, error.message);
            }
        }

        // Step 6: Enable core apps for all tenants
        console.log('\n🔓 Enabling core apps for all tenants...');
        const tenants = await prisma.tenant.findMany();
        const coreApps = defaultApps.filter(a => a.isCore);

        for (const tenant of tenants) {
            for (const app of coreApps) {
                try {
                    await prisma.tenantApp.upsert({
                        where: {
                            tenantId_appId: {
                                tenantId: tenant.id,
                                appId: app.id,
                            },
                        },
                        update: {},
                        create: {
                            tenantId: tenant.id,
                            appId: app.id,
                            enabled: true,
                        },
                    });
                } catch (error) {
                    console.error(`  ❌ Failed to enable ${app.name} for ${tenant.name}`);
                }
            }
            console.log(`  ✅ Enabled core apps for: ${tenant.name}`);
        }

        console.log('\n✅ Migration complete!\n');
        console.log('📊 Summary:');
        console.log(`  - Platform Users: ${userMap.size}`);
        console.log(`  - Tenants: ${tenants.length}`);
        console.log(`  - Apps: ${defaultApps.length}`);
        console.log('\n⚠️  Next steps:');
        console.log('  1. Verify data in PostgreSQL');
        console.log('  2. Test auth flows on staging');
        console.log('  3. Enable feature flag: USE_NEW_AUTH=true');
        console.log('  4. Monitor for 24 hours');
        console.log('  5. Deprecate Firestore auth logic');
    } catch (error) {
        console.error('💥 Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateFirestoreToPostgres()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
