# ✅ Firebase Integration Checklist

## 📋 What You Need to Do

Use this checklist to complete your Firebase setup. Check off each item as you complete it.

---

## ☐ Step 1: Create Firebase Project (5 min)

1. **☐** Go to https://console.firebase.google.com/
2. **☐** Click "Add Project" or "Create a Project"
3. **☐** Enter project name: `alphery-os` (or your choice)
4. **☐** Choose whether to enable Google Analytics
5. **☐** Click "Create Project"
6. **☐** Wait for project to be created
7. **☐** Click "Continue" when ready

---

## ☐ Step 2: Enable Authentication (3 min)

1. **☐** In left sidebar, click: **Build** → **Authentication**
2. **☐** Click "Get Started"

### Email/Password:
3. **☐** Click on "Email/Password" provider
4. **☐** Toggle "Enable" to ON
5. **☐** Click "Save"

### Google Sign-In:
6. **☐** Click on "Google" provider
7. **☐** Toggle "Enable" to ON
8. **☐** Enter your support email
9. **☐** Click "Save"

---

## ☐ Step 3: Create Firestore Database (3 min)

1. **☐** In left sidebar, click: **Build** → **Firestore Database**
2. **☐** Click "Create database"
3. **☐** Select **Production mode** (recommended)
4. **☐** Choose location (closest to your users)
5. **☐** Click "Enable"
6. **☐** Wait for database to be created

### Security Rules:
7. **☐** Click "Rules" tab
8. **☐** Replace rules with:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
9. **☐** Click "Publish"

---

## ☐ Step 4: Get Firebase Configuration (2 min)

1. **☐** Click the gear icon (⚙️) next to "Project Overview"
2. **☐** Click "Project settings"
3. **☐** Scroll down to "Your apps" section
4. **☐** If no web app exists, click Web icon (`</>`)
5. **☐** Enter app nickname: `alphery-os-web`
6. **☐** **Click "Register app"
7. **☐** Copy the `firebaseConfig` object (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "alphery-os.firebaseapp.com",
  projectId: "alphery-os",
  storageBucket: "alphery-os.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456:web:abc123"
};
```

---

## ☐ Step 5: Configure Your Local Project (2 min)

1. **☐** Open your project folder
2. **☐** Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```

3. **☐** Open `.env.local` in your editor

4. **☐** Paste your Firebase values (from Step 4):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=alphery-os.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=alphery-os
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=alphery-os.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abc123
```

5. **☐** Save the file

---

## ☐ Step 6: Test Locally (2 min)

1. **☐** In terminal, stop your dev server (Ctrl+C)

2. **☐** Restart dev server:
   ```bash
   npm run dev
   ```

3. **☐** Open http://localhost:3000

4. **☐** You should see the Firebase auth screen!

5. **☐** Try creating an account:
   - Click "Don't have an account? Sign Up"
   - Enter name, email, password
   - Click "Sign Up"

6. **☐** Check Firebase Console → Authentication → Users
   - Your new user should appear!

---

## ☐ Step 7: Deploy to Vercel (5 min)

### Add Environment Variables:
1. **☐** Go to https://vercel.com/dashboard
2. **☐** Click on your project
3. **☐** Click "Settings" → "Environment Variables"

4. **☐** Add each Firebase variable:
   - Name: `NEXT_PUBLIC_FIREBASE_API_KEY`
   - Value: (paste from .env.local)
   - Environment: All (Production, Preview, Development)
   - Click "Save"

5. **☐** Repeat for all 6 variables:
   - ☐ `NEXT_PUBLIC_FIREBASE_API_KEY`
   - ☐ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - ☐ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - ☐ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - ☐ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - ☐ `NEXT_PUBLIC_FIREBASE_APP_ID`

### Push to GitHub:
6. **☐** In terminal:
   ```bash
   git add .
   git commit -m "Add Firebase integration"
   git push
   ```

7. **☐** Vercel will auto-deploy!

8. **☐** Wait for deployment to finish

9. **☐** Visit your live site (e.g., https://yourapp.vercel.app)

---

## ☐ Step 8: Authorize Domain in Firebase (1 min)

1. **☐** Copy your Vercel domain (e.g., `alphery-os.vercel.app`)

2. **☐** Go to Firebase Console

3. **☐** Click: **Build** → **Authentication** → **Settings** tab

4. **☐** Scroll to "Authorized domains"

5. **☐** Click "Add domain"

6. **☐** Paste your Vercel domain

7. **☐** Click "Add"

---

## ☐ Step 9: Test Live Site (2 min)

1. **☐** Visit your Vercel URL

2. **☐** Try signing up with a new account

3. **☐** Try signing in with Google

4. **☐** Check Firebase Console → Authentication → Users
   - New users should appear!

5. **☐** Check Firestore Database → Data
   - User documents should be created!

---

## 🎉 Done!

### ✅ What You've Accomplished:

- ✅ Firebase project created
- ✅ Authentication enabled (Email + Google)
- ✅ Firestore database set up
- ✅ Local development configured
- ✅ Deployed to Vercel
- ✅ Multi-user cloud OS is live!

---

## 📊 Test Your Setup

### Local Test:
```bash
# Terminal
npm run dev

# Browser
http://localhost:3000
→ Should see auth screen
→ Sign up/login should work
→ Desktop should load
```

### Production Test:
```
# Browser
https://your-app.vercel.app
→ Should see auth screen
→ Sign up/login should work
→ Desktop should load
→ Data syncs to Firestore
```

---

## 🐛 Troubleshooting

### Problem: "Firebase not configured"
- ☐ Check .env.local exists
- ☐ Check all variables are filled
- ☐ Restart dev server

### Problem: Can't sign in on Vercel
- ☐ Check environment vars in Vercel dashboard
- ☐ Check domain is authorized in Firebase
- ☐ Redeploy if you just added env vars

### Problem: Permission denied
- ☐ Check Firestore security rules
- ☐ Make sure user is authenticated

---

## 📚 Next Steps

Now that Firebase is set up, you can:

1. **Extend Functionality**
   - Save desktop state (open apps, positions)
   - Implement file upload/download
   - Add user profile settings
   - Enable file sharing between users

2. **Customize**
   - Change colors, logos
   - Add more apps
   - Create custom themes

3. **Monitor**
   - Check Firebase Console for usage
   - Monitor authentication success/failures
   - Watch database growth

---

## 🎓 Learn More

- [Firebase Docs](https://firebase.google.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)

---

**Congratulations! Your Alphery OS is now cloud-enabled! 🎉**

