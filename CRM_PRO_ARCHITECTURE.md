# CRM PRO - ENTERPRISE MULTI-TENANT ARCHITECTURE
## Salesforce-Level Template-Driven Industry CRM Engine

**Version:** 2.0.0  
**Architecture Type:** Multi-Tenant SaaS with Template Engine  
**Design Pattern:** Domain-Driven Design + Multi-Layered Architecture  
**Target Scale:** 10,000+ Tenants

---

## 🎯 EXECUTIVE SUMMARY

CRM Pro is transformed into a **template-driven, industry-configurable CRM platform** that operates as an isolated module within Alphery OS. Each tenant selects an industry template (Hospital, Real Estate, Jewellery, Corporate, Blank) on first launch, and the entire CRM dynamically adapts: modules, fields, workflows, dashboards, and permissions.

**Key Design Principles:**
- **Complete OS Isolation**: Zero modifications to OS core or auth system
- **Template-Driven Runtime**: All UI/logic loads dynamically from database templates
- **Multi-Tenancy First**: Every table/query scoped by `tenant_id`
- **Salesforce-Level Flexibility**: Custom fields, modules, workflows per tenant
- **Vertical Scalability**: Handles 10K+ tenants with template versioning

---

## 🏗 HIGH-LEVEL ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ALPHERY OS (UNTOUCHED)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Firebase Auth (Gmail) → OS Session → Role Detection → Tenant Workspace     │
│                                                                               │
│  Roles: Super Admin | Alphery Staff | Tenant Admin | Users                  │
│                                                                               │
└─────────────────────────────────────────┬───────────────────────────────────┘
                                          │
                                          │ User Opens CRM App
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CRM PRO (ISOLATED MODULE)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ENTRY POINT: CRM Bootstrap Engine                                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  1. Verify Session (from OS context)                                │   │
│  │  2. Extract: tenant_id, user_id, role                               │   │
│  │  3. Query: tenant_crm_config WHERE tenant_id = $tenant_id           │   │
│  │                                                                       │   │
│  │  IF template_id IS NULL:                                            │   │
│  │     → Route to TemplateSelectionScreen                              │   │
│  │  ELSE:                                                               │   │
│  │     → Route to DynamicCRMWorkspace                                  │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  TEMPLATE SELECTION FLOW (First-Time Only)                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  [Hospital CRM]  [Real Estate]  [Jewellery]  [Corporate]  [Blank]  │   │
│  │                                                                       │   │
│  │  User selects → Validate permissions → Insert tenant_crm_config     │   │
│  │                                                                       │   │
│  │  INSERT INTO tenant_crm_config (                                    │   │
│  │    tenant_id, template_id, enabled_modules, field_overrides,        │   │
│  │    workflow_config, dashboard_layout, permissions_matrix            │   │
│  │  ) SELECT * FROM crm_templates WHERE id = $selected_template        │   │
│  │                                                                       │   │
│  │  → Redirect to DynamicCRMWorkspace                                  │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  DYNAMIC CRM WORKSPACE (Runtime Engine)                             │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────┐│   │
│  │  │ Sidebar Engine   │  │ Module Renderer  │  │ Permission Gate   ││   │
│  │  ├──────────────────┤  ├──────────────────┤  ├───────────────────┤│   │
│  │  │ Load enabled     │  │ Load module by   │  │ Check user role   ││   │
│  │  │ modules from     │  │ slug:            │  │ in tenant:        ││   │
│  │  │ tenant_crm_      │  │                  │  │                   ││   │
│  │  │ config.enabled_  │  │ - Leads          │  │ IF Super Admin:   ││   │
│  │  │ modules[]        │  │ - Contacts       │  │   full access     ││   │
│  │  │                  │  │ - Patients       │  │ ELSE IF Tenant    ││   │
│  │  │ Render dynamic   │  │ - Properties     │  │   Admin:          ││   │
│  │  │ nav items        │  │ - Inventory      │  │   module_perms    ││   │
│  │  │                  │  │                  │  │ ELSE:             ││   │
│  │  └──────────────────┘  │ Fetch field      │  │   role_perms      ││   │
│  │                         │ schema from      │  │                   ││   │
│  │                         │ crm_module_      │  └───────────────────┘│   │
│  │                         │ fields           │                        │   │
│  │                         │                  │                        │   │
│  │                         │ Render form/     │                        │   │
│  │                         │ table dynamically│                        │   │
│  │                         └──────────────────┘                        │   │
│  │                                                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │ Data Layer (All queries tenant-scoped)                       │  │   │
│  │  ├──────────────────────────────────────────────────────────────┤  │   │
│  │  │                                                                │  │   │
│  │  │  prisma.crmRecords.findMany({                                │  │   │
│  │  │    where: {                                                   │  │   │
│  │  │      tenantId: req.tenantId,  // ← ALWAYS ENFORCED           │  │   │
│  │  │      moduleSlug: 'leads'                                      │  │   │
│  │  │    }                                                           │  │   │
│  │  │  })                                                            │  │   │
│  │  │                                                                │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        TEMPLATE ENGINE (Backend)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  crm_templates          →  Defines industry base configurations             │
│  tenant_crm_config      →  Tenant's active CRM state (immutable template)   │
│  crm_module_fields      →  Custom fields added by tenant                    │
│  crm_workflows          →  Automation rules (status change → email)         │
│  crm_records            →  Actual data (JSON storage for flexibility)       │
│  crm_dashboards         →  Widget layouts per role                          │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 FOLDER STRUCTURE

