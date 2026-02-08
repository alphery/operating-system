# 🚀 Alphery OS Deployment Guide

## Current Tech Stack
- **Frontend**: Next.js (deployed on Vercel)
- **Backend**: NestJS (needs deployment)
- **Database**: PostgreSQL on Supabase
- **Auth**: Firebase Admin SDK (for user management)

---

## ✅ RECOMMENDED: Deploy Backend to Fly.io

### Why Fly.io?
- ✅ Better than Render/Railway (fewer bugs, faster)
- ✅ WebSocket & Socket.IO support
- ✅ Works seamlessly with Supabase
- ✅ Free tier: 256MB RAM (perfect for testing)
- ✅ Auto-sleep when idle (saves resources)

---

## 📦 Step-by-Step Deployment

### 1. Install Fly.io CLI
```bash
# Linux/WSL
curl -L https://fly.io/install.sh | sh

# Add to PATH (add this to ~/.bashrc or ~/.zshrc)
export FLYCTL_INSTALL="/home/$USER/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Reload shell
source ~/.bashrc
```

### 2. Login to Fly.io
```bash
fly auth login
```

### 3. Deploy Backend
```bash
cd backend

# Create app (one-time setup)
fly launch --no-deploy

# Set environment secrets
fly secrets set DATABASE_URL="postgresql://postgres.anklmzmbfzkvhbpkompb:ALPHERY25@supabase@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

fly secrets set JWT_SECRET="alphery-os-super-secret-jwt-key-change-in-production-2024"

fly secrets set SUPABASE_URL="https://anklmzmbfzkvhbpkompb.supabase.co"

fly secrets set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xtem1iZnprdmhicGtvbXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMDgxODksImV4cCI6MjA4NTU4NDE4OX0.Ks4biO7ANQWixU1s-09hunuG0MGKlwdvsBU3H4RjeFg"

fly secrets set CORS_ORIGIN="https://alphery-os.vercel.app"

# Optional: Add Firebase credentials if you have them
# fly secrets set FIREBASE_PRIVATE_KEY="..."
# fly secrets set FIREBASE_CLIENT_EMAIL="..."
# fly secrets set FIREBASE_PROJECT_ID="alphery-1"

# Deploy!
fly deploy
```

### 4. Get Your Backend URL
```bash
fly status
# Your URL will be: https://alphery-os-backend.fly.dev
```

### 5. Update Frontend Environment
Update your frontend (Vercel) environment variables:
```
NEXT_PUBLIC_BACKEND_URL=https://alphery-os-backend.fly.dev
```

---

## 🔥 ALTERNATIVE: Supabase Edge Functions (Simpler!)

If you want to **eliminate the backend entirely**, use Supabase Edge Functions:

### Pros:
- ✅ No separate backend to manage
- ✅ Built-in authentication
- ✅ Integrated with Supabase DB
- ✅ Free tier (500K requests/month)
- ✅ TypeScript-based

### Cons:
- ❌ Need to migrate NestJS code to Deno
- ❌ No WebSockets (use Supabase Realtime instead)

**Only choose this if you want to simplify architecture long-term.**

---

## 📊 Final Recommended Stack

| Component | Technology | Platform |
|-----------|-----------|----------|
| Frontend | Next.js | **Vercel** |
| Backend | NestJS | **Fly.io** |
| Database | PostgreSQL | **Supabase** |
| Auth | Firebase Admin | Integrated |
| WebSockets | Socket.IO | Fly.io (persistent) |

---

## 🆘 Troubleshooting

### If Fly.io deployment fails:
1. Check logs: `fly logs`
2. SSH into machine: `fly ssh console`
3. Check Prisma migrations: The `start.sh` script handles this automatically

### If database connection fails:
- Ensure `DATABASE_URL` has Supabase pooler URL (port 6543)
- Check Supabase dashboard for connection limits

### If Frontend can't reach backend:
- Update CORS in `backend/src/main.ts` to allow Vercel domain
- Verify `NEXT_PUBLIC_BACKEND_URL` in Vercel env vars

---

## 💡 Quick Commands

```bash
# View logs
fly logs

# Scale resources (if needed)
fly scale memory 512  # Upgrade to 512MB

# SSH into server
fly ssh console

# Check status
fly status

# Redeploy
fly deploy
```

---

**Need help?** Just ask! I'll help you deploy to Fly.io step by step.
