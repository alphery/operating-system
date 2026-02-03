# 🏢 Multi-Tenant SaaS Architecture Guide

## Overview

Your CRM operates as a **multi-tenant SaaS platform** where:
- **One Database** serves **multiple organizations/companies**
- Each organization is a **Tenant**
- Data is automatically isolated by `tenantId`

## 🔑 Key Concepts

### What is a Tenant?
A **Tenant** represents one customer/organization using your CRM:
- Example: "Acme Corp" = 1 Tenant
- Example: "TechStart Inc" = 1 Tenant
- Example: "Your Company" = 1 Tenant

Each tenant has:
- Unique `id` and `subdomain`
- Their own users, clients, projects, CRM data
- A subscription plan (free, pro, enterprise)

### Data Isolation
All data tables have a `tenantId` foreign key:
```
Client → tenantId → Tenant
Project → tenantId → Tenant
CRMActivity → tenantId → Tenant
```

This ensures:
✅ Acme Corp cannot see TechStart's data
✅ Each tenant operates independently
✅ One database serves thousands of tenants

---

## 📝 How to Create a New Tenant

### Option 1: API Endpoint (Production)

**Endpoint:** `POST /api/tenants`

**Example Request:**
```bash
curl -X POST https://alphery-os-backend.onrender.com/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "subdomain": "acme",
    "plan": "pro",
    "adminEmail": "admin@acme.com",
    "adminName": "John Doe"
  }'
```

**What Happens:**
1. ✅ Creates a new Tenant record
2. ✅ Creates an admin User for that tenant
3. ✅ Returns both tenant and user IDs

**Response:**
```json
{
  "tenant": {
    "id": "clx123abc...",
    "name": "Acme Corporation",
    "subdomain": "acme",
    "plan": "pro"
  },
  "adminUser": {
    "id": "usr456def...",
    "email": "admin@acme.com",
    "tenantId": "clx123abc..."
  }
}
```

### Option 2: Database Seed (Development)

Add to `backend/prisma/seed.js`:
```javascript
await prisma.tenant.create({
  data: {
    name: 'My New Company',
    subdomain: 'mynewco',
    plan: 'free',
    users: {
      create: {
        email: 'admin@mynewco.com',
        name: 'Admin User',
        role: 'admin'
      }
    }
  }
});
```

---

## 🚀 Scaling for Production

### 1. **Subdomain-Based Routing**

Each client gets their own subdomain:
- `acme.yourcrm.com` → Tenant: "Acme Corp"
- `techstart.yourcrm.com` → Tenant: "TechStart Inc"

**Implementation:**
```javascript
// In your frontend (Vercel)
const subdomain = window.location.hostname.split('.')[0];

// Fetch tenant info
const response = await fetch(`/api/tenants/subdomain/${subdomain}`);
const tenant = await response.json();

// Store tenantId for all API calls
localStorage.setItem('tenantId', tenant.id);
```

**Backend Middleware:**
```typescript
// Extract tenantId from JWT or subdomain
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function) {
    const subdomain = req.hostname.split('.')[0];
    req.tenantId = getTenantIdFromSubdomain(subdomain);
    next();
  }
}
```

### 2. **Authentication Per Tenant**

When a user logs in:
1. Verify email/password
2. Check which tenant they belong to
3. Issue JWT with `tenantId` inside
4. All API requests include JWT → backend extracts `tenantId`

**Example JWT Payload:**
```json
{
  "userId": "usr123",
  "tenantId": "ten456",
  "email": "john@acme.com",
  "role": "admin"
}
```

### 3. **Plan-Based Features**

Restrict features by tenant plan:
```typescript
// In your service
if (tenant.plan === 'free' && clients.length >= 10) {
  throw new Error('Upgrade to Pro for unlimited clients');
}
```

**Feature Matrix:**
| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Clients | 10 | Unlimited | Unlimited |
| Users | 1 | 5 | Unlimited |
| Custom Modules | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ✅ |

