# ✅ Deployment Checklist - Alphery ERP

## 🎯 Your Current Setup
- ✅ **Frontend**: Already on Vercel (`alphery-os.vercel.app`)
- 🔧 **Backend**: Ready to deploy to Render
- ✅ **CORS**: Already configured for Vercel domains
- ✅ **Environment Variable Support**: Already implemented in frontend

---

## 🚀 Step-by-Step Deployment (15 minutes)

### Part 1: Deploy Backend to Render (10 min)

#### 1. Create Render Web Service
- [ ] Go to https://render.com
- [ ] Click **"New +"** → **"Web Service"**
- [ ] Connect GitHub repo: `alphery/operating-system`
- [ ] Set **Root Directory**: `backend`

#### 2. Configure Build Settings
- [ ] **Build Command**: 
  ```
  npm install && npx prisma generate && npm run build
  ```
- [ ] **Start Command**: 
  ```
  npm run start:prod
  ```
- [ ] **Environment**: Node (18.x or 20.x)

#### 3. Add Environment Variables in Render
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3001` (or leave empty to use Render's default)
- [ ] `DATABASE_URL` = Your PostgreSQL URL (see Part 2)
- [ ] `CORS_ORIGIN` = `https://alphery-os.vercel.app` (optional, already handled in code)

#### 4. Click "Create Web Service"
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Copy your Render URL: `https://YOUR-APP-NAME.onrender.com`

### Part 2: Setup Database (5 min)

**Option A: Render PostgreSQL Database (Recommended)**
- [ ] In Render dashboard: **New +** → **PostgreSQL**
- [ ] Name: `alphery-erp-db`
- [ ] Free tier is fine for testing
- [ ] Copy **Internal Connection String**
- [ ] Paste into backend service's `DATABASE_URL` environment variable
- [ ] **Important**: Add `?sslmode=require` to the end of the URL if not present

**Option B: Use Existing Supabase/External DB**
- [ ] Use your PostgreSQL connection string
- [ ] Format: `postgresql://user:password@host:5432/database?sslmode=require`

### Part 3: Update Frontend on Vercel (2 min)

#### Go to Vercel Dashboard
- [ ] Select project: `alphery-os` (or whatever it's named)
- [ ] Go to **Settings** → **Environment Variables**
- [ ] Find or add: `NEXT_PUBLIC_BACKEND_URL`
- [ ] Set value: `https://YOUR-RENDER-APP-NAME.onrender.com`
- [ ] Click **Save**
- [ ] Go to **Deployments** tab
- [ ] Click **⋮** on latest deployment → **Redeploy**

---

## 🧪 Testing Your Deployment

### Test Backend (Render)
```bash
# Should return empty array []
curl https://YOUR-RENDER-APP.onrender.com/projects
curl https://YOUR-RENDER-APP.onrender.com/clients
curl https://YOUR-RENDER-APP.onrender.com/tasks
```

### Test Frontend (Vercel)
1. Open: `https://alphery-os.vercel.app`
2. Open Browser Console (F12)
3. Check for errors (should be none)
4. Try creating a project
5. Data should save to your Render backend + database!

---

## 🔧 If Something Goes Wrong

### Backend Build Fails on Render
**Check Render Logs for:**
- Missing dependencies → Add to `package.json`
- Prisma errors → Ensure `prisma` is in `dependencies`, not `devDependencies`

**Fix:**
```json
// backend/package.json
"dependencies": {
  "prisma": "5.22.0",
  "@prisma/client": "5.22.0",
  // ... other deps
}
```

### Frontend Can't Connect (CORS Error)
**Symptom**: Browser console shows CORS error

**Check:**
- [ ] `NEXT_PUBLIC_BACKEND_URL` is set correctly in Vercel
- [ ] Vercel deployment finished after updating env variable
- [ ] Backend is running (visit backend URL directly)

### Database Connection Fails
**Symptom**: Render logs show "Can't reach database server"

**Fix:**
- [ ] Ensure `DATABASE_URL` has `?sslmode=require` at the end
- [ ] Check database is in same region as web service (or use external connection string)
- [ ] Verify database credentials are correct

### Render Free Tier: Slow First Request
**Note**: Free tier "spins down" after 15 minutes of inactivity
- First request may take 30-60 seconds to wake up
- Subsequent requests are fast
- Solution: Upgrade to $7/mo paid tier, or use UptimeRobot to ping every 10min

---

## 📊 Post-Deployment Database Setup

After backend is running, initialize your database:

### Run Migrations (in Render Shell or locally)
```bash
# Option 1: In Render Shell (Dashboard → Shell tab)
npx prisma migrate deploy

# Option 2: Locally with production DATABASE_URL
DATABASE_URL="your-render-db-url" npx prisma migrate deploy
```

### Seed Sample Data (Optional)
```bash
# Access Prisma Studio
npx prisma studio

# Or create via API/Frontend
# Just use the Vercel app to create projects, clients, etc.
```

---

## 🎉 Success Criteria

✅ **Backend**: 
- Render URL returns `[]` for `/projects`
- Render logs show "Backend running on port"
- No errors in logs

✅ **Frontend**:
- Vercel app loads without errors
- Can create projects/tasks/clients
- Data persists after refresh
- Console shows no CORS/network errors

✅ **Database**:
- Prisma migrations ran successfully
- Can see data in Prisma Studio or database GUI

---

## 🔐 Security Notes

Before public launch:
- [ ] Add authentication to backend endpoints
- [ ] Implement rate limiting
- [ ] Set up database backups
- [ ] Use strong database passwords
- [ ] Enable Render's Autoscaling (if needed)

---

## 💰 Cost Estimate

**Free Tier (for testing):**
- ✅ Vercel: Free (Hobby plan)
- ✅ Render Web Service: Free (with spin-down)
- ✅ Render PostgreSQL: Free (256MB storage)

**Paid Tier (for production):**
- Vercel Pro: $20/month (if needed for team features)
- Render: $7/month (always-on, no spin-down)
- Render PostgreSQL: $7/month (1GB storage)

**Total**: ~$14-34/month for production-ready setup

---

## 📞 Quick Reference

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend (Vercel) | `https://alphery-os.vercel.app` | User interface |
| Backend (Render) | `https://YOUR-APP.onrender.com` | API endpoints |
| Database | Render PostgreSQL | Data storage |

---

**You're all set! Follow the checklist above and you'll be deployed in 15 minutes! 🚀**
