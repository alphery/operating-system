import React, { Component } from 'react';

export class TenantManager extends Component {
    constructor() {
        super();
        this.state = {
            tenants: [],
            showEditor: false,
            newTenant: {
                name: '',
                email: '', // Admin Email
                plan: 'enterprise',
                template: 'healthcare-erp',
                allowedApps: ['projects', 'messenger', 'calendar', 'files'] // Default allowed apps
            },
            isLoading: false,
            message: null
        };
    }

    componentDidMount() {
        // Authenticate: Only allow Super Admin
        // In a real app, you'd check this.props.user.email === 'alpherymail@gmail.com' again here
        // But the desktop level check is the first gate.
        this.fetchTenants();
    }

    fetchTenants = async () => {
        try {
            const res = await fetch('https://alphery-os-backend.onrender.com/tenants');
            if (res.ok) {
                const tenants = await res.json();
                this.setState({ tenants });
            }
        } catch (e) {
            console.error("Failed to fetch tenants", e);
        }
    }

    handleInputChange = (e) => {
        const { name, value } = e.target;
        this.setState(prev => ({
            newTenant: { ...prev.newTenant, [name]: value }
        }));
    }

    handleAppSelection = (appId) => {
        const { allowedApps } = this.state.newTenant;
        let newApps;
        if (allowedApps.includes(appId)) {
            newApps = allowedApps.filter(id => id !== appId);
        } else {
            newApps = [...allowedApps, appId];
        }
        this.setState(prev => ({
            newTenant: { ...prev.newTenant, allowedApps: newApps }
        }));
    }

    createTenant = async () => {
        this.setState({ isLoading: true, message: null });
        try {
            // 1. Create Tenant Record
            const res = await fetch('https://alphery-os-backend.onrender.com/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: this.state.newTenant.name,
                    plan: this.state.newTenant.plan,
                    allowedApps: this.state.newTenant.allowedApps // Now sending allowedApps!
                })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to create tenant');

            const tenantId = data.id;

            // 2. Instantiate ERP Factory (Apply Template)
            const factoryRes = await fetch('https://alphery-os-backend.onrender.com/factory/instantiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: tenantId,
                    templateSlug: this.state.newTenant.template
                })
            });

            if (!factoryRes.ok) throw new Error('Failed to apply ERP template');

            this.setState({
                message: `✅ Success! Tenant '${data.name}' created with ID: ${tenantId}. ERP instantiated.`,
                isLoading: false,
                showEditor: false,
                newTenant: { ...this.state.newTenant, name: '', email: '' }
            });

            // Refresh list
            this.fetchTenants();

        } catch (error) {
            this.setState({ message: `❌ Error: ${error.message}`, isLoading: false });
        }
    }

    render() {
        const supportedApps = [
            { id: 'projects', name: 'CRM Pro' },
            { id: 'messenger', name: 'Messenger' },
            { id: 'files', name: 'Files' },
            { id: 'calendar', name: 'Calendar' },
            { id: 'vscode', name: 'VS Code' },
            { id: 'terminal', name: 'Terminal' }
        ];

        return (
            <div className="w-full h-full bg-gray-50 flex flex-col font-sans">
                {/* Header */}
                <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Alphery OS - God Mode</h1>
                        <p className="text-sm text-gray-500">Super Admin Tenant Manager</p>
                    </div>
                    <button
                        onClick={() => this.setState({ showEditor: true })}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <span>+</span> New Client
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-auto">
                    {this.state.message && (
                        <div className={`mb-6 p-4 rounded-lg ${this.state.message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {this.state.message}
                        </div>
                    )}

                    {/* Tenant List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {this.state.tenants.length === 0 ? (
                            <div className="col-span-3 text-center text-gray-400 py-10">
                                <p>No clients found. Click "New Client" to onboard one.</p>
                            </div>
                        ) : this.state.tenants.map(tenant => (
                            <div key={tenant.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl font-bold">
                                        {tenant.name.charAt(0)}
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">Active</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{tenant.name}</h3>
                                <p className="text-sm text-gray-500 mb-4">Plan: {tenant.plan}</p>

                                {tenant.allowedApps && tenant.allowedApps.length > 0 && (
                                    <>
                                        <div className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Access</div>
                                        <div className="flex gap-2 flex-wrap mb-4">
                                            {tenant.allowedApps.slice(0, 3).map(appId => (
                                                <span key={appId} className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                                                    {supportedApps.find(a => a.id === appId)?.name || appId}
                                                </span>
                                            ))}
                                            {tenant.allowedApps.length > 3 && <span className="text-xs text-gray-400">+{tenant.allowedApps.length - 3}</span>}
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(tenant.id); this.setState({ message: `Copied ID: ${tenant.id}` }); }}
                                        className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                                    >
                                        Copy ID
                                    </button>
                                    <button className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                                        Manage
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Create Modal */}
                {this.state.showEditor && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                                <h2 className="text-lg font-bold">Onboard New Client</h2>
                                <button onClick={() => this.setState({ showEditor: false })} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                        <input
                                            name="name"
                                            value={this.state.newTenant.name}
                                            onChange={this.handleInputChange}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                            placeholder="e.g. Acme Corp"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                                        <input
                                            name="email"
                                            value={this.state.newTenant.email}
                                            onChange={this.handleInputChange}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                            placeholder="client@company.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                                        <select
                                            name="plan"
                                            value={this.state.newTenant.plan}
                                            onChange={this.handleInputChange}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            <option value="starter">Starter</option>
                                            <option value="business">Business</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Industry Template</label>
                                        <select
                                            name="template"
                                            value={this.state.newTenant.template}
                                            onChange={this.handleInputChange}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            <option value="healthcare-erp">🏥 Healthcare ERP</option>
                                            <option value="construction-erp">🏗️ Construction ERP</option>
                                            <option value="retail-pos">🛒 Retail POS</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Allowed OS Apps</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {supportedApps.map(app => (
                                            <div
                                                key={app.id}
                                                onClick={() => this.handleAppSelection(app.id)}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-2 ${this.state.newTenant.allowedApps.includes(app.id)
                                                    ? 'bg-purple-50 border-purple-500 text-purple-700'
                                                    : 'hover:bg-gray-50 border-gray-200'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${this.state.newTenant.allowedApps.includes(app.id) ? 'bg-purple-600 border-transparent' : 'border-gray-300'
                                                    }`}>
                                                    {this.state.newTenant.allowedApps.includes(app.id) && <span className="text-white text-xs">✓</span>}
                                                </div>
                                                <span className="text-sm font-medium">{app.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                                <button onClick={() => this.setState({ showEditor: false })} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Cancel</button>
                                <button
                                    onClick={this.createTenant}
                                    disabled={this.state.isLoading}
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg disabled:opacity-50 flex items-center gap-2"
                                >
                                    {this.state.isLoading ? 'Deploying...' : 'Deploy Tenant'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export const displayTenantManager = () => {
    return <TenantManager />;
};
