# 🔧 Firebase Mock Mode Diagnostic Guide

## Current Issue
Your backend is running in **Firebase MOCK mode**, which means:
- ❌ Firebase credentials are not being read from environment variables
- ❌ Custom tokens generated are fake and won't work with real Firebase
- ❌ File Manager permission errors will persist

## Quick Diagnostic Steps

### Step 1: Check Backend Health
Open this URL in your browser:
```
https://alphery-os-backend.onrender.com/health
```

You should see something like:
```json
{
  "status": "ok",
  "firebase": {
    "hasProjectId": true,
    "hasClientEmail": true,
    "hasPrivateKey": true,
    "privateKeyLength": 1234,
    "isConfigured": true
  }
}
```

**If `isConfigured: false`**, one or more Firebase credentials are missing.

### Step 2: Check Render Environment Variables
Go to your Render dashboard:
1. Navigate to your backend service
2. Click "Environment" tab
3. Verify these variables exist:

```
FIREBASE_PROJECT_ID=alphery-1
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@alphery-1.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDSxd8n+meGZEZW\n..."
```

**CRITICAL**: The `FIREBASE_PRIVATE_KEY` must:
- Start with `"-----BEGIN PRIVATE KEY-----\n`
- Have `\n` (backslash-n) for newlines, NOT actual line breaks
- End with `\n-----END PRIVATE KEY-----\n"`
- Be wrapped in double quotes

### Step 3: Check Render Logs
In Render dashboard:
1. Go to "Logs" tab
2. Look for one of these messages on startup:

**✅ SUCCESS:**
```
✅ [FIREBASE] Admin SDK initialized successfully with Production Credentials
```

**❌ FAILURE:**
```
⚠️ [FIREBASE] Missing credentials. Using MOCK mode for local development.
```

If you see the failure message, check the credential check output:
```
🔍 [FIREBASE] Credential check: {
  hasProjectId: true/false,
  hasClientEmail: true/false,
  hasPrivateKey: true/false,
  privateKeyLength: 0
}
```

## Common Issues & Fixes

### Issue 1: Private Key Has Literal Newlines
**Symptom:** `privateKeyLength` is very small (< 100)

**Fix:** The key must be on ONE line with `\n` escape sequences:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADA...\n-----END PRIVATE KEY-----\n"
```

NOT multiple lines like:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADA...
-----END PRIVATE KEY-----"
```

### Issue 2: Missing Quotes
**Symptom:** Render shows the variable but backend doesn't see it

**Fix:** Wrap the entire private key in double quotes in Render's environment variable editor.

### Issue 3: Deployment Not Triggered
**Symptom:** Code is pushed but Render still shows old behavior

**Fix:** 
1. Go to Render dashboard
2. Click "Manual Deploy" > "Deploy latest commit"
3. Wait for build to complete (usually 2-3 minutes)

## Verification Checklist

After fixing environment variables:

- [ ] `/health` endpoint shows `isConfigured: true`
- [ ] Render logs show `✅ [FIREBASE] Admin SDK initialized successfully`
- [ ] Login attempt shows `[Auth] Syncing Firebase identity...` in browser console
- [ ] No more `mock@example.com` in logs
- [ ] File Manager loads without permission errors

## If Still Not Working

### Check 1: Restart Render Service
Sometimes environment variable changes don't take effect until restart:
1. In Render dashboard, go to "Settings"
2. Scroll to bottom
3. Click "Suspend" then "Resume"

### Check 2: Verify Private Key Format
Copy your private key from the Firebase service account JSON and ensure:
1. It starts with `-----BEGIN PRIVATE KEY-----`
2. It ends with `-----END PRIVATE KEY-----`
3. All newlines are replaced with `\n` (literal backslash-n)
4. The entire thing is wrapped in double quotes

### Check 3: Test Locally First
Set the same environment variables in your local `backend/.env`:
```
FIREBASE_PROJECT_ID=alphery-1
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@alphery-1.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

Run `npm run start:dev` and check if you see:
```
✅ [FIREBASE] Admin SDK initialized successfully with Production Credentials
```

If it works locally but not on Render, the issue is with how Render is reading the environment variables.

## Expected Flow (When Working)

1. **User logs in** with AU000001
2. **Backend** (`/auth/login`):
   - Verifies credentials
   - Creates Firebase Custom Token using **real** Firebase Admin SDK
   - Returns token to frontend
3. **Frontend**:
   - Signs into Firebase using custom token
   - Gets authenticated with `platformId` claim
4. **File Manager**:
   - Waits for Firebase auth to complete
   - Accesses Firestore with valid credentials
   - ✅ No permission errors!

## Current State vs. Expected State

### Current (MOCK Mode)
```
Backend: ⚠️ MOCK mode
  ↓
Mock token generated
  ↓
Frontend tries to use mock token with real Firebase
  ↓
❌ Firebase rejects it
  ↓
File Manager: Permission Denied
```

### Expected (Production Mode)
```
Backend: ✅ Real Firebase Admin
  ↓
Real custom token generated
  ↓
Frontend signs in with real token
  ↓
✅ Firebase accepts it + sets claims
  ↓
File Manager: Access Granted
```

## Next Steps

1. **Check `/health` endpoint** - This will tell you immediately if Firebase is configured
2. **Fix environment variables** if needed
3. **Trigger manual deploy** on Render
4. **Wait 2-3 minutes** for deployment
5. **Check Render logs** for success message
6. **Test login** - should now work!

---

**Need Help?**
Share the output of `https://alphery-os-backend.onrender.com/health` and I can tell you exactly what's wrong.
