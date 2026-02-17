import React, { useState } from 'react';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

const AlpherySheets = () => {
    // Define columns
    const columns = [
        { key: 'id', name: 'ID', frozen: true },
        { key: 'task', name: 'Task', resizable: true },
        { key: 'priority', name: 'Priority', resizable: true },
        { key: 'issueType', name: 'Issue Type', resizable: true },
        { key: 'complete', name: '% Complete', resizable: true },
        { key: 'startDate', name: 'Start Date', resizable: true },
        { key: 'completeDate', name: 'Expected Complete', resizable: true }
    ];

    // Initial data
    const [rows, setRows] = useState([
        { id: 0, task: 'Task 1', priority: 'Critical', issueType: 'Bug', complete: 20, startDate: '2023-01-01', completeDate: '2023-01-05' },
        { id: 1, task: 'Task 2', priority: 'High', issueType: 'Feature', complete: 40, startDate: '2023-01-02', completeDate: '2023-01-08' },
        { id: 2, task: 'Task 3', priority: 'Low', issueType: 'Bug', complete: 60, startDate: '2023-01-03', completeDate: '2023-01-10' }
    ]);

    // Status
    const [status, setStatus] = useState('saved');

    const handleRowsChange = (newRows: any) => {
        setRows(newRows);
        setStatus('saving...');
        setTimeout(() => setStatus('saved'), 500);
    };

    return (
        <div className="flex flex-col h-full bg-white text-gray-800 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-4">
                    <img src="./themes/Yaru/apps/A-Sheets.png" alt="Sheets" className="w-8 h-8 rounded-lg object-cover" />
                    <div>
                        <input
                            type="text"
                            defaultValue="Untitled Spreadsheet"
                            className="text-lg font-medium bg-transparent border-none focus:ring-0 p-0"
                        />
                        <div className="text-xs text-gray-500 flex space-x-2">
                            <span className="cursor-pointer hover:text-green-600">File</span>
                            <span className="cursor-pointer hover:text-green-600">Edit</span>
                            <span className="cursor-pointer hover:text-green-600">View</span>
                            <span className="cursor-pointer hover:text-green-600">Insert</span>
                            <span className="cursor-pointer hover:text-green-600">Data</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className={`text-xs px-2 py-1 rounded ${status === 'saved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {status === 'saved' ? 'Saved' : 'Saving...'}
                    </div>
                    <button className="bg-green-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-green-700">
                        Share
                    </button>
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                        A
                    </div>
                </div>
            </div>

            {/* Formula Bar */}
            <div className="flex items-center gap-2 p-1 border-b border-gray-200 bg-gray-50 text-sm">
                <div className="w-8 text-center text-gray-500 font-bold">fx</div>
                <input className="flex-1 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-green-500" placeholder="Function" />
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-hidden relative">
                <DataGrid
                    columns={columns}
                    rows={rows}
                    onRowsChange={handleRowsChange}
                    className="h-full w-full"
                    rowHeight={35}
                />
            </div>

            {/* Sheet Tabs */}
            <div className="flex bg-gray-100 border-t border-gray-300 p-1 gap-1">
                <button className="px-4 py-1 bg-white border-b-2 border-green-500 text-sm font-medium">Sheet 1</button>
                <button className="px-2 py-1 hover:bg-gray-200 text-gray-600 text-lg font-bold">+</button>
            </div>
        </div>
    );
};

export default AlpherySheets;
