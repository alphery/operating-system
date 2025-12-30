import React, { Component } from 'react';
import $ from 'jquery';

export class ERPDashboard extends Component {
    constructor() {
        super();
    }

    render() {
        return (
            <div className="w-full h-full flex flex-col bg-gray-100 text-gray-800 select-none overflow-y-auto">
                {/* Header */}
                <div className="w-full h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
                    <h1 className="text-xl font-bold text-blue-600 tracking-wide">Business Overview</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Welcome, Admin</span>
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">A</div>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Stat Cards */}
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                        <div className="text-gray-500 text-sm font-medium">Total Revenue</div>
                        <div className="text-2xl font-bold mt-1">$124,500</div>
                        <div className="text-green-500 text-xs mt-2 font-medium">↑ 12% from last month</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                        <div className="text-gray-500 text-sm font-medium">Active Projects</div>
                        <div className="text-2xl font-bold mt-1">18</div>
                        <div className="text-green-500 text-xs mt-2 font-medium">3 delivered this week</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                        <div className="text-gray-500 text-sm font-medium">New Leads</div>
                        <div className="text-2xl font-bold mt-1">45</div>
                        <div className="text-gray-400 text-xs mt-2 font-medium">Target: 50</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
                        <div className="text-gray-500 text-sm font-medium">Pending Tasks</div>
                        <div className="text-2xl font-bold mt-1">12</div>
                        <div className="text-red-500 text-xs mt-2 font-medium">2 Overdue</div>
                    </div>
                </div>

                {/* Main Graph/Table Section */}
                <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Mock Graph Area */}
                    <div className="col-span-2 bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Revenue Trends</h3>
                        <div className="h-64 flex items-end justify-between px-4 pb-4 border-b border-l border-gray-200 gap-2">
                             {[40, 60, 45, 75, 55, 80, 70, 90, 65, 85, 95, 100].map((h, i) => (
                                <div key={i} className="w-full bg-blue-500 hover:bg-blue-600 transition-all rounded-t" style={{height: `${h}%`}}></div>
                             ))}
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-2 px-4">
                            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                            <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="col-span-1 bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {[1,2,3,4,5].map((_, i) => (
                                <div key={i} className="flex items-start pb-4 border-b border-gray-100 last:border-0">
                                     <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 mr-3"></div>
                                     <div>
                                         <p className="text-sm font-medium text-gray-800">New invoice generated</p>
                                         <p className="text-xs text-gray-500">Invoice #102{i} for Tenant Inc.</p>
                                     </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export const displayERPDashboard = () => {
    return <ERPDashboard />;
};
