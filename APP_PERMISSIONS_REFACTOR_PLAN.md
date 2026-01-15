# App Permissions & Installation Refactor Plan

## Problem Statement
Currently, when a Super Admin grants app permissions to a user, those apps appear directly on the user's desktop/dock. This is not realistic behavior.

## Desired Behavior

### 1. Permission Model
- **Permissions** = What apps a user **CAN** install (visible in App Store)
- **Installation** = What apps a user **HAS** installed (visible on desktop/dock)

### 2. User Flows

#### Super Admin Flow:
1. Super Admin assigns app permissions to users via User Manager
2. Permitted apps become **available** in that user's App Store
3. Apps do NOT appear on user's desktop/dock until manually installed

#### Regular User Flow:
1. User opens App Store
2. Sees only apps they have permission for (+ system apps)
3. Clicks "GET" to install an app
4. App appears in desktop/dock after installation
5. Can uninstall apps (except system apps)

### 3. System Apps
Always available and always installed:
- `app-store`
- `settings`
- `messenger`
- `trash`

## Current Architecture Issues

### Desktop.js (fetchAppsData)
**Line 221-228**: Permission check determines if app appears on desktop
```javascript
const hasPermission = !user || !user.permissions ||
    (user.permissions && user.permissions.includes("all_apps")) ||
    (user.permissions && user.permissions.includes(app.id));

if (!hasPermission && user) return; // Skips app entirely
```

**Problem**: Apps with permissions are immediately added to desktop.

### AppStore.js
**Line 244-263**: Permission filtering for App Store display
```javascript
if (!isSuperAdmin && userData) {
    if (userData.allowedApps && userData.allowedApps.length > 0) {
        displayApps = displayApps.filter(app =>
            systemApps.includes(app.id) || userData.allowedApps.includes(app.id)
        );
    }
}
```

**Status**: ✅ Already correct - shows only permitted apps

## Implementation Plan

### Phase 1: Update Desktop Logic

**File**: `components/screen/desktop.js`  
**Function**: `fetchAppsData()`

**Changes**:
1. **Separate permission check from display logic**
   - Permission check should only validate App Store access
   - Desktop/dock should only show **installed** apps

2. **Update permission logic (Line 221-228)**:
```javascript
// BEFORE: Skip if no permission
if (!hasPermission && user) return;

// AFTER: Always process app, but mark as unavailable if no permission
// Permissions control App Store visibility, not desktop visibility
const isAvailable = hasPermission; // Store for App Store filtering
```

3. **Filter desktop/dock by installation status**:
```javascript
// Only show on desktop/dock if:
// 1. User has permission (or it's a system app)
// 2. App is installed (not in disabled_apps)
// 3. App has desktop_shortcut OR is in favourites

const shouldShowOnDesktop = (
    isAvailable && // Has permission
    !isDisabled && // Is installed
    (app.desktop_shortcut || favourite_apps[app.id])
);
```

### Phase 2: Ensure App Store Filtering

**File**: `components/apps/app_store.js`  
**Function**: `render()`

**Status**: Already implements permission filtering correctly (Line 244-263)

**Verification needed**:
- Ensure `userData.allowedApps` is being set correctly
- Ensure system apps are always shown
- Test with different user roles

### Phase 3: Update Default Installed Apps Logic

**File**: `components/screen/desktop.js`  
**Lines**: 179-202

**Changes**:
1. Default installed apps should be intersection of:
   - System apps (always installed)
   - Apps explicitly marked as default
   
2. User-specific default installed apps based on permissions:
```javascript
const DEFAULT_SYSTEM_APPS = ['app-store', 'settings', 'messenger', 'trash'];
const DEFAULT_INSTALLED = ['chrome', 'calendar', 'weather', 'files', 'gedit'];

// For new users: Install system apps + defaults that user has permission for
const userDefaultInstalled = DEFAULT_SYSTEM_APPS.concat(
    DEFAULT_INSTALLED.filter(appId => {
        const hasPermission = !user || !user.permissions ||
            user.permissions.includes("all_apps") ||
            user.permissions.includes(appId);
        return hasPermission;
    })
);

// Apps NOT in userDefaultInstalled should be in disabled_apps
disabledFromStorage allApps NOT in userDefaultInstalled
```

### Phase 4: User Manager Integration

**File**: `components/apps/user_manager.js` (if exists)

**Required Features**:
1. UI for Super Admin to assign app permissions
2. Update Firestore `userData.allowedApps` array
3. Permissions should be stored as array of app IDs:
```javascript
{
  uid: "user123",
  email: "user@example.com",
  role: "user",
  allowedApps: ["chrome", "vscode", "calendar"], // Apps user CAN install
  disabledApps: ["vscode"] // Apps user HAS NOT installed
}
```

### Phase 5: Firestore Schema

**Collection**: `users`  
**Document Structure**:
```javascript
{
  uid: string,
  email: string,
  role: "super_admin" | "admin" | "user",
  allowedApps: string[], // Permitted apps (what CAN be installed)
  disabledApps: string[], // Uninstalled apps (what IS NOT installed)
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Logic**:
- `allowedApps`: Controlled by Super Admin, determines App Store visibility
- `disabledApps`: Controlled by User, determines desktop/dock visibility
- If `allowedApps` is undefined/null: All apps available (backward compatibility)
- If `allowedApps` is empty array: Only system apps available

## Testing Checklist

### Super Admin Tests:
- [ ] Can assign specific apps to users
- [ ] Can remove app permissions
- [ ] Changes sync to Firestore
- [ ] User's App Store updates immediately

### Regular User Tests:
- [ ] App Store shows only permitted apps + system apps
- [ ] Desktop/dock shows only installed apps
- [ ] Can install permitted apps
- [ ] Can uninstall non-system apps
- [ ] Installation state persists across sessions
- [ ] Installation state syncs across devices (Firestore)

### System App Tests:
- [ ] System apps always visible in App Store
- [ ] System apps always installed (can't uninstall)
- [ ] System apps always in dock/desktop

### Edge Cases:
- [ ] New user: Only system apps + defaults installed
- [ ] Guest user: All apps available, localStorage persistence
- [ ] Permission removed while app installed: App hidden from App Store, remains installed
- [ ] Permission added: App appears in App Store, not auto-installed

## Migration Strategy

1. **Backup existing data** before deployment
2. **Add `allowedApps` field** to existing users:
   - Super Admin: `allowedApps: null` (all apps)
   - Others: `allowedApps: null` (backward compatibility)
3. **Update desktop logic** to respect new model
4. **Test with sample users** before production
5. **Communicate changes** to existing users

## Files to Modify

1. ✅ `components/screen/desktop.js` - Main desktop logic
2. ✅ `components/apps/app_store.js` - App Store filtering (verify)
3. ✅ `components/apps/user_manager.js` - Permission assignment UI
4. ✅ `context/AuthContext.tsx` - Ensure `allowedApps` syncs
5. ✅ Firestore Security Rules - Update to allow permission management

## Success Criteria

✅ Super Admin can control which apps each user can access  
✅ Users see only permitted apps in App Store  
✅ Apps don't appear on desktop until manually installed  
✅ Installation state persists across sessions and devices  
✅ System apps always available and installed  
✅ Backward compatible with existing users
