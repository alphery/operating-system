# 🔥 Firebase Setup Guide for Alphery OS

## Overview
This guide will help you set up Firebase for your Alphery OS to enable:
- ✅ User authentication (Email/Password & Google OAuth)
- ✅ Cloud data storage (Firestore)
- ✅ User sessions managed globally
- ✅ Multi-user support with isolated data

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or "Create a Project"
3. Enter project name: `alphery-os` (or your choice)
4. Enable/Disable Google Analytics (your choice)
5. Click "Create Project"

## Step 2: Enable Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click "Get Started"
3. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"
4. Enable **Google Sign-In**:
   - Click on "Google"
   - Toggle "Enable"
   - Enter support email
   - Click "Save"

## Step 3: Create Firestore Database

1. In Firebase Console, go to **Build > Firestore Database**
2. Click "Create Database"
3. Choose **Production mode** (or Test mode for development)
4. Select a location (choose closest to your users)
5. Click "Enable"

### Firestore Security Rules (Recommended):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 4: Enable Storage (Optional - for file uploads)

1. In Firebase Console, go to **Build > Storage**
2. Click "Get Started"
3. Choose production/test mode
4. Click "Done"

## Step 5: Get Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon `</>`
4. Register your app with a nickname: `alphery-os-web`
5. Copy the `firebaseConfig` object

## Step 6: Configure Your App

1. **Create `.env.local` file** in your project root:

```bash
cp .env.local.example .env.local
```

2. **Edit `.env.local`** and paste your Firebase config values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=alphery-os.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=alphery-os
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=alphery-os.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=12345...
NEXT_PUBLIC_FIREBASE_APP_ID=1:12345...
```

## Step 7: Deploy to Vercel

1. **Add environment variables in Vercel**:
   - Go to your Vercel project dashboard
   - Click "Settings" > "Environment Variables"
   - Add all `NEXT_PUBLIC_FIREBASE_*` variables
   - Click "Save"

2. **Redeploy**:
   ```bash
   git add .
   git commit -m "Add Firebase integration"
   git push
   ```

Vercel will automatically redeploy your app with Firebase enabled!

## Step 8: Test Your Setup

1. Visit your deployed app
2. You should see the new authentication screen
3. Try creating an account with email/password
4. Try signing in with Google
5. Your data will now be saved to Firebase!

## Features Enabled

### ✅ Multi-User Support
- Each user has their own account
- Data is isolated per user
- Users can access their data from any device

### ✅ Authentication Methods
- Email & Password signup/login
- Google OAuth sign-in
- Demo mode (falls back to local storage)

### ✅ Cloud Data Storage
- User profiles stored in Firestore
- Settings synced across devices
- Files and apps data (ready to extend)

### ✅ Session Management
- Persistent login (stays logged in)
- Secure authentication tokens
- Auto-refresh on page reload

## Firestore Data Structure

```
users (collection)
  ├─ {userId} (document)
      ├─ uid: string
      ├─ email: string
      ├─ displayName: string
      ├─ photoURL: string
      ├─ createdAt: timestamp
      ├─ settings: object
      │   ├─ wallpaper: string
      │   └─ theme: string
      ├─ files: array
      └─ apps: array
```

## Next Steps

### Extend Functionality:
1. **Save Desktop State**: Store open apps, window positions
2. **File System**: Store files in Firestore/Storage
3. **Settings Sync**: Save wallpaper, theme preferences
4. **Sharing**: Share files between users
5. **Real-time Updates**: Use Firestore listeners for live sync

## Troubleshooting

### Error: "Firebase not configured"
- Make sure `.env.local` exists with all variables
- Restart dev server: `npm run dev`
- For Vercel: Check environment variables in dashboard

### Error: "Permission denied"
- Check Firestore security rules
- Make sure user is authenticated

### Error: "Auth domain not authorized"
- In Firebase Console > Authentication > Settings
- Add your Vercel domain to "Authorized domains"

## Important Notes

⚠️ **Never commit `.env.local` to Git!** (It's in `.gitignore`)
✅ **Always use environment variables in Vercel**
🔒 **Use production mode rules for Firestore**
🌍 **Add your domain to Firebase authorized domains**

## Support

For issues, check:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Deployment](https://vercel.com/docs)

---

**Alphery OS** is now cloud-enabled! 🚀
