# ALPHERY ACCESS - ENTERPRISE SAAS ARCHITECTURE SPECIFICATION

> **Status:** Production-Ready Blueprint  
> **Target:** Multi-Tenant ERP Platform (Odoo/Zoho Class)  
> **Authority Levels:** Platform Owner → Tenant Admin → Tenant Employee

---

## 📐 SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                     ALPHERY PLATFORM LAYER                       │
│                         (God Mode)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Platform    │    │   Tenant     │    │  Platform    │      │
│  │  Owners      │    │  Registry    │    │  Apps        │      │
│  │  Management  │    │              │    │  Catalog     │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TENANT ISOLATION LAYER                      │
│                   (Multi-Tenant Boundary)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
        ┌────────────┐ ┌────────────┐ ┌────────────┐
        │  Tenant A  │ │  Tenant B  │ │  Tenant N  │
        └────────────┘ └────────────┘ └────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TENANT RUNTIME LAYER                          │
│                  (Tenant Admin Controls)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  User        │    │  Enabled     │    │  Employee    │      │
│  │  Management  │    │  Apps        │    │  Permissions │      │
│  │              │    │  (CRM, ERP)  │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EMPLOYEE ACCESS LAYER                         │
│                  (Scoped App Visibility)                         │
├─────────────────────────────────────────────────────────────────┤
│  Employee sees ONLY:                                             │
│  • Apps tenant has enabled                                       │
│  • Apps they personally have permission to use                   │
│  • Data scoped to their tenant (enforced at DB level)           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                          │
│              (Firebase - Identity ONLY)                          │
├─────────────────────────────────────────────────────────────────┤
│  Firebase validates:                                             │
│  ✓ firebase_uid exists                                          │
│  ✓ Token is valid                                               │
│                                                                   │
│  Backend resolves authorization:                                 │
│  1. Extract firebase_uid from JWT                               │
│  2. Query platform_users → get internal user_id                │
│  3. Check tenant_users → determine tenant_id + role            │
│  4. Apply guards: PlatformGuard / TenantGuard / AppGuard       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA (PostgreSQL)

### **Core Principle:** UUID-Based, Email is NEVER a Key

```sql
-- ═══════════════════════════════════════════════════════════
-- PLATFORM LAYER TABLES
-- ═══════════════════════════════════════════════════════════

-- Platform Users: The source of truth for all identities
CREATE TABLE platform_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,  -- From Firebase Auth
    email VARCHAR(255) NOT NULL,                -- For display only
    display_name VARCHAR(255),
    photo_url TEXT,
    is_god BOOLEAN DEFAULT FALSE,               -- Platform owner flag
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    CONSTRAINT unique_email_case_insensitive UNIQUE (LOWER(email))
);

CREATE INDEX idx_platform_users_firebase_uid ON platform_users(firebase_uid);
CREATE INDEX idx_platform_users_email_lower ON platform_users(LOWER(email));
CREATE INDEX idx_platform_users_is_god ON platform_users(is_god) WHERE is_god = TRUE;

-- Tenants: Organizations/Workspaces
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(63) UNIQUE,               -- For future custom domains
    owner_user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE RESTRICT,
    plan VARCHAR(50) DEFAULT 'free',            -- free, pro, enterprise
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_owner ON tenants(owner_user_id);
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain) WHERE subdomain IS NOT NULL;
CREATE INDEX idx_tenants_is_active ON tenants(is_active) WHERE is_active = TRUE;

-- Apps Catalog: All available apps in the platform
CREATE TABLE apps (
    id VARCHAR(50) PRIMARY KEY,                 -- e.g., 'crm-pro', 'messenger'
    code VARCHAR(50) UNIQUE NOT NULL,           -- programmatic identifier
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    category VARCHAR(50),                       -- crm, hr, finance, utility
    is_core BOOLEAN DEFAULT FALSE,              -- Core apps (settings, app-store)
    is_active BOOLEAN DEFAULT TRUE,
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apps_category ON apps(category);
CREATE INDEX idx_apps_is_core ON apps(is_core) WHERE is_core = TRUE;

-- Tenant-App Association: Which apps a tenant has enabled
CREATE TABLE tenant_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    app_id VARCHAR(50) NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',                -- App-specific config per tenant
    enabled_at TIMESTAMPTZ DEFAULT NOW(),
    enabled_by_user_id UUID REFERENCES platform_users(id),
    
    CONSTRAINT unique_tenant_app UNIQUE (tenant_id, app_id)
);

CREATE INDEX idx_tenant_apps_tenant ON tenant_apps(tenant_id);
CREATE INDEX idx_tenant_apps_enabled ON tenant_apps(tenant_id, enabled) WHERE enabled = TRUE;

-- ═══════════════════════════════════════════════════════════
-- TENANT LAYER TABLES
-- ═══════════════════════════════════════════════════════════

-- Tenant Users: Bridge between platform users and tenants
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,                  -- owner, admin, member, viewer
    is_active BOOLEAN DEFAULT TRUE,
    invited_by_user_id UUID REFERENCES platform_users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_user UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_role ON tenant_users(tenant_id, role);
CREATE INDEX idx_tenant_users_active ON tenant_users(tenant_id, is_active) WHERE is_active = TRUE;

-- User App Permissions: Fine-grained app access per user
CREATE TABLE user_app_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_user_id UUID NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
    app_id VARCHAR(50) NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{"read": true, "write": false, "delete": false}',
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by_user_id UUID REFERENCES platform_users(id),
    
    CONSTRAINT unique_user_app_permission UNIQUE (tenant_user_id, app_id)
);

CREATE INDEX idx_user_app_perms_tenant_user ON user_app_permissions(tenant_user_id);
CREATE INDEX idx_user_app_perms_app ON user_app_permissions(app_id);

-- Invitations: Pending tenant invitations
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    token VARCHAR(128) UNIQUE NOT NULL,
    invited_by_user_id UUID NOT NULL REFERENCES platform_users(id),
    status VARCHAR(20) DEFAULT 'pending',       -- pending, accepted, expired, revoked
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(LOWER(email));
CREATE INDEX idx_invitations_tenant_status ON invitations(tenant_id, status);

-- ═══════════════════════════════════════════════════════════
-- AUDIT & SECURITY
-- ═══════════════════════════════════════════════════════════

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES platform_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,               -- CREATE_USER, ENABLE_APP, etc.
    entity_type VARCHAR(100),                   -- tenant, user, app
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
```

