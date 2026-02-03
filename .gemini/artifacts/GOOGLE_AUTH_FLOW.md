# Google Sign-In → Multi-Tenant CRM Flow

## 🔄 **Complete Authentication Flow**

### Step-by-Step Process

```
1. User clicks "Sign in with Google" on Frontend
   ↓
2. Google OAuth pops up
   ↓
3. User approves, Google returns ID token
   ↓
4. Frontend sends token to Backend
   ↓
5. Backend verifies token with Google
   ↓
6. Backend extracts user email & name
   ↓
7. Backend checks: Does this user exist?
   
   ├─ **NEW USER** (First-time login)
   │  ├─ Create new Tenant (their personal organization)
   │  ├─ Create User record linked to that Tenant
   │  ├─ Set as admin of their Tenant
   │  └─ Issue JWT with tenantId
   │
   └─ **EXISTING USER** (Returning)
      ├─ Find their User record
      ├─ Get their tenantId
      └─ Issue JWT with tenantId
   
   ↓
8. Frontend stores JWT
   ↓
9. All CRM API calls include JWT
   ↓
10. Backend extracts tenantId from JWT → Data isolated automatically ✅
```

---

## 📝 **Database Schema After Google Login**

### Scenario: 3 users sign in with Google

**User 1:** `john@gmail.com` (First login)
```
Tenant Created:
- id: "ten-001"
- name: "john@gmail.com's Workspace"
- subdomain: "john-gmail"
- plan: "free"

User Created:
- id: "usr-001"
- email: "john@gmail.com"
- name: "John Doe"
- tenantId: "ten-001"
- role: "admin"
- googleId: "google-12345"
```

**User 2:** `jane@company.com` (First login)
```
Tenant Created:
- id: "ten-002"
- name: "jane@company.com's Workspace"
- subdomain: "jane-company"

User Created:
- id: "usr-002"
- email: "jane@company.com"
- tenantId: "ten-002"
- googleId: "google-67890"
```

**User 1 logs in again:**
```
✅ User found (usr-001)
✅ Tenant found (ten-001)
✅ JWT issued with tenantId: "ten-001"
→ Sees all their CRM data
```

---

## 🎯 **Two Deployment Models**

### Model A: Personal CRM (Current - Recommended for MVP)
**Every user gets their own workspace**

- `john@gmail.com` → Creates tenant "John's CRM"
- `jane@gmail.com` → Creates tenant "Jane's CRM"
- Each user is admin of their own workspace
- Great for: Personal use, freelancers, small businesses

**Pros:**
- ✅ Simple onboarding
- ✅ No invitations needed
- ✅ Users own their data

**Cons:**
- ❌ Users can't collaborate within same tenant

---

### Model B: Team CRM (Advanced - For Scale)
**First user creates workspace, invites team**

**Flow:**
1. `admin@acme.com` signs in → Creates "Acme Corp" tenant
2. Admin invites `sales@acme.com` via email
3. `sales@acme.com` signs in with Google → Joins existing "Acme Corp" tenant
4. Both share same CRM data

**Requires:**
- Invitation system
- Role-based access control (admin/member/viewer)
- Team management UI

**I recommend starting with Model A, then add Model B later.**

---

## 🛠️ **Implementation**

### Backend Changes Needed

I'll create these files:
1. `auth/google.strategy.ts` - Google OAuth verification
2. `auth/auth.service.ts` - Handle login logic
3. `auth/auth.controller.ts` - `/api/auth/google` endpoint
4. Update User model with `googleId` field

### Frontend Integration

Your existing Google Sign-In button will call:
```javascript
// After Google OAuth returns token
const response = await fetch('https://alphery-os-backend.onrender.com/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: googleIdToken // From Google Sign-In
  })
});

const { accessToken, user, tenant } = await response.json();

// Store JWT
localStorage.setItem('token', accessToken);
localStorage.setItem('tenantId', tenant.id);
localStorage.setItem('user', JSON.stringify(user));

// Now all CRM API calls include this token
fetch('https://alphery-os-backend.onrender.com/clients', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

---

## 🔑 **JWT Structure**

After successful login, JWT contains:
```json
{
  "userId": "usr-001",
  "email": "john@gmail.com",
  "tenantId": "ten-001",
  "role": "admin",
  "iat": 1707856123,
  "exp": 1707942523
}
```

Backend middleware extracts `tenantId` from JWT automatically.

---

## 🎨 **User Experience**

### First-Time User:
```
1. Click "Sign in with Google"
2. Approve Google OAuth
3. Redirect to CRM Dashboard
   → Empty state: "Welcome! Create your first opportunity"
4. Start using CRM (data saves to their tenant)
```

### Returning User:
```
1. Click "Sign in with Google"
2. Instant redirect to Dashboard
   → Sees all their previous data
3. Continue working
```

---

## 🚀 **Next Steps**

Shall I implement:
1. ✅ **Google OAuth Backend** (auth endpoints + JWT)
2. ✅ **Auto-create tenant on first login**
3. ✅ **Update User model with googleId**
4. ✅ **Middleware to extract tenantId from JWT**
5. 📋 **Frontend integration guide**

This will make your CRM production-ready for real users!

**Ready to implement? Say "yes" and I'll build it now! 🚀**
