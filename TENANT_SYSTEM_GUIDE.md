# 🏢 Operating System ERP - Multi-Tenant Architecture Guide

## 📊 **What is this System?**

Your OS is built like **Odoo**, **Salesforce**, or **Microsoft 365** - a **multi-tenant SaaS ERP** where:
- ✅ One codebase serves multiple companies/organizations (called **Tenants**)
- ✅ Each company has their own isolated data (like having separate databases, but efficient)
- ✅ Users can be members of multiple tenants
- ✅ Real-time collaboration via WebSockets (like Google Docs)

---

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                     PLATFORM LAYER                          │
│  • PlatformUser (Global identity across all tenants)       │
│  • Tenant (Companies/Organizations)                         │
│  • App Catalog (Available apps like CRM, HR, Projects)     │
└─────────────────────────────────────────────────────────────┘
                             │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────┴────────┐  ┌──────┴──────┐  ┌────────┴────────┐
│  Tenant A      │  │  Tenant B   │  │  Tenant C       │
│  (Acme Inc)    │  │ (TechCorp)  │  │ (StartupXYZ)    │
├────────────────┤  ├─────────────┤  ├─────────────────┤
│ • 5 users      │  │ • 20 users  │  │ • 3 users       │
│ • CRM enabled  │  │ • CRM+HR    │  │ • Projects only │
│ • 100 clients  │  │ • 500 tasks │  │ • 10 projects   │
└────────────────┘  └─────────────┘  └─────────────────┘
```

---

## 🔑 **Key Concepts**

### **1. Platform User**
- **Global identity** across the entire system
- Can be member of **multiple tenants** (like having multiple Slack workspaces)
- Has a unique email and `customUid` (e.g., `AU123456`)
- Example: `john@example.com` can belong to both Acme Inc and TechCorp

### **2. Tenant**
- Represents a **company or organization**
- Has an **owner** (the person who created it)
- Has **tenant-specific data** (clients, projects, tasks)
- Can enable/disable **apps** (CRM, HR, Projects, etc.)
- All data is **isolated** - Tenant A cannot see Tenant B's data

### **3. Apps**
- Modular features like **CRM**, **Projects**, **HR**, **Messenger**
- Tenants can **enable** or **disable** apps
- Users can have **per-app permissions** (read, write, delete)

### **4. Multi-Tenancy in Database**
Every ERP record (Client, Project, Task, etc.) has a `tenantId`:
```sql
SELECT * FROM clients WHERE tenant_id = 'tenant-abc-123';
```
This ensures **data isolation** - queries automatically filter by tenant.

---

## 🚀 **How to Create a New Tenant**

You have two methods:

### **Method 1: Using the Backend API (Recommended)**

#### **Step 1: Get a God Mode Token**
First, you need an authenticated user with `isGod = true` permission.

#### **Step 2: Call the Platform API**
```bash
POST http://localhost:10000/platform/tenants
Headers:
  Authorization: Bearer <your-firebase-token>
  
Body:
{
  "name": "Acme Corporation",
  "ownerEmail": "john@acmecorp.com",
  "subdomain": "acme" // Optional: For future subdomain routing
}
```

**What this does:**
1. ✅ Creates a new tenant
2. ✅ Assigns the owner (user must exist in `platform_users`)
3. ✅ Adds owner as tenant member with `owner` role
4. ✅ Enables all **core apps** (settings, messenger, etc.)
5. ✅ Returns the new tenant object

#### **Example Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Acme Corporation",
  "subdomain": "acme",
  "ownerUserId": "123e4567-e89b-12d3-a456-426614174000",
  "plan": "free",
  "isActive": true,
  "createdAt": "2026-02-11T02:00:00Z"
}
```

---

### **Method 2: Test via Prisma Studio (Quick Testing)**

#### **Step 1: Start Prisma Studio**
```bash
cd backend
npx prisma studio
```

This opens a GUI at `http://localhost:5555`

#### **Step 2: Create Manually**
1. Go to **`Tenant`** table → Click **Add record**
2. Fill in:
   - **name**: "My Test Company"
   - **ownerUserId**: (Copy an existing PlatformUser ID)
   - **plan**: "free"
   - **isActive**: true
3. Click **Save**

---

## 🔐 **How Authentication Works**

### **Login Flow:**
```
1. User logs in with Firebase (email/password)
   ↓
2. Backend creates/finds PlatformUser by firebaseUid
   ↓
3. Frontend loads user's tenant memberships
   ↓
4. User selects which tenant to work in
   ↓
5. All API calls include tenantId from JWT or context
```

### **Current State:**
- ✅ Firebase authentication working
- ✅ PlatformUser creation  working
- ⚠️ **Tenant selection UI** not fully implemented (uses first available tenant)

---

## 📱 **How Apps Work in Your OS**

Your OS has **two app systems** (legacy + new):

### **1. Desktop Apps (Legacy - apps.config.js)**
- These are the apps you see on your desktop (Chrome, Files, Settings)
- Located in: `/apps.config.js`
- Rendered by: `components/screen/desktop.js`

