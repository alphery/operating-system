import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to create a new tenant with an owner
 * Usage: npx tsx scripts/create-tenant.ts
 */

async function createTenant() {
    console.log('🏢 Creating a new tenant...\n');

    // Configuration - CHANGE THESE VALUES
    const config = {
        tenantName: 'Demo Corporation',
        ownerEmail: 'admin@democorp.com', // Must be an existing PlatformUser
        subdomain: 'demo', // Optional: for future subdomain routing
        plan: 'free', // free, pro, enterprise
    };

    try {
        // 1. Find or create owner
        let owner = await prisma.platformUser.findFirst({
            where: { email: config.ownerEmail.toLowerCase() },
        });

        if (!owner) {
            console.log(`❌ Error: User with email ${config.ownerEmail} not found!`);
            console.log(`\n📝 Please create the user first by signing up, or use an existing email.`);
            process.exit(1);
        }

        console.log(`✅ Found owner: ${owner.email} (${owner.id})`);

        // 2. Check if tenant with this subdomain already exists
        if (config.subdomain) {
            const existing = await prisma.tenant.findUnique({
                where: { subdomain: config.subdomain },
            });

            if (existing) {
                console.log(`❌ Error: Tenant with subdomain '${config.subdomain}' already exists!`);
                process.exit(1);
            }
        }

        // 3. Create tenant
        const tenant = await prisma.tenant.create({
            data: {
                name: config.tenantName,
                subdomain: config.subdomain,
                ownerUserId: owner.id,
                plan: config.plan,
                isActive: true,
            },
        });

        console.log(`✅ Created tenant: ${tenant.name} (${tenant.id})`);

        // 4. Add owner as tenant member
        await prisma.tenantUser.create({
            data: {
                tenantId: tenant.id,
                userId: owner.id,
                role: 'owner',
                isActive: true,
            },
        });

        console.log(`✅ Added ${owner.email} as tenant owner`);

        // 5. Enable core apps for the tenant
        const coreApps = await prisma.app.findMany({
            where: { isCore: true },
        });

        if (coreApps.length > 0) {
            for (const app of coreApps) {
                await prisma.tenantApp.create({
                    data: {
                        tenantId: tenant.id,
                        appId: app.id,
                        enabled: true,
                        enabledByUserId: owner.id,
                    },
                });
            }
            console.log(`✅ Enabled ${coreApps.length} core apps`);
        } else {
            console.log(`⚠️  No core apps found in the App catalog`);
        }

        // 6. Summary
        console.log(`\n🎉 Success! Tenant created:\n`);
        console.log(`   ID: ${tenant.id}`);
        console.log(`   Name: ${tenant.name}`);
        console.log(`   Subdomain: ${tenant.subdomain || 'N/A'}`);
        console.log(`   Owner: ${owner.email}`);
        console.log(`   Plan: ${tenant.plan}`);
        console.log(`   Apps enabled: ${coreApps.length}`);
        console.log(`\n✅ ${owner.email} can now log in and access this tenant!`);

    } catch (error) {
        console.error('❌ Error creating tenant:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createTenant();
