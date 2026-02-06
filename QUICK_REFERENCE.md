# ALPHERY ACCESS REBUILD - QUICK REFERENCE

## 🎯 Core Changes

| Old (Email-Based) | New (UUID-Based) |
|-------------------|------------------|
| `users` collection keyed by email | `platform_users` table keyed by UUID |
| Firebase token = authorization | Firebase token = identity only |
| `allowedApps` array on user | `user_app_permissions` table |
| Email as FK: `parentUserId: email` | UUID as FK: `userId: UUID` |
| Single-level hierarchy | Platform → Tenant → User |

---

## 🔑 Key Tables

```sql
platform_users   -- All identities (firebase_uid → UUID mapping)
tenants          -- Organizations/workspaces
tenant_users     -- Membership bridge table
apps             -- App catalog
tenant_apps      -- Which apps a tenant has enabled
user_app_permissions -- Fine-grained app access
```

---

## 🛡️ Authorization Flow

```
1. User logs in with Firebase → Get firebase_uid
2. Backend maps firebase_uid → platform_user.id (UUID)
3. Issue session JWT with { sub: UUID, isGod: boolean }
4. Client sends session token (not Firebase token)
5. Guard validates: User → Tenant → App
```

---

## 📝 Usage Examples

### Backend Controller
```typescript
@Controller('clients')
@UseGuards(TenantGuard, AppPermissionGuard)
@RequireApp('crm-pro')
export class ClientsController {
  @Get()
  findAll(@Request() req) {
    const tenantId = req.tenantId; // Injected by TenantGuard
    return this.service.findAll(tenantId);
  }
}
```

### Frontend API Call
```typescript
// Include tenant in header
const clients = await fetch('/api/clients', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'X-Tenant-ID': currentTenantId
  }
});
```

---

## 🚀 Quick Start Commands

```bash
# 1. Deploy new schema
cd backend
npx prisma migrate dev --name alphery_access_init

# 2. Run migration script
npx ts-node scripts/migrate-firestore-to-postgres.ts

# 3. Verify data
npx prisma studio

# 4. Test locally
npm run dev
```

---

## 🔍 Common Queries

**Find all tenants for a user:**
```sql
SELECT t.* FROM tenants t
JOIN tenant_users tu ON t.id = tu.tenant_id
WHERE tu.user_id = $1 AND tu.is_active = true;
```

**Check if user can access app:**
```sql
SELECT 1 FROM tenant_apps ta
JOIN tenant_users tu ON ta.tenant_id = tu.tenant_id
LEFT JOIN user_app_permissions uap ON tu.id = uap.tenant_user_id AND ta.app_id = uap.app_id
WHERE tu.user_id = $1 
  AND ta.tenant_id = $2 
  AND ta.app_id = $3 
  AND ta.enabled = true
  AND (tu.role IN ('owner', 'admin') OR uap.id IS NOT NULL);
```

**List all apps a user can access in a tenant:**
```sql
SELECT DISTINCT a.* FROM apps a
JOIN tenant_apps ta ON a.id = ta.app_id
JOIN tenant_users tu ON ta.tenant_id = tu.tenant_id
LEFT JOIN user_app_permissions uap ON tu.id = uap.tenant_user_id AND a.id = uap.app_id
WHERE tu.user_id = $1 
  AND tu.tenant_id = $2 
  AND ta.enabled = true
  AND (tu.role IN ('owner', 'admin') OR uap.id IS NOT NULL);
```

---

## ⚠️ Critical Rules

1. **NEVER** use email as a foreign key
2. **ALWAYS** validate `tenantId` on backend (use `TenantGuard`)
3. **NEVER** trust client-provided `X-Tenant-ID` without verification
4. **ALWAYS** inject `tenantId` in guards, not from request body
5. **GOD MODE** bypasses all checks (use sparingly)

---

## 📂 File Locations

| File | Purpose |
|------|---------|
| `backend/prisma/schema-alphery-access.prisma` | New database schema |
| `backend/src/auth/auth.service-new.ts` | Firebase → Session token logic |
| `backend/src/auth/guards/index.ts` | PlatformGuard, TenantGuard, AppPermissionGuard |
| `backend/scripts/migrate-firestore-to-postgres.ts` | Migration script |
| `ALPHERY_ACCESS_REBUILD_SPEC.md` | Complete architecture spec |
| `IMPLEMENTATION_CHECKLIST.md` | Step-by-step tasks |

---

## 🎨 Frontend Changes

**Old AuthContext:**
```typescript
const { user, userData } = useAuth();
// userData.allowedApps = ['crm-pro', 'calendar']
```

**New AuthContext:**
```typescript
const { user, session, tenants } = useAuth();
// session.token = JWT with UUID
// tenants = [{ id, name, role }]

// Select active tenant
setActiveTenant(tenants[0].id);

// Fetch apps for active tenant
const apps = await getAvailableApps(activeTenantId);
```

---

## 🆘 Troubleshooting

**Issue:** "Tenant ID required"  
**Fix:** Add `X-Tenant-ID` header or ensure TenantGuard is applied

**Issue:** "App not enabled for your workspace"  
**Fix:** Tenant admin must enable app in Alphery Access

**Issue:** "You do not have permission to access this app"  
**Fix:** Tenant admin must grant explicit permission or promote user to admin

**Issue:** Migration script fails  
**Fix:** Check Firestore connection, verify `approvalStatus` field exists

---

## 📞 Support

**Architecture Questions:** See `ALPHERY_ACCESS_REBUILD_SPEC.md`  
**Implementation Steps:** See `IMPLEMENTATION_CHECKLIST.md`  
**Database Schema:** See `backend/prisma/schema-alphery-access.prisma`

---

**Last Updated:** 2026-02-07  
**Version:** 1.0 (Initial Release)
