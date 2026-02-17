# CRM PRO - QUICK REFERENCE GUIDE
**Fast Reference for Developers Working on CRM Pro**

---

## 🔑 KEY CONCEPTS

### Template-Driven Architecture
- Each tenant selects ONE industry template (Hospital, Real Estate, Jewellery, etc.)
- Template defines: modules, fields, workflows, dashboards, permissions
- Tenant can customize: add custom fields, toggle modules, modify workflows
- Template is locked once data exists (prevents breaking changes)

### Multi-Tenant Isolation
- **All queries MUST include `tenant_id`**
- **All data stored in JSON for flexibility (like Salesforce)**
- **Each tenant's CRM is completely isolated**
- **No cross-tenant data leakage**

### OS Integration (READ-ONLY)
- CRM uses existing Firebase authentication (never modifies it)
- CRM uses existing tenant/user context (never modifies it)
- CRM uses existing role system (never modifies it)
- CRM adds its own permission layer on top

---

## 📁 FILE LOCATIONS

### Backend
```
backend/src/crm/
├── core/
│   ├── bootstrap.service.ts          # Load tenant CRM config
│   └── template.service.ts           # Template operations
├── templates/
│   ├── seeders/
│   │   └── hospital.template.ts      # Template definitions
│   ├── templates.controller.ts       # API endpoints
│   └── templates.service.ts          # Template logic
├── records/
│   ├── records.controller.ts         # CRUD endpoints
│   └── records.service.ts            # Record logic
└── crm.module.ts                     # Module registration
```

### Frontend
```
components/apps/crm/
├── bootstrap/
│   ├── CRMBootstrap.tsx              # Entry point
│   └── TemplateSelectionScreen.tsx   # First-time setup
├── workspace/
│   ├── CRMWorkspace.tsx              # Main layout
│   └── Sidebar.tsx                   # Module navigation
├── modules/
│   ├── ModuleRenderer.tsx            # Dynamic module view
│   └── TableView.tsx                 # List view
└── hooks/
    └── useCRMContext.ts              # CRM state management
```

### Database
```
crm_templates          → Template definitions
tenant_crm_configs     → Each tenant's CRM state
crm_module_fields      → Field schemas per tenant
crm_records            → All CRM data (JSON storage)
crm_workflows          → Automation rules
crm_workflow_logs      → Execution history
crm_dashboards         → Dashboard layouts
crm_activities         → Activity timeline
```

---

## 🔌 API ENDPOINTS

### Template Management
```typescript
GET    /api/crm/templates                    // List all templates
POST   /api/crm/templates/select             // Select template for tenant
GET    /api/crm/config/:tenantId             // Get tenant CRM config
```

### Records Management
```typescript
GET    /api/crm/:tenantId/:moduleSlug        // List records
POST   /api/crm/:tenantId/:moduleSlug        // Create record
GET    /api/crm/:tenantId/:moduleSlug/:id    // Get record
PUT    /api/crm/:tenantId/:moduleSlug/:id    // Update record
DELETE /api/crm/:tenantId/:moduleSlug/:id    // Delete record
```

### Fields Management
```typescript
GET    /api/crm/:tenantId/fields/:moduleSlug // Get field schema
POST   /api/crm/:tenantId/fields/:moduleSlug // Add custom field
```

### Workflows
```typescript
GET    /api/crm/:tenantId/workflows/:moduleSlug  // List workflows
POST   /api/crm/:tenantId/workflows               // Create workflow
PUT    /api/crm/:tenantId/workflows/:id           // Update workflow
```

---

## 💾 DATABASE QUERIES

### Always Include Tenant ID
```typescript
// ❌ NEVER DO THIS (security risk)
await prisma.cRMRecord.findMany({
  where: { moduleSlug: 'patients' }
});

// ✅ ALWAYS DO THIS
await prisma.cRMRecord.findMany({
  where: {
    tenantId: req.tenantId,  // Always filter by tenant
    moduleSlug: 'patients'
  }
});
```

