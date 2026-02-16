# New Authentication System - Hierarchical ID Structure

## Overview

Simple 3-tier authentication system:

- **AA000001** - Alphery Super Admin (You)
- **AT000001** - Alphery Tenant (Your Clients)
- **AU000001** - Alphery User (Tenant's Users)

## Implementation Plan

### 1. Database Schema Changes

**Users Table:**
```sql
CREATE TABLE users (
  id VARCHAR(20) PRIMARY KEY,  -- AA000001, AT000001, AU000001
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  role ENUM('super_admin', 'tenant_admin', 'user'),
  created_by VARCHAR(20),  -- Who created this user
  tenant_id VARCHAR(20),   -- Which tenant they belong to (NULL for super admin)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);
```

### 2. Authentication Flow

**Login Only (No Signup):**

1. User enters **ID** (AA000001, AT000001, or AU000001)
2. User enters **Password**
3. Backend validates credentials
4. Returns JWT token with role and permissions

### 3. User Creation Flow

**Super Admin (AA000001):**
- Can create Tenant Admins (AT000001, AT000002, etc.)
- Can view all tenants and users
- Full system access

**Tenant Admin (AT000001):**
- Can create Users (AU000001, AU000002, etc.) under their tenant
- Can manage their own users
- Limited to their tenant scope

**Regular User (AU000001):**
- Can only login and use assigned apps
- No user creation rights

### 4. ID Generation Logic

```typescript
// Super Admin IDs
AA000001, AA000002, AA000003...

// Tenant IDs (created by Super Admin)
AT000001, AT000002, AT000003...

// User IDs (created by Tenant Admin)
// Format: AU{tenant_number}{user_number}
// Example: Tenant AT000001 creates users:
AU000001001, AU000001002, AU000001003...
// Tenant AT000002 creates users:
AU000002001, AU000002002, AU000002003...
```

### 5. Frontend Changes

**Remove Signup:**
- Remove "Sign Up" tab from login screen
- Only show "Login" form
- Fields: ID, Password

**User Management UI:**
- Super Admin sees "Create Tenant" button
- Tenant Admin sees "Create User" button
- Regular users see nothing

### 6. Initial Setup

**Seed Database with Super Admin:**
```sql
INSERT INTO users (id, password_hash, name, email, role, is_active)
VALUES (
  'AA000001',
  '$2b$10$...',  -- Hash of 'ALPHERY25@it'
  'Super Admin',
  'alpherymail@gmail.com',
  'super_admin',
  true
);
```

## Files to Modify

1. **Backend:**
   - `auth.service.ts` - Simplify to ID+Password only
   - `auth.controller.ts` - Remove signup endpoint
   - `users.service.ts` - Add createTenant, createUser methods
   - `prisma/schema.prisma` - Update user model
   - `prisma/seed.ts` - Add super admin seed

2. **Frontend:**
   - `firebase_auth_screen.js` - Remove signup, simplify to login only
   - `alphery_access.tsx` - Add "Create Tenant" / "Create User" UI
   - Remove Firebase dependency (optional)

## Benefits

✅ **Simpler** - No Firebase, no complex OAuth
✅ **Controlled** - You create all accounts
✅ **Hierarchical** - Clear role structure
✅ **Secure** - No public signup
✅ **Fast** - Direct database auth

## Migration Steps

1. Create new simplified auth service
2. Remove Firebase dependencies
3. Update login screen
4. Add user management UI
5. Seed super admin account
6. Test login flow

---

**Ready to implement this?** This is much simpler than the current Firebase setup!
