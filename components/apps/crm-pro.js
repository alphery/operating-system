import React, { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════
// CRM PRO - TEMPLATE-DRIVEN MULTI-TENANT CRM
// ═══════════════════════════════════════════════════════════

export default function CRMPro() {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isGod, setIsGod] = useState(false);

    useEffect(() => {
        // 1. IMPROVED GOD MODE DETECTION
        // We check every possible key where the platform might store the Super Admin state
        const user1 = JSON.parse(localStorage.getItem('user_data') || '{}');
        const user2 = JSON.parse(localStorage.getItem('user') || '{}');
        const username = localStorage.getItem('username');
        const platformId = localStorage.getItem('platform_id');

        // Detection logic for Super Admin (God)
        const isSuperAdmin =
            user1.role === 'admin' || user1.isGod || user1.email === 'alpherymail@gmail.com' ||
            user2.role === 'admin' || user2.isGod || user2.customUid === 'AA000001' || user2.customUid === 'AU000001' ||
            username === 'admin' || username === 'AA000001' || username === 'AU000001' ||
            platformId === 'PLATFORM_SUPER_ADMIN';

        setIsGod(isSuperAdmin);

        // 2. Load Persistence
        const savedTemplate = localStorage.getItem('crm_template');
        const savedAuth = localStorage.getItem('crm_authenticated');

        if (isSuperAdmin) {
            // God Mode: Always force reset to selection grid on mount
            // This ensures God never gets stuck in a branded login or workspace
            setSelectedTemplate(null);
            setIsAuthenticated(false);
            // Optionally clear the temporary local storage to be safe
            localStorage.removeItem('crm_template');
            localStorage.removeItem('crm_authenticated');
        } else {
            // Regular Tenant: Auto-load their configured CRM
            if (savedTemplate) {
                setSelectedTemplate(JSON.parse(savedTemplate));
            }
            if (savedAuth === 'true') {
                setIsAuthenticated(true);
            }
        }

        setTimeout(() => setLoading(false), 800);
    }, []);

    const handleSelectTemplate = (template) => {
        // Only save to localStorage permanently for non-god users
        if (!isGod) {
            localStorage.setItem('crm_template', JSON.stringify(template));
        }

        setSelectedTemplate(template);
        setIsAuthenticated(false);
        localStorage.removeItem('crm_authenticated');
    };

    const handleLogin = (success) => {
        if (success) {
            setIsAuthenticated(true);
            // Only remember login session for non-god users (God chooses to "re-login" or skip)
            if (!isGod) {
                localStorage.setItem('crm_authenticated', 'true');
            }
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    if (!selectedTemplate) {
        return <TemplateSelectionScreen onSelect={handleSelectTemplate} />;
    }

    // After template is selected
    // 1. Super Admin (God) bypasses login to preview everything instantly
    // 2. Regular Tenants must login
    if (!isAuthenticated && !isGod) {
        return <CRMLogin template={selectedTemplate} onLogin={handleLogin} />;
    }

    return <CRMWorkspace template={selectedTemplate} />;
}

// ═══════════════════════════════════════════════════════════
// CRM LOGIN PAGE
// ═══════════════════════════════════════════════════════════
function CRMLogin({ template, onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError('');

        // Simulation delay for premium feeel
        setTimeout(() => {
            if (username === 'KEC000001' && password === 'ALPHERY25@it') {
                onLogin(true);
            } else {
                setError('Invalid credentials. Please contact administrator.');
                setIsLoggingIn(false);
            }
        }, 1000);
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-[#f2f4f8] relative overflow-hidden font-sans">
            {/* Soft Premium Background */}
            <div className="absolute top-0 left-0 w-full h-full opacity-40">
                <div className="absolute top-[-10%] right-[-5%] w-[70%] h-[70%] bg-blue-100 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[60%] bg-indigo-100 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-[460px] bg-white border border-white rounded-[2rem] p-12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] z-10 mx-4 relative backdrop-blur-sm">

                {/* Logo Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#7066E0] rounded-[1.5rem] shadow-xl shadow-indigo-200 mb-6 text-white text-3xl font-bold transition-transform hover:scale-105 duration-300">
                        {template.id === 'hospital' ? 'H' : template.icon}
                    </div>

                    <h1 className="text-3xl font-bold text-[#1a1c1e] mb-2 tracking-tight">
                        {template.name}
                    </h1>
                    <p className="text-[#64748b] font-medium text-sm">
                        Sign in to your CRM dashboard
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username */}
                    <div>
                        <label className="block text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.15em] mb-2 ml-1">
                            Username
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#7066E0] transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                className="w-full pl-12 pr-4 py-4 bg-[#f8fafc] border border-gray-100 rounded-2xl focus:border-[#7066E0] focus:ring-4 focus:ring-[#7066E0]/5 outline-none transition-all text-[#334155] font-medium placeholder:text-[#cbd5e1]"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.15em] mb-2 ml-1">
                            Password
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#7066E0] transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-12 pr-12 py-4 bg-[#f8fafc] border border-gray-100 rounded-2xl focus:border-[#7066E0] focus:ring-4 focus:ring-[#7066E0]/5 outline-none transition-all text-[#334155] font-medium placeholder:text-[#cbd5e1]"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#cbd5e1] hover:text-[#7066E0] transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 text-xs font-bold p-4 rounded-xl border border-red-50 animate-shake flex items-center gap-2">
                            <span className="text-lg">⚠️</span> {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className={`w-full py-4.5 bg-gradient-to-r from-[#7066E0] to-[#8278f0] text-white rounded-2xl font-bold text-lg shadow-[0_12px_24px_-8px_rgba(112,102,224,0.4)] hover:shadow-[0_16px_32px_-8px_rgba(112,102,224,0.5)] transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${isLoggingIn ? 'opacity-80 cursor-not-allowed' : ''}`}
                    >
                        {isLoggingIn ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-[0.25em]">
                        Alphery Secure Engine 1.4
                    </p>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// LOADING SCREEN
// ═══════════════════════════════════════════════════════════
function LoadingScreen() {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading CRM Pro...</p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// TEMPLATE SELECTION SCREEN
// ═══════════════════════════════════════════════════════════
function TemplateSelectionScreen({ onSelect }) {
    const templates = [
        {
            id: 'hospital',
            name: 'Hospital CRM',
            icon: '🏥',
            description: 'Complete healthcare management with patient records, appointments, and medical history',
            industryType: 'Healthcare',
            modules: ['Patients', 'Appointments', 'Doctors', 'Medical Records', 'Prescriptions', 'Billing'],
            color: 'from-blue-500 to-cyan-500'
        },
        {
            id: 'real-estate',
            name: 'Real Estate CRM',
            icon: '🏢',
            description: 'Property management, agent tracking, listings, and client communication',
            industryType: 'Real Estate',
            modules: ['Properties', 'Agents', 'Listings', 'Clients', 'Deals', 'Viewings'],
            color: 'from-emerald-500 to-teal-500'
        },
        {
            id: 'jewellery',
            name: 'Jewellery CRM',
            icon: '💎',
            description: 'Inventory management, customer orders, designs, and sales tracking',
            industryType: 'Retail',
            modules: ['Inventory', 'Customers', 'Sales', 'Designs', 'Orders', 'Suppliers'],
            color: 'from-purple-500 to-pink-500'
        },
        {
            id: 'corporate',
            name: 'Corporate CRM',
            icon: '🎯',
            description: 'Lead management, accounts, contacts, and sales pipeline tracking',
            industryType: 'Business',
            modules: ['Leads', 'Accounts', 'Contacts', 'Opportunities', 'Campaigns', 'Reports'],
            color: 'from-orange-500 to-red-500'
        },
        {
            id: 'blank',
            name: 'Blank Template',
            icon: '📝',
            description: 'Start from scratch and build your own customized CRM',
            industryType: 'Custom',
            modules: ['Custom Module 1', 'Custom Module 2'],
            color: 'from-gray-500 to-slate-500'
        }
    ];

    const handleSelect = (template) => {
        // Save to localStorage (in real app, this would be an API call)
        localStorage.setItem('crm_template', JSON.stringify(template));
        onSelect(template);
    };

    return (
        <div className="w-full h-full overflow-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12 text-center">
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
                    🚀 CRM Pro - Template System
                </div>
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                    Choose Your CRM Template
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Select an industry template to instantly configure your CRM with pre-built modules,
                    fields, workflows, and dashboards. Setup takes just <span className="font-bold text-blue-600">30 seconds</span>!
                </p>
            </div>

            {/* Template Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-blue-200"
                        onClick={() => handleSelect(template)}
                    >
                        {/* Icon */}
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${template.color} flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform`}>
                            {template.icon}
                        </div>

                        {/* Header */}
                        <div className="mb-4">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{template.name}</h3>
                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                                {template.industryType}
                            </span>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            {template.description}
                        </p>

                        {/* Modules */}
                        <div className="space-y-2 mb-6">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Included Modules:</p>
                            <div className="flex flex-wrap gap-2">
                                {template.modules.slice(0, 4).map((module, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded-lg font-medium">
                                        {module}
                                    </span>
                                ))}
                                {template.modules.length > 4 && (
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg font-medium">
                                        +{template.modules.length - 4} more
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Select Button */}
                        <button className={`w-full py-3 rounded-xl bg-gradient-to-r ${template.color} text-white font-semibold shadow-lg group-hover:shadow-xl transition-all transform group-hover:scale-105`}>
                            Select Template →
                        </button>
                    </div>
                ))}
            </div>

            {/* Feature Highlights */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center">
                    <div className="text-3xl mb-3">⚡</div>
                    <h4 className="font-bold text-gray-900 mb-2">30-Second Setup</h4>
                    <p className="text-sm text-gray-600">Unlike Salesforce (20+ hours), get started instantly</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center">
                    <div className="text-3xl mb-3">🎨</div>
                    <h4 className="font-bold text-gray-900 mb-2">Fully Customizable</h4>
                    <p className="text-sm text-gray-600">Add custom fields and modules without code</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center">
                    <div className="text-3xl mb-3">💰</div>
                    <h4 className="font-bold text-gray-900 mb-2">80% Cost Savings</h4>
                    <p className="text-sm text-gray-600">Cheaper than Salesforce, HubSpot, and Zoho</p>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// CRM WORKSPACE (After Template Selected)
// ═══════════════════════════════════════════════════════════
function CRMWorkspace({ template }) {
    const [activeModule, setActiveModule] = useState(template.modules[0]);
    const [showSettings, setShowSettings] = useState(false);

    const handleResetTemplate = () => {
        if (confirm('Are you sure you want to change your CRM template? This will reset all configurations.')) {
            localStorage.removeItem('crm_template');
            window.location.reload();
        }
    };

    return (
        <div className="w-full h-full flex bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`text-3xl`}>{template.icon}</div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{template.name}</h2>
                            <p className="text-xs text-gray-500">{template.industryType}</p>
                        </div>
                    </div>
                </div>

                {/* Modules */}
                <div className="flex-1 overflow-y-auto p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Modules</p>
                    <div className="space-y-1">
                        {template.modules.map((module) => (
                            <button
                                key={module}
                                onClick={() => setActiveModule(module)}
                                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${activeModule === module
                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {module}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Settings */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="w-full px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-left flex items-center gap-2"
                    >
                        ⚙️ Settings
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                    <h1 className="text-xl font-bold text-gray-900">{activeModule}</h1>
                    <div className="flex items-center gap-3">
                        <input
                            type="search"
                            placeholder="Search..."
                            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                            + Add {activeModule}
                        </button>
                    </div>
                </div>

                {/* Module Content */}
                <div className="flex-1 overflow-auto p-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
                        <div className="text-center">
                            <div className="text-6xl mb-4">{template.icon}</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{activeModule} Module</h2>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Dynamic table, forms, and workflows for {activeModule.toLowerCase()} will appear here.
                                This is powered by the template's field schema.
                            </p>
                            <div className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                                📋 Implementation Phase: Backend APIs + Form Generator
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">CRM Settings</h3>

                        <div className="space-y-4 mb-6">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm font-semibold text-gray-700 mb-1">Current Template</p>
                                <p className="text-lg font-bold text-gray-900">{template.name}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm font-semibold text-gray-700 mb-1">Industry Type</p>
                                <p className="text-lg font-bold text-gray-900">{template.industryType}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm font-semibold text-gray-700 mb-1">Active Modules</p>
                                <p className="text-lg font-bold text-gray-900">{template.modules.length} modules</p>
                            </div>
                        </div>

                        <button
                            onClick={handleResetTemplate}
                            className="w-full px-6 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors mb-3"
                        >
                            Change Template
                        </button>

                        <button
                            onClick={() => setShowSettings(false)}
                            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export const displayCRMPro = () => {
    return <CRMPro />;
};