```
backend/src/
├── crm/
│   ├── crm.module.ts                    # NestJS module registration
│   │
│   ├── core/                            # Core CRM engine (template-agnostic)
│   │   ├── template.service.ts          # Template selection/loading
│   │   ├── bootstrap.service.ts         # CRM initialization per tenant
│   │   ├── module-registry.service.ts   # Dynamic module registration
│   │   └── permission.service.ts        # CRM-specific permission checks
│   │
│   ├── templates/                       # Template management
│   │   ├── templates.controller.ts      # Super Admin: CRUD templates
│   │   ├── templates.service.ts         # Template seeding/versioning
│   │   └── seeders/                     # Default template definitions
│   │       ├── hospital.template.ts
│   │       ├── real-estate.template.ts
│   │       ├── jewellery.template.ts
│   │       ├── corporate.template.ts
│   │       └── blank.template.ts
│   │
│   ├── modules/                         # Dynamic module implementations
│   │   ├── leads/
│   │   │   ├── leads.controller.ts
│   │   │   ├── leads.service.ts
│   │   │   └── dto/
│   │   ├── contacts/
│   │   ├── accounts/
│   │   ├── opportunities/
│   │   ├── patients/                    # Hospital-specific
│   │   ├── properties/                  # Real Estate-specific
│   │   ├── inventory/                   # Jewellery-specific
│   │   └── ...other modules
│   │
│   ├── fields/                          # Custom field engine
│   │   ├── field.service.ts             # CRUD custom fields
│   │   ├── field-validator.ts           # Runtime type validation
│   │   └── field-renderer.ts            # UI field component mapper
│   │
│   ├── workflows/                       # Workflow automation engine
│   │   ├── workflow.service.ts          # Trigger evaluation
│   │   ├── actions/                     # Action handlers
│   │   │   ├── send-email.action.ts
│   │   │   ├── update-field.action.ts
│   │   │   ├── create-task.action.ts
│   │   │   └── webhook.action.ts
│   │   └── triggers/
│   │       ├── record-created.trigger.ts
│   │       ├── field-changed.trigger.ts
│   │       └── status-updated.trigger.ts
│   │
│   ├── dashboards/                      # Dashboard engine
│   │   ├── dashboard.service.ts         # Layout/widget management
│   │   ├── widgets/                     # Widget types
│   │   │   ├── metric-card.widget.ts
│   │   │   ├── chart.widget.ts
│   │   │   ├── recent-records.widget.ts
│   │   │   └── pipeline.widget.ts
│   │   └── dashboard.controller.ts
│   │
│   ├── records/                         # Universal record storage
│   │   ├── records.controller.ts        # CRUD for all modules
│   │   ├── records.service.ts           # JSON-based flexible storage
│   │   └── records.repository.ts        # Prisma abstraction
│   │
│   ├── guards/                          # CRM-specific guards
│   │   ├── crm-access.guard.ts          # Verify tenant has CRM enabled
│   │   └── module-permission.guard.ts   # Module-level permission check
│   │
│   └── dto/                             # Shared DTOs
│       ├── create-record.dto.ts
│       ├── template-selection.dto.ts
│       └── field-schema.dto.ts

components/apps/crm/                     # Frontend (isolated from OS)
├── index.tsx                            # CRM entry point
│
├── bootstrap/                           # CRM initialization
│   ├── CRMBootstrap.tsx                 # Detects template state
│   └── TemplateSelectionScreen.tsx      # Template picker UI
│
├── workspace/                           # Main CRM UI
│   ├── CRMWorkspace.tsx                 # Layout wrapper
│   ├── Sidebar.tsx                      # Dynamic module navigation
│   └── Topbar.tsx                       # CRM-specific actions
│
├── modules/                             # Module views
│   ├── ModuleRenderer.tsx               # Universal module container
│   ├── TableView.tsx                    # List view with dynamic columns
│   ├── FormView.tsx                     # Create/Edit with dynamic fields
│   └── DetailView.tsx                   # Record detail page
│
├── fields/                              # Field type components
│   ├── TextField.tsx
│   ├── SelectField.tsx
│   ├── DateField.tsx
│   ├── RelationshipField.tsx            # Lookup to other modules
│   └── FileUploadField.tsx
│
├── workflows/                           # Workflow UI
│   ├── WorkflowBuilder.tsx              # Visual workflow editor
│   └── WorkflowList.tsx
│
├── dashboards/                          # Dashboard UI
│   ├── DashboardEditor.tsx              # Drag-drop widget builder
│   └── widgets/
│       ├── MetricCard.tsx
│       ├── ChartWidget.tsx
│       └── RecentRecords.tsx
│
├── hooks/                               # CRM-specific hooks
│   ├── useCRMConfig.ts                  # Load tenant CRM config
│   ├── useModuleData.ts                 # Fetch module records
│   ├── useFieldSchema.ts                # Load field definitions
│   └── usePermissions.ts                # Check module/action permissions
│
└── styles/
    └── crm.module.css                   # CRM-specific styling
```

