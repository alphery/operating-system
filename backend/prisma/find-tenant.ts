import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Searching for Tenants...');

    const tenants = await prisma.tenant.findMany({
        select: {
            id: true,
            name: true,
            subdomain: true
        }
    });

    if (tenants.length === 0) {
        console.log('⚠️ No tenants found. You might need to create one first.');
    } else {
        console.log('\n✅ Found Tenants:');
        console.table(tenants);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
