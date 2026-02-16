# How to Exit Emergency Mode and Create Tenants

## Current Situation

You're in **Emergency God Mode** which is a **local-only, offline fallback mode**. This mode:
- ✅ Works without backend authentication
- ✅ Allows you to explore the OS interface
- ❌ **Cannot create tenants** (requires real backend authentication)
- ❌ Cannot access multi-user features
- ❌ Cannot sync data to the cloud

## Solution: Proper Login

To create tenants and use full backend features, you need to **exit emergency mode** and **log in properly**.

### Option 1: Sign Up (New User) ⭐ RECOMMENDED

1. **Refresh the page** to see the login screen
2. Click **"Sign Up"** tab
3. Fill in your details:
   - Name
   - Mobile (optional)
   - Email
   - Password (min 6 characters)
4. Click **"Create Account"**
5. You'll receive a **Custom UID** (like `AU000001`)
6. **Save this UID** - you'll need it to log in!
7. Click **"Proceed to Login"**
8. Enter your **UID** and **Password**
9. Click **"Enter Workspace"**

### Option 2: Log In (Existing User)

If you already have an account:

1. **Refresh the page**
2. Enter your **Custom UID** (format: `AUXXXXXX`)
3. Enter your **Password**
4. Click **"Enter Workspace"**

### Option 3: Guest Mode (Limited Features)

If you just want to explore:

1. **Refresh the page**
2. Click **"Explore as Guest"**
3. This gives you a demo environment (still limited, no tenant creation)

## Quick Commands to Exit Emergency Mode

### Method 1: Clear Storage and Refresh

Open browser console (F12) and run:

\`\`\`javascript
// Clear emergency mode
localStorage.removeItem('alphery_session_v2');
localStorage.removeItem('alphery_tenant_v2');

// Refresh page
location.reload();
\`\`\`

### Method 2: Sign Out

If you see a logout button in the OS, click it to return to the login screen.

## After Proper Login

Once you're logged in with real credentials, you'll be able to:

✅ **Create Tenants** - Full access to platform administration
✅ **Manage Users** - Add/remove users from your workspace
✅ **Configure Apps** - Enable/disable apps for your organization
✅ **Real-time Sync** - All changes saved to backend
✅ **Multi-device Access** - Login from anywhere

## Test Credentials (If Backend Has Demo Data)

If your backend has demo users, you might be able to use:

- **UID:** `AU000001` (or similar)
- **Password:** Check your backend seed data

## Troubleshooting

### "Invalid User ID" Error
- Make sure you've signed up first
- UID format must be `AUXXXXXX` (uppercase)
- Check if backend is running: https://alphery-os-backend.onrender.com

### "Authentication Failed" Error
- Verify your password is correct
- If you just signed up, make sure Firebase is configured
- Check browser console for detailed errors

### Backend Not Responding
- Render free tier has cold starts (wait 15-30 seconds)
- Check if backend is online: https://alphery-os-backend.onrender.com
- Look for "Backend waking up" messages in console

## Why Emergency Mode Exists

Emergency mode is a **safety feature** that allows the OS to work even when:
- Backend is down
- Network is unavailable  
- Authentication fails
- You're developing offline

It's **not meant for production use** - it's a fallback for development and emergencies.

## Next Steps

1. **Refresh your browser** → `http://localhost:3000`
2. **Sign up** with your email
3. **Save your UID** (you'll need it!)
4. **Log in** with UID + Password
5. **Open Alphery Access** app
6. **Create your first tenant** 🎉

---

**Need Help?**
- Check console logs (F12) for errors
- Verify backend is running
- Make sure Firebase is configured in `.env.local`
