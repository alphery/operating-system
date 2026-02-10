
const { PrismaClient } = require('@prisma/client');

async function testConnection(password) {
    const encodedPassword = encodeURIComponent(password);
    const url = `postgresql://postgres.anklmzmbfzkvhbpkompb:${encodedPassword}@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`;

    console.log(`Testing password: ${password}`);
    // console.log(`URL: ${url}`); 

    const prisma = new PrismaClient({
        datasources: { db: { url } }
    });

    try {
        await prisma.$connect();
        console.log('✅ CONNECTION SUCCESSFUL with password:', password);
        console.log('   Correct Connection String:', url);
        return true;
    } catch (e) {
        console.log('❌ Connection failed:', e.message.split('\n')[0]);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    const passwords = ['ALPHERY25', 'ALPHERY25@it', 'ALPHERY25@supabase'];

    for (const p of passwords) {
        if (await testConnection(p)) break;
    }
}

main();
