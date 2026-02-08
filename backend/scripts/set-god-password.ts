import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setGodPassword() {
    try {
        // Update AU000001's password
        const result = await prisma.platformUser.update({
            where: { customUid: 'AU000001' },
            data: {
                settings: {
                    password: 'ALPHERY25@it'
                }
            }
        });

        console.log('✅ Password updated for AU000001');
        console.log('   Email:', result.email);
        console.log('   Custom UID:', result.customUid);
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

setGodPassword();