### **Migration Notes:**
- `email` is REMOVED from all foreign key relationships
- All existing Firebase `uid` must be mapped to `firebase_uid`
- Firestore `users` collection documents keyed by email → migrate to `platform_users` table
- `parentUserId` concept → replaced with `tenant_users.role` hierarchy

---

## 🔐 AUTHENTICATION → AUTHORIZATION FLOW

### **Separation of Concerns**

```
┌────────────────────────────────────────────────────────────────┐
│  AUTHENTICATION (Firebase)                                      │
│  • Validates identity via Google Sign-In / Email                │
│  • Issues JWT with firebase_uid                                │
│  • NO authorization logic                                       │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│  AUTHORIZATION (Backend NestJS)                                 │
│  • Resolves firebase_uid → user_id                            │
│  • Determines tenant membership                                │
│  • Enforces role-based access                                  │
│  • Applies app-level permissions                               │
└────────────────────────────────────────────────────────────────┘
```

### **Step-by-Step Flow**

#### **1. User Logs In (Frontend)**
```typescript
// Frontend: pages/_app.tsx or AuthContext
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  
  // Get Firebase ID Token (this is NOT stored, just verified)
  const idToken = await credential.user.getIdToken();
  
  // Send to backend for session creation
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  
  const { sessionToken, userData } = await response.json();
  
  // Store OUR session token (not Firebase token)
  localStorage.setItem('session_token', sessionToken);
  
  return userData;
};
```

#### **2. Backend Validates Firebase Token**
```typescript
// Backend: src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  async validateFirebaseToken(idToken: string) {
    try {
      // Verify Firebase token signature and expiry
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const firebaseUid = decodedToken.uid;
      const email = decodedToken.email;
      
      // Lookup or create platform user
      let platformUser = await this.prisma.platform_users.findUnique({
        where: { firebase_uid: firebaseUid }
      });
      
      if (!platformUser) {
        // First-time login: Auto-create platform user
        platformUser = await this.prisma.platform_users.create({
          data: {
            firebase_uid: firebaseUid,
            email: email,
            display_name: decodedToken.name || email.split('@')[0],
            photo_url: decodedToken.picture,
            is_god: email === 'alpherymail@gmail.com' // Hardcoded god check
          }
        });
      }
      
      // Update last login
      await this.prisma.platform_users.update({
        where: { id: platformUser.id },
        data: { last_login_at: new Date() }
      });
      
      // Issue OUR session token (JWT with user_id, not firebase_uid)
      const sessionToken = this.jwtService.sign({
        sub: platformUser.id,
        email: platformUser.email,
        is_god: platformUser.is_god
      });
      
      return { sessionToken, platformUser };
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}
```

