import React, { useState, useEffect } from 'react';
import { useAuth, useAuthenticatedFetch } from '../../context/AuthContext-new';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';

// ═══════════════════════════════════════════════════════════
// ALPHERY ACCESS - ADMIN CONSOLE
// ═══════════════════════════════════════════════════════════

export default function AlpheryAccess() {
  const { platformUser, currentTenant } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const [permManagingApp, setPermManagingApp] = useState<any>(null);

  // God sees everything, others see their tenant
  // Only alpherymail@gmail.com can be God
  const isGod = (platformUser?.isGod && platformUser?.email === 'alpherymail@gmail.com') || false;

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

      <div className="access-container">
        {isGod ? (
          <GodDashboard
            onSelectApp={setPermManagingApp}
          />
        ) : (
          <TenantAdminDashboard />
        )}
      </div>

      {permManagingApp && (
        <AppAccessModal
          app={permManagingApp}
          onClose={() => setPermManagingApp(null)}
          onUpdate={() => {
            // Updated in-place
          }}
        />
      )}

      <style jsx global>{`
        .alphery-access {
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: white;
        }

        /* Global Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 2rem;
        }

        .modal {
          background: white;
          width: 100%;
          max-width: 600px;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          color: #1a202c;
          position: relative;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .modal.wider-modal { max-width: 900px; }
        .modal.wide-modal { max-width: 800px; }

        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          flex-shrink: 0;
        }

        .modal-header h3 { margin: 0; color: #1a202c; font-weight: 800; }
        .close-btn { background: #edf2f7; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: #4a5568; cursor: pointer; transition: all 0.2s; }
        .close-btn:hover { background: #e2e8f0; color: #1a202c; transform: rotate(90deg); }

        .modal-body {
          padding: 2rem;
          overflow-y: auto;
          flex: 1;
        }

        .modal-actions {
          padding: 1.5rem 2rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 1rem;
          background: #f8fafc;
          flex-shrink: 0;
        }

        .modal-actions button {
          flex: 1;
          padding: 0.8rem;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        /* Animations */
        .animate-in {
          animation: modalSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
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

        .access-container {
          max-width: 1400px;
          margin: 0 auto;
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

function GodDashboard({ onSelectApp }: { onSelectApp: (app: any) => void }) {
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
        {activeTab === 'tenants' && <TenantsList tenants={tenants} users={users} allPlatformApps={apps} onUpdate={loadPlatformData} />}
        {activeTab === 'users' && <UsersList users={users} onUpdate={loadPlatformData} />}
        {activeTab === 'apps' && (
          <AppsList
            apps={apps}
            onSelect={onSelectApp}
            onUpdate={loadPlatformData}
          />
        )}
        {activeTab === 'analytics' && <AnalyticsDashboard onRepair={loadPlatformData} />}
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

function TenantsList({ tenants, users, allPlatformApps, onUpdate }: any) {
  const [showCreate, setShowCreate] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: '',
    ownerEmail: '',
    organizationEmail: '',
    businessType: ''
  });
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [managingAppsTenant, setManagingAppsTenant] = useState<any>(null);
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
        setNewTenant({ name: '', ownerEmail: '', organizationEmail: '', businessType: '' });
        onUpdate();
        alert('🎉 Organization Workspace created successfully!');
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/platform/tenants/${editingTenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTenant.name,
          plan: editingTenant.plan,
          organizationEmail: editingTenant.organizationEmail,
          businessType: editingTenant.businessType,
          mobile: editingTenant.mobile,
          address: editingTenant.address,
          personalEmail: editingTenant.personalEmail,
        }),
      });
      if (res.ok) {
        setEditingTenant(null);
        onUpdate();
        alert('✅ Organization profile updated!');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to update tenant');
      }
    } catch (err) {
      alert('Error updating tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('🚨 ARE YOU SURE? This will permanently delete this organization and ALL its data!')) return;

    setLoading(true);
    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/platform/tenants/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setEditingTenant(null);
        onUpdate();
        alert('🗑️ Tenant deleted successfully');
      } else {
        alert('Failed to delete tenant');
      }
    } catch (err) {
      alert('Error deleting tenant');
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
                <label>Organization Mail ID</label>
                <input
                  type="email"
                  value={newTenant.organizationEmail}
                  onChange={e => setNewTenant({ ...newTenant, organizationEmail: e.target.value.toLowerCase() })}
                  placeholder="contact@company.com"
                />
              </div>

              <div className="form-group">
                <label>Business Type</label>
                <select
                  value={newTenant.businessType}
                  onChange={e => setNewTenant({ ...newTenant, businessType: e.target.value })}
                >
                  <option value="">Select Type</option>
                  <option value="SaaS">SaaS</option>
                  <option value="Service">Service Based</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Owner Admin Email (Login ID)</label>
                <input
                  type="email"
                  value={newTenant.ownerEmail}
                  onChange={e => setNewTenant({ ...newTenant, ownerEmail: e.target.value.toLowerCase() })}
                  placeholder="owner@gmail.com"
                  required
                />
                <small>This user will be granted Tenant Admin status.</small>
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

      {editingTenant && (
        <div className="modal-overlay" onClick={(e) => {
          if ((e.target as any).className === 'modal-overlay') setEditingTenant(null);
        }}>
          <div className="modal animate-in">
            <div className="modal-header">
              <h3>🛠️ Edit Organization</h3>
              <button className="close-btn" onClick={() => setEditingTenant(null)}>×</button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Organization Name</label>
                <input
                  value={editingTenant.name}
                  onChange={e => setEditingTenant({ ...editingTenant, name: e.target.value })}
                  placeholder="Organization Name"
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Organization Mail</label>
                  <input
                    value={editingTenant.organizationEmail || ''}
                    onChange={e => setEditingTenant({ ...editingTenant, organizationEmail: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Business Type</label>
                  <input
                    value={editingTenant.businessType || ''}
                    onChange={e => setEditingTenant({ ...editingTenant, businessType: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Mobile No</label>
                  <input
                    value={editingTenant.mobile || ''}
                    onChange={e => setEditingTenant({ ...editingTenant, mobile: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Personal Mail</label>
                  <input
                    value={editingTenant.personalEmail || ''}
                    onChange={e => setEditingTenant({ ...editingTenant, personalEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Office Address</label>
                <textarea
                  value={editingTenant.address || ''}
                  onChange={e => setEditingTenant({ ...editingTenant, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Subscription Plan</label>
                <select
                  value={editingTenant.plan}
                  onChange={e => setEditingTenant({ ...editingTenant, plan: e.target.value })}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="info-section">
                <div className="info-row">
                  <span className="label">Unique ID:</span>
                  <span className="value code">{editingTenant.id}</span>
                </div>
                <div className="info-row">
                  <span className="label">Subdomain:</span>
                  <span className="value">{editingTenant.subdomain}.alphery.com</span>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-delete"
                  onClick={() => handleDelete(editingTenant.id)}
                  disabled={loading}
                >
                  🗑️ Delete Tenant
                </button>
                <div style={{ flex: 1 }} />
                <button type="button" className="btn-cancel" onClick={() => setEditingTenant(null)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="list">
        {tenants.map((tenant: any) => (
          <div key={tenant.id} className="card">
            <div className="card-header" onClick={() => setEditingTenant({ ...tenant })} style={{ cursor: 'pointer' }}>
              <div className="tenant-title-row">
                <h3>{tenant.name}</h3>
                <span className="tenant-id-tag">{tenant.customShortId || 'AT--'}</span>
              </div>
              <span className={`plan-badge ${tenant.plan}`}>{tenant.plan}</span>
            </div>

            <div className="card-body" onClick={() => setEditingTenant({ ...tenant })} style={{ cursor: 'pointer' }}>
              <div className="info-row">
                <span className="label">Biz Type:</span>
                <span className="value">{tenant.businessType || 'General'}</span>
              </div>
              <div className="info-row">
                <span className="label">Org Mail:</span>
                <span className="value">{tenant.organizationEmail || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">Owner:</span>
                <span className="value">{tenant.owner?.email || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">Status:</span>
                <span className={`status-badge ${tenant.isActive !== false ? 'active' : 'inactive'}`}>
                  {tenant.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="card-footer">
              <div className="stat" onClick={() => setEditingTenant({ ...tenant })} style={{ cursor: 'pointer' }}>
                <span className="stat-val">👥 {tenant._count?.users || 0}</span>
                <span className="stat-label">Users</span>
              </div>
              <div className="stat-btn" onClick={(e) => {
                e.stopPropagation();
                setManagingAppsTenant(tenant);
              }}>
                <span className="stat-val">📱 {tenant._count?.apps || 0}</span>
                <span className="stat-label">Manage Apps</span>
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

      {managingAppsTenant && (
        <ManageAppsModal
          tenant={managingAppsTenant}
          allApps={allPlatformApps}
          onClose={() => setManagingAppsTenant(null)}
          onUpdate={onUpdate}
        />
      )}

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

        .card.clickable {
          cursor: pointer;
        }

        .info-section {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border: 1px solid #edf2f7;
        }

        .btn-delete {
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          border: 1px solid #feb2b2;
          background: #fff5f5;
          color: #c53030;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-delete:hover {
          background: #c53030;
          color: white;
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

        .modal-header h3 { margin: 0; color: #2d3748; }

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

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .tenant-title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .tenant-id-tag {
          background: #edf2f7;
          color: #4a5568;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 800;
          font-family: monospace;
          border: 1px solid #e2e8f0;
          text-transform: uppercase;
        }

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

  const deletePlatformUser = async (user: any) => {
    if (!confirm(`🚨 ARE YOU SURE? This will PERMANENTLY delete user ${user.email} and ALL their associated data!`)) return;

    setLoading(user.id);
    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/platform/users/${user.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onUpdate();
        alert('🗑️ User deleted permanently');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to delete user');
      }
    } catch (error) {
      alert('Error deleting user');
    } finally {
      setLoading(null);
    }
  };

  // Promote to God removed as per requirement. Only alpherymail@gmail.com is God.

  return (
    <div className="users-list">
      <div className="header">
        <h2>👥 Platform Users</h2>
        <p className="subtitle">Manage all users across the platform</p>
      </div>

      <div className="user-table-container">
        <table>
          <thead>
            <tr>
              <th>Identity</th>
              <th>Email & Auth</th>
              <th>Name & Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Access</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id} className={!user.isActive ? 'inactive' : ''}>
                <td>
                  <div className="user-id-stack">
                    <span className="user-id" title="Custom Platform UID">{user.customUid}</span>
                    <span className="db-id" title="Database UUID">{user.id.substring(0, 8)}...</span>
                  </div>
                </td>
                <td>
                  <div className="email-stack">
                    <span className="email-text">{user.email}</span>
                    <span className={`provider-tag ${user.firebaseUid ? 'google' : 'local'}`}>
                      {user.firebaseUid ? 'G Google Auth' : '⌨ Local Login'}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="name-stack">
                    <span className="user-name">{user.displayName || 'Unnamed User'}</span>
                    <span className="user-mobile">{user.mobile || 'No Mobile'}</span>
                  </div>
                </td>
                <td>
                  <div className="role-stack">
                    {user.email === 'alpherymail@gmail.com' ? (
                      <span className="badge-role super">Super Admin</span>
                    ) : user.role === 'tenant_admin' ? (
                      <span className="badge-role tenant">Tenant Admin</span>
                    ) : (
                      <span className="badge-role user">Member</span>
                    )}
                    {user.isGod && user.email !== 'alpherymail@gmail.com' && (
                      <small className="god-warning">⚠️ Legacy God</small>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? '✓ Active' : '✗ Disabled'}
                  </span>
                </td>
                <td>
                  <div className="access-stack">
                    {user.tenantMemberships?.length > 0 ? (
                      user.tenantMemberships.map((m: any) => (
                        <div key={m.tenant.id} className="tenant-link">
                          🏢 {m.tenant.name}
                        </div>
                      ))
                    ) : (
                      <span className="no-access">No Workspaces</span>
                    )}
                    <small className="since-text">Joined {new Date(user.createdAt).toLocaleDateString()}</small>
                  </div>
                </td>
                <td>
                  <div className="actions">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.isActive)}
                      disabled={loading === user.id}
                      className={`btn-action ${user.isActive ? 'btn-red' : 'btn-green'}`}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    {user.email !== 'alpherymail@gmail.com' && (
                      <button
                        onClick={() => deletePlatformUser(user)}
                        disabled={loading === user.id}
                        className="btn-action btn-delete-user"
                        title="Delete user permanently"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .users-list .header { margin-bottom: 2rem; }
        .users-list h2 { margin: 0; color: #2d3748; }
        .subtitle { color: #718096; margin-top: 0.25rem; }

        .user-table-container {
          background: #f8fafc;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        table { width: 100%; border-collapse: collapse; }
        th { background: #edf2f7; padding: 1rem; text-align: left; font-size: 0.75rem; color: #4a5568; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 1.25rem 1rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
        tr:hover { background: #f1f5f9; }
        tr.inactive { background: #fafafa; }

        .user-id-stack { display: flex; flex-direction: column; gap: 0.25rem; }
        .user-id { font-family: monospace; font-weight: 700; color: #4c51bf; background: #e0e7ff; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem; }
        .db-id { font-size: 0.7rem; color: #a0aec0; }

        .email-stack { display: flex; flex-direction: column; gap: 0.35rem; }
        .email-text { font-weight: 600; color: #2d3748; }
        .provider-tag { font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 4px; width: fit-content; text-transform: uppercase; }
        .provider-tag.google { background: #fff5f5; color: #c53030; border: 1px solid #feb2b2; }
        .provider-tag.local { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

        .name-stack { display: flex; flex-direction: column; }
        .user-name { font-weight: 700; color: #1a202c; }
        .user-mobile { font-size: 0.8rem; color: #718096; }

        .status-badge { padding: 0.35rem 0.75rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
        .status-badge.active { background: #d1fae5; color: #065f46; }
        .status-badge.inactive { background: #fee2e2; color: #991b1b; }

        .role-stack { display: flex; flex-direction: column; gap: 0.25rem; }
        .badge-role { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; width: fit-content; }
        .badge-role.super { background: linear-gradient(135deg, #7066E0 0%, #C084FC 100%); color: white; }
        .badge-role.tenant { background: #E0E7FF; color: #4338CA; border: 1px solid #C7D2FE; }
        .badge-role.user { background: #F3F4F6; color: #4B5563; }
        .god-warning { font-size: 0.65rem; color: #DC2626; font-weight: 600; }

        .access-stack { display: flex; flex-direction: column; gap: 0.25rem; max-width: 150px; }
        .tenant-link { font-size: 0.8rem; font-weight: 600; color: #2D3748; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .no-access { font-size: 0.8rem; color: #A0AEC0; font-style: italic; }
        .since-text { font-size: 0.7rem; color: #A0AEC0; margin-top: 0.15rem; }

        .actions { display: flex; gap: 0.5rem; flex-wrap: nowrap; }
        .btn-action { padding: 0.4rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-action:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-green { background: #16a34a; color: white; }
        .btn-red { background: #dc2626; color: white; }
        .btn-delete-user { border: 1px solid #feb2b2; background: #fff5f5; color: #c53030; }
        .btn-delete-user:hover:not(:disabled) { background: #dc2626; color: white; }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// APPS LIST (God Mode)
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// APPS LIST (God Mode)
// ═══════════════════════════════════════════════════════════

function AppsList({ apps, onSelect, onUpdate }: any) {
  return (
    <div className="apps-list">
      <div className="header">
        <h2>📱 Application Catalog</h2>
        <p className="subtitle">Click an app to manage platform-wide permissions</p>
      </div>
      <div className="grid">
        {apps.map((app: any) => (
          <div key={app.id} className="app-card" onClick={() => onSelect(app)}>
            <div className="app-icon-wrapper">
              <span className="app-id-pill">{app.id}</span>
            </div>
            <h3>{app.name}</h3>
            <p>{app.description}</p>
            <div className="meta">
              <span className={`badge ${app.isCore ? 'core' : ''}`}>
                {app.isCore ? 'Core System' : 'Standard App'}
              </span>
              <span className="category">{app.category}</span>
            </div>

            <div className="usage-stat">
              <span className="dot"></span>
              Used by {app._count?.tenantApps || 0} organizations
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .apps-list .header { margin-bottom: 2rem; }
        .apps-list h2 { margin: 0; color: #2d3748; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        
        .app-card { 
          background: white; 
          padding: 1.5rem; 
          border-radius: 16px; 
          border: 2px solid #e2e8f0; 
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        
        .app-card:hover { 
          border-color: #667eea; 
          transform: translateY(-4px); 
          box-shadow: 0 12px 20px rgba(102, 126, 234, 0.15); 
        }

        .app-icon-wrapper { margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: flex-start; }
        .app-id-pill { font-size: 0.65rem; font-family: monospace; font-weight: 800; background: #f1f5f9; color: #64748b; padding: 0.2rem 0.5rem; border-radius: 4px; text-transform: uppercase; }

        .app-card h3 { margin: 0 0 0.5rem 0; color: #1a202c; font-size: 1.25rem; }
        .app-card p { margin: 0 0 1.25rem 0; font-size: 0.9rem; color: #4a5568; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        
        .meta { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
        .badge { padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; background: #f3f4f6; color: #6b7280; text-transform: uppercase; }
        .badge.core { background: #e0e7ff; color: #4338ca; }
        .category { padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.7rem; font-weight: 600; background: #f8fafc; color: #94a3b8; text-transform: capitalize; border: 1px solid #f1f5f9; }

        .usage-stat { font-size: 0.75rem; color: #94a3b8; display: flex; align-items: center; gap: 0.5rem; border-top: 1px solid #f1f5f9; pt: 1rem; margin-top: 0.5rem; padding-top: 0.75rem; }
        .usage-stat .dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; display: inline-block; }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// APP ACCESS MODAL (Global Permission Manager)
// ═══════════════════════════════════════════════════════════

function AppAccessModal({ app, onClose, onUpdate }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const authenticatedFetch = useAuthenticatedFetch();

  useEffect(() => {
    loadConsumers();
  }, [app.id]);

  async function loadConsumers() {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/platform/apps/${app.id}/consumers`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error('Failed to load consumers:', err);
    } finally {
      setLoading(false);
    }
  }

  const toggleTenantAccess = async (tenantId: string) => {
    setProcessing(`t-${tenantId}`);
    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/platform/apps/${app.id}/tenants/${tenantId}/toggle`, {
        method: 'PATCH'
      });
      if (res.ok) loadConsumers();
    } finally {
      setProcessing(null);
    }
  };

  const toggleUserAccess = async (userId: string) => {
    setProcessing(`u-${userId}`);
    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/platform/apps/${app.id}/users/${userId}/toggle`, {
        method: 'PATCH'
      });
      if (res.ok) loadConsumers();
    } finally {
      setProcessing(null);
    }
  };

  const filteredTenants = data?.tenants?.filter((t: any) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.customShortId?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filteredUsers = data?.users?.filter((u: any) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wider-modal animate-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="app-info">
            <span className="app-icon-large">📱</span>
            <div>
              <h3>Permissions: {app.name}</h3>
              <p className="subtitle">Managing platform-wide access rights</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-search">
          <input
            placeholder="🔍 Search tenants or staff members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner-large"></div>
              <p>Fetching permission map...</p>
            </div>
          ) : (
            <div className="access-grid">
              {/* TENANTS SECTION */}
              <section className="access-section">
                <div className="section-header">
                  <h4>🏢 Organizations ({filteredTenants.length})</h4>
                  <p>Hides/Shows app for all workspace members</p>
                </div>
                <div className="access-list">
                  {filteredTenants.map((t: any) => (
                    <div key={t.id} className="access-item">
                      <div className="item-info">
                        <span className="id-tag">{t.customShortId || 'TENANT'}</span>
                        <span className="name">{t.name}</span>
                      </div>
                      <button
                        className={`toggle-btn ${t.enabled ? 'enabled' : ''}`}
                        disabled={processing === `t-${t.id}`}
                        onClick={() => toggleTenantAccess(t.id)}
                      >
                        {processing === `t-${t.id}` ? '...' : (t.enabled ? 'ENABLED' : 'DISABLED')}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* STAFF/USERS SECTION */}
              <section className="access-section">
                <div className="section-header">
                  <h4>👥 Platform Staff & Private Users ({filteredUsers.length})</h4>
                  <p>Individual access for non-workspace roles</p>
                </div>
                <div className="access-list">
                  {filteredUsers.map((u: any) => (
                    <div key={u.id} className="access-item">
                      <div className="item-info">
                        <span className={`role-pill ${u.role}`}>{u.role}</span>
                        <div className="user-details">
                          <span className="name">{u.displayName || 'Unnamed Staff'}</span>
                          <span className="email">{u.email}</span>
                        </div>
                      </div>
                      <button
                        className={`toggle-btn ${u.enabled ? 'enabled' : ''}`}
                        disabled={processing === `u-${u.id}` || u.role === 'super_admin'}
                        onClick={() => toggleUserAccess(u.id)}
                      >
                        {u.role === 'super_admin' ? 'FULL ACCESS' : (processing === `u-${u.id}` ? '...' : (u.enabled ? 'GRANTED' : 'REVOKED'))}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        <style jsx>{`
          .modal-header .app-info { display: flex; align-items: center; gap: 1rem; }
          .app-icon-large { font-size: 2rem; }
          .modal-search { padding: 1rem 2rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
          .search-input { width: 100%; border: 2px solid #e2e8f0; padding: 0.6rem 1rem; border-radius: 12px; font-size: 0.95rem; }
          .modal-body { padding: 0; max-height: 60vh; overflow-y: auto; }
          
          .access-grid { display: grid; grid-template-columns: 1fr 1fr; divide-x: 1px solid #e2e8f0; }
          .access-section { padding: 1.5rem 2rem; border-right: 1px solid #f1f5f9; }
          .access-section:last-child { border-right: none; }
          
          .section-header { margin-bottom: 1.5rem; }
          .section-header h4 { margin: 0; color: #1a202c; font-weight: 700; }
          .section-header p { margin: 0.25rem 0 0 0; font-size: 0.8rem; color: #718096; }

          .access-list { display: flex; flex-direction: column; gap: 0.75rem; }
          .access-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; }
          
          .item-info { display: flex; align-items: center; gap: 0.75rem; }
          .id-tag { font-family: monospace; font-size: 0.7rem; font-weight: 800; background: #e2e8f0; color: #475569; padding: 0.15rem 0.4rem; border-radius: 4px; }
          .name { font-weight: 600; font-size: 0.9rem; color: #334155; }
          
          .user-details { display: flex; flex-direction: column; }
          .email { font-size: 0.75rem; color: #94a3b8; }
          
          .role-pill { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; padding: 0.1rem 0.4rem; border-radius: 4px; }
          .role-pill.super_admin { background: #fee2e2; color: #ef4444; }
          .role-pill.user { background: #f1f5f9; color: #64748b; }
          .role-pill.tenant_admin { background: #dcfce7; color: #166534; }

          .toggle-btn { padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.7rem; font-weight: 800; cursor: pointer; border: none; transition: all 0.2s; min-width: 85px; }
          .toggle-btn.enabled { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
          .toggle-btn:not(.enabled) { background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; }
          .toggle-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(0.95); }
          
          .loading-state { padding: 4rem; text-align: center; color: #94a3b8; }
          .spinner-large { width: 3rem; height: 3rem; border: 4px solid #f1f5f9; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
        `}</style>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TENANT USERS LIST
// ═══════════════════════════════════════════════════════════

function TenantUsersList({ users, tenantId, onUpdate }: any) {
  const [showInvite, setShowInvite] = useState(false);
  const [managingUser, setManagingUser] = useState<any>(null);

  return (
    <div className="tenant-users-list">
      <div className="header">
        <div>
          <h2>👥 Team Members</h2>
          <p className="subtitle">Invite and manage access for your organization</p>
        </div>
        <button className="btn-add" onClick={() => setShowInvite(true)}>
          <span className="icon">+</span> Add Team Member
        </button>
      </div>

      <div className="user-table-container">
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>App Access</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((member: any) => (
              <tr key={member.id}>
                <td>
                  <div className="user-info">
                    <div className="avatar">
                      {member.user.photoUrl ? (
                        <img src={member.user.photoUrl} alt="" />
                      ) : (
                        <span>{(member.user.displayName || member.user.email)[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="name">{member.user.displayName || 'Unnamed Member'}</div>
                      <div className="email">{member.user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${member.role}`}>{member.role}</span>
                </td>
                <td>
                  <div className="app-stats">
                    <strong>{member.appPermissions?.length || 0}</strong> apps enabled
                  </div>
                </td>
                <td>
                  <button className="btn-manage" onClick={() => setManagingUser(member)}>
                    ⚙️ Manage Access
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <InviteMemberModal
          tenantId={tenantId}
          onClose={() => setShowInvite(false)}
          onUpdate={onUpdate}
        />
      )}

      {managingUser && (
        <UserAppPermissionsModal
          member={managingUser}
          tenantId={tenantId}
          onClose={() => setManagingUser(null)}
          onUpdate={onUpdate}
        />
      )}

      <style jsx>{`
        .tenant-users-list .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .tenant-users-list h2 { margin: 0; color: #1a202c; }
        .subtitle { color: #718096; font-size: 0.9rem; margin-top: 0.25rem; }
        
        .btn-add { background: #667eea; color: white; border: none; padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
        .btn-add:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); }

        .user-table-container { background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f1f5f9; padding: 1rem; text-align: left; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 1.25rem 1rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        
        .user-info { display: flex; align-items: center; gap: 1rem; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; overflow: hidden; }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .name { font-weight: 600; color: #1a202c; }
        .email { font-size: 0.8rem; color: #718096; }

        .role-badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .role-badge.owner { background: #fee2e2; color: #991b1b; }
        .role-badge.admin { background: #dbeafe; color: #1e40af; }
        .role-badge.member { background: #dcfce7; color: #166534; }

        .app-stats { font-size: 0.9rem; color: #4a5568; }
        
        .btn-manage { background: white; border: 1px solid #e2e8f0; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; color: #4a5568; cursor: pointer; transition: all 0.2s; }
        .btn-manage:hover { background: #f7fafc; border-color: #cbd5e0; }
      `}</style>
    </div>
  );
}

function InviteMemberModal({ tenantId, onClose, onUpdate }: any) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const authenticatedFetch = useAuthenticatedFetch();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/tenants/${tenantId}/users/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (res.ok) {
        onUpdate();
        onClose();
        alert('📩 Invitation sent successfully!');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to invite user');
      }
    } catch (err) {
      alert('Error sending invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>➕ Add Team Member</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleInvite}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="colleague@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value.toLowerCase())}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Workspace Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member (Regular Access)</option>
              <option value="admin">Admin (Can manage users)</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserAppPermissionsModal({ member, tenantId, onClose, onUpdate }: any) {
  const [tenantApps, setTenantApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const userPermittedAppIds = member.appPermissions?.map((p: any) => p.appId) || [];

  useEffect(() => {
    loadTenantApps();
  }, []);

  async function loadTenantApps() {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/tenants/${tenantId}/apps`);
      if (res.ok) setTenantApps(await res.json());
    } finally {
      setLoading(false);
    }
  }

  const togglePermission = async (appId: string, isGranted: boolean) => {
    setProcessing(appId);
    try {
      const method = isGranted ? 'DELETE' : 'POST';
      const res = await authenticatedFetch(`${BACKEND_URL}/tenants/${tenantId}/users/${member.user.id}/apps/${appId}`, {
        method
      });
      if (res.ok) onUpdate();
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚙️ App Access: {member.user.displayName || member.user.email}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body p-6">
          <p className="subtitle mb-6">Enable or disable specific applications for this member.</p>

          {loading ? (
            <div className="flex-center py-10"><div className="spinner"></div></div>
          ) : (
            <div className="perm-list">
              {tenantApps.map((ta: any) => {
                const isGranted = userPermittedAppIds.includes(ta.appId);
                return (
                  <div key={ta.appId} className="perm-item">
                    <div className="app-info">
                      <span className="app-name">{ta.app.name}</span>
                      <span className="app-cat">{ta.app.category}</span>
                    </div>
                    <button
                      className={`toggle-btn ${isGranted ? 'granted' : ''}`}
                      disabled={processing === ta.appId}
                      onClick={() => togglePermission(ta.appId, isGranted)}
                    >
                      {processing === ta.appId ? '...' : (isGranted ? 'GRANTED' : 'NO ACCESS')}
                    </button>
                  </div>
                );
              })}
              {tenantApps.length === 0 && (
                <div className="empty-apps">
                  No apps enabled for this organization yet.
                </div>
              )}
            </div>
          )}
        </div>
        <style jsx>{`
          .perm-list { display: flex; flex-direction: column; gap: 0.75rem; }
          .perm-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
          .app-info { display: flex; flex-direction: column; }
          .app-name { font-weight: 700; color: #1a202c; }
          .app-cat { font-size: 0.75rem; color: #718096; text-transform: uppercase; }
          .toggle-btn { padding: 0.4rem 1rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; border: none; min-width: 100px; }
          .toggle-btn.granted { background: #dcfce7; color: #166534; }
          .toggle-btn:not(.granted) { background: #f1f5f9; color: #64748b; }
          .empty-apps { text-align: center; padding: 2rem; color: #a0aec0; font-style: italic; }
        `}</style>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MANAGE APPS MODAL (Super Admin)
// ═══════════════════════════════════════════════════════════

function ManageAppsModal({ tenant, allApps, onClose, onUpdate }: any) {
  const [tenantApps, setTenantApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  useEffect(() => {
    loadTenantApps();
  }, [tenant.id]);

  async function loadTenantApps() {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/tenants/${tenant.id}/apps`);
      if (res.ok) {
        setTenantApps(await res.json());
      }
    } catch (err) {
      console.error('Failed to load tenant apps:', err);
    } finally {
      setLoading(false);
    }
  }

  const toggleApp = async (appId: string, currentlyEnabled: boolean) => {
    setProcessing(appId);
    try {
      const method = currentlyEnabled ? 'DELETE' : 'POST';
      const res = await authenticatedFetch(`${BACKEND_URL}/tenants/${tenant.id}/apps/${appId}`, {
        method
      });
      if (res.ok) {
        await loadTenantApps();
        onUpdate();
      }
    } catch (err) {
      alert('Failed to update app status');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide-modal animate-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>📱 Manage App Permissions</h3>
            <p className="modal-subtitle">Enabling apps for <strong>{tenant.name}</strong></p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">Loading tenant application bundle...</div>
          ) : (
            <div className="app-permission-grid">
              {allApps.map((app: any) => {
                const tenantAppEntry = tenantApps.find(ta => ta.appId === app.id);
                const isEnabled = tenantAppEntry && tenantAppEntry.enabled;

                return (
                  <div key={app.id} className={`app-perm-card ${isEnabled ? 'enabled' : 'disabled'}`}>
                    <div className="app-icon-small">{app.iconUrl || '📦'}</div>
                    <div className="app-info">
                      <div className="app-name-row">
                        <h4>{app.name}</h4>
                        {app.isCore && <span className="core-tag">Core</span>}
                      </div>
                      <p>{app.description}</p>
                    </div>
                    <div className="app-toggle">
                      <button
                        onClick={() => toggleApp(app.id, !!isEnabled)}
                        disabled={processing === app.id}
                        className={`toggle-btn ${isEnabled ? 'on' : 'off'}`}
                      >
                        {processing === app.id ? '...' : isEnabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-actions-footer">
          <button className="btn-finish" onClick={onClose}>Done</button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .modal { background: white; width: 100%; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; color: #1a202c; }
        .wide-modal { max-width: 800px; }
        .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
        .modal-subtitle { color: #64748b; font-size: 0.9rem; margin: 0; }
        .close-btn { background: none; border: none; font-size: 1.5rem; color: #a0aec0; cursor: pointer; }
        .modal-body { padding: 2rem; max-height: 500px; overflow-y: auto; }
        .loading-state { padding: 3rem; text-align: center; color: #64748b; font-style: italic; }
        .app-permission-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .app-perm-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0; transition: all 0.2s; background: #fff; }
        .app-perm-card.enabled { border-color: #667eea; background: #f5f3ff; }
        .app-perm-card.disabled { opacity: 0.8; }
        .app-icon-small { font-size: 1.5rem; }
        .app-info { flex: 1; }
        .app-info h4 { margin: 0; font-size: 0.95rem; color: #1e293b; }
        .app-name-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
        .core-tag { font-size: 0.65rem; background: #e0e7ff; color: #4338ca; padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 800; text-transform: uppercase; }
        .app-info p { margin: 0; font-size: 0.75rem; color: #64748b; line-height: 1.3; }
        .toggle-btn { padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; min-width: 80px; }
        .toggle-btn.on { background: #667eea; color: white; }
        .toggle-btn.off { background: #f1f5f9; color: #64748b; }
        .modal-actions-footer { padding: 1.5rem 2rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; }
        .btn-finish { background: #1a202c; color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-weight: 700; cursor: pointer; }
        .animate-in { animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TENANT APPS LIST
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// ANALYTICS & SYSTEM HEALTH
// ═══════════════════════════════════════════════════════════

function AnalyticsDashboard({ onRepair }: { onRepair: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const authenticatedFetch = useAuthenticatedFetch();

  const handleRepair = async () => {
    if (!confirm('This will attempt to manually add missing database columns (allowed_apps, custom_short_id). Continue?')) return;
    setRepairing(true);
    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/platform/repair-db`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert('✅ ' + data.message);
        onRepair();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('Error triggering repair');
    } finally {
      setRepairing(false);
    }
  };

  return (
    <div className="analytics-dashboard">
      <div className="header-row">
        <div>
          <h2>📊 Platform Analytics</h2>
          <p className="subtitle">System health and usage metrics</p>
        </div>
        <button
          className={`repair-btn ${repairing ? 'loading' : ''}`}
          onClick={handleRepair}
          disabled={repairing}
        >
          {repairing ? '🛠 Repairing...' : '🛠 Repair Database Schema'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">Active</div>
          <div className="stat-label">System Status</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">Stable</div>
          <div className="stat-label">API Health</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">Connected</div>
          <div className="stat-label">Database Status</div>
        </div>
      </div>

      <div className="notice-box">
        <h3>💡 Pro Tip</h3>
        <p>If you see "0 organizations" or app toggles aren't saving, click the <strong>Repair Database Schema</strong> button above to synchronize the database with the latest features.</p>
      </div>

      <style jsx>{`
        .analytics-dashboard { color: #1a202c; background: white; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .header-row h2 { margin: 0; color: #2d3748; }
        .subtitle { color: #718096; margin: 0.25rem 0 0 0; }
        
        .repair-btn {
          background: #f1f5f9; color: #475569; border: 2px solid #e2e8f0; padding: 0.75rem 1.5rem; 
          border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .repair-btn:hover:not(:disabled) { background: #e2e8f0; border-color: #cbd5e0; color: #1e293b; }
        .repair-btn.loading { opacity: 0.7; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .stat-card { background: #f8fafc; padding: 1.5rem; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center; }
        .stat-value { font-size: 1.5rem; font-weight: 800; color: #10b981; margin-bottom: 0.25rem; }
        .stat-label { font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        .notice-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 1.5rem; border-radius: 12px; color: #1e40af; }
        .notice-box h3 { margin: 0 0 0.5rem 0; font-size: 1.1rem; }
        .notice-box p { margin: 0; line-height: 1.5; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TENANT APPS LIST
// ═══════════════════════════════════════════════════════════

function TenantAppsList({ apps, tenantId, onUpdate }: any) {
  return (
    <div className="tenant-apps">
      <h2>📱 Organization Applications</h2>
      <p className="subtitle">Applications enabled for your workspace</p>

      <div className="apps-grid">
        {apps.length === 0 ? (
          <div className="empty-apps">
            <p>No extra applications enabled by super admin yet.</p>
          </div>
        ) : (
          apps.map((ta: any) => (
            <div key={ta.appId} className={`app-card-simple ${ta.enabled ? 'active' : 'disabled'}`}>
              <div className="icon">{ta.app?.iconUrl || '📦'}</div>
              <div className="info">
                <h3>{ta.app?.name}</h3>
                <p>{ta.app?.description}</p>
              </div>
              <div className={`status-tag ${ta.enabled ? 'enabled' : 'disabled'}`}>
                {ta.enabled ? 'Enabled' : 'Restricted'}
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .tenant-apps h2 { margin-bottom: 0.25rem; }
        .subtitle { color: #666; margin-bottom: 2rem; font-size: 0.9rem; }
        .apps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .app-card-simple { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; }
        .icon { font-size: 2rem; }
        .info { flex: 1; }
        .info h3 { margin: 0; font-size: 1rem; color: #1a202c; }
        .info p { margin: 0.25rem 0 0 0; font-size: 0.8rem; color: #64748b; line-height: 1.4; }
        .status-tag { font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.5rem; border-radius: 4px; text-transform: uppercase; }
        .status-tag.enabled { background: #dcfce7; color: #166534; }
        .status-tag.disabled { background: #fee2e2; color: #991b1b; }
        .empty-apps { padding: 3rem; text-align: center; color: #a0aec0; border: 2px dashed #e2e8f0; border-radius: 12px; grid-column: 1 / -1; }
      `}</style>
    </div>
  );
}
