import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- USER DEBUG ---');
    try {
        const users = await prisma.platformUser.findMany({
            select: {
                id: true,
                customUid: true,
                email: true,
                displayName: true,
                settings: true,
                isActive: true
            }
        });

        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            const settings = typeof u.settings === 'string' ? JSON.parse(u.settings) : u.settings;
            console.log(`- [${u.customUid}] Email: ${u.email}, Name: ${u.displayName}, Pwd in Settings: ${settings?.password || 'NONE (falling back to AlpheryOS123)'}, Active: ${u.isActive}`);
        });
    } catch (e) {
        console.error('Error fetching users:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
