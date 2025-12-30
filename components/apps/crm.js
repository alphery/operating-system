import React, { Component } from 'react';
import ERPDatabase from '../util components/database';

export class CRM extends Component {
    constructor() {
        super();
        this.state = {
            activeTab: 'leads',
            leads: [],
            showAddModal: false,
            newLead: { name: '', company: '', status: 'New', value: '' }
        }
    }

    componentDidMount() {
        this.refreshData();
    }

    refreshData = () => {
        this.setState({ leads: ERPDatabase.getLeads() });
    }

    handleInputChange = (e) => {
        this.setState({
            newLead: { ...this.state.newLead, [e.target.name]: e.target.value }
        });
    }

    handleAddLead = () => {
        const { name, company, value } = this.state.newLead;
        if (!name || !company) return; // Basic validation

        ERPDatabase.addLead({
            name, company, value, status: 'New'
        });

        this.setState({
            showAddModal: false,
            newLead: { name: '', company: '', status: 'New', value: '' }
        });
        this.refreshData();
    }

    handleStatusChange = (lead, newStatus) => {
        ERPDatabase.updateLead({ ...lead, status: newStatus });
        this.refreshData();
    }

    render() {
        return (
            <div className="w-full h-full flex bg-gray-50 text-gray-800 font-sans select-none">
                {/* Sidebar */}
                <div className="w-16 md:w-64 bg-gray-900 text-white flex flex-col">
                    <div className="h-16 flex items-center justify-center border-b border-gray-800 font-bold text-xl tracking-wider">
                        <span className="hidden md:block">CRM<span className="text-blue-400">Pro</span></span>
                        <span className="md:hidden">CP</span>
                    </div>
                    <nav className="flex-1 py-4">
                        {['Dashboard', 'Leads', 'Contacts', 'Deals', 'Reports'].map(item => (
                            <div key={item}
                                className={`px-6 py-3 cursor-pointer hover:bg-gray-800 transition-colors flex items-center ${item === 'Leads' ? 'bg-blue-600' : ''}`}>
                                <div className="w-2 h-2 rounded-full bg-current mr-3 opacity-50"></div>
                                <span className="hidden md:block">{item}</span>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Toolbar */}
                    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                        <h2 className="text-lg font-semibold text-gray-700">Leads Management</h2>
                        <button
                            onClick={() => this.setState({ showAddModal: true })}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow text-sm font-medium transition">
                            + Add New Lead
                        </button>
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 overflow-auto p-6">
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Company</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Value</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {this.state.leads.map(lead => (
                                        <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{lead.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{lead.company}</td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={lead.status}
                                                    onChange={(e) => this.handleStatusChange(lead, e.target.value)}
                                                    className={`px-2 py-1 text-xs rounded-full font-semibold border bg-opacity-20 cursor-pointer outline-none
                                                    ${lead.status === 'New' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                            lead.status === 'Negotiation' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                                lead.status === 'Closed Won' ? 'bg-green-50 text-green-600 border-green-200' :
                                                                    'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                    <option value="New">New</option>
                                                    <option value="Contacted">Contacted</option>
                                                    <option value="Negotiation">Negotiation</option>
                                                    <option value="Closed Won">Closed Won</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-sm">${lead.value}</td>
                                            <td className="px-6 py-4 text-gray-400 cursor-pointer hover:text-red-500" onClick={() => { ERPDatabase.deleteLead(lead.id); this.refreshData(); }}>
                                                Delete
                                            </td>
                                        </tr>
                                    ))}
                                    {this.state.leads.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-400">No leads found. Add one!</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Add Lead Modal */}
                    {this.state.showAddModal && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                            <div className="bg-white rounded-lg shadow-xl w-96 p-6 animate-in fade-in zoom-in duration-200">
                                <h3 className="text-xl font-bold mb-4 text-gray-800">Add New Lead</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input name="name" value={this.state.newLead.name} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Elon Musk" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                        <input name="company" value={this.state.newLead.company} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. SpaceX" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value ($)</label>
                                        <input name="value" type="number" value={this.state.newLead.value} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 50000" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={() => this.setState({ showAddModal: false })} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                    <button onClick={this.handleAddLead} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Lead</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export const displayCRM = () => {
    return <CRM />;
};
