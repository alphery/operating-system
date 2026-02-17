import React, { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════
// CRM PRO - TEMPLATE-DRIVEN MULTI-TENANT CRM
// ═══════════════════════════════════════════════════════════

export default function CRMPro() {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate checking if tenant already has a template
        setTimeout(() => {
            const saved = localStorage.getItem('crm_template');
            if (saved) {
                setSelectedTemplate(JSON.parse(saved));
            }
            setLoading(false);
        }, 500);
    }, []);

    // If no template selected, show template selection screen
    if (loading) {
        return <LoadingScreen />;
    }

    if (!selectedTemplate) {
        return <TemplateSelectionScreen onSelect={setSelectedTemplate} />;
    }

    // Template selected, show CRM Workspace
    return <CRMWorkspace template={selectedTemplate} />;
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
