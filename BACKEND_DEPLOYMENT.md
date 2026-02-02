# 🚀 BACKEND DEPLOYMENT GUIDE - Render.com

## 🎯 **Quick Summary:**

**Platform:** Render.com (Free tier)
**Time:** 10-15 minutes
**Cost:** $0 (Free forever)
**Result:** Your backend running at `https://your-app.onrender.com`

---

## 📋 **STEP-BY-STEP GUIDE:**

### **STEP 1: Prepare Backend for Production** ✅

First, let's make sure your backend is production-ready:

#### **A. Check package.json:**

Your backend already has these scripts:
```json
{
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:prod": "node dist/main"
}
```
✅ **Already configured!**

#### **B. Create a startup script:**

We need to ensure the build happens before start. Update `backend/package.json`:

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "deploy": "npm run build && npm run start:prod"
  }
}
```

---

### **STEP 2: Create Render Account** 🌐

1. **Go to:** https://render.com
2. **Click:** "Get Started"
3. **Sign up with GitHub** (recommended - easier deployment)
4. **Authorize Render** to access your GitHub repos

---

### **STEP 3: Create New Web Service** 🆕

1. **Click:** "New +" button (top right)
2. **Select:** "Web Service"
3. **Connect Repository:**
   - If you see your `operating-system` repo → Click "Connect"
   - If not → Click "Configure account" → Grant access

---

### **STEP 4: Configure Web Service** ⚙️

Fill in these settings:

#### **Basic Settings:**
```
Name: your-os-backend
(or any name you want)

Region: Oregon (US West)
(or closest to you)

Branch: main

Root Directory: backend
(IMPORTANT! This tells Render to only build the backend folder)
```

#### **Build Settings:**
```
Runtime: Node

Build Command:
npm install && npm run build

Start Command:
npm run start:prod
```

#### **Plan:**
```
Instance Type: Free
(Select "Free" - $0/month)
```

---

### **STEP 5: Add Environment Variables** 🔐

Click **"Advanced"** → **"Add Environment Variable"**

Add these one by one:

```bash
# Required:
NODE_ENV=production
PORT=10000

# Supabase (from your backend/.env):
DATABASE_URL=your_supabase_connection_string_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here

# Optional (if you want):
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

**Where to find these values:**
1. Open `backend/.env` on your local machine
2. Copy the values
3. Paste into Render

**Important:** Replace `your_supabase_connection_string_here` with actual values!

---

### **STEP 6: Deploy!** 🚀

1. **Click:** "Create Web Service"
2. **Wait:** Render will start building (2-5 minutes)
3. **Watch:** Build logs in real-time

**Build Progress:**
```
✓ Cloning repository...
✓ Running: npm install
✓ Running: npm run build
✓ Starting service...
✓ Service is live!
```

---

### **STEP 7: Get Your Backend URL** 🌐

After successful deployment:

1. You'll see: `your-os-backend.onrender.com`
2. **Copy this URL!** You'll need it for frontend

**Example URL:**
```
https://your-os-backend.onrender.com
```

**Test it:**
```
https://your-os-backend.onrender.com/
```

Should show: `"Hello from Nest.js!"`

---

### **STEP 8: Update Frontend** 🔧

Now connect your frontend to the production backend:

#### **A. Update Vercel Environment Variables:**

1. Go to Vercel Dashboard: https://vercel.com
2. Select your project
3. Go to: **Settings** → **Environment Variables**
4. Add new variable:

```
Name: NEXT_PUBLIC_BACKEND_URL
Value: https://your-os-backend.onrender.com
Environment: Production, Preview, Development
```

5. **Click:** "Save"

#### **B. Redeploy Frontend:**

```bash
# In your local project root:
git add .
git commit -m "feat: connect to production backend"
git push origin main
```

Vercel will auto-redeploy with new backend URL!

---

### **STEP 9: Update Backend CORS** 🔒

Your backend needs to allow requests from Vercel:

**Edit:** `backend/src/main.ts`

