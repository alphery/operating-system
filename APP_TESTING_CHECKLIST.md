# 🧪 Alphery OS - App Testing Checklist

## Current Stack Status:
- ✅ **Frontend**: Next.js running on port 3000
- ✅ **Backend**: Nest.js running on port 3001
- ✅ **Socket.IO**: Connected and working
- ✅ **Firebase**: Still active (Auth + Firestore)
- ⏳ **Supabase**: Connected but not migrated yet
- ⏳ **Prisma**: Temporarily disabled (Prisma 7 compatibility)

---

## 🔍 Critical Apps to Test

### 1. **Messenger** 🟡 HIGH PRIORITY
**Tech Used**: Firebase Firestore, Firebase Auth  
**Test:**
- [ ] Open Messenger
- [ ] Can you see existing conversations?
- [ ] Send a test message
- [ ] Does it sync in real-time?
- [ ] Check if emoji picker works

**Expected**: Should work 100% (still uses Firebase)

---

### 2. **Alphery Projects** 🟡 HIGH PRIORITY
**Tech Used**: Firebase Firestore, RBAC permissions  
**Test:**
- [ ] Open Projects app
- [ ] Can you see your projects list?
- [ ] Create a new project
- [ ] Edit a project
- [ ] Check permissions (as super admin you should see all)

**Expected**: Should work 100% (still uses Firebase)

---

### 3. **Alphery Users** 🟡 HIGH PRIORITY
**Tech Used**: Firebase Auth, Firestore  
**Test:**
- [ ] Open Users app
- [ ] Can you see all users?
- [ ] View user details
- [ ] Check approval system
- [ ] Verify super admin controls work

**Expected**: Should work 100% (still uses Firebase)

---

### 4. **User Permissions Manager** 🟡 ADMIN FEATURE
**Tech Used**: Firebase Firestore  
**Test:**
- [ ] Open User Permissions
- [ ] Can you assign/revoke project access?
- [ ] Can you toggle app permissions?
- [ ] Does it save correctly?

**Expected**: Should work 100%

---

### 5. **File Manager** 🟢 LOW RISK
**Tech Used**: Browser File System API (local)  
**Test:**
- [ ] Open Files
- [ ] Navigate folders (Documents, Pictures, etc.)
- [ ] Upload a file
- [ ] Create a new folder
- [ ] Delete a file
- [ ] Check storage indicator

**Expected**: Should work 100% (independent of backend changes)

---

### 6. **Settings** 🟢 LOW RISK
**Tech Used**: Firebase Firestore for user settings  
**Test:**
- [ ] Open Settings
- [ ] Change wallpaper
- [ ] Does it save?
- [ ] Check other settings tabs

**Expected**: Should work 100%

---

### 7. **Chrome/Browser** 🟢 LOW RISK
**Tech Used**: Pure frontend  
**Test:**
- [ ] Open Chrome
- [ ] Load a website
- [ ] Navigate between sites
- [ ] Check if new tabs work

**Expected**: Should work 100%

---

### 8. **App Store** 🟢 LOW RISK
**Tech Used**: Firestore for storing disabled apps  
**Test:**
- [ ] Open App Store
- [ ] Can you install/uninstall apps?
- [ ] Do changes persist?

**Expected**: Should work 100%

---

### 9. **Calendar** 🟢 LOW RISK
**Tech Used**: Pure frontend  
**Test:**
- [ ] Open Calendar
- [ ] View current month
- [ ] Navigate months

**Expected**: Should work 100%

---

### 10. **Weather** 🟢 LOW RISK
**Tech Used**: External API  
**Test:**
- [ ] Open Weather
- [ ] Does it load your location?
- [ ] Shows current weather?

**Expected**: Should work 100%

---

### 11. **🔴 Realtime Demo** 🆕 NEW APP
**Tech Used**: Socket.IO (new backend)  
**Test:**
- [ ] Can you find it in your apps?
- [ ] Open it
- [ ] Does it show "Connected"?
- [ ] Send a message
- [ ] Open in two tabs → does it sync?

**Expected**: Should work if Socket.IO connected

---

## 🚨 Potential Issues to Watch For:

### Issue 1: Context Provider Order
**Symptom**: Apps crash on load  
**Cause**: Wrong provider order in _app.tsx  
**Status**: ✅ Fixed (SupabaseAuth → Socket → Firebase)

### Issue 2: Socket.IO Dependency
**Symptom**: Apps wait for Socket.IO before loading  
**Cause**: useSocket() called too early  
**Status**: ✅ Fixed (Socket doesn't block Firebase apps)

### Issue 3: Firebase Still Works
**Symptom**: Firebase apps don't work  
**Status**: ✅ Should be fine - we only ADDED new tech, didn't remove Firebase

---

## 📋 Testing Order (Recommended):

1. **Start Simple** → Test File Manager, Calendar, Weather
2. **Test Core Auth** → Open Settings, check if your profile loads
3. **Test Messenger** → Most critical business app
4. **Test Projects** → Second most critical
5. **Test User Management** → Admin features
6. **Test New Stack** → Realtime Demo app

---

## 🔧 If Something Breaks:

### App won't open
- Check browser console for errors
- Look for "undefined" or "null" errors
- Report the exact error message

### Firebase apps slow
- Check if Socket.IO is blocking (shouldn't be)
- Look for connection timeout errors

### Permission errors
- Check if you're still logged in as super admin
- Verify Firebase Auth is working

---

## ✅ Success Criteria:

- [ ] All Firebase apps work exactly as before
- [ ] Socket.IO demo connects and works
- [ ] No console errors
- [ ] Performance is good
- [ ] Ready to start ERP development

---

**Current Status**: Ready for Testing  
**Next Step**: Test apps → Fix any issues → Start ERP

**Start with opening Messenger and Projects - these are your most critical apps!**