---

## 🗄️ DATABASE SCHEMA DESIGN

### 1. **crm_templates** (Base Configurations)
```sql
CREATE TABLE crm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,              -- "Hospital CRM"
  slug VARCHAR(50) UNIQUE NOT NULL,        -- "hospital-crm"
  industry_type VARCHAR(50) NOT NULL,      -- "healthcare"
  description TEXT,
  icon_url VARCHAR(255),
  
  -- Template Configuration (JSON)
  enabled_modules JSONB NOT NULL DEFAULT '[]',
  -- [
  --   { "slug": "patients", "label": "Patients", "icon": "user-md", "order": 1 },
  --   { "slug": "appointments", "label": "Appointments", "icon": "calendar", "order": 2 }
  -- ]
  
  module_configs JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "patients": {
  --     "default_fields": [...],
  --     "default_statuses": ["New", "Active", "Inactive"],
  --     "default_views": ["All Patients", "Recent"]
  --   }
  -- }
  
  field_schemas JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "patients": [
  --     { "key": "patient_id", "label": "Patient ID", "type": "text", "required": true },
  --     { "key": "blood_group", "label": "Blood Group", "type": "select", "options": ["A+", "B+", "O+"] }
  --   ]
  -- }
  
  workflow_schemas JSONB DEFAULT '{}',
  -- {
  --   "patients": [
  --     {
  --       "name": "New Patient Welcome",
  --       "trigger": "record_created",
  --       "actions": [
  --         { "type": "send_email", "template": "patient_welcome", "to": "{{email}}" }
  --       ]
  --     }
  --   ]
  -- }
  
  dashboard_layout JSONB DEFAULT '{}',
  -- {
  --   "default": {
  --     "widgets": [
  --       { "type": "metric", "title": "Total Patients", "module": "patients", "aggregation": "count" },
  --       { "type": "chart", "title": "Appointments This Week", "module": "appointments", "chart_type": "bar" }
  --     ]
  --   }
  -- }
  
  permissions_matrix JSONB DEFAULT '{}',
  -- {
  --   "owner": { "patients": ["create", "read", "update", "delete"], "appointments": ["*"] },
  --   "admin": { "patients": ["create", "read", "update"], "appointments": ["read"] },
  --   "member": { "patients": ["read"], "appointments": ["read"] }
  -- }
  
  version VARCHAR(10) DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT TRUE,          -- System templates cannot be deleted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_crm_templates_slug ON crm_templates(slug);
CREATE INDEX idx_crm_templates_active ON crm_templates(is_active);
```

### 2. **tenant_crm_config** (Tenant CRM State)
```sql
CREATE TABLE tenant_crm_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES crm_templates(id),
  
  -- Tenant can override template config (deep merge with template)
  enabled_modules JSONB NOT NULL,          -- Copied from template, can toggle modules
  field_overrides JSONB DEFAULT '{}',      -- Additional custom fields
  -- {
  --   "patients": [
  --     { "key": "insurance_provider", "label": "Insurance Provider", "type": "text", "custom": true }
  --   ]
  -- }
  
  workflow_config JSONB DEFAULT '{}',      -- Additional/modified workflows
  dashboard_layout JSONB DEFAULT '{}',     -- Custom dashboard layout
  permissions_matrix JSONB DEFAULT '{}',   -- Tenant-specific role permissions
  
  -- Metadata
  selected_at TIMESTAMP DEFAULT NOW(),
  selected_by_user_id UUID REFERENCES platform_users(id),
  template_version VARCHAR(10),            -- Track which template version was used
  can_change_template BOOLEAN DEFAULT FALSE, -- Lock template after data exists
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_tenant_crm UNIQUE (tenant_id)
);

CREATE INDEX idx_tenant_crm_tenant ON tenant_crm_config(tenant_id);
CREATE INDEX idx_tenant_crm_template ON tenant_crm_config(template_id);
```

