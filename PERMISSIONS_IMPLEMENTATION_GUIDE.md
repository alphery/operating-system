# User Permissions System - Implementation Guide

## Overview
This guide explains how to implement role-based access control for:
1. **Alphery Projects**: Control which users can see which projects
2. **App Store**: Control which users can see which apps
3. **Super Admin**: Keep full access for alpherymail@gmail.com

## What's Already Done ✅

### 1. AuthContext Updated
- Added `allowedProjects` and `allowedApps` arrays to UserData interface
- These arrays are initialized during signup/Google login
- Super admins get empty arrays (empty = full access)
- Regular users get empty arrays (will be populated by admin)

### 2. User Permissions Manager Created
- New app at: `components/apps/user_permissions.js`
- Added to apps.config.js as "User Permissions"
- Super admin-only interface to manage user permissions
- Features:
  - Select any user
  - Toggle project access (checkboxes for each project)
  - Toggle app access (checkboxes for each app)
  - Save button to update Firestore

### 3. Projects App Wrapper Created
- New file: `components/apps/projects_with_auth.js`
- HOC that injects user auth data into Projects component
- apps.config.js updated to use this wrapper

## What You Need to Do 📝

### Step 1: Update Projects Filtering

Open `components/apps/projects.js` and find the `subscribeToProjects` method (around line 211).

Replace this code:
```javascript
this.unsubscribeProjects = onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    this.setState({ projects, loading: false });
}, (error) => {
    console.error('Error loading projects:', error);
    this.setState({ loading: false });
});
```

With this code:
```javascript
this.unsubscribeProjects = onSnapshot(q, (snapshot) => {
    const allProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    
    // Filter projects based on user permissions
    const user = this.props.userData || this.props.user;
    const isSuperAdmin = user && user.role === 'super_admin';
    
    let filteredProjects = allProjects;
    if (!isSuperAdmin && user && user.allowedProjects) {
        // Show only projects the user has access to
        filteredProjects = allProjects.filter(p => user.allowedProjects.includes(p.id));
    } else if (!isSuperAdmin) {
        // If not admin and no allowedProjects array, show nothing
        filteredProjects = [];
    }
    
    this.setState({ projects: filteredProjects, loading: false });
}, (error) => {
    console.error('Error loading projects:', error);
    this.setState({ loading: false });
});
```

### Step 2: Update App Store Filtering

Open `components/apps/app_store.js` and find the render method where `displayApps` is filtered (around line 224).

Add this code right after line 228 (after category filtering):

```javascript
// Permission-based app filtering
const user = this.props.user;
const userData = this.props.userData;
const isSuperAdmin = userData && userData.role === 'super_admin';

if (!isSuperAdmin && userData && userData.allowedApps && userData.allowedApps.length > 0) {
    displayApps = displayApps.filter(app => userData.allowedApps.includes(app.id));
} else if (!isSuperAdmin && user) {
    // If user has allowedApps defined but it's empty, show no apps (except system apps)
    const systemApps = ['app-store', 'settings', 'users'];
    if (userData && userData.allowedApps && userData.allowedApps.length === 0) {
        displayApps = displayApps.filter(app => systemApps.includes(app.id));
    }
}
```

## How to Use the System 🎯

### As Super Admin (alpherymail@gmail.com)

1. **Open User Permissions App**
   - Launch "User Permissions" from App Store or desktop
   
2. **Select a User**
   - Click on any user from the left sidebar
   
3. **Grant Project Access**
   - Check the boxes for projects this user should see
   - Unchecked projects will be hidden from that user
   
4. **Grant App Access**
   - Check the boxes for apps this user should access
   - Unchecked apps won't appear in their App Store
   
5. **Save Changes**
   - Click "Save Permissions" button
   - Changes are saved to Firestore immediately

### As Regular User

- **Alphery Projects**: Only shows projects you have access to
- **App Store**: Only shows apps you have permission to see
- System apps (Settings, App Store, Users) are always visible
- If you have no permissions granted, you'll see empty lists

## Permission Logic 🔐

### Projects Access
- **Super Admin**: Sees ALL projects automatically
- **Regular User**: 
  - If `allowedProjects` array is empty → sees NO projects
  - If `allowedProjects` array has IDs → sees only those projects
  
### Apps Access
- **Super Admin**: Sees ALL apps automatically
- **Regular User**:
  - System apps (app-store, settings, users) always visible
  - If `allowedApps` array is empty → sees only system apps
  - If `allowedApps` array has IDs → sees system apps + allowed apps

## Database Structure 📊

User document in Firestore `users` collection:
```javascript
{
uid: "user123",
  email: "user@example.com",
  displayName: "John Doe",
  role: "user", // or "super_admin"
  approvalStatus: "approved",
  allowedProjects: ["project1", "project2"], // Project IDs
  allowedApps: ["projects", "chrome", "vscode"], // App IDs
  // ... other fields
}
```

## Testing Checklist ✅

1. **Create Test User**
   - Sign up with a new email (not alpherymail@gmail.com)
   
2. **Grant Permissions as Admin**
   - Login as alpherymail@gmail.com
   - Open User Permissions app
   - Select the test user
   - Grant access to 1-2 projects
   - Grant access to 1-2 apps
   - Save
   
3. **Test as Regular User**
   - Login as test user
   - Open Alphery Projects → should see only granted projects
   - Open App Store → should see only granted apps + system apps
   
4. **Test as Super Admin**
   - Login as alpherymail@gmail.com
   - Open Alphery Projects → should see ALL projects
   - Open App Store → should see ALL apps
   - User Permissions app should be accessible

## Troubleshooting 🔧

### User sees no projects
- Check their `allowedProjects` array in Firestore
- Make sure project IDs match exactly
- Verify user is approved (`approvalStatus: "approved"`)

### User sees all projects (but shouldn't)
- Check if user role is `super_admin` (should be `user`)
- Verify permission filtering code is active in `subscribeToProjects`

### User Permissions app doesn't show
- Verify you're logged in as super admin
- Check role is exactly `super_admin` in Firestore
- Check apps.config.js includes the app

### Changes don't take effect
- Refresh the page after saving permissions
- Check browser console for errors
- Verify Firestore write succeeded

## Future Enhancements 💡

1. **Project-level permissions**
   - Read-only vs Read-Write access
   - Different roles per project

2. **Group-based permissions**
   - Create user groups (e.g., "Developers", "Managers")
   - Assign permissions to groups
   - Users inherit group permissions

3. **Permission templates**
   - Pre-defined permission sets
   - Quick apply common configurations

4. **Activity logging**
   - Track who accessed what
   - Permission change history
   - Audit trail

## Files Modified 📝

1. `/context/AuthContext.tsx` - Added permission fields
2. `/components/apps/user_permissions.js` - NEW: Permission manager UI
3. `/components/apps/projects_with_auth.js` - NEW: Projects wrapper with auth
4. `/apps.config.js` - Added User Permissions app, updated Projects import
5. `/components/apps/projects.js` - Added hasProjectAccess helper (needs filtering update)
6. `/components/apps/app_store.js` - Needs permission filtering (manual step)

## Support 🆘

If you encounter issues:
1. Check browser console for errors
2. Verify Firestore rules allow user data reads/writes
3. Ensure user is properly authenticated
4. Check that arrays are properly formatted in Firestore

Happy coding! 🚀
