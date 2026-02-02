# 🚀 Production Deployment Guide: Vercel (Frontend) + Render (Backend)

## Current Setup
- ✅ **Frontend**: Vercel - `https://alphery-os.vercel.app`
- 🔧 **Backend**: Render - Needs deployment
- 🗄️ **Database**: PostgreSQL (Render managed or external)

---

## 📦 Backend Deployment to Render

### Step 1: Create Render Account & New Web Service

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the `backend` directory (or configure Root Directory: `/backend`)

### Step 2: Configure Build Settings

**Build Command:**
```bash
npm install && npx prisma generate && npm run build
```

**Start Command:**
```bash
npm run start:prod
```

**Environment:**
- **Node Version**: 18.x or 20.x
- **Region**: Choose closest to you (Oregon, Frankfurt, Singapore)

### Step 3: Set Environment Variables

Add these environment variables in Render dashboard:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` (or use Render's auto `$PORT`) |
| `DATABASE_URL` | Your PostgreSQL connection string |
| `CORS_ORIGIN` | `https://alphery-os.vercel.app` |

### Step 4: Database Setup

**Option A: Render PostgreSQL (Recommended)**
1. In Render dashboard: **New +** → **PostgreSQL**
2. Copy the **Internal Connection String**
3. Paste into `DATABASE_URL` environment variable

**Option B: External Database (Supabase/Railway)**
- Use your existing PostgreSQL connection string

### Step 5: Deploy & Test

1. Click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. Your backend URL will be: `https://alphery-erp-backend-XXXXX.onrender.com`
4. Test: Visit `https://your-backend-url.onrender.com/projects`
   - Should return: `[]` (empty array)

---

## 🌐 Frontend (Vercel) Configuration

### Step 1: Update Backend URL in Vercel

1. Go to [vercel.com](https://vercel.com) → Your project
2. **Settings** → **Environment Variables**
3. Add:
   ```
   NEXT_PUBLIC_BACKEND_URL = https://your-render-backend-url.onrender.com
   ```
4. **Redeploy** your frontend

### Step 2: Alternative - Update .env.local

If you prefer updating locally and pushing:

```bash
# .env.local
NEXT_PUBLIC_BACKEND_URL=https://your-render-backend-url.onrender.com
```

Then:
```bash
git add .env.local
git commit -m "Update backend URL for production"
git push
```

Vercel will auto-deploy.

---

## ✅ Verification Checklist

### Backend (Render)
- [ ] Service is running (check Render dashboard)
- [ ] Can access `https://your-backend.onrender.com/projects` → Returns `[]`
- [ ] Can access `/tasks`, `/clients`, `/quotations`, `/documents` endpoints
- [ ] Database is connected (check Render logs)
- [ ] CORS is configured correctly

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_BACKEND_URL` environment variable set
- [ ] Frontend deployed successfully
- [ ] No console errors about CORS
- [ ] Can create/view projects from Vercel app

---

## 🛠️ Common Issues & Fixes

### Issue 1: CORS Errors on Vercel
**Symptom**: `Access to fetch at 'https://...' has been blocked by CORS`

**Fix**: Update `backend/src/main.ts` CORS origin:
```typescript
origin: function (origin, callback) {
  if (!origin) return callback(null, true);
  
  // Add your Vercel domain
  if (origin.match(/\.vercel\.app$/) || 
      origin === 'https://alphery-os.vercel.app') {
    return callback(null, true);
  }
  callback(new Error('Not allowed by CORS'), false);
},
```

### Issue 2: Database Connection Errors
**Symptom**: `Error: P1001: Can't reach database server`

**Fix**:
1. Check `DATABASE_URL` format:
   ```
   postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
   ```
2. Ensure SSL is enabled for external connections
3. Verify Render's database is in the same region as your web service

### Issue 3: Build Fails on Render
**Symptom**: Build command errors

**Fix**:
1. Ensure `package.json` has all dependencies
2. Add `prisma` to `dependencies` (not just `devDependencies`):
   ```json
   "dependencies": {
     "prisma": "5.22.0",
     "@prisma/client": "5.22.0"
   }
   ```
3. Check Node version compatibility

### Issue 4: Render Free Tier Spin-Down
**Symptom**: First request takes 30-60 seconds

**Note**: Render's free tier spins down after 15 minutes of inactivity.
- **Solution**: Upgrade to paid tier ($7/month) for always-on
- **Workaround**: Use a service like [UptimeRobot](https://uptimerobot.com) to ping every 10 minutes

---

## 📊 Database Migration for Production

After deploying to Render, run migrations:

```bash
# In Render Shell (or locally with production DATABASE_URL)
npx prisma migrate deploy
```

Or use Prisma Studio to seed initial data:
```bash
npx prisma studio
```

---

## 🔒 Security Recommendations

1. **Environment Variables**: Never commit `.env` files
2. **Database**: Use strong passwords, enable SSL
3. **CORS**: Only allow your Vercel domain, not all origins
4. **Rate Limiting**: Add rate limiting middleware (future enhancement)
5. **Authentication**: Implement JWT authentication before public launch

---

## 📈 Monitoring & Logs

### Render Logs
- Check **Logs** tab in Render dashboard
- Look for errors: `[Nest]`, `Prisma`, `Database`

### Vercel Logs
- Check **Deployments** → **View Function Logs**
- Monitor API fetch errors

---

## 🎯 Quick Deployment Commands

### Push Changes
```bash
# From project root
git add .
git commit -m "Configure for production deployment"
git push origin main
```

Both Vercel and Render will auto-deploy on push!

---

## 📝 Post-Deployment Checklist

1. **Test All Modules**:
   - [ ] Create a project
   - [ ] Add a task
   - [ ] Add a client
   - [ ] Create a quotation
   - [ ] Upload a document

2. **Performance**:
   - [ ] Check page load times
   - [ ] Monitor API response times
   - [ ] Verify database queries are optimized

3. **User Experience**:
   - [ ] No console errors
   - [ ] Smooth navigation
   - [ ] Data persists correctly

---

## 🆘 Need Help?

If you encounter issues:
1. Check Render logs for backend errors
2. Check browser console for frontend errors
3. Verify environment variables are set correctly
4. Test endpoints individually using Postman/curl

---

**Your deployment configuration is ready! 🚀**

Just deploy to Render and update the Vercel environment variable with your new backend URL.
