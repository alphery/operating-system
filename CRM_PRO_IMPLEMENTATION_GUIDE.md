# CRM PRO - IMPLEMENTATION GUIDE
**Step-by-Step Implementation Plan for Template-Driven Multi-Tenant CRM**

---

## 📋 PREREQUISITES

Before starting, ensure you have:
- ✅ Existing Alphery OS running with Firebase Auth
- ✅ PostgreSQL database configured
- ✅ Prisma ORM set up
- ✅ NestJS backend running
- ✅ Next.js/React frontend running

---

## 🚀 PHASE 1: DATABASE SETUP (Day 1-2)

### Step 1.1: Update Prisma Schema

```bash
# 1. Open backend/prisma/schema.prisma
# 2. Copy models from crm_schema_additions.prisma
# 3. Add relations to existing PlatformUser model
```

**Edit `backend/prisma/schema.prisma`:**

```prisma
// Find PlatformUser model and add these relations:
model PlatformUser {
  // ... existing fields ...
  
  // CRM Relations (add these)
  crmConfigsSelected  TenantCRMConfig[]
  crmFieldsCreated    CRMModuleField[]
  crmRecordsOwned     CRMRecord[]            @relation("CRMRecordOwner")
  crmRecordsCreated   CRMRecord[]            @relation("CRMRecordCreatedBy")
  crmRecordsUpdated   CRMRecord[]            @relation("CRMRecordUpdatedBy")
  crmRecordsDeleted   CRMRecord[]            @relation("CRMRecordDeletedBy")
  crmWorkflowsCreated CRMWorkflow[]
  crmDashboardsCreated CRMDashboard[]
  crmActivities       CRMActivity[]
}

// Find Tenant model and add these relations:
model Tenant {
  // ... existing fields ...
  
  // CRM Relations (add these)
  crmConfig       TenantCRMConfig?
  crmFields       CRMModuleField[]
  crmRecords      CRMRecord[]
  crmWorkflows    CRMWorkflow[]
  crmDashboards   CRMDashboard[]
  crmActivities   CRMActivity[]
}
```

### Step 1.2: Run Migration

```bash
cd backend
npx prisma migrate dev --name add_crm_pro_tables
npx prisma generate
```

### Step 1.3: Verify Database

```bash
# Connect to your PostgreSQL database and verify tables exist:
psql -U your_username -d your_database

\dt crm*

# You should see:
# - crm_templates
# - tenant_crm_configs
# - crm_module_fields
# - crm_records
# - crm_workflows
# - crm_workflow_logs
# - crm_dashboards
# - crm_activities
```

---

## 🏗️ PHASE 2: BACKEND FOUNDATION (Day 3-5)

### Step 2.1: Create CRM Module Structure

```bash
cd backend/src
mkdir -p crm/{core,templates,modules,fields,workflows,dashboards,records,guards,dto}
```

### Step 2.2: Create Template Service

**File: `backend/src/crm/templates/templates.service.ts`**

```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { hospitalCRMTemplate } from './seeders/hospital.template';
// Import other templates

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async seedDefaultTemplates() {
    const templates = [
      hospitalCRMTemplate,
      // Add others: realEstateCRMTemplate, jewelleryCRMTemplate, etc.
    ];

    for (const template of templates) {
      await this.prisma.cRMTemplate.upsert({
        where: { slug: template.slug },
        create: template,
        update: template,
      });
    }

    console.log(`✅ Seeded ${templates.length} CRM templates`);
  }

  async getAllTemplates() {
    return this.prisma.cRMTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        industryType: true,
        description: true,
        iconUrl: true,
        version: true,
      },
    });
  }

  async selectTemplate(
    tenantId: string,
    templateId: string,
    userId: string,
  ) {
    // Check if already configured
    const existing = await this.prisma.tenantCRMConfig.findUnique({
      where: { tenantId },
    });

    if (existing && !existing.canChangeTemplate) {
      throw new ConflictException(
        'Template is locked. Data exists in CRM.',
      );
    }

    // Load template
    const template = await this.prisma.cRMTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Create/update tenant config
    const config = await this.prisma.tenantCRMConfig.upsert({
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
        templateVersion: template.version,
        canChangeTemplate: true,
      },
      update: {
        templateId,
        enabledModules: template.enabledModules,
        templateVersion: template.version,
      },
    });

    // Seed module fields
    await this.seedModuleFields(tenantId, template.fieldSchemas);

    return config;
  }

  private async seedModuleFields(tenantId: string, fieldSchemas: any) {
    for (const [moduleSlug, fields] of Object.entries(fieldSchemas)) {
      for (const field of fields as any[]) {
        await this.prisma.cRMModuleField.upsert({
          where: {
            tenantId_moduleSlug_fieldKey: {
              tenantId,
              moduleSlug,
              fieldKey: field.key,
            },
          },
          create: {
            tenantId,
            moduleSlug,
            fieldKey: field.key,
            fieldLabel: field.label,
            fieldType: field.type,
            fieldOptions: field.options || {},
            isRequired: field.required || false,
            isSearchable: field.searchable || true,
            isSystem: field.system || false,
            displayOrder: field.order || 0,
            validationRules: field.validation || {},
          },
          update: {},
        });
      }
    }
  }
}
```

