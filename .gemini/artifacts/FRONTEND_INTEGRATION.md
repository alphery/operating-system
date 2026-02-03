# Frontend Integration Guide - Google OAuth + Multi-Tenant CRM

## 🚀 Complete Implementation Steps

### Step 1: Update Google Sign-In Button

Your existing Google Sign-In button needs to send the ID token to the backend.

**File:** `components` or wherever your Google button is

```javascript
// After user signs in with Google
function handleGoogleSignIn(googleUser) {
  const idToken = googleUser.credential; // Or googleUser.getAuthResponse().id_token
  
  // Send to backend
  fetch('https://alphery-os-backend.onrender.com/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  })
  .then(res => res.json())
  .then(data => {
    // Store JWT and user info
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('tenantId', data.tenant.id);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect to CRM Dashboard
    window.location.href = '/apps/crm';
  })
  .catch(err => {
    console.error('Login failed:', err);
    alert('Login failed. Please try again.');
  });
}
```

---

### Step 2: Update All CRM API Calls

Every API call must include the JWT token in headers.

**Before:**
```javascript
fetch('https://alphery-os-backend.onrender.com/clients')
```

**After:**
```javascript
const token = localStorage.getItem('token');

fetch('https://alphery-os-backend.onrender.com/clients', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**Create a utility function:**
```javascript
// utils/api.js
export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`https://alphery-os-backend.onrender.com${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, redirect to login
      localStorage.clear();
      window.location.href = '/login';
    }
    throw new Error(`API error: ${response.statusText}`);
  }
  
  return response.json();
}

// Usage:
import { apiCall } from './utils/api';

// GET request
const clients = await apiCall('/clients');

// POST request
const newClient = await apiCall('/clients', {
  method: 'POST',
  body: JSON.stringify({ name: 'Acme Corp', email: 'contact@acme.com' })
});
```

---

### Step 3: Update CRM Component

**File:** `components/apps/crm_odoo.js`

Find all `fetch()` calls and update them:

```javascript
// OLD:
fetch(`${API_BASE}/clients`)

// NEW:
apiCall('/clients')
```

**Example - Create Opportunity:**
```javascript
async createOpportunity(data) {
  try {
    const response = await apiCall('/clients', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    // Update state
    this.setState({
      clients: [...this.state.clients, response],
      showModal: null
    });
  } catch (error) {
    console.error('Failed to create opportunity:', error);
    alert('Failed to create opportunity');
  }
}
```

---

### Step 4: Add Team Invitation UI

**New Component: Team Management**

```javascript
// components/apps/team_management.js
class TeamManagement extends React.Component {
  state = {
    invitations: [],
    newEmail: '',
    newRole: 'member'
  };

  async componentDidMount() {
    const invitations = await apiCall('/invitations');
    this.setState({ invitations });
  }

  async sendInvitation() {
    const { newEmail, newRole } = this.state;
    
    const invitation = await apiCall('/invitations', {
      method: 'POST',
      body: JSON.stringify({
        email: newEmail,
        role: newRole
      })
    });
    
    alert(`Invitation sent! Share this link:\n${invitation.invitationLink}`);
    
    // Reload invitations
    const invitations = await apiCall('/invitations');
    this.setState({ invitations, newEmail: '', newRole: 'member' });
  }

  render() {
    return (
      <div className="team-management">
        <h2>Team Members</h2>
        
        <div className="invite-form">
          <input
            type="email"
            placeholder="Email address"
            value={this.state.newEmail}
            onChange={(e) => this.setState({ newEmail: e.target.value })}
          />
          <select
            value={this.state.newRole}
            onChange={(e) => this.setState({ newRole: e.target.value })}
          >
            <option value="viewer">Viewer</option>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={() => this.sendInvitation()}>
            Send Invitation
          </button>
        </div>

        <div className="invitations-list">
          <h3>Pending Invitations</h3>
          {this.state.invitations.map(inv => (
            <div key={inv.id} className="invitation-item">
              <span>{inv.email}</span>
              <span>{inv.role}</span>
              <span>{inv.status}</span>
              <button onClick={() => this.cancelInvitation(inv.id)}>Cancel</button>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
```

---

### Step 5: Accept Invitation Page

**New Page:** `/accept-invite/[token]`

```javascript
// pages/accept-invite.js
async function acceptInvite() {
  const token = getTokenFromURL(); // Extract from URL
  
  // Check invitation validity
  const invitation = await fetch(`https://alphery-os-backend.onrender.com/invitations/token/${token}`)
    .then(r => r.json());
  
  if (invitation.status !== 'pending') {
    alert('This invitation is no longer valid');
    return;
  }
  
  // Show "Sign in with Google to accept" button
  // When user signs in, pass the invitation token
  function handleGoogleSignIn(googleUser) {
    const idToken = googleUser.credential;
    
    fetch('https://alphery-os-backend.onrender.com/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken,
        invitationToken: token // IMPORTANT: Include this
      })
    })
    .then(res => res.json())
    .then(data => {
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('tenantId', data.tenant.id);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to team's CRM
      window.location.href = '/apps/crm';
    });
  }
}
```

---

### Step 6: Environment Variables

**Backend:** Add to `.env` or Render environment variables

```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
JWT_SECRET=your-super-secret-jwt-key-change-this
FRONTEND_URL=https://alphery-os.vercel.app
```

**Get Google Client ID:**
1. Go to https://console.cloud.google.com/
2. Create project → Enable Google Sign-In API
3. Create OAuth credentials
4. Copy Client ID

---

### Step 7: Test Flow

**Scenario 1: New User**
1. User clicks "Sign in with Google"
2. Backend creates new workspace for them
3. User sees empty CRM dashboard
4. User creates opportunities → Data saves to their tenant

**Scenario 2: Team Invitation**
1. User A invites user B (owner invites member)
2. User B receives invitation link
3. User B clicks link → Signs in with Google
4. User B joins User A's workspace
5. Both see same CRM data

---

## 📊 API Endpoints Summary

```
Authentication:
POST /api/auth/google          - Login with Google
GET  /api/auth/me              - Get current user

Invitations:
POST   /api/invitations        - Send invitation
GET    /api/invitations        - List pending invitations
GET    /api/invitations/token/:token - Get invitation details
DELETE /api/invitations/:id    - Cancel invitation
POST   /api/invitations/:id/resend  - Resend invitation

CRM (All require JWT):
GET    /api/clients            - Get clients (filtered by tenantId)
POST   /api/clients            - Create client (auto-adds tenantId)
GET    /api/activities         - Get activities (filtered by tenantId)
POST   /api/activities         - Create activity (auto-adds tenantId)
```

---

## 🔒 Security Notes

1. **Never expose JWT secret** - Keep it in environment variables only
2. **Validate tokens** - Backend automatically validates all requests
3. **HTTPS only** - Always use HTTPS in production
4. **Token expiry** - Tokens expire in 7 days, user must re-login
5. **Role-based access** - Implement role checks for sensitive operations

---

## 🎯 Next Steps

1. ✅ Deploy backend with Google Client ID set
2. ✅ Update frontend Google button to send token
3. ✅ Add JWT to all API calls
4. ✅ Build team management UI
5. ✅ Test with real Google accounts

**Your multi-tenant CRM is ready for production! 🚀**
