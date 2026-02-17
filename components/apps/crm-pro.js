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
            const validUsernames = ['KEC000001', 'AU000001', 'AA000001', 'admin'];
            const validPasswords = ['ALPHERY25@it', 'AU25@erp', 'AL25@it'];

            if (validUsernames.includes(username) && validPasswords.includes(password)) {
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
// CRM WORKSPACE (MODERN GLASSY FRONTIER)
// ═══════════════════════════════════════════════════════════
function CRMWorkspace({ template }) {
    const [activeModule, setActiveModule] = useState('CRM Dashboard');
    const [showSettings, setShowSettings] = useState(false);

    // Mock dashboard data
    const stats = [
        { label: 'NEW LEADS TODAY', value: '47', change: '+18%', icon: '👤+', color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'CONVERSION RATE', value: '68.4%', change: '+5.2%', icon: '📈', color: 'text-green-500', bg: 'bg-green-50' },
        { label: 'FOLLOW-UPS DUE', value: '23', change: 'Today', icon: '🕒', color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'PIPELINE VALUE', value: '₹128K', change: '+24%', icon: '🎯', color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'CAMPAIGNS ACTIVE', value: '8', change: '2 ending soon', icon: '🎗️', color: 'text-pink-500', bg: 'bg-pink-50' },
    ];

    const sidebarSections = [
        {
            title: 'PILLAR 1 — HOSPITAL',
            items: [
                { name: 'Patient Management', icon: '👥' },
                { name: 'Appointments & Scheduling', icon: '📅' },
                { name: 'OPD & Consultation', icon: '🩺' },
                { name: 'Billing & Payments', icon: '💳' },
                { name: 'Pharmacy Management', icon: '💊' },
            ]
        },
        {
            title: 'PILLAR 2 — OPTICAL LAB CRM',
            items: [
                { name: 'Lab Jobs', icon: '🔬' },
                { name: 'Technicians', icon: '👨‍🔧' },
                { name: 'Machines', icon: '⚙️' },
                { name: 'Consumables Inventory', icon: '📦' },
                { name: 'QC Checklist', icon: '✅' },
                { name: 'Remake Tickets', icon: '🎫' },
            ]
        },
        {
            title: 'PILLAR 3 — CRM & MARKETING',
            items: [
                { name: 'CRM Dashboard', icon: '📊' },
                { name: 'Marketing Hub', icon: '📢' },
            ]
        }
    ];

    return (
        <div className="w-full h-full flex bg-[#eef2f6] font-sans relative overflow-hidden">
            {/* --- PREMIUM MESH BACKGROUND DECOR --- */}
            <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-blue-300/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[60%] bg-purple-300/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* --- SIDEBAR --- */}
            <div className="w-72 h-full bg-white/60 backdrop-blur-2xl border-r border-white/40 flex flex-col z-20 relative m-4 rounded-[2.5rem] shadow-2xl shadow-gray-200/50">
                {/* Brand Logo */}
                <div className="p-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#6355d8] rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
                            K
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight leading-tight">Kirti Eye Care</h2>
                            <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Enterprise ERP</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Sections */}
                <div className="flex-1 overflow-y-auto px-6 space-y-8 pb-10 custom-scrollbar">
                    {sidebarSections.map((section, idx) => (
                        <div key={idx}>
                            <h3 className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mb-4 ml-4">{section.title}</h3>
                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => setActiveModule(item.name)}
                                        className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${activeModule === item.name
                                            ? 'bg-gradient-to-r from-indigo-50 to-white text-indigo-600 shadow-sm border border-indigo-100/50'
                                            : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'
                                            }`}
                                    >
                                        <span className={`text-xl transition-transform group-hover:scale-110 ${activeModule === item.name ? 'opacity-100' : 'opacity-60'}`}>{item.icon}</span>
                                        <span className={`text-sm font-bold tracking-tight ${activeModule === item.name ? 'font-extrabold' : 'font-semibold'}`}>{item.name}</span>
                                        {activeModule === item.name && (
                                            <div className="ml-auto w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sidebar Footer */}
                <div className="p-6">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-red-500 font-bold text-sm tracking-tight transition-colors"
                    >
                        <span>🚪</span>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 flex flex-col pt-6 pr-6 pb-6 relative z-10 w-full overflow-hidden">

                {/* Top Bar */}
                <header className="h-20 flex items-center justify-between px-8 bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl mb-6 shadow-xl shadow-slate-200/20">
                    <div className="flex items-center gap-6 flex-1 max-w-xl">
                        <button className="p-2 text-slate-400 hover:text-slate-800 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                        </button>
                        <div className="flex-1 relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search anything..."
                                className="w-full pl-12 pr-6 py-3 bg-white/60 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all font-semibold text-slate-600 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 pl-8 border-l border-slate-200/50">
                        <div className="flex items-center gap-2">
                            <button className="relative p-2.5 text-slate-400 hover:text-slate-800 transition-colors bg-white/40 border border-white rounded-xl">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
                            </button>
                            <button className="p-2.5 text-slate-400 hover:text-slate-800 transition-colors bg-white/40 border border-white rounded-xl">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                        </div>

                        <div className="flex items-center gap-4 bg-white/40 border border-white p-1.5 rounded-2xl">
                            <div className="text-right">
                                <p className="text-[13px] font-black text-slate-800 tracking-tight leading-none uppercase">KEC000001</p>
                                <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-1">Super Admin</p>
                            </div>
                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm uppercase">
                                KE
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Header */}
                <div className="px-4 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">CRM Intelligence</h1>
                        <p className="text-slate-500 font-bold tracking-tight">Real-time lifecycle & relationship engine</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-white border border-white rounded-xl flex items-center gap-3 shadow-xl shadow-slate-200/20">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></div>
                            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Live Feed</span>
                        </div>
                        <div className="text-[10px] font-black text-slate-300 tracking-widest uppercase">Last Sync: 08 Ago</div>
                    </div>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-5 gap-6 mb-8 px-2">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white/50 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
                            <div className={`${stat.bg} w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2">{stat.label}</p>
                            <div className="flex items-baseline justify-between mb-1">
                                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</h3>
                                <div className={`text-[10px] font-black ${stat.change.includes('+') ? 'text-green-500 bg-green-50' : 'text-slate-400 bg-slate-50'} px-2 py-1 rounded-lg`}>
                                    {stat.change}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-3 gap-8 flex-1 px-2">
                    {/* Line Chart Component (Mocked visualization) */}
                    <div className="col-span-2 bg-white/50 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/20 flex flex-col">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Lead Conversion Trends</h3>
                            <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none">
                                <option>Last 7 Days</option>
                                <option>This Month</option>
                            </select>
                        </div>
                        <div className="flex-1 relative pb-10">
                            {/* SVG Simulation for Graph */}
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 300">
                                {/* Grid Lines */}
                                <line x1="0" y1="210" x2="800" y2="210" stroke="#f1f5f9" strokeWidth="2" strokeDasharray="8 8" />
                                <line x1="0" y1="140" x2="800" y2="140" stroke="#f1f5f9" strokeWidth="2" strokeDasharray="8 8" />
                                <line x1="0" y1="70" x2="800" y2="70" stroke="#f1f5f9" strokeWidth="2" strokeDasharray="8 8" />

                                {/* Path 1 (Blue) */}
                                <path
                                    d="M0,210 Q100,200 200,160 T400,180 T600,120 T800,160"
                                    fill="none"
                                    stroke="#6355d8"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    className="drop-shadow-lg"
                                />

                                {/* Path 2 (Green) */}
                                <path
                                    d="M0,240 Q150,230 300,190 T500,210 T800,240"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    className="drop-shadow-lg"
                                />

                                {/* Interactive Points */}
                                <circle cx="200" cy="160" r="8" fill="#6355d8" className="animate-pulse" />
                                <circle cx="600" cy="120" r="8" fill="#6355d8" />
                                <circle cx="300" cy="190" r="8" fill="#10b981" />
                            </svg>
                            <div className="absolute bottom-0 w-full flex justify-between px-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                            </div>
                        </div>
                    </div>

                    {/* Donut Chart Component */}
                    <div className="bg-white/50 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/20 flex flex-col">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight mb-10">Lead Source Distribution</h3>
                        <div className="flex-1 flex items-center justify-center relative">
                            {/* Donut Simulation */}
                            <div className="relative w-56 h-56 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="112" cy="112" r="90" stroke="#f1f5f9" strokeWidth="35" fill="none" />
                                    <circle cx="112" cy="112" r="90" stroke="#6355d8" strokeWidth="35" fill="none" strokeDasharray="565.48" strokeDashoffset="140" strokeLinecap="round" />
                                    <circle cx="112" cy="112" r="90" stroke="#10b981" strokeWidth="35" fill="none" strokeDasharray="565.48" strokeDashoffset="420" strokeLinecap="round" />
                                    <circle cx="112" cy="112" r="90" stroke="#f59e0b" strokeWidth="35" fill="none" strokeDasharray="565.48" strokeDashoffset="510" strokeLinecap="round" />
                                </svg>

                                {/* Legends floating labels simulation */}
                                <div className="absolute top-[-10%] right-[-10%] text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-white border border-indigo-100 px-3 py-1 rounded-full shadow-lg">Website</div>
                                <div className="absolute top-[40%] left-[-20%] text-[10px] font-black text-green-500 uppercase tracking-widest bg-white border border-green-100 px-3 py-1 rounded-full shadow-lg">Walk-in</div>
                                <div className="absolute bottom-[0%] right-[-10%] text-[10px] font-black text-orange-500 uppercase tracking-widest bg-white border border-orange-100 px-3 py-1 rounded-full shadow-lg">Campaign</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar Decor */}
                <div className="mt-8 flex gap-8">
                    <div className="flex-1 h-32 bg-white/40 backdrop-blur-xl border border-white rounded-[2rem] p-8">
                        <h4 className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2">Top Performing Campaigns</h4>
                        <div className="w-full h-2 bg-slate-100 rounded-full mt-4 overflow-hidden">
                            <div className="w-[60%] h-full bg-indigo-500"></div>
                        </div>
                    </div>
                    <div className="w-80 h-32 bg-indigo-600 rounded-[2rem] p-8 flex items-center justify-between text-white">
                        <div>
                            <h4 className="text-[10px] font-black tracking-widest uppercase opacity-60 mb-1">Quick Actions</h4>
                            <p className="text-xl font-extrabold tracking-tight">Generate Report</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl">🚀</div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
                @keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }
            `}</style>
        </div>
    );
}

export const displayCRMPro = () => {
    return <CRMPro />;
};