### 3. **crm_module_fields** (Runtime Field Definitions)
```sql
CREATE TABLE crm_module_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_slug VARCHAR(50) NOT NULL,        -- "patients", "leads", "properties"
  
  field_key VARCHAR(100) NOT NULL,         -- "blood_group", "insurance_no"
  field_label VARCHAR(100) NOT NULL,       -- "Blood Group"
  field_type VARCHAR(50) NOT NULL,         -- "text", "select", "date", "relationship", "file"
  
  field_options JSONB DEFAULT '{}',
  -- For select: { "options": ["A+", "B+", "O+"] }
  -- For relationship: { "related_module": "doctors", "display_field": "name" }
  
  is_required BOOLEAN DEFAULT FALSE,
  is_searchable BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE,         -- System fields cannot be deleted
  display_order INT DEFAULT 0,
  
  validation_rules JSONB DEFAULT '{}',
  -- { "min_length": 5, "max_length": 20, "pattern": "^[A-Z]+$" }
  
  created_by_user_id UUID REFERENCES platform_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_tenant_module_field UNIQUE (tenant_id, module_slug, field_key)
);

CREATE INDEX idx_crm_fields_tenant_module ON crm_module_fields(tenant_id, module_slug);
```

### 4. **crm_records** (Universal Data Storage)
```sql
CREATE TABLE crm_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_slug VARCHAR(50) NOT NULL,        -- "leads", "patients", "properties"
  
  -- JSON storage for maximum flexibility (like Salesforce)
  data JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "name": "John Doe",
  --   "email": "john@example.com",
  --   "status": "New",
  --   "blood_group": "A+",
  --   "custom_field_xyz": "value"
  -- }
  
  -- Metadata
  record_number VARCHAR(50),               -- Auto-generated: PAT-000001, LEAD-000123
  owner_user_id UUID REFERENCES platform_users(id),
  created_by_user_id UUID REFERENCES platform_users(id),
  updated_by_user_id UUID REFERENCES platform_users(id),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  deleted_by_user_id UUID REFERENCES platform_users(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_record_number UNIQUE (tenant_id, module_slug, record_number)
);

CREATE INDEX idx_crm_records_tenant_module ON crm_records(tenant_id, module_slug);
CREATE INDEX idx_crm_records_owner ON crm_records(owner_user_id);
CREATE INDEX idx_crm_records_data_gin ON crm_records USING GIN (data); -- Fast JSON queries
CREATE INDEX idx_crm_records_deleted ON crm_records(is_deleted) WHERE is_deleted = FALSE;
```

### 5. **crm_workflows** (Automation Engine)
```sql
CREATE TABLE crm_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_slug VARCHAR(50) NOT NULL,
  
  name VARCHAR(100) NOT NULL,              -- "Send Welcome Email"
  description TEXT,
  
  -- Trigger configuration
  trigger_type VARCHAR(50) NOT NULL,       -- "record_created", "field_updated", "status_changed"
  trigger_conditions JSONB DEFAULT '{}',
  -- {
  --   "field": "status",
  --   "operator": "equals",
  --   "value": "New"
  -- }
  
  -- Actions to execute
  actions JSONB NOT NULL,
  -- [
  --   {
  --     "type": "send_email",
  --     "template": "patient_welcome",
  --     "to": "{{data.email}}",
  --     "subject": "Welcome {{data.name}}"
  --   },
  --   {
  --     "type": "update_field",
  --     "field": "onboarding_status",
  --     "value": "Email Sent"
  --   }
  -- ]
  
  is_active BOOLEAN DEFAULT TRUE,
  execution_order INT DEFAULT 0,           -- For multiple workflows on same trigger
  
  created_by_user_id UUID REFERENCES platform_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_crm_workflows_tenant_module ON crm_workflows(tenant_id, module_slug);
CREATE INDEX idx_crm_workflows_active ON crm_workflows(is_active) WHERE is_active = TRUE;
```

### 6. **crm_workflow_logs** (Audit Trail)
```sql
CREATE TABLE crm_workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES crm_workflows(id) ON DELETE CASCADE,
  record_id UUID NOT NULL REFERENCES crm_records(id) ON DELETE CASCADE,
  
  execution_status VARCHAR(20) NOT NULL,   -- "success", "failed", "partial"
  executed_actions JSONB,                  -- Which actions ran
  error_message TEXT,
  execution_duration_ms INT,
  
  executed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflow_logs_workflow ON crm_workflow_logs(workflow_id);
CREATE INDEX idx_workflow_logs_record ON crm_workflow_logs(record_id);
```

### 7. **crm_dashboards** (Dashboard Layouts)
```sql
CREATE TABLE crm_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  
  role_restriction VARCHAR(50),            -- NULL = all roles, "admin" = admin only
  
  layout JSONB NOT NULL,
  -- {
  --   "grid": "12-column",
  --   "widgets": [
  --     {
  --       "id": "widget-1",
  --       "type": "metric_card",
  --       "title": "Total Patients",
  --       "position": { "x": 0, "y": 0, "w": 3, "h": 2 },
  --       "config": {
  --         "module": "patients",
  --         "aggregation": "count",
  --         "filter": { "status": "Active" }
  --       }
  --     }
  --   ]
  -- }
  
  is_default BOOLEAN DEFAULT FALSE,
  created_by_user_id UUID REFERENCES platform_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_tenant_dashboard_name UNIQUE (tenant_id, name)
);

CREATE INDEX idx_crm_dashboards_tenant ON crm_dashboards(tenant_id);
```

