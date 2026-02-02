# 🏁 FINAL STEPS TO LIVE SYSTEM

## 1️⃣ Fix "WebSocket connection failed" (Frontend)
Your Vercel frontend is still trying to talk to `localhost`! This is why you see the error.

**You MUST do this:**
1.  Go to **Vercel Dashboard**.
2.  Select your Project -> **Settings** -> **Environment Variables**.
3.  Add/Update this variable:
    *   **Key:** `NEXT_PUBLIC_BACKEND_URL`
    *   **Value:** `https://alphery-os-backend.onrender.com`
4.  **Save**.
5.  Go to **Deployments** tab -> Click the 3 dots on the latest deployment -> **Redeploy**.

**Result:** The frontend will now talk to the live backend on Render instead of your laptop.

---

## 2️⃣ Fix "Failed to connect to database" (Backend)
Your backend is running (`Nest application successfully started`), but Supabase is rejecting the connection or timing out.

**You MUST do this:**
1.  Go to **Render Dashboard**.
2.  Select your Service -> **Environment**.
3.  Edit `DATABASE_URL`.
4.  **Append** this to the end of the URL value:
    `?connect_timeout=30`
    *   Example: `postgres://...?connect_timeout=30`
5.  **Save Changes**. Render will restart the app automatically.

**Result:** This gives the "slow" request more time to connect to Supabase, often fixing the "Can't reach database" error in serverless environments.

---

## 3️⃣ Manifest Warning
I fixed this in code (`public/manifest.json`). The next Vercel deployment (Step 1) will resolve it.

**DO THESE STEPS NOW.** 
Everything else is perfect. 🚀