### JSON Queries
```typescript
// Search in JSON data
await prisma.cRMRecord.findMany({
  where: {
    tenantId: tenantId,
    moduleSlug: 'patients',
    data: {
      path: ['status'],
      equals: 'Active'
    }
  }
});

// Find records with specific field value
await prisma.$queryRaw`
  SELECT * FROM crm_records
  WHERE tenant_id = ${tenantId}
    AND module_slug = 'patients'
    AND data->>'status' = 'Active'
`;
```

---

## 🎨 TEMPLATE STRUCTURE

### Minimal Template Example
```typescript
{
  name: 'Corporate CRM',
  slug: 'corporate-crm',
  industryType: 'business',
  
  enabledModules: [
    {
      slug: 'leads',
      label: 'Leads',
      icon: 'user-plus',
      order: 1,
      recordPrefix: 'LEAD'
    },
    {
      slug: 'accounts',
      label: 'Accounts',
      icon: 'building',
      order: 2,
      recordPrefix: 'ACC'
    }
  ],
  
  fieldSchemas: {
    leads: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'status', label: 'Status', type: 'select', options: ['New', 'Qualified'] }
    ]
  },
  
  permissionsMatrix: {
    owner: { leads: ['*'], accounts: ['*'] },
    admin: { leads: ['read', 'update'], accounts: ['read'] },
    member: { leads: ['read'], accounts: ['read'] }
  },
  
  version: '1.0.0'
}
```

---

## 🔐 PERMISSION CHECKING

### Backend Guard
```typescript
// In any CRM controller
@UseGuards(JwtAuthGuard, CRMModulePermissionGuard)
@Post(':tenantId/:moduleSlug')
async createRecord(
  @Param('tenantId') tenantId: string,
  @Param('moduleSlug') moduleSlug: string,
  @Body() data: any,
  @Request() req
) {
  // Permission already checked by guard
  return this.recordsService.createRecord(
    tenantId,
    moduleSlug,
    data,
    req.user.sub
  );
}
```

### Frontend Hook
```typescript
// In React component
const { permissions, checkPermission } = useCRMContext();

function PatientList() {
  const canCreate = checkPermission('patients', 'create');
  const canDelete = checkPermission('patients', 'delete');
  
  return (
    <div>
      {canCreate && <button>Add Patient</button>}
      {canDelete && <button>Delete</button>}
    </div>
  );
}
```

---

## 🚦 WORKFLOW EXECUTION

### Trigger Types
```typescript
'record_created'       // When new record is created
'record_updated'       // When record is updated
'field_changed'        // When specific field changes
'status_changed'       // When status field changes
'scheduled'            // Runs on schedule (daily, hourly, etc.)
```

### Action Types
```typescript
'send_email'           // Send email notification
'update_field'         // Update a field value
'create_record'        // Create related record
'webhook'              // Call external webhook
'assign_to_user'       // Assign to user
'send_notification'    // In-app notification
```

### Example Workflow
```typescript
{
  name: 'New Lead Assignment',
  triggerType: 'record_created',
  triggerConditions: {
    field: 'status',
    operator: 'equals',
    value: 'New'
  },
  actions: [
    {
      type: 'assign_to_user',
      userId: '{{auto_assign_logic}}'
    },
    {
      type: 'send_email',
      to: '{{data.email}}',
      subject: 'Welcome!',
      body: 'Thank you for your interest...'
    }
  ]
}
```

---

## 🐛 COMMON ERRORS & FIXES

### Error: "Template not found"
**Cause:** Templates not seeded  
**Fix:** Run `npx ts-node backend/prisma/seed-crm-templates.ts`

### Error: "Tenant ID missing in query"
**Cause:** Forgot to include `tenantId` in WHERE clause  
**Fix:** Always add `tenantId: req.tenantId` to all queries

