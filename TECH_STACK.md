# 🚀 Alphery OS - Complete Tech Stack

## 📊 **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                        ALPHERY OS                            │
│                   (Operating System in Browser)              │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐         ┌───────▼────────┐
        │   FRONTEND     │         │    BACKEND     │
        │   (Vercel)     │◄────────┤   (Render)     │
        │   Next.js      │  API    │   NestJS       │
        └───────┬────────┘         └───────┬────────┘
                │                           │
                │                  ┌────────▼────────┐
                │                  │   DATABASE      │
                │                  │   (Supabase)    │
                │                  │   PostgreSQL    │
                │                  └────────┬────────┘
                │                           │
        ┌───────▼────────┐         ┌───────▼────────┐
        │  AUTHENTICATION │         │   FILE STORAGE │
        │   Firebase      │         │   Supabase     │
        │   Admin SDK     │         │   Storage      │
        └─────────────────┘         └────────────────┘
```

---

## 🎨 **Frontend Stack**

### **Framework & Libraries**
- **Next.js 13+** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling

### **State Management**
- **React Context API** - Global state
- **Socket.IO Client** - Real-time communication

### **UI Components**
- Custom Ubuntu-like desktop interface
- Window management system
- App drawer and taskbar
- File explorer
- Terminal emulator

### **Deployment**
- **Platform**: Vercel
- **URL**: https://alphery-os.vercel.app
- **Auto-deploy**: On push to `main` branch
- **Environment Variables**:
  ```
  NEXT_PUBLIC_BACKEND_URL=https://alphery-os-backend.onrender.com
  NEXT_PUBLIC_SUPABASE_URL=https://anklmzmbfzkvhbpkompb.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
  NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDdP3vYlaQ...
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=alphery-1.firebaseapp.com
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=alphery-1
  ```

---

## ⚙️ **Backend Stack**

### **Framework & Core**
- **NestJS** - Progressive Node.js framework
- **Node.js 20** - Runtime environment
- **TypeScript** - Type safety
- **Express** - HTTP server (under NestJS)

### **Database & ORM**
- **Prisma** - Modern ORM
- **PostgreSQL** - Relational database (via Supabase)

### **Authentication**
- **Firebase Admin SDK** - User management
- **JWT** - Session tokens
- **Custom UID System** - User ID format: `AU000001`, `AU000002`, etc.

### **Real-time Communication**
- **Socket.IO** - WebSocket connections
- **CORS** - Cross-origin resource sharing

### **Key Features**
- Multi-tenant architecture
- Role-based access control (RBAC)
- God Mode for admin users
- Dynamic ERP/CRM factory system
- Audit logging
- Notification system

### **Deployment**
- **Platform**: Render (Free Tier)
- **URL**: https://alphery-os-backend.onrender.com
- **Region**: Singapore
- **Auto-deploy**: On push to `main` branch
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `./start.sh` (includes migrations & seeding)
- **Environment Variables** (Set in Render Dashboard):
  ```
  NODE_ENV=production
  PORT=10000
  DATABASE_URL=postgresql://postgres.anklmzmbfzkvhbpkompb:ALPHERY25@supabase@...
  JWT_SECRET=alphery-os-super-secret-jwt-key-change-in-production-2024
  SUPABASE_URL=https://anklmzmbfzkvhbpkompb.supabase.co
  SUPABASE_ANON_KEY=eyJhbGci...
  CORS_ORIGIN=https://alphery-os.vercel.app
  ```

---

## 🗄️ **Database Stack**

### **Provider**
- **Supabase** - PostgreSQL as a Service
- **Region**: AWS ap-southeast-2 (Sydney)

### **Connection**
- **Pooler URL** (for serverless): Port 6543 with pgBouncer
- **Direct URL** (for migrations): Port 5432

### **Schema Management**
- **Prisma Migrations** - Version-controlled schema changes
- **Seeding** - Default data population (admin user, templates)

### **Key Tables**
- `PlatformUser` - User accounts with custom UIDs
- `Tenant` - Multi-tenant organizations
- `Role` - RBAC roles
- `Permission` - Granular permissions
- `EntitySchema` - Dynamic ERP/CRM schemas
- `EntityRecord` - Dynamic data storage
- `AuditLog` - Activity tracking
- `Notification` - User notifications

---

## 🔐 **Authentication Stack**

### **User Management**
- **Firebase Authentication** - User creation & password management
- **Firebase Admin SDK** - Server-side user operations
- **Custom UID System** - Friendly user IDs (AU000001, AU000002...)

### **Session Management**
- **JWT Tokens** - Stateless authentication
- **Custom Claims** - User metadata in tokens
- **Session Expiry** - Configurable token lifetime

### **Authorization**
- **God Mode** - Super admin access (alpherymail@gmail.com)
- **Tenant-based** - Multi-tenant isolation
- **Role-based** - Granular permissions

---

## 📦 **File Storage**

### **Provider**
- **Supabase Storage** - S3-compatible object storage

### **Buckets**
- `avatars` - User profile pictures
- `documents` - User-uploaded files
- `public` - Publicly accessible assets

---

## 🔄 **CI/CD Pipeline**

### **Git Workflow**
- **Repository**: GitHub (alphery/operating-system)
- **Main Branch**: `main` (production)
- **Auto-deploy**: Push to `main` triggers deployments

### **Deployment Flow**
```
1. Developer pushes to GitHub
   ↓