### **2. ERP Apps (New - Backend Apps table)**
- These are business apps (CRM, HR, Projects)
- Stored in database: `apps` table  
- Controlled per-tenant in: `tenant_apps` table

### **Integration Strategy:**
```javascript
// Future: Merge both systems
const desktopApps = await getDesktopApps(userId);
const erpApps = await getTenantApps(tenantId);
const allApps = [...desktopApps, ...erpApps];
```

---

## 🎛️ **Managing Tenants**

### **List All Tenants**
```bash
GET http://localhost:10000/platform/tenants
# Requires: God mode token
```

### **Get Specific Tenant**
```bash
GET http://localhost:10000/tenants/:tenantId
# Requires: Member of that tenant
```

### **Get Tenant Members**
```bash
GET http://localhost:10000/tenants/:tenantId/users
```

### **Invite User to Tenant**
```bash
POST http://localhost:10000/tenants/:tenantId/users/invite
Body:
{
  "email": "newuser@example.com",
  "role": "member"
}
```

This creates an **Invitation** with a unique token. Email the user the signup link:
```
https://yourapp.com/invite/{token}
```

---

## 🔧 **How Data Isolation Works**

### **Example: Creating a Client in CRM**

**Bad (Insecure):**
```typescript
// ❌ NO tenant filtering - security issue!
const clients = await prisma.client.findMany();
```

**Good (Secure):**
```typescript
// ✅ Always filter by tenantId
const tenantId = req.user.tenantId; // From JWT
const clients = await prisma.client.findMany({
  where: { tenantId }
});
```

### **Auto-Protection with TenantGuard**
```typescript
@Controller('clients')
@UseGuards(JwtAuthGuard, TenantGuard) // ← Enforces tenant check
export class ClientsController {
  @Get()
  async getClients(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.clientsService.findAll(tenantId);
  }
}
```

---

## 🔥 **Real-Time Collaboration**

When User A creates a CRM client, User B sees it instantly:

### **Backend (broadcasts change):**
```typescript
async createClient(tenantId: string, data: any) {
  const client = await this.prisma.client.create({ data });
  
  // Broadcast to all users in this tenant
  this.realtimeGateway.broadcast(
    `tenant:${tenantId}`,
    'client:created',
    client
  );
  
  return client;
}
```

### **Frontend (listens for changes):**
```typescript
socket.on('client:created', (newClient) => {
  setClients([...clients, newClient]); // Update UI instantly
});
```

---

## 📊 **Database Schema Summary**

```sql
PlatformUser (Global)
  ├── TenantUser (Membership)
  │     ├── Tenant (Organization)
  │     │     ├── Client (CRM)
  │     │     ├── Project (PM)
  │     │     └── Task (Tasks)
  │     └── UserAppPermission
  └── Invitation
```

---

## 🎯 **Common Use Cases**

### **1. Multi-Company Freelancer**
- User: `john@example.com`
- Tenant A: "John's Agency" (owner)
- Tenant B: "Client Corp" (member)
- John switches between tenants in the UI

### **2. Enterprise Department**
- Tenant: "Acme Corp"
- Sales Team: Access to CRM app
- Dev Team: Access to Projects app
- HR Team: Access to HR app
- Permissions managed via `UserAppPermission`

### **3. Startup Growth**
- Start: Free plan, 3 users, CRM only
- Growth: Upgrade to Pro, add 10 users, enable HR + Projects
- Enterprise: Custom apps, 100+ users, dedicated support

---

## 🎓 **Next Steps for You**

### **Phase 1: Complete Tenant UI**
- [ ] Add tenant switcher in navbar (like Slack workspace switcher)
- [ ] Settings page to create new tenant
- [ ] Invite users UI

### **Phase 2: App Store**
- [ ] Enable/disable apps from Settings
- [ ] Per-user app permissions
- [ ] App usage analytics

### **Phase 3: Advanced Features**
- [ ] Subdomain routing (`acme.yourapp.com`)
- [ ] Billing integration (Stripe)
- [ ] Custom roles per tenant
- [ ] White-labeling

---

## 💡 **Tips**

### **God Mode vs Normal User**
- **God Mode** (`isGod: true`): Platform owner, can see all tenants, manage apps
- **Tenant Owner**: Can manage their tenant, invite users, enable apps
- **Member**: Can use enabled apps, cannot change tenant settings

### **Testing Locally**
1. Start backend: `cd backend && npm run start:dev`
2. Check `http://localhost:10000/platform/tenants` (needs auth)
3. Use Prisma Studio to see data: `npx prisma studio`

---

## 🤝 **Questions?**

**Q: Can a user be in multiple tenants?**  
A: Yes! Check `TenantUser` table - one user can have multiple memberships.

**Q: How do I delete a tenant?**  
A: `DELETE /platform/tenants/:id` (God mode only). This cascades and deletes all related data.

**Q: Can I customize apps per tenant?**  
A: Yes! Each `TenantApp` has a `settings` JSON field for tenant-specific configuration.

---

**You're building production-grade SaaS architecture! 🚀**