---

## 🔄 RUNTIME LOGIC FLOW (Pseudocode)

### **1. CRM Bootstrap on App Open**
```typescript
// Frontend: components/apps/crm/bootstrap/CRMBootstrap.tsx

async function initializeCRM() {
  // Step 1: Get session from OS context (already authenticated)
  const { userId, tenantId, role } = useAuthContext(); // From Alphery OS
  
  // Step 2: Check if tenant has CRM configured
  const crmConfig = await fetch(`/api/crm/config/${tenantId}`);
  
  if (!crmConfig) {
    // First-time user: Show template selection
    return <TemplateSelectionScreen tenantId={tenantId} />;
  }
  
  // Step 3: Load CRM configuration
  const { templateId, enabledModules, fieldSchemas, permissions } = crmConfig;
  
  // Step 4: Store in CRM context
  setCRMContext({
    tenantId,
    userId,
    role,
    template: templateId,
    modules: enabledModules,
    permissions: permissions[role]
  });
  
  // Step 5: Render CRM workspace
  return <CRMWorkspace />;
}
```

### **2. Template Selection Flow**
```typescript
// Backend: crm/templates/templates.service.ts

async function selectTemplate(tenantId: string, templateId: string, userId: string) {
  // Verify user is Tenant Admin or Super Admin
  const hasPermission = await authService.canManageTenant(userId, tenantId);
  if (!hasPermission) throw new ForbiddenException();
  
  // Check if template already selected
  const existing = await prisma.tenantCRMConfig.findUnique({
    where: { tenantId }
  });
  
  if (existing && existing.canChangeTemplate === false) {
    throw new ConflictException('Template locked due to existing data');
  }
  
  // Load template
  const template = await prisma.crmTemplates.findUnique({
    where: { id: templateId }
  });
  
  // Create tenant CRM config
  const config = await prisma.tenantCRMConfig.upsert({
    where: { tenantId },
    create: {
      tenantId,
      templateId,
      enabledModules: template.enabledModules,
      fieldOverrides: {},
      workflowConfig: template.workflowSchemas,
      dashboardLayout: template.dashboardLayout,
      permissionsMatrix: template.permissionsMatrix,
      selectedByUserId: userId,
      templateVersion: template.version
    },
    update: {
      templateId,
      enabledModules: template.enabledModules,
      templateVersion: template.version
    }
  });
  
  // Seed default fields for all modules
  await seedModuleFields(tenantId, template.fieldSchemas);
  
  return config;
}
```

### **3. Dynamic Module Loading**
```typescript
// Frontend: components/apps/crm/modules/ModuleRenderer.tsx

function ModuleRenderer({ moduleSlug }: { moduleSlug: string }) {
  const { tenantId, permissions } = useCRMContext();
  
  // Load field schema for this module
  const { fields } = useFieldSchema(moduleSlug);
  
  // Load data with tenant scoping
  const { records, loading } = useQuery(`
    query GetRecords($tenantId: UUID!, $module: String!) {
      crmRecords(
        where: { 
          tenantId: $tenantId, 
          moduleSlug: $module,
          isDeleted: false
        }
      ) {
        id
        data
        owner { displayName }
        createdAt
      }
    }
  `, { tenantId, module: moduleSlug });
  
  // Check module permission
  if (!permissions[moduleSlug]?.read) {
    return <AccessDenied />;
  }
  
  return (
    <ModuleTableView
      fields={fields}
      records={records}
      onCreateRecord={() => showCreateModal(moduleSlug, fields)}
      onEditRecord={(id) => showEditModal(id, fields)}
      canEdit={permissions[moduleSlug]?.update}
      canDelete={permissions[moduleSlug]?.delete}
    />
  );
}
```

### **4. Record Creation with Workflow Trigger**
```typescript
// Backend: crm/records/records.service.ts

async function createRecord(dto: CreateRecordDto, context: RequestContext) {
  const { tenantId, userId } = context;
  const { moduleSlug, data } = dto;
  
  // Validate field schema
  const fields = await prisma.crmModuleFields.findMany({
    where: { tenantId, moduleSlug }
  });
  
  const validatedData = validateFieldData(data, fields);
  
  // Generate record number
  const recordNumber = await generateRecordNumber(tenantId, moduleSlug);
  
  // Create record
  const record = await prisma.crmRecords.create({
    data: {
      tenantId,
      moduleSlug,
      data: validatedData,
      recordNumber,
      ownerUserId: userId,
      createdByUserId: userId
    }
  });
  
  // Trigger workflows asynchronously
  await workflowService.processTriggers(
    tenantId,
    moduleSlug,
    'record_created',
    record
  );
  
  return record;
}
```

