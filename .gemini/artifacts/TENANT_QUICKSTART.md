# Quick Start: Creating Tenants

## Using the API (Recommended for Production)

### 1. Create a New Tenant
```bash
curl -X POST https://alphery-os-backend.onrender.com/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "subdomain": "testco",
    "plan": "free",
    "adminEmail": "admin@testco.com",
    "adminName": "Test Admin"
  }'
```

### 2. List All Tenants
```bash
curl https://alphery-os-backend.onrender.com/tenants
```

### 3. Get Tenant by Subdomain
```bash
curl https://alphery-os-backend.onrender.com/tenants/subdomain/testco
```

---

## Using Browser Console (Quick Test)

Open your browser console on `https://alphery-os.vercel.app` and run:

```javascript
// Create a new tenant
fetch('https://alphery-os-backend.onrender.com/tenants', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Test Company',
    subdomain: 'mytestco',
    plan: 'pro',
    adminEmail: 'admin@mytestco.com',
    adminName: 'Test User'
  })
})
.then(r => r.json())
.then(data => console.log('Created Tenant:', data));
```

---

## Example: Real-World Onboarding

**Scenario:** You acquire a new client "Acme Corporation"

**Step 1:** Create their tenant
```bash
curl -X POST https://alphery-os-backend.onrender.com/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "subdomain": "acme",
    "plan": "enterprise",
    "adminEmail": "ceo@acmecorp.com",
    "adminName": "Jane Smith"
  }'
```

**Response:**
```json
{
  "tenant": {
    "id": "clx789xyz",
    "name": "Acme Corporation",
    "subdomain": "acme",
    "plan": "enterprise"
  },
  "adminUser": {
    "id": "usr123abc",
    "email": "ceo@acmecorp.com",
    "tenantId": "clx789xyz"
  }
}
```

**Step 2:** Share credentials with client
- URL: `https://acme.yourcrm.com` (configure DNS)
- Email: `ceo@acmecorp.com`
- They can now use the CRM with their own isolated data

---

## Current Default Tenant

Your CRM currently uses `'default-tenant'` (created by seed script).

**To switch to a real tenant:**
1. Create tenant via API
2. Update frontend code to use new `tenantId`
3. Or implement authentication that extracts `tenantId` from user session

---

## See Full Documentation

Read `MULTI_TENANT_ARCHITECTURE.md` for complete scaling guide.
