import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setGodPassword() {
    try {
        console.log('Resetting password for AU000001...');
        const result = await prisma.platformUser.update({
            where: { customUid: 'AU000001' },
            data: {
                settings: {
                    password: '123456'
                }
            }
        });

        console.log('✅ Password successfully reset to "123456"');
        console.log('   Email:', result.email);
        console.log('   Custom UID:', result.customUid);
    } catch (error) {
        console.error('❌ Error resetting password:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

setGodPassword();