#### **3. Authorization Guards**

```typescript
// Backend: src/auth/guards/platform.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PlatformGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  
  async canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) return false;
    
    try {
      const payload = this.jwtService.verify(token);
      request.user = payload; // { sub: user_id, is_god: boolean }
      
      // Platform Guard: Only gods pass
      return payload.is_god === true;
    } catch {
      return false;
    }
  }
}
```

```typescript
// Backend: src/auth/guards/tenant.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}
  
  async canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub; // From JWT
    const tenantId = request.headers['x-tenant-id'] || request.body.tenantId;
    
    if (!userId || !tenantId) return false;
    
    // Check if user belongs to this tenant
    const membership = await this.prisma.tenant_users.findUnique({
      where: {
        tenant_id_user_id: { tenant_id: tenantId, user_id: userId }
      }
    });
    
    if (!membership || !membership.is_active) return false;
    
    // Inject tenant context into request
    request.tenantId = tenantId;
    request.tenantRole = membership.role;
    
    return true;
  }
}
```

```typescript
// Backend: src/auth/guards/app-permission.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AppPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}
  
  async canActivate(context: ExecutionContext): boolean {
    const requiredApp = this.reflector.get<string>('app', context.getHandler());
    if (!requiredApp) return true; // No specific app required
    
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    const tenantId = request.tenantId; // Injected by TenantGuard
    
    // God mode bypasses all app restrictions
    if (request.user?.is_god) return true;
    
    // Check if tenant has this app enabled
    const tenantApp = await this.prisma.tenant_apps.findUnique({
      where: {
        tenant_id_app_id: { tenant_id: tenantId, app_id: requiredApp }
      }
    });
    
    if (!tenantApp || !tenantApp.enabled) return false;
    
    // Check if user has permission to this app
    const tenantUser = await this.prisma.tenant_users.findUnique({
      where: {
        tenant_id_user_id: { tenant_id: tenantId, user_id: userId }
      },
      include: {
        user_app_permissions: {
          where: { app_id: requiredApp }
        }
      }
    });
    
    // If user is tenant owner/admin, auto-grant
    if (['owner', 'admin'].includes(tenantUser?.role)) return true;
    
    // Otherwise, check explicit permissions
    return tenantUser?.user_app_permissions.length > 0;
  }
}
```

#### **4. Usage in Controllers**

```typescript
// Backend: src/crm/clients.controller.ts
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { AppPermissionGuard } from '../auth/guards/app-permission.guard';
import { RequireApp } from '../auth/decorators/require-app.decorator';

@Controller('clients')
@UseGuards(TenantGuard, AppPermissionGuard)
@RequireApp('crm-pro')  // Custom decorator
export class ClientsController {
  @Get()
  async findAll(@Request() req) {
    const tenantId = req.tenantId; // Injected by TenantGuard
    // All queries automatically scoped to tenantId
    return this.clientsService.findAll(tenantId);
  }
  
  @Post()
  async create(@Request() req, @Body() createDto) {
    return this.clientsService.create(req.tenantId, createDto);
  }
}
```

---

## 🎯 PERMISSION RESOLUTION LOGIC

### **Decision Tree**

```
User requests access to App X in Tenant Y
│
├─ Is user God? ───────────────────────────────→ ✅ ALLOW
│
├─ Does user belong to Tenant Y? ──NO→ ❌ DENY
│   └─ YES ↓
│
├─ Is Tenant Y subscribed to App X? ──NO→ ❌ DENY
│   └─ YES ↓
│
├─ Is user Owner/Admin in Tenant Y? ───────────→ ✅ ALLOW
│   └─ NO ↓
│
├─ Does user have explicit permission to App X? → ✅ ALLOW
│   └─ NO ↓
│
└─ ❌ DENY
```

### **Pseudocode**

