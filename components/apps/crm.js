import React, { useState, useEffect } from 'react';
import ERPDatabase from '../util components/database';

// ═══════════════════════════════════════════════════════════
// ICONS (Inline SVG for premium look)
// ═══════════════════════════════════════════════════════════
const Icons = {
    Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    Leads: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    Cases: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
    Calendar: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    Settings: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    Bell: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>,
    User: () => <svg className="w-8 h-8 rounded-full" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
};

// ═══════════════════════════════════════════════════════════
// CRM COMPONENT
// ═══════════════════════════════════════════════════════════
export default function CRM() {
    const [activeTab, setActiveTab] = useState('Customer Journeys');
    const [leads, setLeads] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newLead, setNewLead] = useState({ name: '', company: '', status: 'New', value: '' });

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setLeads(ERPDatabase.getLeads());
    };

    const handleAddLead = () => {
        const { name, company, value } = newLead;
        if (!name || !company) return;
        ERPDatabase.addLead({ name, company, value, status: 'New' });
        setShowAddModal(false);
        setNewLead({ name: '', company: '', status: 'New', value: '' });
        refreshData();
    };

    const handleStatusChange = (lead, newStatus) => {
        ERPDatabase.updateLead({ ...lead, status: newStatus });
        refreshData();
    };

    return (
        <div className="crm-app w-full h-full flex font-sans text-gray-800 bg-[#f0f2f5] select-none overflow-hidden rounded-lg">

            {/* 1. SIDEBAR (Glassy) */}
            <div className="w-20 lg:w-64 flex-shrink-0 flex flex-col glass-sidebar z-20 transition-all duration-300">
                <div className="h-20 flex items-center justify-center border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">S</div>
                        <span className="hidden lg:block font-bold text-xl text-gray-800 tracking-tight">Sugar<span className="text-blue-600">CRM</span></span>
                    </div>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                    {[
                        { id: 'Customer Journeys', icon: Icons.Cases },
                        { id: 'Leads', icon: Icons.Leads },
                        { id: 'Opportunities', icon: Icons.Dashboard },
                        { id: 'Calendar', icon: Icons.Calendar },
                        { id: 'Reports', icon: Icons.Dashboard },
                    ].map(item => (
                        <div
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group
                                ${activeTab === item.id
                                    ? 'bg-white shadow-lg text-blue-600 scale-105'
                                    : 'hover:bg-white/50 text-gray-500 hover:text-gray-800'}`}
                        >
                            <div className={`p-2 rounded-xl transition-colors ${activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 group-hover:bg-white'}`}>
                                <item.icon />
                            </div>
                            <span className="hidden lg:block font-medium">{item.id}</span>
                            {item.id === 'Customer Journeys' && <span className="hidden lg:block ml-auto w-2 h-2 rounded-full bg-red-500"></span>}
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/50 cursor-pointer transition-colors">
                        <Icons.User />
                        <div className="hidden lg:block">
                            <p className="text-sm font-bold text-gray-800">Admin User</p>
                            <p className="text-xs text-gray-500">Pro Plan</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Background Blobs for Glassmorphism */}
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                {/* Top Bar */}
                <div className="h-20 flex items-center justify-between px-8 z-10">
                    <h1 className="text-2xl font-bold text-gray-800">{activeTab}</h1>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500">
                                <Icons.Search />
                            </div>
                            <input
                                type="text"
                                placeholder="Search everything..."
                                className="pl-10 pr-4 py-2.5 rounded-2xl bg-white/60 border border-white/20 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none w-64 transition-all shadow-sm backdrop-blur-sm"
                            />
                        </div>
                        <button className="p-2.5 rounded-xl bg-white/60 hover:bg-white text-gray-500 hover:text-blue-600 transition-all shadow-sm backdrop-blur-sm relative">
                            <Icons.Bell />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 px-4"
                        >
                            <Icons.Plus />
                            <span className="hidden sm:inline font-medium">Create</span>
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-auto p-8 z-10 custom-scrollbar">
                    {activeTab === 'Customer Journeys' && <CustomerJourneyView />}
                    {activeTab === 'Leads' && (
                        <LeadsView
                            leads={leads}
                            onDelete={(id) => { ERPDatabase.deleteLead(id); refreshData(); }}
                            onStatusChange={handleStatusChange}
                        />
                    )}
                    {activeTab !== 'Customer Journeys' && activeTab !== 'Leads' && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 animate-pulse"></div>
                            <p className="text-lg">Module coming soon...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Lead Modal Overlay */}
            {showAddModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl p-8 w-96 shadow-2xl transform transition-all scale-100">
                        <h3 className="text-2xl font-bold mb-6 text-gray-800">New Lead</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-500 ml-1">Full Name</label>
                                <input
                                    value={newLead.name}
                                    onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-100 transition-all"
                                    placeholder="Jane Doe"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-500 ml-1">Company</label>
                                <input
                                    value={newLead.company}
                                    onChange={e => setNewLead({ ...newLead, company: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-100 transition-all"
                                    placeholder="Acme Inc."
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-500 ml-1">Value ($)</label>
                                <input
                                    type="number"
                                    value={newLead.value}
                                    onChange={e => setNewLead({ ...newLead, value: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-100 transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 font-medium transition-colors">Cancel</button>
                            <button onClick={handleAddLead} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform hover:scale-105">Save Lead</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .glass-sidebar {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(20px);
                    border-right: 1px solid rgba(255, 255, 255, 0.4);
                    box-shadow: 4px 0 24px rgba(0,0,0,0.02);
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 99px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
                
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// SUB-VIEWS
// ═══════════════════════════════════════════════════════════

function CustomerJourneyView() {
    return (
        <div className="w-full h-full overflow-x-auto pb-4">
            <div className="min-w-[1000px] flex gap-8 p-2">

                {/* Stage 1: Case Allocation */}
                <StageColumn title="New Case Management" count={2} color="blue">
                    <JourneyCard
                        title="Allocate Case to User"
                        assignee="Alex M."
                        done={true}
                        time="2h ago"
                    />
                    <JourneyCard
                        title="Acknowledge Receipt"
                        assignee="System"
                        done={true}
                        time="1h ago"
                        isSystem
                    />
                </StageColumn>

                {/* Connector */}
                <div className="flex flex-col justify-center gap-2 pt-12">
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                </div>

                {/* Stage 2: Issue Identification */}
                <StageColumn title="Issue Identification" count={4} color="purple">
                    <JourneyCard title="Identify Category" assignee="Sarah J." done={true} />
                    <JourneyCard title="Identify Severity" assignee="Sarah J." done={true} />
                    <JourneyCard title="Identify Impact" assignee="Sarah J." done={true} />
                    <JourneyCard
                        title="Allocate Resolution Team"
                        assignee="Mike T."
                        active
                        status="In Progress"
                    />
                </StageColumn>

                {/* Connector */}
                <div className="flex flex-col justify-center gap-2 pt-12">
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                </div>

                {/* Stage 3: Technical Resolution */}
                <StageColumn title="Technical Resolution" count={3} color="indigo">
                    <JourneyCard title="Identifying Dependencies" />
                    <JourneyCard title="Isolate Issue" />
                    <JourneyCard title="Patch Verification" />
                </StageColumn>

                {/* Sidebar Widget Area */}
                <div className="w-80 flex flex-col gap-6 ml-auto">
                    <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white/50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">Request Processing</h3>
                            <button className="text-gray-400 hover:text-gray-600"><Icons.Settings /></button>
                        </div>
                        <div className="space-y-3">
                            {['Problem Resolution', 'Customer Comms', 'Testing & Verification', 'Customer Confirm'].map((item, i) => (
                                <div key={i} className="bg-white p-3 rounded-xl text-sm font-medium text-gray-600 shadow-sm border border-gray-50 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer">
                                    {item}
                                    <span className="text-gray-300">→</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function StageColumn({ title, children, count, color }) {
    return (
        <div className="flex flex-col w-72">
            <div className="flex items-center justify-between mb-4 pl-2">
                <h3 className="font-bold text-gray-700">{title}</h3>
                <div className={`px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-600 text-xs font-bold`}>
                    {count}
                </div>
            </div>
            <div className="flex flex-col gap-4 relative">
                {/* Connection Line Background */}
                <div className="absolute left-[-16px] top-8 bottom-8 w-0.5 bg-gray-200 hidden"></div>
                {children}
            </div>
        </div>
    );
}

function JourneyCard({ title, assignee, done, active, time, isSystem, status }) {
    return (
        <div className={`
            relative p-5 rounded-3xl transition-all duration-300 border
            ${active
                ? 'bg-white shadow-xl shadow-blue-100 border-blue-200 scale-105 z-10'
                : 'bg-white/80 hover:bg-white border-white/60 shadow-sm hover:shadow-md'}
        `}>
            {/* Status Indicator */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    {done ? (
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                            <Icons.Check />
                        </div>
                    ) : (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold
                            ${active ? 'border-blue-500 text-blue-500 bg-blue-50' : 'border-gray-300 text-gray-400'}`}>
                            {active ? '●' : '+'}
                        </div>
                    )}
                </div>
                {time && <span className="text-xs text-gray-400">{time}</span>}
                {status && <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-1 rounded-full">{status}</span>}
            </div>

            <h4 className={`font-semibold text-sm mb-3 ${active ? 'text-gray-800' : 'text-gray-600'}`}>
                {title}
            </h4>

            {assignee && (
                <div className="flex items-center gap-2 mt-auto">
                    {isSystem ? (
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">🤖</div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-orange-400"></div>
                    )}
                    <span className="text-xs font-medium text-gray-500">{assignee}</span>
                </div>
            )}
        </div>
    );
}

function LeadsView({ leads, onDelete, onStatusChange }) {
    return (
        <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-white/50 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold">
                    <tr>
                        <th className="px-6 py-5">Name</th>
                        <th className="px-6 py-5">Company</th>
                        <th className="px-6 py-5">Status</th>
                        <th className="px-6 py-5">Value</th>
                        <th className="px-6 py-5"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {leads.map(lead => (
                        <tr key={lead.id} className="hover:bg-white/80 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 text-white flex items-center justify-center text-xs font-bold">
                                        {lead.name.charAt(0)}
                                    </div>
                                    <span className="font-medium text-gray-900">{lead.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{lead.company}</td>
                            <td className="px-6 py-4">
                                <select
                                    value={lead.status}
                                    onChange={(e) => onStatusChange(lead, e.target.value)}
                                    className={`px-3 py-1 text-xs rounded-full font-bold border-none outline-none cursor-pointer appearance-none transition-all
                                    ${lead.status === 'New' ? 'bg-blue-100 text-blue-700' :
                                            lead.status === 'Negotiation' ? 'bg-amber-100 text-amber-700' :
                                                lead.status === 'Closed Won' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-gray-100 text-gray-600'}`}
                                >
                                    <option value="New">New Lead</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Negotiation">Negotiation</option>
                                    <option value="Closed Won">Closed Won</option>
                                </select>
                            </td>
                            <td className="px-6 py-4 font-mono text-sm text-gray-700">${lead.value}</td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() => onDelete(lead.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    {leads.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">?</div>
                                    <p>No leads yet.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export const displayCRM = () => {
    return <CRM />;
};
