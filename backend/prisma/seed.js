// Simple seed script - runs with plain Node.js, no TypeScript needed
const { PrismaClient } = require('@prisma/client');

// Use bcryptjs instead of bcrypt (pure JS, no native deps needed in Alpine)
let bcrypt;
try {
    bcrypt = require('bcrypt');
} catch (e) {
    // Fallback: manually create a hash if bcrypt not available
    bcrypt = null;
}

const prisma = new PrismaClient();

async function hashPassword(password) {
    if (bcrypt) {
        return bcrypt.hash(password, 10);
    }
    // If bcrypt is not available, use a simple approach
    // This should not happen in production
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create Super Admin (AA000001)
    const superAdminPassword = 'ALPHERY25@it';
    const superAdminPasswordHash = await hashPassword(superAdminPassword);

    const superAdmin = await prisma.platformUser.upsert({
        where: { customUid: 'AA000001' },
        update: {
            passwordHash: superAdminPasswordHash,
            isActive: true,
            role: 'super_admin',
            isGod: true,
        },
        create: {
            customUid: 'AA000001',
            email: 'alpherymail@gmail.com',
            displayName: 'Super Admin',
            passwordHash: superAdminPasswordHash,
            role: 'super_admin',
            isGod: true,
            isActive: true,
        },
    });

    console.log('✅ Super Admin created:', {
        id: superAdmin.customUid,
        email: superAdmin.email,
        role: superAdmin.role,
    });

    // 2. Seed Apps
    const apps = [
        { id: 'alphery-access', name: 'Alphery Access', icon: '🔐', description: 'User & tenant management', category: 'admin', isActive: true },
        { id: 'crm-pro', name: 'CRM Pro', icon: '📊', description: 'Customer Relationship Manager', category: 'business', isActive: true },
        { id: 'office-word', name: 'Office Word', icon: '📝', description: 'Word Processor', category: 'productivity', isActive: true },
        { id: 'office-excel', name: 'Office Excel', icon: '📈', description: 'Spreadsheet', category: 'productivity', isActive: true },
        { id: 'office-ppt', name: 'Office PPT', icon: '📽️', description: 'Presentations', category: 'productivity', isActive: true },
        { id: 'alphery-mail', name: 'Alphery Mail', icon: '📧', description: 'Email Client', category: 'communication', isActive: true },
        { id: 'alphery-meet', name: 'Alphery Meet', icon: '📹', description: 'Video Conferencing', category: 'communication', isActive: true },
        { id: 'file-manager', name: 'File Manager', icon: '📁', description: 'File Management', category: 'system', isActive: true },
        { id: 'terminal', name: 'Terminal', icon: '💻', description: 'Command Line', category: 'system', isActive: true },
        { id: 'settings', name: 'Settings', icon: '⚙️', description: 'System Settings', category: 'system', isActive: true },
    ];

    for (const app of apps) {
        await prisma.app.upsert({
            where: { id: app.id },
            update: { name: app.name, isActive: app.isActive },
            create: app,
        });
    }

    console.log(`✅ ${apps.length} apps seeded`);
    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e.message);
        // Don't exit with error - let server start anyway
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