### **5. Workflow Execution**
```typescript
// Backend: crm/workflows/workflow.service.ts

async function processTriggers(
  tenantId: string,
  moduleSlug: string,
  triggerType: string,
  record: any
) {
  // Find active workflows
  const workflows = await prisma.crmWorkflows.findMany({
    where: {
      tenantId,
      moduleSlug,
      triggerType,
      isActive: true
    },
    orderBy: { executionOrder: 'asc' }
  });
  
  for (const workflow of workflows) {
    const startTime = Date.now();
    let status = 'success';
    let error = null;
    
    try {
      // Evaluate conditions
      const conditionsMet = evaluateConditions(workflow.triggerConditions, record.data);
      
      if (conditionsMet) {
        // Execute actions
        for (const action of workflow.actions) {
          await executeAction(action, record, tenantId);
        }
      }
    } catch (e) {
      status = 'failed';
      error = e.message;
    }
    
    // Log execution
    await prisma.crmWorkflowLogs.create({
      data: {
        workflowId: workflow.id,
        recordId: record.id,
        executionStatus: status,
        executedActions: workflow.actions,
        errorMessage: error,
        executionDurationMs: Date.now() - startTime
      }
    });
  }
}

async function executeAction(action: any, record: any, tenantId: string) {
  switch (action.type) {
    case 'send_email':
      await emailService.sendTemplatedEmail({
        to: interpolate(action.to, record),
        subject: interpolate(action.subject, record),
        template: action.template,
        data: record.data
      });
      break;
      
    case 'update_field':
      await prisma.crmRecords.update({
        where: { id: record.id },
        data: {
          data: {
            ...record.data,
            [action.field]: action.value
          }
        }
      });
      break;
      
    case 'webhook':
      await fetch(action.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      break;
  }
}
```

---

## 🔐 ISOLATION FROM OS CORE

### **Authentication: Zero Modifications Required**
```typescript
// CRM uses existing OS session, never touches auth flow

// components/apps/crm/index.tsx
export default function CRMApp() {
  // Get session from OS-provided context
  const { user, tenantId, role } = useOSAuthContext(); // ← OS hook
  
  // CRM just reads, never writes to OS auth
  return <CRMBootstrap userId={user.id} tenantId={tenantId} role={role} />;
}
```

### **Permission Isolation**
```typescript
// OS Permissions (untouched):
// - Who can access CRM app: AuthService.canAccessApp(userId, tenantId, 'crm-pro')

// CRM Permissions (isolated):
// - Which CRM modules user can access: CRMPermissionService.canAccessModule(userId, tenantId, 'patients')
// - What actions user can perform: CRMPermissionService.hasPermission(userId, tenantId, 'patients', 'delete')

// No cross-contamination: CRM permissions stored in tenant_crm_config.permissions_matrix
```

### **Database Isolation**
```sql
-- OS Core Tables (never touched by CRM):
platform_users, tenants, apps, tenant_apps, tenant_users

-- CRM-Specific Tables (isolated):
crm_templates, tenant_crm_config, crm_module_fields, crm_records, crm_workflows

-- Only shared reference: tenant_id foreign key (read-only for validation)
```

### **Routing Isolation**
```typescript
// OS routes (unchanged):
/workspace → OS Desktop
/workspace/:tenantId/apps → App Launcher

// CRM routes (self-contained):
/workspace/:tenantId/apps/crm-pro → CRM Bootstrap
/workspace/:tenantId/apps/crm-pro/select-template → Template Selection
/workspace/:tenantId/apps/crm-pro/:moduleSlug → Module View
/workspace/:tenantId/apps/crm-pro/dashboards/:dashboardId → Dashboard

// All CRM routes handled by components/apps/crm/index.tsx router
```

---

## 🎨 SAMPLE TEMPLATE JSON

