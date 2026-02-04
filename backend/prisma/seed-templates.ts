import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Industry Templates...');

    // 1. Healthcare ERP Template
    await prisma.industryTemplate.upsert({
        where: { slug: 'healthcare-erp' },
        update: {},
        create: {
            slug: 'healthcare-erp',
            name: 'Healthcare ERP',
            description: 'Complete hospital management system',
            isPublic: true,
            modules: [
                {
                    name: "Patient",
                    slug: "patient",
                    icon: "heart-pulse", // Feather icon
                    fields: [
                        { name: "Full Name", key: "name", type: "text", isRequired: true },
                        { name: "DOB", key: "dob", type: "date" },
                        { name: "Blood Group", key: "blood_group", type: "text", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
                        { name: "Status", key: "status", type: "status", options: ["Admitted", "Discharged", "Critical"] }
                    ]
                },
                {
                    name: "Appointment",
                    slug: "appointment",
                    icon: "calendar",
                    fields: [
                        { name: "Patient", key: "patient_id", type: "relation" }, // Link to Patient
                        { name: "Date", key: "date", type: "date", isRequired: true },
                        { name: "Doctor", key: "doctor", type: "text" }
                    ]
                }
            ],
            workflows: [
                {
                    name: "Welcome Patient",
                    moduleSlug: "patient",
                    trigger: "ON_CREATE",
                    actions: [
                        { type: "EMAIL", config: { subject: "Welcome to HealthPlus!", to: "{{email}}" } }
                    ]
                }
            ],
            dashboards: [
                {
                    name: "Hospital Overview",
                    widgets: [
                        { title: "Admitted Patients", type: "METRIC", moduleSlug: "patient", config: { status: "Admitted" }, position: { x: 0, y: 0, w: 2, h: 2 } }
                    ]
                }
            ]
        }
    });

    console.log('✅ Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
