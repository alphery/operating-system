# 🚀 Deploy AA/AT/AU Auth System to Render

## Overview

This guide will help you deploy the new hierarchical authentication system (AA/AT/AU) to Render.

## What Changed

✅ **Removed Firebase dependency** - No more Firebase Admin SDK needed  
✅ **Added password-based auth** - Uses bcrypt for secure password hashing  
✅ **Added role system** - `super_admin`, `tenant_admin`, `user`  
✅ **Added user creation** - Super admins create tenants, tenants create users  
✅ **Removed signup** - Only login with predefined credentials  

## Step-by-Step Deployment

### 1. **Update Database Schema on Render**

The schema has new fields:
- `password_hash` - For storing bcrypt hashed passwords
- `role` - User role (super_admin, tenant_admin, user)
- `created_by` - Who created this user
- `firebase_uid` - Now optional (for legacy users)

**Option A: Auto-migrate (Recommended)**

Render will automatically run migrations on deploy if you have this in `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && nest build"
  }
}
```

**Option B: Manual Migration**

1. Go to Render Dashboard → Your Backend Service
2. Click **Shell** tab
3. Run:
   ```bash
   npx prisma migrate deploy
   ```

### 2. **Seed Super Admin Account**

After migration, seed the database:

**In Render Shell:**
```bash
npx prisma db seed
```

This creates:
- **User ID:** `AA000001`
- **Password:** `ALPHERY25@it`
- **Email:** `alpherymail@gmail.com`
- **Role:** `super_admin`

### 3. **Update Backend Code on Render**

**Push your changes to Git:**

```powershell
git add .
git commit -m "feat: Implement AA/AT/AU hierarchical auth system

- Removed Firebase dependency
- Added bcrypt password authentication
- Added role-based access (super_admin, tenant_admin, user)
- Added create-tenant and create-user endpoints
- Removed public signup
- Seeded super admin account (AA000001)"

git push
```

Render will automatically deploy the new code.

### 4. **Verify Deployment**

**Check Render Logs:**

1. Go to Render Dashboard → Your Backend Service
2. Click **Logs** tab
3. Look for:
   ```
   ✅ Prisma schema loaded
   ✅ Database migrations applied
   ✅ Nest application successfully started
   ```

**Test Login Endpoint:**

```powershell
Invoke-WebRequest -Uri "https://alphery-os-backend.onrender.com/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"customUid":"AA000001","password":"ALPHERY25@it"}' `
  -UseBasicParsing
```

You should get a `200 OK` with a session token!

### 5. **Update Frontend Environment**

Your `.env.local` is already set to:
```
NEXT_PUBLIC_BACKEND_URL=https://alphery-os-backend.onrender.com
```

Just refresh your browser and try logging in!

## Login Credentials

### Super Admin (You)
```
User ID: AA000001
Password: ALPHERY25@it
```

## API Endpoints

### 1. **Login**
```
POST /auth/login
Body: { "customUid": "AA000001", "password": "ALPHERY25@it" }
Response: { "sessionToken": "...", "platformUser": {...}, "tenants": [...] }
```

### 2. **Create Tenant** (Super Admin Only)
```
POST /auth/create-tenant
Headers: { "Authorization": "Bearer <sessionToken>" }
Body: {
  "name": "Client Company",
  "email": "client@example.com",
  "password": "ClientPass123",
  "displayName": "Client Admin"
}
Response: { "customUid": "AT000001", "email": "...", "message": "..." }
```

### 3. **Create User** (Tenant Admin Only)
```
POST /auth/create-user
Headers: { "Authorization": "Bearer <sessionToken>" }
Body: {
  "tenantId": "<tenant-uuid>",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "UserPass123",
  "displayName": "John Doe"
}
Response: { "customUid": "AU000001", "email": "...", "message": "..." }
```

## Files Modified/Created

### Backend:
1. ✅ `prisma/schema.prisma` - Added `passwordHash`, `role`, `createdBy` fields
2. ✅ `prisma/seed.ts` - Seeds AA000001 super admin
3. ✅ `src/auth/auth-simple.service.ts` - New auth service without Firebase
4. ✅ `src/auth/auth-simple.controller.ts` - New controller with create endpoints
5. ⏳ `src/auth/auth.module.ts` - Needs to be updated to use new service

### Frontend:
1. ✅ `components/screen/firebase_auth_screen.js` - Removed signup, login-only
2. ⏳ `components/apps/alphery_access.tsx` - Needs "Create Tenant" UI
3. ⏳ `context/AuthContext-new.tsx` - May need updates for new auth flow

## Next Steps After Deployment

### 1. **Test Login**
1. Go to `http://localhost:3000` (or your Vercel URL)
2. Enter:
   - User ID: `AA000001`
   - Password: `ALPHERY25@it`
3. Click "Enter Workspace"
4. You should be logged in as Super Admin!

### 2. **Create Your First Tenant**
1. Open **Alphery Access** app
2. Click **"Create Tenant"** button (needs to be added to UI)
3. Fill in:
   - Name: "My First Client"
   - Email: "client@example.com"
   - Password: "Client123"
4. You'll get `AT000001` as the tenant ID
5. Give this to your client to log in!

### 3. **Tenant Creates Users**
1. Client logs in with `AT000001` + password
2. They see **"Create User"** button
3. They create users (`AU000001`, `AU000002`, etc.)
4. Users can log in and access assigned apps

## Troubleshooting

### Migration Fails
```bash
# In Render Shell:
npx prisma migrate reset --force
npx prisma migrate deploy
npx prisma db seed
```

### Seed Fails
```bash
# In Render Shell:
npx prisma db seed
```

### Login Returns 401
- Check if seed ran successfully
- Verify password is exactly `ALPHERY25@it`
- Check Render logs for errors

### "Module not found" Error
```bash
# In Render Shell:
npm install
npm run build
```

## Security Notes

🔒 **Password Storage:** All passwords are hashed with bcrypt (10 rounds)  
🔒 **JWT Tokens:** 7-day expiration  
🔒 **Role-Based Access:** Guards prevent unauthorized access  
🔒 **No Public Signup:** Only admins can create accounts  

## Production Checklist

- [ ] Database migrations applied
- [ ] Super admin seeded (AA000001)
- [ ] Apps seeded in database
- [ ] Backend deployed to Render
- [ ] Frontend `.env.local` points to Render
- [ ] Login tested with AA000001
- [ ] Create tenant endpoint tested
- [ ] Create user endpoint tested

---

**Ready to deploy?** Push your code and Render will handle the rest! 🚀
