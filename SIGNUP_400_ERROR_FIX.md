# Signup 400 Error - Troubleshooting Guide

## The Problem

You're getting a **400 Bad Request** error when trying to sign up:

```
POST https://alphery-os-backend.onrender.com/auth/signup 400 (Bad Request)
```

## Most Likely Causes

### 1. **Firebase Admin SDK Not Configured on Render** ⚠️

The backend needs Firebase Admin credentials to create users. Check if these environment variables are set on Render:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### 2. **Email Already Exists**

If you've tried signing up before, the email might already be in the database.

### 3. **Invalid Input Data**

The signup request might be missing required fields.

## Quick Fixes

### Fix 1: Use Local Backend (Recommended for Development)

Instead of using the Render backend, run the backend locally:

1. **Open a new terminal**
2. **Navigate to backend:**
   ```powershell
   cd "d:\Github Desktop\operating-system\backend"
   ```

3. **Install dependencies (if not done):**
   ```powershell
   npm install
   ```

4. **Start the backend:**
   ```powershell
   npm run start:dev
   ```

5. **Update frontend to use local backend:**
   - Open `.env.local`
   - Change:
     ```
     NEXT_PUBLIC_BACKEND_URL=https://alphery-os-backend.onrender.com
     ```
   - To:
     ```
     NEXT_PUBLIC_BACKEND_URL=http://localhost:10000
     ```

6. **Restart frontend:**
   - Stop `npm run dev` (Ctrl+C)
   - Run `npm run dev` again

### Fix 2: Check Render Environment Variables

1. Go to https://dashboard.render.com
2. Find your `alphery-os-backend` service
3. Go to **Environment** tab
4. Verify these variables exist:
   - `FIREBASE_PROJECT_ID` = `alphery-1`
   - `FIREBASE_CLIENT_EMAIL` = `firebase-adminsdk-fbsvc@alphery-1.iam.gserviceaccount.com`
   - `FIREBASE_PRIVATE_KEY` = (the long private key from `.env`)

5. If missing, add them and **redeploy**

### Fix 3: Try a Different Email

If you've tried signing up before, try a completely new email address.

### Fix 4: Check Backend Logs

1. Go to Render dashboard
2. Click on your backend service
3. Go to **Logs** tab
4. Look for the actual error message when you try to sign up
5. Share the error message for more specific help

## Alternative: Use Guest Mode for Now

While we fix the signup issue, you can use the OS in guest/demo mode:

1. **Refresh the page**
2. Click **"Explore as Guest"** on the login screen
3. This gives you a demo environment (limited features)

## Testing Signup Locally

Once you have the local backend running, try signing up with:

- **Name:** Test User
- **Email:** test@example.com
- **Password:** test123

If it works locally, the issue is definitely with the Render deployment.

## Expected Behavior

When signup works correctly, you should see:

```
┌─────────────────────────────┐
│   🎉 Access Granted         │
│                             │
│   Identity Token            │
│   ┌─────────────────────┐   │
│   │    AU123456        │   │
│   └─────────────────────┘   │
│                             │
│   [Proceed to Login]        │
└─────────────────────────────┘
```

## Debug Information Needed

To help debug further, please provide:

1. **Browser console full error** (expand the 400 error to see response body)
2. **Render backend logs** (from the time you tried to sign up)
3. **Email you're trying to use** (to check if it exists)

## Next Steps

**Recommended approach:**

1. ✅ **Run backend locally** (easiest fix)
2. ✅ **Update `.env.local`** to point to `localhost:10000`
3. ✅ **Restart frontend**
4. ✅ **Try signup again**

This will bypass the Render deployment issues and let you create tenants immediately!

---

**Need the backend running command?**

```powershell
# Terminal 1: Backend
cd "d:\Github Desktop\operating-system\backend"
npm run start:dev

# Terminal 2: Frontend (already running)
# Keep npm run dev running
```

Then update `.env.local` and refresh your browser!
