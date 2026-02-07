const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list() {
    const apps = await prisma.app.findMany();
    console.log(JSON.stringify(apps, null, 2));
    await prisma.$disconnect();
}
list();
