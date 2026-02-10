import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USER_EMAIL = 'YOUR_EMAIL@HERE.COM'; // 👈 REPLACE THIS WITH YOUR EMAIL

async function promoteToGod() {
    if (USER_EMAIL === 'YOUR_EMAIL@HERE.COM') {
        console.error('❌ Please edit this script and set your USER_EMAIL first!');
        process.exit(1);
    }

    console.log(`🔍 Promoting user with email: ${USER_EMAIL} to GOD MODE...`);

    try {
        const user = await prisma.platformUser.findFirst({
            where: { email: USER_EMAIL.toLowerCase() },
        });

        if (!user) {
            console.error(`❌ User not found! Please sign up first.`);
            process.exit(1);
        }

        const updatedUser = await prisma.platformUser.update({
            where: { id: user.id },
            data: { isGod: true },
        });

        console.log(`\n✅ SUCCESS! User ${updatedUser.email} is now a GOD ADMIN! 👑`);
        console.log(`   ID: ${updatedUser.id}`);
        console.log(`   Is God: ${updatedUser.isGod}`);
        console.log(`\n👉 You can now access the full Alphery Access dashboard!`);

    } catch (error) {
        console.error('❌ Error promoting user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

promoteToGod();
