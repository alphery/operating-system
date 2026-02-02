# 🚀 Alphery OS - Complete Setup Guide

## Step 1: Create a Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** (it's FREE)
3. Create a new project:
   - **Name**: `alphery-os`
   - **Database Password**: (choose a strong password and SAVE IT)
   - **Region**: Choose closest to you
   - Wait 2-3 minutes for setup

4. Once ready, click **"Project Settings"** → **"API"**
5. Copy these values:
   - `Project URL` → This is your `SUPABASE_URL`
   - `anon public` key → This is your `SUPABASE_ANON_KEY`
   - `service_role secret` key → This is your `SUPABASE_SERVICE_KEY`

6. Click **"Database"** → **"Connection String"** → **"URI"**
   - Copy the connection string (it looks like `postgresql://postgres:[YOUR-PASSWORD]@...`)
   - Replace `[YOUR-PASSWORD]` with your actual database password
   - This is your `DATABASE_URL`

---

## Step 2: Setup Environment Variables

### Frontend (.env.local)
Create/update `/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Backend (backend/.env)
Create `/backend/.env`:
```bash
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Redis (local for now)
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3 (Optional - can skip for now)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=alphery-os-files
```

---

## Step 3: Setup Database Schema

```bash
cd backend
npx prisma db push
npx prisma generate
cd ..
```

---

## Step 4: Install Redis Locally (Optional but Recommended)

**Ubuntu/WSL:**
```bash
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Skip for now?** Comment out `RedisModule` in `backend/src/app.module.ts` temporarily.

---

## Step 5: Run Everything

### Option A: Run Separately (Development)

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run start:dev
```

### Option B: Run with Docker (Production-like)

```bash
docker-compose up --build
```

---

## Step 6: Test It Out

1. Open `http://localhost:3000`
2. Your Alphery OS should load
3. Backend API: `http://localhost:3001`
4. Socket.IO should auto-connect (check browser console)

---

## Step 7: Migrate Firebase Users to Supabase (Optional)

Your existing Firebase Auth still works! But to switch to Supabase:

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Email** and **Google** providers
3. Update `context/AuthContext.tsx` to use Supabase instead of Firebase

---

## What's Free?

| Service | Free Tier |
|---------|-----------|
| **Supabase** | 500MB DB, 1GB Storage, 50K Users |
| **Redis (Local)** | Free (runs on your machine) |
| **AWS S3** | 5GB for 12 months (new accounts) |
| **Vercel** | Unlimited deployments |
| **Docker** | Free (local) |

---

## Need Help?

Run into issues? Check:
- `backend/` folder has all dependencies installed: `npm install`
- Redis is running: `redis-cli ping` (should return `PONG`)
- Supabase connection: Check the URL/keys are correct
- Port conflicts: Make sure 3000 (frontend) and 3001 (backend) are free

---

**You're ready to go! 🎉**