### Error: "Permission denied"
**Cause:** User role doesn't have permission  
**Fix:** Check `permissionsMatrix` in template and user's role

### Error: "Cannot change template"
**Cause:** `canChangeTemplate = false` (data exists)  
**Fix:** This is intentional to prevent data loss

### Error: "Field validation failed"
**Cause:** Required field missing or invalid type  
**Fix:** Check field schema in `crm_module_fields`

---

## 📊 SCALABILITY TIPS

### Database Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_crm_records_tenant_module_status 
ON crm_records(tenant_id, module_slug) 
WHERE data->>'status' = 'Active';

-- Partition large tables
CREATE TABLE crm_records_2026 PARTITION OF crm_records
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

### Caching Strategy
```typescript
// Cache template configs (1 hour)
const template = await cache.get(`template:${templateId}`, async () => {
  return prisma.cRMTemplate.findUnique({ where: { id: templateId } });
}, 3600);

// Cache field schemas (30 minutes)
const fields = await cache.get(`fields:${tenantId}:${moduleSlug}`, async () => {
  return prisma.cRMModuleField.findMany({ where: { tenantId, moduleSlug } });
}, 1800);

// DON'T cache record data (always fresh)
```

### Queue Long Operations
```typescript
// For bulk imports, use background jobs
import { Queue } from 'bull';

const importQueue = new Queue('crm-import');

importQueue.process(async (job) => {
  const { tenantId, moduleSlug, records } = job.data;
  
  for (const record of records) {
    await recordsService.createRecord(tenantId, moduleSlug, record);
  }
});
```

---

## 🧪 TESTING CHECKLIST

### Unit Tests
- [ ] Template selection creates correct config
- [ ] Record creation validates fields
- [ ] Workflow triggers execute actions
- [ ] Permissions are checked correctly

### Integration Tests
- [ ] Multi-tenant isolation (tenant A can't see tenant B data)
- [ ] Template selection locks after data creation
- [ ] Custom fields are persisted correctly
- [ ] Workflows trigger on record creation

### E2E Tests
- [ ] User selects template from UI
- [ ] User creates record in module
- [ ] User sees only their tenant's data
- [ ] User with "member" role can't delete records

---

## 📚 ADDITIONAL RESOURCES

### Documentation
- Full Architecture: `CRM_PRO_ARCHITECTURE.md`
- Implementation Guide: `CRM_PRO_IMPLEMENTATION_GUIDE.md`
- Schema Reference: `backend/prisma/crm_schema_additions.prisma`

### Example Templates
- Hospital CRM: `backend/src/crm/templates/seeders/hospital.template.ts`
- Real Estate CRM: (TODO)
- Jewellery CRM: (TODO)

### Related Files
- OS Auth Service: `backend/src/auth/auth.service.ts`
- OS Tenant Model: `backend/prisma/schema.prisma`
- OS Context: `context/AuthContext.tsx`

---

## 🎯 QUICK START COMMANDS

```bash
# 1. Update database
cd backend
npx prisma migrate dev --name add_crm_pro
npx prisma generate

# 2. Seed templates
npx ts-node prisma/seed-crm-templates.ts

# 3. Start backend
npm run start:dev

# 4. Start frontend
cd ..
npm run dev

# 5. Test CRM
# - Login to OS
# - Open CRM app
# - Select template
# - Create first record
```

---

## ⚠️ CRITICAL DO'S AND DON'TS

### ✅ DO:
- Always include `tenantId` in queries
- Validate field data before saving
- Use transactions for multi-step operations
- Log workflow executions
- Cache template configs
- Version your templates

### ❌ DON'T:
- Don't modify OS auth system
- Don't allow cross-tenant queries
- Don't hardcode field schemas
- Don't skip permission checks
- Don't cache record data
- Don't allow template change with existing data

---

**Keep this guide handy while developing! 🚀**