Find the CORS section and update:

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app',  // ← Add your Vercel URL
    'https://your-vercel-app-git-*.vercel.app',  // ← Preview deployments
  ],
  credentials: true,
});
```

**Replace** `your-vercel-app` with your actual Vercel URL!

**Then redeploy backend:**
- Just push to GitHub
- Render will auto-redeploy!

```bash
git add backend/src/main.ts
git commit -m "fix: update CORS for production"
git push origin main
```

---

## ✅ **VERIFICATION:**

### **Test Backend Directly:**

1. Open: `https://your-os-backend.onrender.com`
2. Should see: `"Hello from Nest.js!"`

### **Test Socket.IO:**

1. Open: `https://your-os-backend.onrender.com/socket.io/`
2. Should see: Socket.IO server info

### **Test Frontend Connection:**

1. Open your Vercel app
2. Open browser console (F12)
3. Should see: `✅ [SocketContext] Connected to backend!`

---

## 🐛 **COMMON ISSUES & FIXES:**

### **Issue 1: "Service build failed"**

**Check:**
- Root directory is set to `backend`
- Build command is: `npm install && npm run build`
- You have a `package.json` in `backend/` folder

**Fix:**
- Go to Render dashboard → Settings
- Verify "Root Directory" = `backend`
- Retry deployment

---

### **Issue 2: "Port already in use"**

**Your backend should use Render's port:**

**Edit:** `backend/src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Use Render's PORT or fallback to 3001
  const port = process.env.PORT || 3001;
  
  await app.listen(port);
  console.log(`🚀 Backend running on port ${port}`);
}
```

---

### **Issue 3: "Cannot connect to database"**

**Check DATABASE_URL format:**

```
postgresql://user:password@host:port/database?sslmode=require
```

**Get from Supabase:**
1. Supabase Dashboard → Project Settings → Database
2. Copy "Connection string" for "Session mode"
3. Replace `[YOUR-PASSWORD]` with actual password
4. Paste into Render env vars

---

### **Issue 4: "CORS error in browser"**

**Update CORS in backend:**

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app',
    /vercel\.app$/,  // Allow all Vercel preview URLs
  ],
  credentials: true,
});
```

Push to GitHub → Render auto-redeploys

---

### **Issue 5: "Render free tier goes to sleep"**

**Free tier sleeps after 15 minutes of inactivity**

**Solutions:**

**A. Quick (Temporary):**
- First request will wake it (takes 30 seconds)
- Just wait and retry

**B. Better (Free):**
Use a ping service like UptimeRobot:
1. Go to: https://uptimerobot.com
2. Add monitor for your backend URL
3. Ping every 5 minutes (keeps it awake)

**C. Best (Paid - $7/month):**
- Upgrade to Render Starter plan
- Backend stays awake 24/7

---

## 📊 **DEPLOYMENT CHECKLIST:**

### **Before Deploying:**
- [ ] `backend/package.json` has `build` and `start:prod` scripts
- [ ] You have Supabase `DATABASE_URL`
- [ ] You have a Render account
- [ ] Backend is pushed to GitHub

### **Render Setup:**
- [ ] Created Web Service
- [ ] Set root directory to `backend`
- [ ] Added build command: `npm install && npm run build`
- [ ] Added start command: `npm run start:prod`
- [ ] Added environment variables (DATABASE_URL, etc.)
- [ ] Selected Free tier

### **After Deployment:**
- [ ] Backend URL works: `https://your-app.onrender.com`
- [ ] Updated Vercel with `NEXT_PUBLIC_BACKEND_URL`
- [ ] Updated CORS in backend with Vercel URL
- [ ] Pushed CORS update to GitHub
- [ ] Tested Socket.IO connection in browser

---

## 🎯 **QUICK REFERENCE:**

**Render Dashboard:**
https://dashboard.render.com

**Your Backend URL:**
`https://your-os-backend.onrender.com`

**Environment Variables Needed:**
```
NODE_ENV=production
PORT=10000
DATABASE_URL=your_supabase_url
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

**Build Commands:**
```
Build: npm install && npm run build
Start: npm run start:prod
```

---

## 🚀 **READY TO DEPLOY?**

**Follow steps 1-9 above!**

**Estimated Time:** 10-15 minutes

**Result:** 
- ✅ Backend running on Render
- ✅ Frontend on Vercel
- ✅ Socket.IO working
- ✅ Full stack live!

**Need help? Let me know at which step you get stuck!** 💪