### **Hospital CRM Template**
```json
{
  "id": "uuid-hospital",
  "name": "Hospital CRM",
  "slug": "hospital-crm",
  "industry_type": "healthcare",
  "description": "Complete hospital management with patients, appointments, and medical records",
  "icon_url": "/icons/hospital.svg",
  
  "enabled_modules": [
    {
      "slug": "patients",
      "label": "Patients",
      "icon": "user-injured",
      "order": 1,
      "default_statuses": ["New", "Active", "Discharged", "Deceased"]
    },
    {
      "slug": "appointments",
      "label": "Appointments",
      "icon": "calendar-check",
      "order": 2,
      "default_statuses": ["Scheduled", "Completed", "Cancelled", "No-Show"]
    },
    {
      "slug": "doctors",
      "label": "Doctors",
      "icon": "user-md",
      "order": 3,
      "default_statuses": ["Active", "On Leave", "Retired"]
    },
    {
      "slug": "medical_records",
      "label": "Medical Records",
      "icon": "file-medical",
      "order": 4
    }
  ],
  
  "field_schemas": {
    "patients": [
      { "key": "patient_id", "label": "Patient ID", "type": "text", "required": true, "system": true },
      { "key": "full_name", "label": "Full Name", "type": "text", "required": true },
      { "key": "date_of_birth", "label": "Date of Birth", "type": "date", "required": true },
      { "key": "blood_group", "label": "Blood Group", "type": "select", "options": ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
      { "key": "phone", "label": "Phone Number", "type": "phone", "required": true },
      { "key": "email", "label": "Email", "type": "email" },
      { "key": "address", "label": "Address", "type": "textarea" },
      { "key": "emergency_contact", "label": "Emergency Contact", "type": "text" },
      { "key": "insurance_provider", "label": "Insurance Provider", "type": "text" },
      { "key": "insurance_number", "label": "Insurance Number", "type": "text" },
      { "key": "primary_doctor", "label": "Primary Doctor", "type": "relationship", "options": { "related_module": "doctors", "display_field": "full_name" } },
      { "key": "status", "label": "Status", "type": "select", "options": ["New", "Active", "Discharged", "Deceased"], "required": true, "system": true }
    ],
    
    "appointments": [
      { "key": "appointment_number", "label": "Appointment #", "type": "text", "system": true },
      { "key": "patient", "label": "Patient", "type": "relationship", "required": true, "options": { "related_module": "patients", "display_field": "full_name" } },
      { "key": "doctor", "label": "Doctor", "type": "relationship", "required": true, "options": { "related_module": "doctors", "display_field": "full_name" } },
      { "key": "appointment_date", "label": "Appointment Date", "type": "datetime", "required": true },
      { "key": "duration_minutes", "label": "Duration (minutes)", "type": "number", "default": 30 },
      { "key": "reason", "label": "Reason for Visit", "type": "textarea", "required": true },
      { "key": "status", "label": "Status", "type": "select", "options": ["Scheduled", "Completed", "Cancelled", "No-Show"], "system": true }
    ]
  },
  
  "workflow_schemas": {
    "patients": [
      {
        "name": "New Patient Welcome Email",
        "trigger_type": "record_created",
        "actions": [
          {
            "type": "send_email",
            "template": "patient_welcome",
            "to": "{{data.email}}",
            "subject": "Welcome to {{tenant.name}}",
            "body": "Dear {{data.full_name}}, your patient ID is {{data.patient_id}}"
          }
        ]
      }
    ],
    
    "appointments": [
      {
        "name": "Appointment Confirmation",
        "trigger_type": "record_created",
        "trigger_conditions": {
          "field": "status",
          "operator": "equals",
          "value": "Scheduled"
        },
        "actions": [
          {
            "type": "send_email",
            "to": "{{data.patient.email}}",
            "subject": "Appointment Confirmed",
            "body": "Your appointment with {{data.doctor.full_name}} is scheduled for {{data.appointment_date}}"
          }
        ]
      },
      {
        "name": "Appointment Reminder (24h before)",
        "trigger_type": "scheduled",
        "trigger_conditions": {
          "field": "appointment_date",
          "operator": "is_tomorrow"
        },
        "actions": [
          {
            "type": "send_email",
            "to": "{{data.patient.email}}",
            "subject": "Appointment Reminder",
            "body": "Reminder: You have an appointment tomorrow at {{data.appointment_date}}"
          }
        ]
      }
    ]
  },
  
  "dashboard_layout": {
    "default": {
      "widgets": [
        {
          "id": "total-patients",
          "type": "metric_card",
          "title": "Total Patients",
          "position": { "x": 0, "y": 0, "w": 3, "h": 2 },
          "config": {
            "module": "patients",
            "aggregation": "count",
            "filter": { "status": "Active" },
            "icon": "users",
            "color": "blue"
          }
        },
        {
          "id": "todays-appointments",
          "type": "metric_card",
          "title": "Today's Appointments",
          "position": { "x": 3, "y": 0, "w": 3, "h": 2 },
          "config": {
            "module": "appointments",
            "aggregation": "count",
            "filter": { "appointment_date": "today", "status": "Scheduled" },
            "icon": "calendar",
            "color": "green"
          }
        },
        {
          "id": "appointments-chart",
          "type": "chart",
          "title": "Appointments This Week",
          "position": { "x": 0, "y": 2, "w": 6, "h": 4 },
          "config": {
            "module": "appointments",
            "chart_type": "bar",
            "x_axis": "appointment_date",
            "y_axis": "count",
            "date_range": "this_week"
          }
        },
        {
          "id": "recent-patients",
          "type": "recent_records",
          "title": "Recently Registered Patients",
          "position": { "x": 6, "y": 0, "w": 6, "h": 6 },
          "config": {
            "module": "patients",
            "limit": 10,
            "fields": ["patient_id", "full_name", "phone", "primary_doctor", "created_at"]
          }
        }
      ]
    }
  },
  
  "permissions_matrix": {
    "owner": {
      "patients": ["create", "read", "update", "delete", "export"],
      "appointments": ["*"],
      "doctors": ["*"],
      "medical_records": ["*"]
    },
    "admin": {
      "patients": ["create", "read", "update", "export"],
      "appointments": ["create", "read", "update", "delete"],
      "doctors": ["read"],
      "medical_records": ["create", "read", "update"]
    },
    "member": {
      "patients": ["read"],
      "appointments": ["create", "read", "update_own"],
      "doctors": ["read"],
      "medical_records": ["read_own"]
    }
  },
  
  "version": "1.0.0",
  "is_active": true,
  "is_system": true
}
```