### Step 2.3: Create Template Controller

**File: `backend/src/crm/templates/templates.controller.ts`**

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('api/crm/templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  async getTemplates() {
    return this.templatesService.getAllTemplates();
  }

  @Post('select')
  async selectTemplate(
    @Body() body: { tenantId: string; templateId: string },
    @Request() req,
  ) {
    return this.templatesService.selectTemplate(
      body.tenantId,
      body.templateId,
      req.user.sub,
    );
  }
}
```

### Step 2.4: Create Bootstrap Service

**File: `backend/src/crm/core/bootstrap.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CRMBootstrapService {
  constructor(private prisma: PrismaService) {}

  async getTenantCRMConfig(tenantId: string) {
    const config = await this.prisma.tenantCRMConfig.findUnique({
      where: { tenantId },
      include: {
        template: {
          select: {
            name: true,
            slug: true,
            industryType: true,
          },
        },
      },
    });

    if (!config) {
      return null; // First-time user
    }

    return {
      templateId: config.templateId,
      templateName: config.template.name,
      templateSlug: config.template.slug,
      enabledModules: config.enabledModules,
      permissionsMatrix: config.permissionsMatrix,
      dashboardLayout: config.dashboardLayout,
      canChangeTemplate: config.canChangeTemplate,
    };
  }
}
```

### Step 2.5: Create Records Service

**File: `backend/src/crm/records/records.service.ts`**

```typescript
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async createRecord(
    tenantId: string,
    moduleSlug: string,
    data: any,
    userId: string,
  ) {
    // Validate fields
    const fields = await this.prisma.cRMModuleField.findMany({
      where: { tenantId, moduleSlug },
    });

    const validatedData = this.validateFieldData(data, fields);

    // Generate record number
    const recordNumber = await this.generateRecordNumber(
      tenantId,
      moduleSlug,
    );

    // Create record
    const record = await this.prisma.cRMRecord.create({
      data: {
        tenantId,
        moduleSlug,
        data: validatedData,
        recordNumber,
        ownerUserId: userId,
        createdByUserId: userId,
      },
    });

    return record;
  }

  async getRecords(
    tenantId: string,
    moduleSlug: string,
    filters?: any,
  ) {
    return this.prisma.cRMRecord.findMany({
      where: {
        tenantId,
        moduleSlug,
        isDeleted: false,
        ...filters,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRecord(
    recordId: string,
    tenantId: string,
    data: any,
    userId: string,
  ) {
    // Verify ownership
    const record = await this.prisma.cRMRecord.findFirst({
      where: { id: recordId, tenantId },
    });

    if (!record) {
      throw new ForbiddenException('Record not found');
    }

    return this.prisma.cRMRecord.update({
      where: { id: recordId },
      data: {
        data: { ...record.data, ...data },
        updatedByUserId: userId,
      },
    });
  }

  private validateFieldData(data: any, fields: any[]) {
    // TODO: Implement field validation based on field type and rules
    return data;
  }

  private async generateRecordNumber(
    tenantId: string,
    moduleSlug: string,
  ): Promise<string> {
    const count = await this.prisma.cRMRecord.count({
      where: { tenantId, moduleSlug },
    });

    const prefix = moduleSlug.toUpperCase().slice(0, 3);
    const number = String(count + 1).padStart(6, '0');

    return `${prefix}-${number}`;
  }
}
```

### Step 2.6: Create CRM Module Registration

**File: `backend/src/crm/crm.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesService } from './templates/templates.service';
import { TemplatesController } from './templates/templates.controller';
import { CRMBootstrapService } from './core/bootstrap.service';
import { RecordsService } from './records/records.service';
import { RecordsController } from './records/records.controller';

@Module({
  providers: [
    PrismaService,
    TemplatesService,
    CRMBootstrapService,
    RecordsService,
  ],
  controllers: [TemplatesController, RecordsController],
  exports: [TemplatesService, CRMBootstrapService, RecordsService],
})
export class CRMModule {}
```

### Step 2.7: Register in App Module

**File: `backend/src/app.module.ts`**

```typescript
import { CRMModule } from './crm/crm.module';

@Module({
  imports: [
    // ... existing imports
    CRMModule,
  ],
})
export class AppModule {}
```

### Step 2.8: Seed Templates

Create a seed script:

**File: `backend/prisma/seed-crm-templates.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
import { hospitalCRMTemplate } from '../src/crm/templates/seeders/hospital.template';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CRM templates...');

  await prisma.cRMTemplate.upsert({
    where: { slug: hospitalCRMTemplate.slug },
    create: hospitalCRMTemplate,
    update: hospitalCRMTemplate,
  });

  console.log('✅ CRM templates seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run the seed:**

```bash
npx ts-node backend/prisma/seed-crm-templates.ts
```

---

## 🎨 PHASE 3: FRONTEND BOOTSTRAP (Day 6-8)

### Step 3.1: Create CRM App Structure

```bash
cd components/apps
mkdir -p crm/{bootstrap,workspace,modules,fields,hooks,styles}
```

### Step 3.2: Create CRM Context

**File: `components/apps/crm/hooks/useCRMContext.ts`**

```typescript
import { createContext, useContext, useState } from 'react';

interface CRMContextType {
  tenantId: string;
  userId: string;
  role: string;
  templateId: string | null;
  enabledModules: any[];
  permissions: any;
  setConfig: (config: any) => void;
}

const CRMContext = createContext<CRMContextType | null>(null);

export function CRMProvider({ children, initialConfig }) {
  const [config, setConfig] = useState(initialConfig);

  return (
    <CRMContext.Provider value={{ ...config, setConfig }}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRMContext() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRMContext must be used within CRMProvider');
  }
  return context;
}
```

### Step 3.3: Create Bootstrap Component

**File: `components/apps/crm/bootstrap/CRMBootstrap.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { useAuthContext } from '../../../../context/AuthContext';
import TemplateSelectionScreen from './TemplateSelectionScreen';
import CRMWorkspace from '../workspace/CRMWorkspace';
import { CRMProvider } from '../hooks/useCRMContext';

export default function CRMBootstrap() {
  const { user, currentTenantId, role } = useAuthContext();
  const [crmConfig, setCRMConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCRMConfig() {
      try {
        const response = await fetch(
          `/api/crm/config/${currentTenantId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('sessionToken')}`,
            },
          }
        );

        if (response.ok) {
          const config = await response.json();
          setCRMConfig(config);
        } else {
          setCRMConfig(null); // First-time user
        }
      } catch (error) {
        console.error('Failed to load CRM config:', error);
        setCRMConfig(null);
      } finally {
        setLoading(false);
      }
    }

    loadCRMConfig();
  }, [currentTenantId]);

  if (loading) {
    return <div className="crm-loading">Loading CRM...</div>;
  }

  if (!crmConfig || !crmConfig.templateId) {
    return (
      <TemplateSelectionScreen
        tenantId={currentTenantId}
        onTemplateSelected={(config) => setCRMConfig(config)}
      />
    );
  }

  return (
    <CRMProvider
      initialConfig={{
        tenantId: currentTenantId,
        userId: user.id,
        role: role,
        ...crmConfig,
      }}
    >
      <CRMWorkspace />
    </CRMProvider>
  );
}
```

### Step 3.4: Create Template Selection Screen

**File: `components/apps/crm/bootstrap/TemplateSelectionScreen.tsx`**

```typescript
import { useState, useEffect } from 'react';
import styles from '../styles/TemplateSelection.module.css';

export default function TemplateSelectionScreen({ tenantId, onTemplateSelected }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    async function loadTemplates() {
      const response = await fetch('/api/crm/templates', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sessionToken')}`,
        },
      });

      const data = await response.json();
      setTemplates(data);
      setLoading(false);
    }

    loadTemplates();
  }, []);

  async function selectTemplate(templateId: string) {
    setSelecting(true);

    try {
      const response = await fetch('/api/crm/templates/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sessionToken')}`,
        },
        body: JSON.stringify({ tenantId, templateId }),
      });

      if (response.ok) {
        const config = await response.json();
        onTemplateSelected(config);
      } else {
        alert('Failed to select template');
      }
    } catch (error) {
      console.error('Error selecting template:', error);
      alert('Error selecting template');
    } finally {
      setSelecting(false);
    }
  }

  if (loading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Choose Your CRM Template</h1>
        <p>Select the template that best fits your business needs</p>
      </div>

      <div className={styles.templatesGrid}>
        {templates.map((template) => (
          <div
            key={template.id}
            className={styles.templateCard}
            onClick={() => !selecting && selectTemplate(template.id)}
          >
            <div className={styles.icon}>
              <img src={template.iconUrl} alt={template.name} />
            </div>
            <h3>{template.name}</h3>
            <p>{template.description}</p>
            <span className={styles.badge}>{template.industryType}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 3.5: Create CRM Entry Point

**File: `components/apps/crm/index.tsx`**

```typescript
import CRMBootstrap from './bootstrap/CRMBootstrap';

export default function CRMProApp() {
  return <CRMBootstrap />;
}
```

---

## 📊 PHASE 4: TESTING & VALIDATION (Day 9-10)

### Step 4.1: Test Template Selection

1. Login to Alphery OS
2. Open CRM app
3. Verify template selection screen appears
4. Select "Hospital CRM"
5. Verify redirect to CRM workspace

### Step 4.2: Verify Database

```sql
-- Check tenant_crm_configs table
SELECT * FROM tenant_crm_configs WHERE tenant_id = 'your-tenant-id';

-- Check crm_module_fields
SELECT * FROM crm_module_fields WHERE tenant_id = 'your-tenant-id';
```

### Step 4.3: Test API Endpoints

```bash
# Get templates
curl http://localhost:10000/api/crm/templates \
  -H "Authorization: Bearer YOUR_TOKEN"

# Select template
curl -X POST http://localhost:10000/api/crm/templates/select \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"tenantId": "xxx", "templateId": "yyy"}'
```

---

## 🎯 NEXT PHASES (Future Implementation)

### Phase 5: Module Renderer (Week 3)
- Dynamic table view
- Dynamic form generator
- Field components

### Phase 6: Workflow Engine (Week 4)
- Trigger evaluation
- Action execution
- Email integration

### Phase 7: Dashboard Builder (Week 5)
- Widget system
- Drag-drop layout
- Data aggregation

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Phase 1: Database schema updated and migrated
- [ ] Phase 2: Backend services created
- [ ] Templates seeded in database
- [ ] Phase 3: Frontend bootstrap created
- [ ] CRM app registered in OS app launcher
- [ ] Template selection tested
- [ ] Multi-tenant isolation verified
- [ ] OS authentication unchanged
- [ ] Role-based permissions working

---

## 🚨 CRITICAL REMINDERS

1. **Never modify OS core files**
2. **All CRM queries must include `tenantId` filter**
3. **Use existing OS authentication context**
4. **CRM permissions are separate from OS permissions**
5. **Template selection is one-time only (unless explicitly allowed)**

---

## 📞 TROUBLESHOOTING

### Issue: Template selection fails
**Solution:** Check if user has admin role in tenant

### Issue: Fields not appearing
**Solution:** Verify `seedModuleFields()` ran successfully

### Issue: Records not saving
**Solution:** Check `validateFieldData()` implementation

---

**Ready to build? Start with Phase 1! 🚀**
