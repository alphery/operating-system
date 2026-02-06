# ALPHERY ACCESS REBUILD - IMPLEMENTATION CHECKLIST

**Status:** Ready to Execute  
**Timeline:** 4-6 weeks (with dual-write safety period)  
**Risk Level:** Medium (with rollback capability)

---

## 📋 PHASE 1: FOUNDATION (Week 1)

### Backend Schema
- [ ] **Copy** `schema-alphery-access.prisma` → `schema.prisma`
- [ ] **Run** `npx prisma migrate dev --name alphery_access_init`
- [ ] **Verify** all tables created successfully
- [ ] **Update** `prisma/find-tenant.ts` to use new schema

### Backend Auth Service
- [ ] **Rename** `auth.service-new.ts` → `auth.service.ts` (backup old one)
- [ ] **Import** guards in `auth.module.ts`
- [ ] **Add** JWT configuration in `.env`:
  ```
  JWT_SECRET=<generate-strong-secret>
  JWT_EXPIRES_IN=7d
  ```
- [ ] **Test** Firebase token validation locally

### Guards Implementation
- [ ] **Copy** guards from `guards/index.ts` to proper locations
- [ ] **Register** guards globally in `app.module.ts`:
  ```typescript
  providers: [
    { provide: APP_GUARD, useClass: TenantGuard },
  ]
  ```

---

## 📋 PHASE 2: DATA MIGRATION (Week 2)

### Migration Script
- [ ] **Review** `scripts/migrate-firestore-to-postgres.ts`
- [ ] **Test** on local copy of Firestore data
- [ ] **Run** migration on staging database first
- [ ] **Verify** all users migrated correctly
- [ ] **Check** tenant ownership assignments
- [ ] **Confirm** app permissions seeded

### Validation
- [ ] **Manual check:** Platform users count matches Firestore users
- [ ] **Manual check:** Tenants created for all TENANT role users
- [ ] **Manual check:** Core apps enabled for all tenants
- [ ] **SQL Query:** Verify no duplicate emails
  ```sql
  SELECT email, COUNT(*) FROM platform_users GROUP BY email HAVING COUNT(*) > 1;
  ```

---

## 📋 PHASE 3: BACKEND INTEGRATION (Week 3)

### Update Controllers
- [ ] **CRM Controller** (`src/crm/clients.controller.ts`):
  ```typescript
  @UseGuards(TenantGuard, AppPermissionGuard)
  @RequireApp('crm-pro')
  export class ClientsController { ... }
  ```
- [ ] **All Controllers:** Add `@UseGuards(TenantGuard)` where needed
- [ ] **All Queries:** Inject `WHERE tenant_id = $1` from `req.tenantId`

### Platform APIs (God Mode)
- [ ] **Create** `src/platform/platform.controller.ts`
  - `GET /platform/tenants` (list all tenants)
  - `POST /platform/tenants` (create tenant)
  - `GET /platform/users` (list all platform users)
  - `PATCH /platform/users/:id/god` (promote to god)
- [ ] **Protect** with `@UseGuards(PlatformGuard)`

### Tenant APIs (Admin)
- [ ] **Create** `src/tenant/tenant.controller.ts`
  - `GET /tenants/:id/apps` (list enabled apps)
  - `POST /tenants/:id/apps/:appId` (enable app)
  - `DELETE /tenants/:id/apps/:appId` (disable app)
  - `GET /tenants/:id/users` (list members)
  - `POST /tenants/:id/users/invite` (send invitation)
  - `PATCH /tenants/:id/users/:userId/permissions` (manage permissions)

---

## 📋 PHASE 4: FRONTEND REBUILD (Week 4)

### Auth Context Update
- [ ] **Update** `context/AuthContext.tsx`:
  - Remove email-based logic
  - Use session token instead of Firebase token
  - Store `sessionToken` in localStorage
  - Fetch user tenants on login
- [ ] **Add** tenant selector if user belongs to multiple tenants

### Alphery Access App
- [ ] **Create** `components/apps/alphery_access/AlpheryAccess.tsx`
- [ ] **Implement** God Mode dashboard (if `userData.isGod`)
  - Tenant list with owner info
  - Platform user management
  - App catalog
  - Audit log viewer
