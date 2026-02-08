import React, { useState, useEffect } from 'react';
import { useAuth, useAuthenticatedFetch } from '../../context/AuthContext-new';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// ═══════════════════════════════════════════════════════════
// ALPHERY ACCESS - ADMIN CONSOLE
// ═══════════════════════════════════════════════════════════

export default function AlpheryAccess() {
  const { platformUser, currentTenant } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  // God sees everything, others see their tenant
  const isGod = platformUser?.isGod || false;

  return (
    <div className="alphery-access">
      <header className="access-header">
        <h1>
          🔐 Alphery Access
          {isGod && <span className="god-badge">GOD MODE</span>}
        </h1>
        <p className="subtitle">
          {isGod
            ? 'Platform-wide user and permission management'
            : `Managing ${currentTenant?.name || 'workspace'}`}
        </p>
      </header>

      {isGod ? <GodDashboard /> : <TenantAdminDashboard />}

      <style jsx>{`
        .alphery-access {
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: white;
        }

        .access-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .access-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .god-badge {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .subtitle {
          font-size: 1.125rem;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// GOD DASHBOARD (Platform Owner)
// ═══════════════════════════════════════════════════════════

function GodDashboard() {
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [activeTab, setActiveTab] = useState('tenants');
  const authenticatedFetch = useAuthenticatedFetch();

  useEffect(() => {
    loadPlatformData();
  }, []);

  async function loadPlatformData() {
    try {
      const [tenantsRes, usersRes, appsRes] = await Promise.all([
        authenticatedFetch(`${BACKEND_URL}/platform/tenants`),
        authenticatedFetch(`${BACKEND_URL}/platform/users`),
        authenticatedFetch(`${BACKEND_URL}/platform/apps`),
      ]);

      if (tenantsRes.ok) setTenants(await tenantsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (appsRes.ok) setApps(await appsRes.json());
    } catch (error) {
      console.error('Failed to load platform data:', error);
    }
  }

  return (
    <div className="god-dashboard">
      <nav className="tabs">
        <button
          className={activeTab === 'tenants' ? 'active' : ''}
          onClick={() => setActiveTab('tenants')}
        >
          🏢 Tenants ({tenants.length})
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Platform Users ({users.length})
        </button>
        <button
          className={activeTab === 'apps' ? 'active' : ''}
          onClick={() => setActiveTab('apps')}
        >
          📱 Apps ({apps.length})
        </button>
      </nav>

      <div className="tab-content">
        {activeTab === 'tenants' && <TenantsList tenants={tenants} onUpdate={loadPlatformData} />}
        {activeTab === 'users' && <UsersList users={users} onUpdate={loadPlatformData} />}
        {activeTab === 'apps' && <AppsList apps={apps} onUpdate={loadPlatformData} />}
      </div>

      <style jsx>{`
        .god-dashboard {
          max-width: 1200px;
          margin: 0 auto;
        }

        .tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.5rem;
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .tabs button {
          flex: 1;
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: none;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.3s;
        }

        .tabs button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .tabs button.active {
          background: white;
          color: #667eea;
        }

        .tab-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TENANT ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════

function TenantAdminDashboard() {
  const { currentTenant } = useAuth();
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const authenticatedFetch = useAuthenticatedFetch();

  useEffect(() => {
    if (currentTenant) {
      loadTenantData();
    }
  }, [currentTenant]);

  async function loadTenantData() {
    if (!currentTenant) return;

    try {
      const [usersRes, appsRes] = await Promise.all([
        authenticatedFetch(`${BACKEND_URL}/tenants/${currentTenant.id}/users`),
        authenticatedFetch(`${BACKEND_URL}/tenants/${currentTenant.id}/apps`),
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (appsRes.ok) setApps(await appsRes.json());
    } catch (error) {
      console.error('Failed to load tenant data:', error);
    }
  }

  return (
    <div className="tenant-dashboard">
      <nav className="tabs">
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Team Members ({users.length})
        </button>
        <button
          className={activeTab === 'apps' ? 'active' : ''}
          onClick={() => setActiveTab('apps')}
        >
          📱 Apps ({apps.length})
        </button>
      </nav>

      <div className="tab-content">
        {activeTab === 'users' && (
          <TenantUsersList users={users} tenantId={currentTenant?.id} onUpdate={loadTenantData} />
        )}
        {activeTab === 'apps' && (
          <TenantAppsList apps={apps} tenantId={currentTenant?.id} onUpdate={loadTenantData} />
        )}
      </div>

      <style jsx>{`
        .tenant-dashboard {
          max-width: 1200px;
          margin: 0 auto;
        }

        .tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.5rem;
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .tabs button {
          flex: 1;
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: none;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.3s;
        }

        .tabs button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .tabs button.active {
          background: white;
          color: #667eea;
        }

        .tab-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          color: #333;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TENANTS LIST (God Mode)
// ═══════════════════════════════════════════════════════════

function TenantsList({ tenants, onUpdate }: any) {
  const [showCreate, setShowCreate] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', subdomain: '', ownerEmail: '', plan: 'free' });
  const [loading, setLoading] = useState(false);
  const authenticatedFetch = useAuthenticatedFetch();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/platform/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTenant),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewTenant({ name: '', subdomain: '', ownerEmail: '', plan: 'free' });
        onUpdate();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create tenant');
      }
    } catch (error) {
      alert('Error creating tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tenants-list">
      <div className="header">
        <h2>🏢 All Tenants</h2>
        <button className="btn-create" onClick={() => setShowCreate(true)}>+ Create Tenant</button>
      </div>

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create New Tenant</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Organization Name</label>
                <input
                  value={newTenant.name}
                  onChange={e => setNewTenant({ ...newTenant, name: e.target.value })}
                  placeholder="Acme Corp"
                  required
                />
              </div>
              <div className="form-group">
                <label>Subdomain</label>
                <input
                  value={newTenant.subdomain}
                  onChange={e => setNewTenant({ ...newTenant, subdomain: e.target.value.toLowerCase() })}
                  placeholder="acme"
                />
              </div>
              <div className="form-group">
                <label>Owner Email</label>
                <input
                  type="email"
                  value={newTenant.ownerEmail}
                  onChange={e => setNewTenant({ ...newTenant, ownerEmail: e.target.value })}
                  placeholder="admin@acme.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Plan</label>
                <select
                  value={newTenant.plan}
                  onChange={e => setNewTenant({ ...newTenant, plan: e.target.value })}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="list">
        {tenants.map((tenant: any) => (
          <div key={tenant.id} className="card">
            <h3>{tenant.name}</h3>
            <p>ID: <span className="small-text">{tenant.id}</span></p>
            <p>Owner: {tenant.owner?.email || 'N/A'}</p>
            <p>Plan: <span className={`plan-badge ${tenant.plan}`}>{tenant.plan}</span></p>
            <div className="meta">
              <span>👥 {tenant._count?.members || 0}</span>
              <span>📱 {tenant._count?.apps || 0}</span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .tenants-list .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .tenants-list h2 {
          margin: 0;
          color: #333;
        }

        .btn-create {
          background: #667eea;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          border: none;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-create:hover {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          transition: all 0.3s;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px rgba(0,0,0,0.1);
          border-color: #667eea;
        }

        .card h3 {
          margin: 0 0 1rem 0;
          color: #1a202c;
          font-size: 1.25rem;
        }

        .card p {
          margin: 0.5rem 0;
          font-size: 0.875rem;
          color: #4a5568;
        }

        .small-text {
          font-family: monospace;
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .plan-badge {
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .plan-badge.free { background: #edf2f7; color: #4a5568; }
        .plan-badge.pro { background: #ebf8ff; color: #3182ce; }
        .plan-badge.enterprise { background: #faf5ff; color: #805ad5; }

        .meta {
          margin-top: 1.5rem;
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #718096;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          width: 100%;
          max-width: 450px;
          color: #333;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .form-group input, .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .modal-actions button {
          flex: 1;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-submit {
          background: #667eea;
          color: white;
          border: none;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// USERS LIST (God Mode)
// ═══════════════════════════════════════════════════════════

function UsersList({ users, onUpdate }: any) {
  const authenticatedFetch = useAuthenticatedFetch();
  const [loading, setLoading] = useState<string | null>(null);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setLoading(userId);
    try {
      await authenticatedFetch(`${BACKEND_URL}/platform/users/${userId}/toggle-status`, {
        method: 'PATCH',
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to update user status');
    } finally {
      setLoading(null);
    }
  };

  const promoteToGod = async (userId: string) => {
    if (!confirm('Are you sure you want to promote this user to God status?')) return;

    setLoading(userId);
    try {
      await authenticatedFetch(`${BACKEND_URL}/platform/users/${userId}/promote-god`, {
        method: 'PATCH',
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to promote user:', error);
      alert('Failed to promote user');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="users-list">
      <div className="header">
        <h2>👥 Platform Users</h2>
        <p className="subtitle">Manage all users across the platform</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Email</th>
            <th>Name</th>
            <th>Mobile</th>
            <th>Status</th>
            <th>God</th>
            <th>Tenants</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: any) => (
            <tr key={user.id} className={!user.isActive ? 'inactive' : ''}>
              <td>
                <span className="user-id">{user.customUid}</span>
              </td>
              <td>{user.email}</td>
              <td>{user.displayName || '-'}</td>
              <td>{user.mobile || '-'}</td>
              <td>
                <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                  {user.isActive ? '✓ Active' : '✗ Inactive'}
                </span>
              </td>
              <td>
                {user.isGod ? (
                  <span className="god-badge">⭐ GOD</span>
                ) : (
                  '-'
                )}
              </td>
              <td>{user.tenantMemberships?.length || 0}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <div className="actions">
                  <button
                    onClick={() => toggleUserStatus(user.id, user.isActive)}
                    disabled={loading === user.id}
                    className="btn-small"
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  {!user.isGod && (
                    <button
                      onClick={() => promoteToGod(user.id)}
                      disabled={loading === user.id}
                      className="btn-small btn-promote"
                    >
                      Promote
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .users-list .header {
          margin-bottom: 1.5rem;
        }

        .users-list h2 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .subtitle {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        th {
          background: #f5f7fa;
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          color: #333;
          white-space: nowrap;
        }

        td {
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }

        tr:hover {
          background: #f9fafb;
        }

        tr.inactive {
          opacity: 0.6;
        }

        .user-id {
          font-family: 'Courier New', monospace;
          background: #667eea20;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: 600;
          color: #667eea;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .god-badge {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          white-space: nowrap;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-small {
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          background: #667eea;
          color: white;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-small:hover:not(:disabled) {
          background: #5568d3;
        }

        .btn-small:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-promote {
          background: #f59e0b;
        }

        .btn-promote:hover:not(:disabled) {
          background: #d97706;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// APPS LIST (God Mode)
// ═══════════════════════════════════════════════════════════

function AppsList({ apps, onUpdate }: any) {
  return (
    <div className="apps-list">
      <h2>📱 Application Catalog</h2>
      <div className="grid">
        {apps.map((app: any) => (
          <div key={app.id} className="app-card">
            <h3>{app.name}</h3>
            <p>{app.description}</p>
            <div className="meta">
              <span className={`badge ${app.isCore ? 'core' : ''}`}>
                {app.isCore ? 'Core' : 'Optional'}
              </span>
              <span className="category">{app.category}</span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .apps-list h2 {
          margin-bottom: 1.5rem;
          color: #333;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .app-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
          transition: all 0.3s;
        }

        .app-card:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .app-card h3 {
          margin: 0 0 0.5rem 0;
          color: #667eea;
        }

        .app-card p {
          margin: 0 0 1rem 0;
          font-size: 0.9rem;
          color: #666;
        }

        .meta {
          display: flex;
          gap: 0.5rem;
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          background: #f3f4f6;
          color: #6b7280;
        }

        .badge.core {
          background: #667eea;
          color: white;
        }

        .category {
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          background: #f9fafb;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TENANT USERS LIST
// ═══════════════════════════════════════════════════════════

function TenantUsersList({ users, tenantId, onUpdate }: any) {
  return (
    <div className="tenant-users-list">
      <h2>👥 Team Members</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Permitted Apps</th>
          </tr>
        </thead>
        <tbody>
          {users.map((member: any) => (
            <tr key={member.id}>
              <td>{member.user.displayName || '-'}</td>
              <td>{member.user.email}</td>
              <td>
                <span className={`role-badge ${member.role}`}>{member.role}</span>
              </td>
              <td>{member.appPermissions?.length || 0} apps</td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .tenant-users-list h2 {
          margin-bottom: 1.5rem;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f5f7fa;
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
        }

        td {
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .role-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .role-badge.owner {
          background: #fef3c7;
          color: #92400e;
        }

        .role-badge.admin {
          background: #dbeafe;
          color: #1e40af;
        }

        .role-badge.member {
          background: #d1fae5;
          color: #065f46;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TENANT APPS LIST
// ═══════════════════════════════════════════════════════════

function TenantAppsList({ apps, tenantId, onUpdate }: any) {
  return (
    <div className="tenant-apps-list">
      <h2>📱 Enabled Apps</h2>
      <div className="grid">
        {apps.map((tenantApp: any) => (
          <div key={tenantApp.id} className="app-card">
            <h3>{tenantApp.app.name}</h3>
            <p>{tenantApp.app.description}</p>
            <div className="status">
              <span className={`badge ${tenantApp.enabled ? 'enabled' : 'disabled'}`}>
                {tenantApp.enabled ? '✓ Enabled' : '✗ Disabled'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .tenant-apps-list h2 {
          margin-bottom: 1.5rem;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .app-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
        }

        .app-card h3 {
          margin: 0 0 0.5rem 0;
          color: #667eea;
        }

        .app-card p {
          margin: 0 0 1rem 0;
          font-size: 0.9rem;
          color: #666;
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .badge.enabled {
          background: #d1fae5;
          color: #065f46;
        }

        .badge.disabled {
          background: #fee2e2;
          color: #991b1b;
        }
      `}</style>
    </div>
  );
}
