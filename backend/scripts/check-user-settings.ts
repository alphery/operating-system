import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.platformUser.findUnique({
            where: { customUid: 'AU000001' }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('✅ User found:');
        console.log('   Custom UID:', user.customUid);
        console.log('   Email:', user.email);
        console.log('   Is Active:', user.isActive);
        console.log('   Settings:', JSON.stringify(user.settings, null, 2));
        console.log('   Settings Type:', typeof user.settings);
        console.log('   Has Password:', !!(user.settings as any)?.password);
        console.log('   Password Value:', (user.settings as any)?.password);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
