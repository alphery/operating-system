const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    try {
        console.log('🔄 Starting migration...');

        // Add custom_uid column (nullable first)
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "platform_users" ADD COLUMN IF NOT EXISTS "custom_uid" TEXT;
        `);
        console.log('✅ Added custom_uid column');

        // Get all users
        const users = await prisma.$queryRaw`
            SELECT id FROM "platform_users" WHERE "custom_uid" IS NULL ORDER BY created_at
        `;

        // Assign custom UIDs
        let counter = 1;
        for (const user of users) {
            const customUid = `AU${String(counter).padStart(6, '0')}`;
            await prisma.$executeRawUnsafe(`
                UPDATE "platform_users" SET "custom_uid" = '${customUid}' WHERE id = '${user.id}'
            `);
            console.log(`✅ Assigned ${customUid} to user ${user.id}`);
            counter++;
        }

        // Make it NOT NULL and UNIQUE
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "platform_users" ALTER COLUMN "custom_uid" SET NOT NULL;
        `);
        console.log('✅ Set custom_uid to NOT NULL');

        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS "platform_users_custom_uid_key" ON "platform_users"("custom_uid");
        `);
        console.log('✅ Created unique index on custom_uid');

        // Add mobile_number column
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "platform_users" ADD COLUMN IF NOT EXISTS "mobile_number" TEXT;
        `);
        console.log('✅ Added mobile_number column');

        // Create index on custom_uid
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "platform_users_custom_uid_idx" ON "platform_users"("custom_uid");
        `);
        console.log('✅ Created index on custom_uid');

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