```typescript
function canAccessApp(userId: UUID, tenantId: UUID, appId: string): boolean {
  // 1. God mode
  const user = getUser(userId);
  if (user.is_god) return true;
  
  // 2. Tenant membership
  const membership = getTenantUser(tenantId, userId);
  if (!membership || !membership.is_active) return false;
  
  // 3. Tenant has app enabled
  const tenantApp = getTenantApp(tenantId, appId);
  if (!tenantApp || !tenantApp.enabled) return false;
  
  // 4. Role-based auto-grant
  if (['owner', 'admin'].includes(membership.role)) return true;
  
  // 5. Explicit permission
  const permission = getUserAppPermission(membership.id, appId);
  return permission !== null;
}
```

---

## 🔄 MIGRATION STRATEGY

### **Phase 1: Parallel Systems (Week 1-2)**
1. Keep Firestore running as-is
2. Deploy new PostgreSQL schema
3. Create migration scripts:
   ```bash
   npm run migrate:firestore-to-postgres
   ```
4. Dual-write: All changes go to both Firestore AND Postgres

### **Phase 2: Data Validation (Week 3)**
1. Run consistency checks
2. Verify UUID mappings
3. Test auth flows on staging with Postgres

### **Phase 3: Cutover (Week 4)**
1. Feature flag: `USE_POSTGRES_AUTH=true`
2. Monitor error rates
3. Rollback capability: `USE_POSTGRES_AUTH=false`

### **Phase 4: Cleanup (Week 5)**
1. Remove Firestore auth logic
2. Delete old Firebase documents
3. Update documentation

### **Migration Script Example**

```typescript
// scripts/migrate-firestore-to-postgres.ts
import { db } from '../config/firebase';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  const usersSnapshot = await db.collection('users').get();
  
  for (const doc of usersSnapshot.docs) {
    const firestoreData = doc.data();
    const email = doc.id; // Old system: email was the key
    
    // Create platform user
    const platformUser = await prisma.platform_users.upsert({
      where: { email: email.toLowerCase() },
      update: {},
      create: {
        firebase_uid: firestoreData.uid || `migrated-${Date.now()}`,
        email: email.toLowerCase(),
        display_name: firestoreData.displayName,
        photo_url: firestoreData.photoURL,
        is_god: ['alpherymail@gmail.com', 'aksnetlink@gmail.com'].includes(email)
      }
    });
    
    // Create tenant if user is TENANT role
    if (firestoreData.role === 'TENANT') {
      const tenant = await prisma.tenants.create({
        data: {
          name: `${firestoreData.displayName}'s Workspace`,
          owner_user_id: platformUser.id
        }
      });
      
      // Add user to their own tenant
      await prisma.tenant_users.create({
        data: {
          tenant_id: tenant.id,
          user_id: platformUser.id,
          role: 'owner'
        }
      });
    }
    
    // Migrate allowedApps → user_app_permissions
    if (Array.isArray(firestoreData.allowedApps)) {
      // This requires knowing which tenant the user belongs to
      // Handle in Phase 2 after manual tenant assignment
    }
    
    console.log(`✅ Migrated: ${email}`);
  }
}

migrate().then(() => console.log('Migration complete'));
```

---

## ✅ DO's AND ❌ DON'Ts

### **✅ MANDATORY DO's**

1. **Always use UUID for relationships**
   ```typescript
   ✅ user_id: UUID
   ❌ user_email: string
   ```

2. **Enforce tenant isolation at database level**
   ```sql
   ✅ WHERE tenant_id = $1
   ❌ Trust client-side tenant selection
   ```

3. **Use role hierarchy for permissions**
   ```
   ✅ owner > admin > member > viewer
   ❌ Flat permission model
   ```

4. **Separate authentication from authorization**
   ```typescript
   ✅ Firebase validates identity → Backend authorizes actions
   ❌ Firebase token decides app access
   ```

5. **Audit all sensitive actions**
   ```typescript
   ✅ Log: user X enabled app Y for tenant Z
   ❌ Silent permission changes
   ```

### **❌ STRICT DON'Ts**

1. **NEVER use email as a foreign key**
   ```sql
   ❌ REFERENCES users(email)
   ✅ REFERENCES platform_users(id)
   ```

2. **NEVER trust client-provided tenant_id**
   ```typescript
   ❌ const tenantId = req.body.tenantId;
   ✅ const tenantId = await resolveTenantFromUser(userId);
   ```

3. **NEVER mix Firebase auth logic with business logic**
   ```typescript
   ❌ if (firebaseUser.email === 'admin@...') allow();
   ✅ if (platformUser.is_god) allow();
   ```

4. **NEVER create separate backends per tenant**
   ```
   ❌ tenant-a.api.com, tenant-b.api.com
   ✅ api.com with tenant_id header
   ```

5. **NEVER use iframes for app isolation**
   ```
   ❌ <iframe src="/crm?tenant=xyz">
   ✅ Proper route guards and permissions
   ```

---

## 📊 FRONTEND EXPECTATIONS

### **Alphery Access UI Structure**

```typescript
// Frontend: components/apps/alphery_access/AlpheryAccess.tsx
import { useAuth } from '../../../context/AuthContext';
import { useTenants } from '../../../hooks/useTenants';

