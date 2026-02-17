"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- DB REPAIR SCRIPT ---');
    try {
        console.log('Attempting to add allowedApps column to platform_users...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "platform_users" ADD COLUMN IF NOT EXISTS "allowed_apps" TEXT[] DEFAULT '{}';`);
        console.log('✅ Column allowed_apps added (or already existed).');
        console.log('Attempting to add custom_short_id column to tenants...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "custom_short_id" TEXT;`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "tenants_custom_short_id_key" ON "tenants"("custom_short_id");`);
        console.log('✅ Column custom_short_id added (or already existed).');
    }
    catch (err) {
        console.error('❌ Failed to repair database:', err);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=repair-db.js.map