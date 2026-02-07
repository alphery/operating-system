const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list() {
    const users = await prisma.platformUser.findMany();
    console.log(JSON.stringify(users, null, 2));
    await prisma.$disconnect();
}
list();