export default function AlpheryAccess() {
  const { user, userData } = useAuth();
  const { tenants, loading } = useTenants();
  
  // God sees all tenants
  const visibleTenants = userData.is_god 
    ? tenants 
    : tenants.filter(t => t.owner_user_id === user.id);
  
  return (
    <div className="alphery-access-console">
      <Sidebar>
        {userData.is_god && <GodModeIndicator />}
        <NavItem icon="tenants" label="Tenants" />
        <NavItem icon="users" label="Platform Users" />
        <NavItem icon="apps" label="App Catalog" />
        <NavItem icon="audit" label="Audit Logs" />
      </Sidebar>
      
      <MainContent>
        <TenantList tenants={visibleTenants} />
      </MainContent>
    </div>
  );
}
```

### **Dynamic App Sidebar (Per Tenant)**

```typescript
// Frontend: components/base/Sidebar.tsx
import { useApps } from '../../hooks/useApps';

export default function Sidebar({ tenantId }) {
  const { availableApps, loading } = useApps(tenantId);
  
  // Backend returns ONLY apps this user can access in this tenant
  return (
    <nav>
      {availableApps.map(app => (
        <AppIcon key={app.id} app={app} />
      ))}
    </nav>
  );
}
```

```typescript
// Frontend: hooks/useApps.ts
export function useApps(tenantId: string) {
  const { data, loading } = useSWR(`/api/tenants/${tenantId}/apps`, fetcher);
  
  // Backend checks:
  // 1. Is app enabled for tenant?
  // 2. Does user have permission?
  // Returns filtered list
  
  return { availableApps: data || [], loading };
}
```

---

## 🎨 GOD MODE vs TENANT ADMIN vs EMPLOYEE

| Feature | God (Platform Owner) | Tenant Admin | Employee |
|---------|---------------------|--------------|----------|
| See all tenants | ✅ | ❌ | ❌ |
| Create tenants | ✅ | ❌ | ❌ |
| Enable apps for tenant | ✅ | ✅ | ❌ |
| Add users to tenant | ✅ | ✅ | ❌ |
| Assign app permissions | ✅ | ✅ | ❌ |
| View audit logs (all) | ✅ | ✅ (own tenant) | ❌ |
| Access any app (bypass) | ✅ | ❌ | ❌ |
| Use apps (with permission) | ✅ | ✅ | ✅ |

---

## 🚀 IMMEDIATE NEXT STEPS

1. **Review & Approve this Spec** ✅
2. **Create new Prisma schema** → Copy from Database Schema section above
3. **Run migration:** `npx prisma migrate dev --name alphery_access_rebuild`
4. **Implement Auth Service** → Backend auth flow
5. **Build Guards** → PlatformGuard, TenantGuard, AppPermissionGuard
6. **Update Frontend** → New AuthContext with UUID logic
7. **Data Migration Script** → Migrate Firestore → Postgres
8. **Test on Staging**
9. **Deploy with Feature Flag**
10. **Monitor & Rollback if needed**

---

## 📞 SUPPORT & ESCALATION

**Critical Decision Required:**
> Should existing CRM data (`clients`, `projects`, etc.) remain in current schema OR be moved to `tenant_id` scoped tables?

**Recommendation:** Keep existing tables, just ensure ALL queries include `WHERE tenant_id = $1`.

---

**Status:** ✅ Production-Ready Blueprint  
**Last Updated:** 2026-02-07  
**Approved By:** [Pending Stakeholder Sign-Off]