- [ ] **Implement** Tenant Admin dashboard (if not god)
  - User management for own tenant
  - App enablement
  - Permission assignment

### Dynamic Sidebar
- [ ] **Update** `components/base/Sidebar.tsx`
- [ ] **Fetch** `/api/tenants/:tenantId/apps/available` (user-specific)
- [ ] **Render** only apps user has permission to access
- [ ] **Hide** disabled apps

### Migration Notice
- [ ] **Show banner:** "We've upgraded to a new permission system!"
- [ ] **Prompt** users to re-login once

---

## 📋 PHASE 5: TESTING & ROLLOUT (Week 5-6)

### Testing Checklist
- [ ] **Test:** God can see all tenants
- [ ] **Test:** Tenant admin can only see their tenant
- [ ] **Test:** Employee can only see permitted apps
- [ ] **Test:** App access correctly denied if:
  - Tenant hasn't enabled app
  - User doesn't have explicit permission
- [ ] **Test:** Tenant isolation (user A can't access tenant B data)
- [ ] **Test:** Role hierarchy (owner > admin > member > viewer)

### Feature Flag Rollout
- [ ] **Add** `.env` flag: `USE_NEW_AUTH=false`
- [ ] **Deploy** backend with flag OFF (dual-write mode)
- [ ] **Monitor** logs for 48 hours
- [ ] **Enable** flag for 10% of users (A/B test)
- [ ] **Full rollout** if no issues

### Rollback Plan
- [ ] **If critical bug:** Set `USE_NEW_AUTH=false`
- [ ] **Firestore still active** as fallback
- [ ] **Data sync:** Ensure Firestore has latest changes

---

## 📋 PHASE 6: CLEANUP (Week 7)

### Code Cleanup
- [ ] **Remove** old Firestore auth logic from `AuthContext.tsx`
- [ ] **Delete** `components/apps/user_manager.js` (old version)
- [ ] **Archive** `schema.prisma.old`
- [ ] **Update** README.md with new architecture

### Documentation
- [ ] **Create** API documentation for new endpoints
- [ ] **Write** "How to Add a New App" guide
- [ ] **Document** permission resolution logic
- [ ] **Update** onboarding docs for new admins

### Firestore Deprecation
- [ ] **Backup** Firestore database (full export)
- [ ] **Delete** `users` collection (after 2 weeks of stability)
- [ ] **Remove** Firestore SDK from frontend dependencies

---

## 🚨 CRITICAL DO'S & DON'TS

### ✅ ALWAYS
- Use UUID for all relationships
- Validate `tenantId` on backend (never trust client)
- Log all permission changes to `audit_logs`
- Test with multiple roles (god, admin, employee)

### ❌ NEVER
- Use email as foreign key
- Skip `TenantGuard` on multi-tenant endpoints
- Hard-code tenant IDs in frontend
- Trust `X-Tenant-ID` header without validation

---

## 📞 DECISION POINTS

**Required Decisions:**
1. Should we auto-migrate existing CRM data to new `tenant_id` FK? **→ YES (already has tenantId)**
2. Should we allow users to belong to multiple tenants? **→ YES (already supported)**
3. Should we add SSO (SAML/OIDC) support? **→ FUTURE (Phase 2)**

---

## 🎯 SUCCESS METRICS

**Week 1:**
- [ ] New schema deployed without errors
- [ ] Migration script tested locally

**Week 2:**
- [ ] 100% of Firestore users migrated
- [ ] All tenants have core apps enabled

**Week 3:**
- [ ] All API endpoints protected by guards
- [ ] Platform routes return 403 for non-gods

**Week 4:**
- [ ] Frontend login flow uses new auth
- [ ] Alphery Access app functional

**Week 5:**
- [ ] Zero auth-related errors in production
- [ ] Feature flag enabled for 100% traffic

**Week 6:**
- [ ] Firestore auth code removed
- [ ] Documentation complete

---

**Approved By:** _______________  
**Start Date:** _______________  
**Go-Live Date:** _______________
