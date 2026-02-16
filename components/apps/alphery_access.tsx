import React, { useState, useEffect } from 'react';
import { useAuth, useAuthenticatedFetch } from '../../context/AuthContext-new';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';

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
  const { sessionToken, signOut } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [activeTab, setActiveTab] = useState('tenants');
  const authenticatedFetch = useAuthenticatedFetch();

  // Check if we're in emergency mode
  const isEmergencyMode = sessionToken === 'emergency-token';

  useEffect(() => {
    if (!isEmergencyMode) {
      loadPlatformData();
    }
  }, [isEmergencyMode]);

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
      {isEmergencyMode && (
        <div className="emergency-banner">
          <div className="emergency-content">
            <span>⚠️ <strong>Emergency Mode</strong>: You're running in offline mode. To create tenants and access backend features, please log in properly.</span>
            <button
              onClick={async () => {
                await signOut();
                window.location.reload();
              }}
              className="emergency-logout-btn"
            >
              Exit & Login
            </button>
          </div>
        </div>
      )}

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
        <button
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
      </nav>

      <div className="tab-content">
        {activeTab === 'tenants' && <TenantsList tenants={tenants} users={users} onUpdate={loadPlatformData} />}
        {activeTab === 'users' && <UsersList users={users} onUpdate={loadPlatformData} />}
        {activeTab === 'apps' && <AppsList apps={apps} onUpdate={loadPlatformData} />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </div>

      <style jsx>{`
        .god-dashboard {
          max-width: 1200px;
          margin: 0 auto;
        }

        .emergency-banner {
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          animation: pulse-warning 2s ease-in-out infinite;
        }

        .emergency-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .emergency-content span {
          flex: 1;
          min-width: 250px;
          font-size: 0.95rem;
        }

        .emergency-logout-btn {
          background: white;
          color: #ef4444;
          padding: 0.6rem 1.5rem;
          border-radius: 8px;
          border: none;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .emergency-logout-btn:hover {
          background: #fee2e2;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .emergency-logout-btn:active {
          transform: translateY(0);
        }

        @keyframes pulse-warning {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
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
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .tab-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          min-height: 400px;
          color: #1a202c;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NEW ANALYTICS DASHBOARD
// ═══════════════════════════════════════════════════════════

function AnalyticsDashboard() {
  return (
    <div className="analytics">
      <div className="empty-state">
        <h3>📊 Platform Analytics</h3>
        <p>Coming soon: Usage stats, revenue metrics, and system health.</p>
      </div>
      <style jsx>{`
        .empty-state { text-align: center; padding: 4rem; color: #666; }
      `}</style>
    </div>
  )
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
// TENANTS LIST (God Mode) - ENHANCED WIZARD
// ═══════════════════════════════════════════════════════════

function TenantsList({ tenants, users, onUpdate }: any) {
  const [showCreate, setShowCreate] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', ownerEmail: '' });
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
        setNewTenant({ name: '', ownerEmail: '' });
        onUpdate();
        alert('🎉 Tenant AND Workspace created successfully!');
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
        <div>
          <h2>🏢 All Tenants</h2>
          <p className="subtitle">Manage organizations and workspaces</p>
        </div>
        <button className="btn-create" onClick={() => setShowCreate(true)}>
          <span className="icon">+</span> New Tenant
        </button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={(e) => {
          if ((e.target as any).className === 'modal-overlay') setShowCreate(false);
        }}>
          <div className="modal animate-in">
            <div className="modal-header">
              <h3>🚀 Create New Organization</h3>
              <button className="close-btn" onClick={() => setShowCreate(false)}>×</button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Organization Name</label>
                <input
                  value={newTenant.name}
                  onChange={e => setNewTenant({ ...newTenant, name: e.target.value })}
                  placeholder="e.g. Acme Industries"
                  required
                  autoFocus
                />
                <small>The display name of the company.</small>
              </div>

              <div className="form-group">
                <label>Owner Gmail ID</label>
                <input
                  type="email"
                  value={newTenant.ownerEmail}
                  onChange={e => setNewTenant({ ...newTenant, ownerEmail: e.target.value.toLowerCase() })}
                  placeholder="user@gmail.com"
                  required
                />
                <small>The user will be automatically registered if they don't exist.</small>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Creating...' : '🚀 Create Tenant & Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="list">
        {tenants.map((tenant: any) => (
          <div key={tenant.id} className="card">
            <div className="card-header">
              <h3>{tenant.name}</h3>
              <span className={`plan-badge ${tenant.plan}`}>{tenant.plan}</span>
            </div>

            <div className="card-body">
              <div className="info-row">
                <span className="label">ID:</span>
                <span className="value code" title={tenant.id}>{tenant.id.substring(0, 8)}...</span>
              </div>
              <div className="info-row">
                <span className="label">Owner:</span>
                <span className="value">{tenant.owner?.email || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">Created:</span>
                <span className="value">{new Date(tenant.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="card-footer">
              <div className="stat">
                <span className="stat-val">👥 {tenant._count?.users || 0}</span>
                <span className="stat-label">Users</span>
              </div>
              <div className="stat">
                <span className="stat-val">📱 {tenant._count?.apps || 0}</span>
                <span className="stat-label">Apps</span>
              </div>
            </div>
          </div>
        ))}

        {tenants.length === 0 && (
          <div className="empty-state">
            <p>No tenants found. Create one to get started!</p>
          </div>
        )}
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
          color: #2d3748;
          font-size: 1.5rem;
        }

        .subtitle { color: #718096; margin: 0.25rem 0 0; font-size: 0.9rem; }

        .btn-create {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 99px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-create:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
        }

        .list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.08);
          border-color: #667eea;
        }

        .card-header {
          padding: 1.5rem;
          border-bottom: 1px solid #f7fafc;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .card h3 { margin: 0; font-size: 1.15rem; color: #2d3748; font-weight: 700; }

        .card-body { padding: 1.25rem 1.5rem; flex: 1; }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .label { color: #718096; }
        .value { color: #2d3748; font-weight: 500; }
        .code { font-family: monospace; background: #edf2f7; padding: 0.1rem 0.3rem; border-radius: 4px; }

        .card-footer {
          padding: 1rem 1.5rem;
          background: #f8fafc;
          display: flex;
          gap: 1.5rem;
          border-top: 1px solid #edf2f7;
        }

        .stat { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #4a5568; font-weight: 600; }

        .plan-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 99px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .plan-badge.free { background: #edf2f7; color: #718096; }
        .plan-badge.pro { background: #ebf8ff; color: #3182ce; }
        .plan-badge.enterprise { background: #faf5ff; color: #805ad5; }

        /* Modal Styles */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999;
        }

        .modal {
          background: white;
          width: 100%; max-width: 550px;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          color: #1a202c;
        }

        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: center;
          background: #f8fafc;
        }

        .modal-header h3 { margin: 0; color: #2d3748; }
        .close-btn { background: none; border: none; font-size: 1.5rem; color: #a0aec0; cursor: pointer; }
        .close-btn:hover { color: #2d3748; }

        form { padding: 2rem; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

        .form-group { margin-bottom: 1.5rem; position: relative; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; color: #4a5568; }
        .form-group small { display: block; margin-top: 0.35rem; color: #a0aec0; font-size: 0.8rem; }
        
        input, select {
          width: 100%; padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0; border-radius: 8px;
          font-size: 1rem; transition: all 0.2s;
          color: #1a202c;
          background: white;
        }

        input:focus, select:focus {
          border-color: #667eea; outline: none;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-prefix {
          display: flex; align-items: center;
          border: 2px solid #e2e8f0; border-radius: 8px;
          background: #f7fafc;
        }
        .input-prefix span { padding-left: 1rem; color: #a0aec0; font-weight: 500; }
        .input-prefix input { border: none; background: transparent; padding-left: 0.25rem; }
        .input-prefix:focus-within { border-color: #667eea; }

        /* User Dropdown */
        .user-dropdown {
          position: absolute; top: 100%; left: 0; right: 0;
          background: white; border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
          z-index: 10; margin-top: 0.5rem;
          max-height: 200px; overflow-y: auto;
        }
        .user-option {
          padding: 0.75rem 1rem;
          display: flex; align-items: center; gap: 0.75rem;
          cursor: pointer; transition: background 0.1s;
        }
        .user-option:hover { background: #f7fafc; }
        .user-avatar {
          width: 32px; h-32px; border-radius: 50%; background: #667eea; color: white;
          display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;
        }
        .user-name { font-weight: 600; color: #2d3748; font-size: 0.9rem; }
        .user-email { color: #718096; font-size: 0.8rem; }

        /* Plan Selector */
        .plan-selector { display: flex; gap: 1rem; }
        .plan-option {
          flex: 1; border: 2px solid #e2e8f0; padding: 1rem;
          border-radius: 10px; cursor: pointer; text-align: center;
          transition: all 0.2s; position: relative;
        }
        .plan-option:hover { border-color: #cbd5e0; }
        .plan-option.selected {
          border-color: #667eea; background: #ebf4ff; color: #5a67d8;
        }
        .plan-name { font-weight: 700; font-size: 0.9rem; }
        .plan-check { position: absolute; top: 5px; right: 5px; font-weight: bold; color: #667eea; font-size: 0.8rem; }

        .modal-actions {
          display: flex; gap: 1rem; margin-top: 2rem;
        }
        .modal-actions button {
          flex: 1; padding: 1rem; border-radius: 10px; font-weight: 700; cursor: pointer; border: none; font-size: 1rem;
        }
        .btn-cancel { background: #edf2f7; color: #4a5568; }
        .btn-cancel:hover { background: #e2e8f0; }
        
        .btn-submit {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        .spinner {
          display: inline-block; width: 1rem; height: 1rem;
          border: 2px solid rgba(255,255,255,0.3); border-radius: 50%;
          border-top-color: white; animation: spin 0.8s linear infinite;
          margin-right: 0.5rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .flex-center { display: flex; align-items: center; justify-content: center; }

        .animate-in { animation: slideUp 0.3s ease-out; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
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
