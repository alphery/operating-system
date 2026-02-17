/**
 * HOSPITAL CRM TEMPLATE
 * Complete healthcare management system with patients, appointments, doctors, and medical records
 */

export const hospitalCRMTemplate = {
    name: 'Hospital CRM',
    slug: 'hospital-crm',
    industryType: 'healthcare',
    description: 'Complete hospital management with patient records, appointments, doctor management, and medical history tracking',
    iconUrl: '/crm-icons/hospital.svg',

    // ═══════════════════════════════════════════════════════════
    // ENABLED MODULES
    // ═══════════════════════════════════════════════════════════
    enabledModules: [
        {
            slug: 'patients',
            label: 'Patients',
            icon: 'user-injured',
            order: 1,
            color: '#3B82F6',
            defaultStatuses: ['New', 'Active', 'Discharged', 'Deceased'],
            recordPrefix: 'PAT',
        },
        {
            slug: 'appointments',
            label: 'Appointments',
            icon: 'calendar-check',
            order: 2,
            color: '#10B981',
            defaultStatuses: ['Scheduled', 'Completed', 'Cancelled', 'No-Show'],
            recordPrefix: 'APT',
        },
        {
            slug: 'doctors',
            label: 'Doctors',
            icon: 'user-md',
            order: 3,
            color: '#8B5CF6',
            defaultStatuses: ['Active', 'On Leave', 'Retired'],
            recordPrefix: 'DOC',
        },
        {
            slug: 'medical_records',
            label: 'Medical Records',
            icon: 'file-medical',
            order: 4,
            color: '#F59E0B',
            recordPrefix: 'MED',
        },
        {
            slug: 'prescriptions',
            label: 'Prescriptions',
            icon: 'prescription',
            order: 5,
            color: '#EC4899',
            defaultStatuses: ['Active', 'Completed', 'Cancelled'],
            recordPrefix: 'PRX',
        },
        {
            slug: 'billing',
            label: 'Billing',
            icon: 'receipt',
            order: 6,
            color: '#14B8A6',
            defaultStatuses: ['Pending', 'Paid', 'Partially Paid', 'Overdue'],
            recordPrefix: 'INV',
        },
    ],

    // ═══════════════════════════════════════════════════════════
    // FIELD SCHEMAS (Per Module)
    // ═══════════════════════════════════════════════════════════
    fieldSchemas: {
        patients: [
            {
                key: 'patient_id',
                label: 'Patient ID',
                type: 'text',
                required: true,
                system: true,
                searchable: true,
                order: 1,
            },
            {
                key: 'full_name',
                label: 'Full Name',
                type: 'text',
                required: true,
                searchable: true,
                order: 2,
            },
            {
                key: 'date_of_birth',
                label: 'Date of Birth',
                type: 'date',
                required: true,
                order: 3,
            },
            {
                key: 'age',
                label: 'Age',
                type: 'number',
                computed: true,
                formula: 'YEAR(TODAY()) - YEAR(date_of_birth)',
                order: 4,
            },
            {
                key: 'gender',
                label: 'Gender',
                type: 'select',
                options: ['Male', 'Female', 'Other'],
                required: true,
                order: 5,
            },
            {
                key: 'blood_group',
                label: 'Blood Group',
                type: 'select',
                options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
                order: 6,
            },
            {
                key: 'phone',
                label: 'Phone Number',
                type: 'phone',
                required: true,
                validation: { pattern: '^[0-9]{10}$' },
                order: 7,
            },
            {
                key: 'email',
                label: 'Email',
                type: 'email',
                searchable: true,
                order: 8,
            },
            {
                key: 'address',
                label: 'Address',
                type: 'textarea',
                order: 9,
            },
            {
                key: 'emergency_contact_name',
                label: 'Emergency Contact Name',
                type: 'text',
                order: 10,
            },
            {
                key: 'emergency_contact_phone',
                label: 'Emergency Contact Phone',
                type: 'phone',
                order: 11,
            },
            {
                key: 'emergency_contact_relation',
                label: 'Relationship',
                type: 'select',
                options: ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'],
                order: 12,
            },
            {
                key: 'insurance_provider',
                label: 'Insurance Provider',
                type: 'text',
                order: 13,
            },
            {
                key: 'insurance_number',
                label: 'Insurance Number',
                type: 'text',
                order: 14,
            },
            {
                key: 'primary_doctor',
                label: 'Primary Doctor',
                type: 'relationship',
                options: {
                    relatedModule: 'doctors',
                    displayField: 'full_name',
                    searchFields: ['full_name', 'specialization'],
                },
                order: 15,
            },
            {
                key: 'medical_history',
                label: 'Medical History',
                type: 'textarea',
                order: 16,
            },
            {
                key: 'allergies',
                label: 'Allergies',
                type: 'multi-select',
                options: ['Penicillin', 'Peanuts', 'Latex', 'Aspirin', 'Sulfa Drugs'],
                order: 17,
            },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: ['New', 'Active', 'Discharged', 'Deceased'],
                required: true,
                system: true,
                order: 18,
            },
            {
                key: 'notes',
                label: 'Notes',
                type: 'textarea',
                order: 19,
            },
        ],

        appointments: [
            {
                key: 'appointment_number',
                label: 'Appointment #',
                type: 'text',
                system: true,
                searchable: true,
                order: 1,
            },
            {
                key: 'patient',
                label: 'Patient',
                type: 'relationship',
                required: true,
                options: {
                    relatedModule: 'patients',
                    displayField: 'full_name',
                    searchFields: ['full_name', 'patient_id', 'phone'],
                },
                order: 2,
            },
            {
                key: 'doctor',
                label: 'Doctor',
                type: 'relationship',
                required: true,
                options: {
                    relatedModule: 'doctors',
                    displayField: 'full_name',
                    searchFields: ['full_name', 'specialization'],
                },
                order: 3,
            },
            {
                key: 'appointment_date',
                label: 'Appointment Date',
                type: 'datetime',
                required: true,
                order: 4,
            },
            {
                key: 'duration_minutes',
                label: 'Duration (minutes)',
                type: 'number',
                default: 30,
                validation: { min: 15, max: 120 },
                order: 5,
            },
            {
                key: 'appointment_type',
                label: 'Type',
                type: 'select',
                options: ['Consultation', 'Follow-up', 'Emergency', 'Surgery', 'Routine Checkup'],
                required: true,
                order: 6,
            },
            {
                key: 'reason',
                label: 'Reason for Visit',
                type: 'textarea',
                required: true,
                order: 7,
            },
            {
                key: 'symptoms',
                label: 'Symptoms',
                type: 'multi-select',
                options: ['Fever', 'Cough', 'Headache', 'Nausea', 'Fatigue', 'Pain'],
                order: 8,
            },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: ['Scheduled', 'Completed', 'Cancelled', 'No-Show'],
                required: true,
                system: true,
                order: 9,
            },
            {
                key: 'notes',
                label: 'Notes',
                type: 'textarea',
                order: 10,
            },
        ],

        doctors: [
            {
                key: 'doctor_id',
                label: 'Doctor ID',
                type: 'text',
                system: true,
                searchable: true,
                order: 1,
            },
            {
                key: 'full_name',
                label: 'Full Name',
                type: 'text',
                required: true,
                searchable: true,
                order: 2,
            },
            {
                key: 'specialization',
                label: 'Specialization',
                type: 'select',
                options: [
                    'General Physician',
                    'Cardiologist',
                    'Neurologist',
                    'Orthopedic',
                    'Pediatrician',
                    'Dermatologist',
                    'Gynecologist',
                    'Psychiatrist',
                    'Surgeon',
                ],
                required: true,
                searchable: true,
                order: 3,
            },
            {
                key: 'qualification',
                label: 'Qualification',
                type: 'text',
                order: 4,
            },
            {
                key: 'experience_years',
                label: 'Years of Experience',
                type: 'number',
                order: 5,
            },
            {
                key: 'phone',
                label: 'Phone Number',
                type: 'phone',
                required: true,
                order: 6,
            },
            {
                key: 'email',
                label: 'Email',
                type: 'email',
                required: true,
                searchable: true,
                order: 7,
            },
            {
                key: 'availability_schedule',
                label: 'Availability Schedule',
                type: 'schedule',
                options: {
                    format: 'weekly',
                    timeSlots: true,
                },
                order: 8,
            },
            {
                key: 'consultation_fee',
                label: 'Consultation Fee',
                type: 'currency',
                order: 9,
            },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: ['Active', 'On Leave', 'Retired'],
                required: true,
                system: true,
                order: 10,
            },
        ],
    },

    // ═══════════════════════════════════════════════════════════
    // WORKFLOW SCHEMAS (Automation Rules)
    // ═══════════════════════════════════════════════════════════
    workflowSchemas: {
        patients: [
            {
                name: 'New Patient Welcome Email',
                triggerType: 'record_created',
                triggerConditions: {},
                actions: [
                    {
                        type: 'send_email',
                        template: 'patient_welcome',
                        to: '{{data.email}}',
                        subject: 'Welcome to {{tenant.name}} Hospital',
                        body: `Dear {{data.full_name}},\n\nWelcome to our hospital! Your Patient ID is {{data.patient_id}}.\n\nWe look forward to serving you.\n\nBest regards,\n{{tenant.name}} Team`,
                    },
                ],
            },
        ],

        appointments: [
            {
                name: 'Appointment Confirmation Email',
                triggerType: 'record_created',
                triggerConditions: {
                    field: 'status',
                    operator: 'equals',
                    value: 'Scheduled',
                },
                actions: [
                    {
                        type: 'send_email',
                        to: '{{data.patient.email}}',
                        subject: 'Appointment Confirmed - {{data.appointment_number}}',
                        body: `Dear {{data.patient.full_name}},\n\nYour appointment has been confirmed:\n\nDoctor: {{data.doctor.full_name}}\nDate & Time: {{data.appointment_date}}\nReason: {{data.reason}}\n\nAppointment Number: {{data.appointment_number}}\n\nPlease arrive 15 minutes early.\n\nThank you,\n{{tenant.name}}`,
                    },
                ],
            },
            {
                name: 'Appointment Reminder (24 hours before)',
                triggerType: 'scheduled',
                schedule: 'daily',
                triggerConditions: {
                    field: 'appointment_date',
                    operator: 'is_tomorrow',
                },
                actions: [
                    {
                        type: 'send_email',
                        to: '{{data.patient.email}}',
                        subject: 'Appointment Reminder - Tomorrow',
                        body: `Dear {{data.patient.full_name}},\n\nThis is a reminder for your appointment tomorrow:\n\nDoctor: {{data.doctor.full_name}}\nDate & Time: {{data.appointment_date}}\n\nSee you tomorrow!\n\n{{tenant.name}}`,
                    },
                ],
            },
            {
                name: 'Mark No-Show After 30 Minutes',
                triggerType: 'scheduled',
                schedule: 'every_15_minutes',
                triggerConditions: {
                    and: [
                        { field: 'status', operator: 'equals', value: 'Scheduled' },
                        { field: 'appointment_date', operator: 'is_past_by_minutes', value: 30 },
                    ],
                },
                actions: [
                    {
                        type: 'update_field',
                        field: 'status',
                        value: 'No-Show',
                    },
                    {
                        type: 'send_email',
                        to: '{{data.doctor.email}}',
                        subject: 'Patient No-Show - {{data.appointment_number}}',
                        body: 'Patient {{data.patient.full_name}} did not show up for the scheduled appointment.',
                    },
                ],
            },
        ],
    },

    // ═══════════════════════════════════════════════════════════
    // DASHBOARD LAYOUTS
    // ═══════════════════════════════════════════════════════════
    dashboardLayout: {
        default: {
            grid: '12-column',
            widgets: [
                {
                    id: 'total-patients',
                    type: 'metric_card',
                    title: 'Total Patients',
                    position: { x: 0, y: 0, w: 3, h: 2 },
                    config: {
                        module: 'patients',
                        aggregation: 'count',
                        filter: { status: 'Active' },
                        icon: 'users',
                        color: '#3B82F6',
                    },
                },
                {
                    id: 'todays-appointments',
                    type: 'metric_card',
                    title: "Today's Appointments",
                    position: { x: 3, y: 0, w: 3, h: 2 },
                    config: {
                        module: 'appointments',
                        aggregation: 'count',
                        filter: { appointment_date: 'today', status: 'Scheduled' },
                        icon: 'calendar',
                        color: '#10B981',
                    },
                },
                {
                    id: 'active-doctors',
                    type: 'metric_card',
                    title: 'Active Doctors',
                    position: { x: 6, y: 0, w: 3, h: 2 },
                    config: {
                        module: 'doctors',
                        aggregation: 'count',
                        filter: { status: 'Active' },
                        icon: 'user-md',
                        color: '#8B5CF6',
                    },
                },
                {
                    id: 'pending-billing',
                    type: 'metric_card',
                    title: 'Pending Bills',
                    position: { x: 9, y: 0, w: 3, h: 2 },
                    config: {
                        module: 'billing',
                        aggregation: 'count',
                        filter: { status: 'Pending' },
                        icon: 'receipt',
                        color: '#F59E0B',
                    },
                },
                {
                    id: 'appointments-chart',
                    type: 'chart',
                    title: 'Appointments This Week',
                    position: { x: 0, y: 2, w: 6, h: 4 },
                    config: {
                        module: 'appointments',
                        chartType: 'bar',
                        xAxis: 'appointment_date',
                        yAxis: 'count',
                        dateRange: 'this_week',
                        groupBy: 'day',
                    },
                },
                {
                    id: 'patient-registrations',
                    type: 'chart',
                    title: 'New Patient Registrations',
                    position: { x: 6, y: 2, w: 6, h: 4 },
                    config: {
                        module: 'patients',
                        chartType: 'line',
                        xAxis: 'created_at',
                        yAxis: 'count',
                        dateRange: 'last_30_days',
                        groupBy: 'day',
                    },
                },
                {
                    id: 'recent-patients',
                    type: 'recent_records',
                    title: 'Recently Registered Patients',
                    position: { x: 0, y: 6, w: 6, h: 4 },
                    config: {
                        module: 'patients',
                        limit: 10,
                        fields: ['patient_id', 'full_name', 'phone', 'primary_doctor', 'created_at'],
                        sortBy: 'created_at',
                        sortOrder: 'desc',
                    },
                },
                {
                    id: 'upcoming-appointments',
                    type: 'recent_records',
                    title: 'Upcoming Appointments',
                    position: { x: 6, y: 6, w: 6, h: 4 },
                    config: {
                        module: 'appointments',
                        limit: 10,
                        fields: ['appointment_number', 'patient', 'doctor', 'appointment_date', 'status'],
                        filter: { status: 'Scheduled', appointment_date: 'upcoming' },
                        sortBy: 'appointment_date',
                        sortOrder: 'asc',
                    },
                },
            ],
        },
    },

    // ═══════════════════════════════════════════════════════════
    // PERMISSIONS MATRIX (Role-Based Access Control)
    // ═══════════════════════════════════════════════════════════
    permissionsMatrix: {
        owner: {
            patients: ['create', 'read', 'update', 'delete', 'export', 'import'],
            appointments: ['create', 'read', 'update', 'delete', 'export'],
            doctors: ['create', 'read', 'update', 'delete', 'export'],
            medical_records: ['create', 'read', 'update', 'delete', 'export'],
            prescriptions: ['create', 'read', 'update', 'delete', 'export'],
            billing: ['create', 'read', 'update', 'delete', 'export'],
        },
        admin: {
            patients: ['create', 'read', 'update', 'export'],
            appointments: ['create', 'read', 'update', 'delete'],
            doctors: ['read', 'update'],
            medical_records: ['create', 'read', 'update', 'export'],
            prescriptions: ['create', 'read', 'update'],
            billing: ['read', 'update', 'export'],
        },
        member: {
            patients: ['read'],
            appointments: ['create', 'read', 'update_own'],
            doctors: ['read'],
            medical_records: ['read_own'],
            prescriptions: ['read_own'],
            billing: ['read_own'],
        },
        viewer: {
            patients: ['read'],
            appointments: ['read'],
            doctors: ['read'],
            medical_records: [],
            prescriptions: [],
            billing: [],
        },
    },

    version: '1.0.0',
    isActive: true,
    isSystem: true,
};