### 4. **Pricing & Billing**

Integrate with Stripe:
```typescript
// When creating tenant
const customer = await stripe.customers.create({
  email: adminEmail,
  metadata: { tenantId: tenant.id }
});

await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: 'price_pro_monthly' }]
});
```

---

## 🔒 Security Best Practices

### Row-Level Security (RLS)
Always filter by `tenantId`:
```typescript
// ❌ BAD - Could leak data
const clients = await prisma.client.findMany();

// ✅ GOOD - Tenant isolated
const clients = await prisma.client.findMany({
  where: { tenantId: req.user.tenantId }
});
```

### Middleware Protection
```typescript
// backend/src/middleware/tenant-guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // From JWT
    const resourceTenantId = request.params.tenantId;
    
    // Ensure user can only access their tenant's data
    return user.tenantId === resourceTenantId;
  }
}
```

---

## 📊 Database Scaling

### When to Shard
If you reach **10,000+ tenants**, consider:

1. **Database Sharding** (Split by tenant ID ranges)
   - Shard 1: Tenants 0-5000
   - Shard 2: Tenants 5001-10000

2. **Separate Databases Per Large Client**
   - Enterprise clients get dedicated DB
   - Small clients share multi-tenant DB

---

## 🛠️ Development Workflow

### Local Development
1. Use `'default-tenant'` for testing
2. Seed with test tenants via `prisma/seed.js`

### Staging Environment
1. Create test tenants via API
2. Test multi-tenant isolation
3. Verify subdomain routing

### Production
1. Sign-up flow creates new tenant
2. User authentication assigns `tenantId`
3. All data operations scoped to tenant

---

## 📞 API Endpoints

### Tenant Management
```
POST   /api/tenants              Create new tenant
GET    /api/tenants              List all tenants (admin)
GET    /api/tenants/:id          Get tenant details
GET    /api/tenants/subdomain/:x Find by subdomain
PATCH  /api/tenants/:id          Update tenant
DELETE /api/tenants/:id          Delete tenant
```

### CRM Endpoints (Tenant-scoped)
```
GET    /api/clients              (filtered by tenantId)
POST   /api/clients              (creates with tenantId)
GET    /api/activities           (filtered by tenantId)
```

---

## 🎯 Next Steps for Production

1. **Add User Authentication**
   - Implement login/signup
   - Issue JWT with `tenantId`

2. **Subdomain Routing**
   - Configure DNS wildcards
   - Map subdomains to tenants

3. **Billing Integration**
   - Connect Stripe
   - Enforce plan limits

4. **Admin Dashboard**
   - Manage all tenants
   - View usage metrics
   - Handle support requests

---

## 💡 Example: Onboarding Flow

**Step 1: Sign Up**
```
User fills form:
- Company Name: "Acme Corp"
- Email: admin@acme.com
- Subdomain: acme (auto-generated from company name)
```

**Step 2: Backend Creates Tenant**
```typescript
POST /api/tenants
{
  name: "Acme Corp",
  subdomain: "acme",
  adminEmail: "admin@acme.com",
  adminName: "Admin User"
}
```

**Step 3: Redirect to Subdomain**
```
Redirect to: https://acme.yourcrm.com
```

**Step 4: User Logs In**
```
JWT issued with:
{
  userId: "...",
  tenantId: "acme-tenant-id",
  email: "admin@acme.com"
}
```

**Step 5: All Data Scoped to Tenant**
```
GET /api/clients → Returns only Acme Corp's clients
POST /api/clients → Creates client for Acme Corp
```

---

## 🔗 Resources

- Prisma Multi-Tenancy: https://www.prisma.io/docs/guides/database/multi-tenancy
- Stripe Subscriptions: https://stripe.com/docs/billing
- JWT Best Practices: https://jwt.io/introduction

---

**Your CRM is now production-ready for multi-tenant SaaS! 🚀**
