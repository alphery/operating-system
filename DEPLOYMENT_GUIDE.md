# 🚀 DEPLOYMENT GUIDE - Updated Stack

## 📊 **Current Setup:**

- ✅ **Frontend (Next.js)** → Already on Vercel
- ✅ **Backend (Nest.js)** → Running locally (needs hosting)
- ✅ **Database** → Supabase (cloud, already live)
- ✅ **Firebase** → Cloud (already live)

---

## 🎯 **What You Need To Do:**

### **Option 1: Deploy Backend Separately** ⭐ RECOMMENDED

**Frontend stays on Vercel, backend goes to Render/Railway**

### **Option 2: Backend-Free Mode**

**Use only Supabase + Firebase** (no custom backend needed)

---

# 📦 **OPTION 1: Deploy Backend (Recommended)**

## **Step 1: Fix Large Files Issue**

### **Find Large Files:**

```bash
# Run this in your project root
find . -type f -size +50M
```

### **Add to .gitignore:**

```bash
# Add these to .gitignore
node_modules/
.next/
dist/
build/
*.log
.env
.env.local
.DS_Store

# Large files (add specific files you found above)
# For example:
# public/videos/large-file.mp4
```

### **Remove from Git History (if already committed):**

```bash
# Remove large files from git
git rm --cached path/to/large/file

# Or use BFG Repo-Cleaner for many files
# Download from: https://reps-cleaner.github.io
```

---

## **Step 2: Deploy Backend to Render** ⭐

**Why Render?**
- ✅ Free tier
- ✅ Auto-deploys from GitHub
- ✅ Easy setup
- ✅ Great for Nest.js

### **A. Create Render Account:**

1. Go to: https://render.com
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**

### **B. Connect Repository:**

1. Select your `operating-system` repo
2. **Root Directory:** `backend`
3. **Environment:** `Node`
4. **Build Command:** `npm install && npm run build`
5. **Start Command:** `npm run start:prod`

### **C. Environment Variables:**

Add these in Render dashboard:

```
DATABASE_URL=your_supabase_connection_string
PORT=3001
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### **D. Deploy:**

Click **"Create Web Service"** → Render will build and deploy!

**You'll get a URL like:** `https://your-app.onrender.com`

---

## **Step 3: Update Frontend for Production Backend**

### **Update `.env.local`:**

```bash
# Add your Render backend URL
NEXT_PUBLIC_BACKEND_URL=https://your-app.onrender.com
```

### **Update `context/SocketContext.tsx`:**

Already done! It uses `process.env.NEXT_PUBLIC_BACKEND_URL`

---

## **Step 4: Update Backend CORS for Vercel**

### **Edit `backend/src/main.ts`:**

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app', // ← Add your Vercel URL
  ],
  credentials: true,
});
```

---

## **Step 5: Push to GitHub & Deploy**

```bash
# Make sure .gitignore is updated
git add .gitignore

# Commit backend changes
git add backend/
git commit -m "feat: add Nest.js backend with Socket.IO"

# Commit frontend changes
git add .
git commit -m "feat: disable StrictMode, add performance optimizations"

# Push to GitHub
git push origin main
```

**What Happens:**
- ✅ Render auto-deploys backend
- ✅ Vercel auto-deploys frontend
- ✅ Everything connects!

---

# 🔧 **OPTION 2: Backend-Free Mode**

**If you don't want to deploy backend**, you can disable it:

### **Remove Socket.IO from Frontend:**

```typescript
// In pages/_app.tsx, remove:
import { SocketProvider } from '../context/SocketContext';

// And remove the wrapper:
<SocketProvider>
  {/* ... */}
</SocketProvider>
```

### **Benefits:**
- ✅ Simpler deployment
- ✅ Only Vercel needed
- ✅ Firebase + Supabase for everything

### **What You Lose:**
- ❌ Real-time Socket.IO features
- ❌ Custom API endpoints

---

# 📋 **DEPLOYMENT CHECKLIST:**

## **Before Pushing to GitHub:**

- [ ] Update `.gitignore` (remove large files)
- [ ] Remove large files from git: `git rm --cached large-file`
- [ ] Set `NODE_ENV=production` in `.env.local`
- [ ] Test build locally: `npm run build`

## **Backend Deployment (Render):**

- [ ] Create Render account
- [ ] Connect GitHub repo
- [ ] Set root directory to `backend`
- [ ] Add environment variables
- [ ] Deploy and get URL

## **Frontend Deployment (Vercel):**

- [ ] Update `NEXT_PUBLIC_BACKEND_URL` in Vercel dashboard
- [ ] Verify Firebase config
- [ ] Verify Supabase config
- [ ] Push to GitHub (auto-deploys)

## **Testing:**

- [ ] Visit Vercel URL
- [ ] Check browser console for errors
- [ ] Test Messenger (Socket.IO)
- [ ] Test Projects (Firebase)
- [ ] Test Settings (Supabase)

---

# 🐛 **Common Issues & Fixes:**

## **Issue 1: "Large files can't push to GitHub"**

**Solution:**
```bash
# Find files over 50MB
find . -type f -size +50M

# Add to .gitignore
echo "path/to/large/file" >> .gitignore

# Remove from git
git rm --cached path/to/large/file

# Commit and push
git commit -m "Remove large files"
git push
```

## **Issue 2: "Backend not connecting on Vercel"**

**Check:**
1. Is `NEXT_PUBLIC_BACKEND_URL` set in Vercel env vars?
2. Did you update CORS in backend?
3. Is Render backend running?

## **Issue 3: "Environment variables not working"**

**Vercel Dashboard:**
1. Go to Project → Settings → Environment Variables
2. Add all `NEXT_PUBLIC_*` variables
3. Redeploy

---

# 🎯 **RECOMMENDED APPROACH:**

## **For Now (Quick):**

1. **Keep backend local** (don't deploy yet)
2. **Deploy frontend only** to Vercel
3. **Use Firebase + Supabase** for data
4. **Disable Socket.IO** temporarily

## **For Production (Later):**

1. **Deploy backend to Render**
2. **Update CORS settings**
3. **Update environment variables**
4. **Enable Socket.IO**

---

# 🚀 **Quick Deploy Commands:**

### **Deploy Frontend Only:**

```bash
# Remove large files
git rm --cached $(find . -type f -size +50M)

# Update .gitignore
echo "*.mp4\n*.webm\n*.mov\nnode_modules/\n.next/" >> .gitignore

# Commit
git add .
git commit -m "fix: remove large files, optimize for deployment"

# Push (Vercel auto-deploys)
git push origin main
```

### **Deploy Backend (Render):**

1. Create Render account: https://render.com
2. New Web Service → Connect repo
3. Root: `backend`
4. Build: `npm install && npm run build`
5. Start: `npm run start:prod`
6. Add env vars
7. Deploy!

---

# 💡 **My Recommendation:**

**FOR NOW:**
- Deploy **frontend only** to Vercel
- Keep **backend local** for dev
- Use this for testing/demo

**FOR PRODUCTION:**
- Deploy **backend to Render** (free tier)
- Update frontend to use production backend URL
- Full stack live!

---

**Want me to help you deploy right now? Tell me which option you want! 🚀**
