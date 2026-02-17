import { Injectable } from '@nestjs/common';

// In-memory template storage (will be replaced with database later)
const TEMPLATES = [
    {
        id: '1',
        slug: 'hospital',
        name: 'Hospital CRM',
        industryType: 'Healthcare',
        description: 'Complete healthcare management with patient records, appointments, and medical history',
        icon: '🏥',
        modules: ['Patients', 'Appointments', 'Doctors', 'Medical Records', 'Prescriptions', 'Billing'],
        fieldSchemas: {
            Patients: [
                { key: 'full_name', label: 'Full Name', type: 'text', required: true },
                { key: 'age', label: 'Age', type: 'number', required: true },
                { key: 'blood_group', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
                { key: 'phone', label: 'Phone Number', type: 'tel', required: true },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'address', label: 'Address', type: 'textarea' },
                { key: 'emergency_contact', label: 'Emergency Contact', type: 'text' },
            ],
            Appointments: [
                { key: 'patient_name', label: 'Patient Name', type: 'text', required: true },
                { key: 'doctor_name', label: 'Doctor Name', type: 'text', required: true },
                { key: 'appointment_date', label: 'Appointment Date', type: 'datetime', required: true },
                { key: 'reason', label: 'Reason', type: 'textarea' },
                { key: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'Completed', 'Cancelled'] },
            ],
            Doctors: [
                { key: 'full_name', label: 'Full Name', type: 'text', required: true },
                { key: 'specialization', label: 'Specialization', type: 'text', required: true },
                { key: 'phone', label: 'Phone', type: 'tel', required: true },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'experience_years', label: 'Years of Experience', type: 'number' },
            ],
        },
        color: 'from-blue-500 to-cyan-500',
    },
    {
        id: '2',
        slug: 'real-estate',
        name: 'Real Estate CRM',
        industryType: 'Real Estate',
        description: 'Property management, agent tracking, listings, and client communication',
        icon: '🏢',
        modules: ['Properties', 'Agents', 'Listings', 'Clients', 'Deals', 'Viewings'],
        fieldSchemas: {
            Properties: [
                { key: 'property_name', label: 'Property Name', type: 'text', required: true },
                { key: 'address', label: 'Address', type: 'textarea', required: true },
                { key: 'price', label: 'Price', type: 'number', required: true },
                { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
                { key: 'bathrooms', label: 'Bathrooms', type: 'number' },
                { key: 'area_sqft', label: 'Area (sq ft)', type: 'number' },
                { key: 'status', label: 'Status', type: 'select', options: ['Available', 'Sold', 'Rented'] },
            ],
            Clients: [
                { key: 'full_name', label: 'Full Name', type: 'text', required: true },
                { key: 'phone', label: 'Phone', type: 'tel', required: true },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'budget', label: 'Budget', type: 'number' },
                { key: 'preferences', label: 'Preferences', type: 'textarea' },
            ],
        },
        color: 'from-emerald-500 to-teal-500',
    },
    {
        id: '3',
        slug: 'jewellery',
        name: 'Jewellery CRM',
        industryType: 'Retail',
        description: 'Inventory management, customer orders, designs, and sales tracking',
        icon: '💎',
        modules: ['Inventory', 'Customers', 'Sales', 'Designs', 'Orders', 'Suppliers'],
        fieldSchemas: {
            Inventory: [
                { key: 'item_name', label: 'Item Name', type: 'text', required: true },
                { key: 'category', label: 'Category', type: 'select', options: ['Rings', 'Necklaces', 'Bracelets', 'Earrings'] },
                { key: 'price', label: 'Price', type: 'number', required: true },
                { key: 'weight_grams', label: 'Weight (grams)', type: 'number' },
                { key: 'stock', label: 'Stock Quantity', type: 'number' },
            ],
            Customers: [
                { key: 'full_name', label: 'Full Name', type: 'text', required: true },
                { key: 'phone', label: 'Phone', type: 'tel', required: true },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'loyalty_points', label: 'Loyalty Points', type: 'number' },
            ],
        },
        color: 'from-purple-500 to-pink-500',
    },
    {
        id: '4',
        slug: 'corporate',
        name: 'Corporate CRM',
        industryType: 'Business',
        description: 'Lead management, accounts, contacts, and sales pipeline tracking',
        icon: '🎯',
        modules: ['Leads', 'Accounts', 'Contacts', 'Opportunities', 'Campaigns', 'Reports'],
        fieldSchemas: {
            Leads: [
                { key: 'full_name', label: 'Full Name', type: 'text', required: true },
                { key: 'company', label: 'Company', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'phone', label: 'Phone', type: 'tel' },
                { key: 'status', label: 'Status', type: 'select', options: ['New', 'Contacted', 'Qualified', 'Lost'] },
                { key: 'value', label: 'Deal Value', type: 'number' },
            ],
            Accounts: [
                { key: 'company_name', label: 'Company Name', type: 'text', required: true },
                { key: 'industry', label: 'Industry', type: 'text' },
                { key: 'website', label: 'Website', type: 'url' },
                { key: 'phone', label: 'Phone', type: 'tel' },
                { key: 'annual_revenue', label: 'Annual Revenue', type: 'number' },
            ],
            Contacts: [
                { key: 'full_name', label: 'Full Name', type: 'text', required: true },
                { key: 'title', label: 'Job Title', type: 'text' },
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'phone', label: 'Phone', type: 'tel' },
                { key: 'account', label: 'Account', type: 'text' },
            ],
        },
        color: 'from-orange-500 to-red-500',
    },
    {
        id: '5',
        slug: 'blank',
        name: 'Blank Template',
        industryType: 'Custom',
        description: 'Start from scratch and build your own customized CRM',
        icon: '📝',
        modules: ['Custom Module 1', 'Custom Module 2'],
        fieldSchemas: {
            'Custom Module 1': [
                { key: 'name', label: 'Name', type: 'text', required: true },
                { key: 'description', label: 'Description', type: 'textarea' },
            ],
        },
        color: 'from-gray-500 to-slate-500',
    },
];

@Injectable()
export class CRMTemplatesService {
    // Get all available templates
    async getAllTemplates() {
        return TEMPLATES;
    }

    // Get a single template by slug
    async getTemplateBySlug(slug: string) {
        const template = TEMPLATES.find((t) => t.slug === slug);
        if (!template) {
            throw new Error(`Template not found: ${slug}`);
        }
        return template;
    }

    // Get tenant's selected template config
    async getTenantConfig(tenantId: string) {
        // For now, check localStorage on frontend
        // In full version, this would query tenant_crm_configs table
        return {
            tenantId,
            hasTemplate: false,
            message: 'Use frontend localStorage for demo',
        };
    }

    // Create/Update tenant template selection
    async setTenantTemplate(tenantId: string, templateSlug: string, userId: string) {
        const template = await this.getTemplateBySlug(templateSlug);

        // In full version, this would save to tenant_crm_configs table
        return {
            success: true,
            tenantId,
            template: {
                slug: template.slug,
                name: template.name,
                modules: template.modules,
                fieldSchemas: template.fieldSchemas,
            },
        };
    }
}
