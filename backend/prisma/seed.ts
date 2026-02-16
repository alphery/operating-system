import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // ═══════════════════════════════════════════════════════════
    // 1. CREATE SUPER ADMIN (AA000001)
    // ═══════════════════════════════════════════════════════════

    const superAdminPassword = 'ALPHERY25@it';
    const superAdminPasswordHash = await bcrypt.hash(superAdminPassword, 10);

    const superAdmin = await prisma.platformUser.upsert({
        where: { customUid: 'AA000001' },
        update: {
            passwordHash: superAdminPasswordHash,
            isActive: true,
        },
        create: {
            customUid: 'AA000001',
            email: 'alpherymail@gmail.com',
            displayName: 'Super Admin',
            passwordHash: superAdminPasswordHash,
            role: 'super_admin',
            isGod: true,
            isActive: true,
            firebaseUid: null, // No Firebase for AA users
        },
    });

    console.log('✅ Super Admin created:', {
        id: superAdmin.customUid,
        email: superAdmin.email,
        password: superAdminPassword,
    });

    // ═══════════════════════════════════════════════════════════
    // 2. SEED APPS (All available apps in the system)
    // ═══════════════════════════════════════════════════════════

    const apps = [
        {
            id: 'alphery-access',
            code: 'alphery_access',
            name: 'Alphery Access',
            description: 'Platform administration and user management',
            category: 'admin',
            isCore: true,
        },
        {
            id: 'crm-pro',
            code: 'crm_pro',
            name: 'CRM Pro',
            description: 'Customer Relationship Management',
            category: 'crm',
            isCore: false,
        },
        {
            id: 'hrm',
            code: 'hrm',
            name: 'Human Resources',
            description: 'HR Management System',
            category: 'hr',
            isCore: false,
        },
        {
            id: 'messenger',
            code: 'messenger',
            name: 'Messenger',
            description: 'Internal messaging and communication',
            category: 'communication',
            isCore: true,
        },
        {
            id: 'file-manager',
            code: 'file_manager',
            name: 'File Manager',
            description: 'Document and file management',
            category: 'utility',
            isCore: true,
        },
        {
            id: 'settings',
            code: 'settings',
            name: 'Settings',
            description: 'System settings and preferences',
            category: 'admin',
            isCore: true,
        },
        {
            id: 'calendar',
            code: 'calendar',
            name: 'Calendar',
            description: 'Event and schedule management',
            category: 'productivity',
            isCore: false,
        },
        {
            id: 'tasks',
            code: 'tasks',
            name: 'Tasks',
            description: 'Task and project management',
            category: 'productivity',
            isCore: false,
        },
        {
            id: 'finance',
            code: 'finance',
            name: 'Finance',
            description: 'Financial management and accounting',
            category: 'finance',
            isCore: false,
        },
        {
            id: 'analytics',
            code: 'analytics',
            name: 'Analytics',
            description: 'Business intelligence and analytics',
            category: 'analytics',
            isCore: false,
        },
    ];

    for (const app of apps) {
        await prisma.app.upsert({
            where: { id: app.id },
            update: app,
            create: app,
        });
    }

    console.log(`✅ Seeded ${apps.length} apps`);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   User ID: AA000001');
    console.log('   Password: ALPHERY25@it');
    console.log('\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