2. Vercel detects push → Builds frontend → Deploys
   ↓
3. Render detects push → Builds backend → Runs migrations → Deploys
   ↓
4. Both services are live with latest code
```

---

## 🛠️ **Development Tools**

### **Code Quality**
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

### **Testing**
- **Jest** - Unit testing framework
- **Supertest** - API testing

### **Development Environment**
- **Local Frontend**: http://localhost:3000
- **Local Backend**: http://localhost:10000
- **Hot Reload**: Both frontend and backend support live reloading

---

## 📈 **Monitoring & Logging**

### **Backend Logs**
- **Render Dashboard** - Real-time logs
- **Console Logging** - Structured logging with NestJS Logger

### **Database Monitoring**
- **Supabase Dashboard** - Query performance, connections
- **Prisma Studio** - Database GUI (local development)

---

## 🌐 **Production URLs**

| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://alphery-os.vercel.app | ✅ Live |
| Backend API | https://alphery-os-backend.onrender.com | ⚠️ Needs Redeploy |
| Database | Supabase (Private) | ✅ Live |
| Auth | Firebase (Private) | ✅ Live |

---

## 🔑 **Admin Account**

- **Email**: alpherymail@gmail.com
- **User ID**: AU000001
- **Password**: ALPHERY25@it
- **Access**: God Mode (full system access)

---

## 📝 **Next Steps to Deploy**

### **1. Render Backend Deployment**

**Option A: Use Render Dashboard (Recommended)**
1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect GitHub repo: `alphery/operating-system`
4. Configure:
   - **Name**: alphery-os-backend
   - **Region**: Singapore
   - **Branch**: main
   - **Root Directory**: backend
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `./start.sh`
   - **Instance Type**: Free
5. Add all environment variables (listed above)
6. Click "Create Web Service"

**Option B: Use render.yaml (Blueprint)**
1. Render will auto-detect `backend/render.yaml`
2. Just add environment variables in dashboard
3. Deploy!

### **2. Update Frontend Environment**
Once backend is deployed:
1. Go to Vercel → alphery-os project → Settings → Environment Variables
2. Update: `NEXT_PUBLIC_BACKEND_URL=https://alphery-os-backend.onrender.com`
3. Redeploy frontend

---

## 🆘 **Troubleshooting**

### **Backend won't start on Render?**
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure `DATABASE_URL` uses Supabase pooler URL (port 6543)

### **Frontend can't connect to backend?**
- Check CORS settings in `backend/src/main.ts`
- Verify `NEXT_PUBLIC_BACKEND_URL` in Vercel
- Check backend is running (visit backend URL in browser)

### **Database connection errors?**
- Verify Supabase project is active
- Check connection string has correct password
- Ensure IP allowlist includes Render's IPs (or set to allow all)

---

**Need help deploying? Just tell me which step you're on!** 🚀