---

## 📈 SCALABILITY \& FUTURE-PROOFING

### **1. Template Versioning**
```typescript
// When updating a template:
// 1. Create new version (e.g., "hospital-crm" v1.1.0)
// 2. Tenants on v1.0.0 keep working (no breaking changes)
// 3. Admin can manually upgrade: POST /api/crm/templates/upgrade
// 4. Migration scripts run to transform old data to new schema
```

### **2. Performance at 10K+ Tenants**
```sql
-- All queries use tenant_id index
SELECT * FROM crm_records 
WHERE tenant_id = $1 AND module_slug = $2;  -- Uses composite index

-- GIN index for fast JSON queries
SELECT * FROM crm_records 
WHERE tenant_id = $1 
  AND data @> '{"status": "Active"}';  -- JSON operator with index

-- Partitioning strategy (if needed):
CREATE TABLE crm_records_2026_q1 PARTITION OF crm_records
FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
```

### **3. Horizontal Scaling**
```typescript
// Stateless architecture:
// - All state in PostgreSQL
// - No session storage in CRM
// - Multiple backend instances with load balancer

// Caching strategy:
// - Template configs: 1 hour cache (rarely change)
// - Field schemas: 30 min cache (per tenant)
// - User permissions: 15 min cache
// - Record data: No cache (always fresh)
```

### **4. Custom Module Builder (Future)**
```typescript
// Allow Super Admins to create new modules without code:
POST /api/crm/modules/custom
{
  "tenant_id": "uuid",
  "slug": "vehicles",  // New module
  "label": "Vehicles",
  "icon": "car",
  "fields": [
    { "key": "make", "label": "Make", "type": "text" },
    { "key": "model", "label": "Model", "type": "text" },
    { "key": "year", "label": "Year", "type": "number" }
  ]
}

// Module automatically appears in sidebar
// All CRUD operations work via generic records API
```

### **5. Multi-Language Support**
```typescript
// Add i18n to templates:
"field_schemas": {
  "patients": [
    {
      "key": "full_name",
      "label": {
        "en": "Full Name",
        "es": "Nombre Completo",
        "fr": "Nom Complet"
      },
      "type": "text"
    }
  ]
}
```

---

## ✅ FINAL CHECKLIST

### **OS Isolation Verified**
- [ ] Authentication flow: **UNTOUCHED** ✅
- [ ] OS core tables: **NO MODIFICATIONS** ✅
- [ ] OS routing: **INDEPENDENT** ✅
- [ ] OS permissions: **READ-ONLY REFERENCE** ✅

### **CRM Features**
- [ ] Template selection UI
- [ ] Dynamic module rendering
- [ ] Custom field engine
- [ ] Workflow automation
- [ ] Dashboard builder
- [ ] Role-based permissions (isolated)
- [ ] Multi-tenant data scoping

### **Scalability**
- [ ] Database indexes optimized
- [ ] JSON queries with GIN indexes
- [ ] Tenant-scoped queries enforced
- [ ] Template versioning support
- [ ] Horizontal scaling ready

---

## 🚀 NEXT STEPS (IMPLEMENTATION ORDER)

1. **Phase 1: Backend Foundation**
   - Create Prisma schema additions
   - Seed default templates (Hospital, Real Estate, etc.)
   - Build template selection API
   - Implement tenant CRM config service

2. **Phase 2: Core Engine**
   - Build dynamic field engine
   - Implement universal records CRUD
   - Create permission checking middleware

3. **Phase 3: Frontend Bootstrap**
   - Build template selection UI
   - Create CRM workspace shell
   - Implement dynamic sidebar

4. **Phase 4: Module Renderer**
   - Build dynamic table view
   - Build dynamic form generator
   - Implement field components

5. **Phase 5: Advanced Features**
   - Workflow engine
   - Dashboard builder
   - Custom fields UI

6. **Phase 6: Polish & Deploy**
   - Performance optimization
   - Documentation
   - Testing suite

---

**This architecture is designed for enterprise-grade performance, complete OS isolation, and infinite customization while maintaining a clean, maintainable codebase.**

Ready to implement? 🚀
