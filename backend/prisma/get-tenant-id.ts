import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking for existing tenants...');

    let tenant = await prisma.tenant.findFirst();

    if (!tenant) {
        console.log('⚠️ No tenants found. Creating a generic "Demo Inc" tenant...');
        tenant = await prisma.tenant.create({
            data: {
                name: "Demo Inc.",
                subdomain: "demo",
                plan: "enterprise"
            }
        });
        console.log('✅ Created new Tenant!');
    } else {
        console.log('ℹ️ Found existing tenant.');
    }

    console.log('\n 👇 USE THIS TENANT ID 👇');
    console.log('====================================================');
    console.log(`Tenant ID:   ${tenant.id}`);
    console.log(`Name:        ${tenant.name}`);
    console.log('====================================================');
    console.log('\nRun command to instantiate Healthcare ERP:');
    console.log(`curl -X POST https://alphery-os-backend.onrender.com/factory/instantiate \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"tenantId": "${tenant.id}", "templateSlug": "healthcare-erp"}'`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
