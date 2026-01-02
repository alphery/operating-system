import React, { Component } from 'react';

export class FileManager extends Component {
    constructor() {
        super();
        this.state = {
            files: [],
            currentPath: '/Alphery OS',
            folderStack: [{ name: 'Alphery OS', handle: null }],
            loading: true,
            viewMode: 'grid',
            showNewFolderModal: false,
            newFolderName: '',
            searchQuery: '',
            uploadProgress: 0,
            isUploading: false,
            storageUsed: 0,
            storageQuota: 0,
            error: null
        };
        this.rootHandle = null;
        this.currentHandle = null;
        this.fileInputRef = React.createRef();
    }

    async componentDidMount() {
        try {
            // Get root directory (private to this app)
            this.rootHandle = await navigator.storage.getDirectory();

            // Create or get "Alphery OS" folder
            const alpheryFolder = await this.rootHandle.getDirectoryHandle('Alphery OS', { create: true });
            this.currentHandle = alpheryFolder;

            await this.loadFiles();
            await this.updateStorageInfo();
        } catch (error) {
            console.error('Error initializing file system:', error);
            this.setState({
                loading: false,
                error: 'Failed to initialize file system: ' + error.message
            });
        }
    }

    updateStorageInfo = async () => {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            this.setState({
                storageUsed: estimate.usage || 0,
                storageQuota: estimate.quota || 0
            });
        }
    }

    loadFiles = async () => {
        if (!this.currentHandle) return;

        this.setState({ loading: true });
        const files = [];

        try {
            for await (const entry of this.currentHandle.values()) {
                const isFolder = entry.kind === 'directory';
                let size = 0;
                let modifiedAt = null;

                if (!isFolder) {
                    try {
                        const file = await entry.getFile();
                        size = file.size;
                        modifiedAt = file.lastModified;
                    } catch (err) {
                        console.error('Error reading file:', err);
                    }
                }

                files.push({
                    name: entry.name,
                    handle: entry,
                    isFolder,
                    size,
                    modifiedAt,
                    type: isFolder ? 'folder' : this.getFileType(entry.name)
                });
            }

            // Sort: folders first, then alphabetically
            files.sort((a, b) => {
                if (a.isFolder && !b.isFolder) return -1;
                if (!a.isFolder && b.isFolder) return 1;
                return a.name.localeCompare(b.name);
            });

            this.setState({ files, loading: false });
        } catch (error) {
            console.error('Error loading files:', error);
            this.setState({ loading: false, error: 'Failed to load files: ' + error.message });
        }
    }

    getFileType = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
            'mp4': 'video/mp4', 'mov': 'video/mov', 'avi': 'video/avi',
            'mp3': 'audio/mp3', 'wav': 'audio/wav',
            'pdf': 'application/pdf',
            'doc': 'application/word', 'docx': 'application/word',
            'xls': 'application/excel', 'xlsx': 'application/excel',
            'ppt': 'application/powerpoint', 'pptx': 'application/powerpoint',
            'zip': 'application/zip', 'rar': 'application/rar',
            'txt': 'text/plain', 'md': 'text/plain'
        };
        return types[ext] || 'application/octet-stream';
    }

    uploadFile = async (file) => {
        if (!this.currentHandle) return;

        this.setState({ isUploading: true, uploadProgress: 0 });

        try {
            const fileHandle = await this.currentHandle.getFileHandle(file.name, { create: true });
            const writable = await fileHandle.createWritable();

            // Stream the file
            const reader = file.stream().getReader();
            let bytesWritten = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                await writable.write(value);
                bytesWritten += value.length;

                const progress = (bytesWritten / file.size) * 100;
                this.setState({ uploadProgress: progress });
            }

            await writable.close();

            await this.loadFiles();
            await this.updateStorageInfo();
            this.setState({ isUploading: false, uploadProgress: 0 });
        } catch (error) {
            console.error('Upload error:', error);
            this.setState({ isUploading: false, uploadProgress: 0 });
            alert('Upload failed: ' + error.message);
        }
    }

    createFolder = async () => {
        const { newFolderName } = this.state;
        if (!newFolderName.trim() || !this.currentHandle) return;

        try {
            await this.currentHandle.getDirectoryHandle(newFolderName.trim(), { create: true });
            await this.loadFiles();
            this.setState({ showNewFolderModal: false, newFolderName: '' });
        } catch (error) {
            console.error('Error creating folder:', error);
            alert('Failed to create folder: ' + error.message);
        }
    }

    deleteFile = async (file) => {
        if (!window.confirm(`Delete "${file.name}"?`)) return;
        if (!this.currentHandle) return;

        try {
            await this.currentHandle.removeEntry(file.name, { recursive: file.isFolder });
            await this.loadFiles();
            await this.updateStorageInfo();
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Failed to delete file: ' + error.message);
        }
    }

    downloadFile = async (file) => {
        try {
            const fileData = await file.handle.getFile();
            const url = URL.createObjectURL(fileData);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Failed to download file: ' + error.message);
        }
    }

    openFolder = async (folder) => {
        const newStack = [...this.state.folderStack, { name: folder.name, handle: folder.handle }];
        this.currentHandle = folder.handle;

        const path = newStack.map(f => f.name).join('/');
        this.setState({
            folderStack: newStack,
            currentPath: path
        });

        await this.loadFiles();
    }

    navigateToFolder = async (index) => {
        const newStack = this.state.folderStack.slice(0, index + 1);
        const folder = newStack[newStack.length - 1];

        // Navigate back to root if index is 0
        if (index === 0) {
            const alpheryFolder = await this.rootHandle.getDirectoryHandle('Alphery OS', { create: true });
            this.currentHandle = alpheryFolder;
        } else {
            this.currentHandle = folder.handle;
        }

        const path = newStack.map(f => f.name).join('/');
        this.setState({
            folderStack: newStack,
            currentPath: path
        });

        await this.loadFiles();
    }

    handleFileInputChange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => this.uploadFile(file));
    }

    handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => this.uploadFile(file));
    }

    handleDragOver = (e) => {
        e.preventDefault();
    }

    getFileIcon = (type, isFolder) => {
        if (isFolder) return '📁';
        if (type.startsWith('image/')) return '🖼️';
        if (type.startsWith('video/')) return '🎥';
        if (type.startsWith('audio/')) return '🎵';
        if (type.includes('pdf')) return '📄';
        if (type.includes('word')) return '📝';
        if (type.includes('excel')) return '📊';
        if (type.includes('powerpoint')) return '📽️';
        if (type.includes('zip') || type.includes('rar')) return '🗜️';
        if (type.includes('text')) return '📃';
        return '📄';
    }

    formatFileSize = (bytes) => {
        if (!bytes) return '-';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    render() {
        const { loading, files, viewMode, folderStack, showNewFolderModal, newFolderName,
            isUploading, uploadProgress, searchQuery, storageUsed, storageQuota, error } = this.state;

        const filteredFiles = searchQuery
            ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : files;

        const storagePercent = storageQuota ? (storageUsed / storageQuota * 100).toFixed(1) : 0;

        return (
            <div className="w-full h-full flex flex-col bg-white text-slate-800 font-sans">
                {/* Toolbar */}
                <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between px-6 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">📁</div>
                        <div>
                            <h1 className="font-bold text-xl">File Manager</h1>
                            <p className="text-xs text-blue-100">
                                {this.formatFileSize(storageUsed)} / {this.formatFileSize(storageQuota)} ({storagePercent}%)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => this.setState({ searchQuery: e.target.value })}
                                className="pl-10 pr-4 py-2 bg-white bg-opacity-20 text-white placeholder-blue-100 border border-white border-opacity-30 rounded-lg focus:bg-opacity-30 focus:outline-none text-sm w-64"
                            />
                            <svg className="w-4 h-4 absolute left-3 top-3 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>

                        {/* View Toggle */}
                        <div className="bg-white bg-opacity-20 p-1 rounded-lg flex gap-1">
                            <button
                                onClick={() => this.setState({ viewMode: 'grid' })}
                                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-10'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                                </svg>
                            </button>
                            <button
                                onClick={() => this.setState({ viewMode: 'list' })}
                                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-10'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                                </svg>
                            </button>
                        </div>

                        {/* Actions */}
                        <button
                            onClick={() => this.fileInputRef.current.click()}
                            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center gap-2 shadow-lg"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                            </svg>
                            Upload
                        </button>
                        <button
                            onClick={() => this.setState({ showNewFolderModal: true })}
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-semibold transition"
                        >
                            New Folder
                        </button>
                    </div>
                </div>

                {/* Breadcrumb */}
                <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-6 gap-2 text-sm overflow-x-auto">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                    </svg>
                    {folderStack.map((folder, index) => (
                        <React.Fragment key={index}>
                            <button
                                onClick={() => this.navigateToFolder(index)}
                                className="hover:text-blue-600 font-medium transition whitespace-nowrap"
                            >
                                {folder.name}
                            </button>
                            {index < folderStack.length - 1 && <span className="text-slate-400">/</span>}
                        </React.Fragment>
                    ))}
                </div>

                {/* File Area */}
                <div
                    className="flex-1 overflow-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100"
                    onDrop={this.handleDrop}
                    onDragOver={this.handleDragOver}
                >
                    {error && (
                        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-slate-600">Loading Alphery OS storage...</p>
                            </div>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="text-6xl mb-4">📂</div>
                                <p className="text-slate-600 text-lg">{searchQuery ? 'No files found' : 'This folder is empty'}</p>
                                <p className="text-slate-400 text-sm mt-2">
                                    {searchQuery ? 'Try a different search' : 'Drag files here or click Upload'}
                                </p>
                            </div>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {filteredFiles.map((file, index) => (
                                <div
                                    key={index}
                                    onDoubleClick={() => file.isFolder && this.openFolder(file)}
                                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition cursor-pointer border border-slate-200 group"
                                >
                                    <div className="text-5xl mb-3 text-center">{this.getFileIcon(file.type, file.isFolder)}</div>
                                    <p className="text-sm font-medium text-slate-800 truncate mb-2" title={file.name}>{file.name}</p>
                                    <p className="text-xs text-slate-400">{this.formatFileSize(file.size)}</p>

                                    <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition">
                                        {!file.isFolder && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); this.downloadFile(file); }}
                                                className="flex-1 bg-blue-100 text-blue-600 rounded px-2 py-1 text-xs hover:bg-blue-200"
                                            >
                                                Download
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); this.deleteFile(file); }}
                                            className="flex-1 bg-red-100 text-red-600 rounded px-2 py-1 text-xs hover:bg-red-200"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Modified</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Size</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredFiles.map((file, index) => (
                                        <tr
                                            key={index}
                                            onDoubleClick={() => file.isFolder && this.openFolder(file)}
                                            className="hover:bg-slate-50 cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{this.getFileIcon(file.type, file.isFolder)}</span>
                                                    <span className="font-medium">{file.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{this.formatDate(file.modifiedAt)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{this.formatFileSize(file.size)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    {!file.isFolder && (
                                                        <button
                                                            onClick={() => this.downloadFile(file)}
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                        >
                                                            Download
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => this.deleteFile(file)}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Hidden File Input */}
                <input
                    ref={this.fileInputRef}
                    type="file"
                    multiple
                    onChange={this.handleFileInputChange}
                    className="hidden"
                />

                {/* New Folder Modal */}
                {showNewFolderModal && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => this.setState({ showNewFolderModal: false })}>
                        <div className="bg-white rounded-2xl shadow-2xl w-96 p-6" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-xl font-bold text-slate-800 mb-4">New Folder</h3>
                            <input
                                type="text"
                                placeholder="Folder name"
                                value={newFolderName}
                                onChange={(e) => this.setState({ newFolderName: e.target.value })}
                                onKeyPress={(e) => e.key === 'Enter' && this.createFolder()}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                                autoFocus
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => this.setState({ showNewFolderModal: false, newFolderName: '' })}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={this.createFolder}
                                    disabled={!newFolderName.trim()}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                    <div className="absolute bottom-6 right-6 bg-white rounded-xl shadow-2xl p-4 w-80 border border-slate-200 z-50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            <span className="font-semibold text-slate-800">Uploading...</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{Math.round(uploadProgress)}%</p>
                    </div>
                )}
            </div>
        );
    }
}

export const displayFileManager = () => {
    return <FileManager />;
};

export default FileManager;
