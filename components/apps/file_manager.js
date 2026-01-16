import React, { Component } from 'react';

export class FileManager extends Component {
    constructor() {
        super();
        this.state = {
            files: [],
            currentPath: '/Home',
            folderStack: [{ name: 'Home', handle: null }],
            loading: true,
            viewMode: 'grid',
            showNewFolderModal: false,
            newFolderName: '',
            searchQuery: '',
            uploadProgress: 0,
            isUploading: false,
            storageUsed: 0,
            storageQuota: 0,
            error: null,
            isExporting: false,
            exportProgress: 0,
            isImporting: false,
            selectedFolder: 'home',
            favorites: ['home', 'documents', 'pictures', 'desktop', 'videos']
        };
        this.rootHandle = null;
        this.currentHandle = null;
        this.fileInputRef = React.createRef();
        this.zipInputRef = React.createRef();
    }

    async componentDidMount() {
        try {
            this.rootHandle = await navigator.storage.getDirectory();
            const alpheryFolder = await this.rootHandle.getDirectoryHandle('Alphery OS', { create: true });
            this.currentHandle = alpheryFolder;

            // Create default folders
            await this.createDefaultFolders();

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

    createDefaultFolders = async () => {
        const folders = ['Desktop', 'Documents', 'Pictures', 'Public', 'Videos'];
        for (const folder of folders) {
            try {
                await this.currentHandle.getDirectoryHandle(folder, { create: true });
            } catch (e) {
                console.error(`Error creating ${folder}:`, e);
            }
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
            'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'svg': 'image',
            'mp4': 'video', 'mov': 'video', 'avi': 'video',
            'mp3': 'audio', 'wav': 'audio',
            'pdf': 'pdf',
            'doc': 'document', 'docx': 'document',
            'xls': 'spreadsheet', 'xlsx': 'spreadsheet',
            'ppt': 'presentation', 'pptx': 'presentation',
            'zip': 'archive', 'rar': 'archive',
            'txt': 'text', 'md': 'text', 'js': 'code', 'css': 'code', 'html': 'code'
        };
        return types[ext] || 'file';
    }

    uploadFile = async (file) => {
        if (!this.currentHandle) return;

        this.setState({ isUploading: true, uploadProgress: 0 });

        try {
            const fileHandle = await this.currentHandle.getFileHandle(file.name, { create: true });
            const writable = await fileHandle.createWritable();

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

        const path = '/' + newStack.map(f => f.name).join('/');
        this.setState({
            folderStack: newStack,
            currentPath: path
        });

        await this.loadFiles();
    }

    navigateToFolder = async (index) => {
        const newStack = this.state.folderStack.slice(0, index + 1);
        const folder = newStack[newStack.length - 1];

        if (index === 0) {
            const alpheryFolder = await this.rootHandle.getDirectoryHandle('Alphery OS', { create: true });
            this.currentHandle = alpheryFolder;
        } else {
            this.currentHandle = folder.handle;
        }

        const path = '/' + newStack.map(f => f.name).join('/');
        this.setState({
            folderStack: newStack,
            currentPath: path
        });

        await this.loadFiles();
    }

    navigateToQuickFolder = async (folderName) => {
        try {
            const alpheryFolder = await this.rootHandle.getDirectoryHandle('Alphery OS', { create: true });
            if (folderName === 'home') {
                this.currentHandle = alpheryFolder;
                this.setState({
                    folderStack: [{ name: 'Home', handle: null }],
                    currentPath: '/Home',
                    selectedFolder: 'home'
                });
            } else {
                const targetFolder = await alpheryFolder.getDirectoryHandle(folderName, { create: true });
                this.currentHandle = targetFolder;
                this.setState({
                    folderStack: [{ name: 'Home', handle: null }, { name: folderName, handle: targetFolder }],
                    currentPath: `/Home/${folderName}`,
                    selectedFolder: folderName.toLowerCase()
                });
            }
            await this.loadFiles();
        } catch (error) {
            console.error('Navigation error:', error);
        }
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
        const icons = {
            image: '🖼️',
            video: '🎥',
            audio: '🎵',
            pdf: '📕',
            document: '📝',
            spreadsheet: '📊',
            presentation: '📽️',
            archive: '🗜️',
            text: '📃',
            code: '💻',
            file: '📄'
        };
        return icons[type] || '📄';
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
            isUploading, uploadProgress, searchQuery, storageUsed, storageQuota, error, selectedFolder, favorites } = this.state;

        const filteredFiles = searchQuery
            ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : files;

        const storagePercent = storageQuota ? (storageUsed / storageQuota * 100).toFixed(1) : 0;

        return (
            <div className="w-full h-full flex bg-white text-slate-900 font-sans overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 flex flex-col flex-shrink-0">
                    {/* Header */}
                    <div className="h-14 flex items-center px-4 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <div className="text-2xl">🏠</div>
                            <span className="font-bold text-lg">Home</span>
                        </div>
                    </div>

                    {/* Favorites Section */}
                    <div className="flex-1 overflow-y-auto p-3">
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 px-2">Favorites</h3>
                            <div className="space-y-1">
                                <button
                                    onClick={() => this.navigateToQuickFolder('home')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${selectedFolder === 'home' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'
                                        }`}
                                >
                                    <span className="text-xl">🏠</span>
                                    <span className="font-medium">Home</span>
                                </button>
                                <button
                                    onClick={() => this.navigateToQuickFolder('Documents')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${selectedFolder === 'documents' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'
                                        }`}
                                >
                                    <span className="text-xl">📄</span>
                                    <span className="font-medium">Documents</span>
                                </button>
                                <button
                                    onClick={() => this.navigateToQuickFolder('Pictures')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${selectedFolder === 'pictures' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'
                                        }`}
                                >
                                    <span className="text-xl">📷</span>
                                    <span className="font-medium">Pictures</span>
                                </button>
                                <button
                                    onClick={() => this.navigateToQuickFolder('Desktop')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${selectedFolder === 'desktop' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'
                                        }`}
                                >
                                    <span className="text-xl">🖥️</span>
                                    <span className="font-medium">Desktop</span>
                                </button>
                                <button
                                    onClick={() => this.navigateToQuickFolder('Videos')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${selectedFolder === 'videos' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'
                                        }`}
                                >
                                    <span className="text-xl">🎬</span>
                                    <span className="font-medium">Videos</span>
                                </button>
                            </div>
                        </div>

                        {/* Storage Info */}
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-600">Storage</span>
                                <span className="text-xs text-slate-500">{storagePercent}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${storagePercent}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-500">
                                {this.formatFileSize(storageUsed)} of {this.formatFileSize(storageQuota)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
                        {/* Navigation */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                <button className="p-2 hover:bg-white rounded transition" title="Back">
                                    ←
                                </button>
                                <button className="p-2 hover:bg-white rounded transition" title="Forward">
                                    →
                                </button>
                                <button onClick={() => this.loadFiles()} className="p-2 hover:bg-white rounded transition" title="Refresh">
                                    ↻
                                </button>
                            </div>

                            {/* Breadcrumb */}
                            <div className="flex items-center gap-1 text-sm ml-4">
                                <span className="text-slate-400">▶</span>
                                <span className="font-semibold">{this.state.currentPath.replace('/', '')}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    value={searchQuery}
                                    onChange={(e) => this.setState({ searchQuery: e.target.value })}
                                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm w-64"
                                />
                                <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>

                            {/* View Toggle */}
                            <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                                <button
                                    onClick={() => this.setState({ viewMode: 'grid' })}
                                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                                    title="Grid View"
                                >
                                    ⊞
                                </button>
                                <button
                                    onClick={() => this.setState({ viewMode: 'list' })}
                                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                                    title="List View"
                                >
                                    ☰
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-6 gap-2 flex-shrink-0">
                        <button
                            onClick={() => this.setState({ showNewFolderModal: true })}
                            className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                        >
                            + New Folder
                        </button>
                        <button
                            onClick={() => this.fileInputRef.current.click()}
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                            Upload
                        </button>
                        <div className="flex-grow"></div>
                        <span className="text-xs text-slate-500">{filteredFiles.length} items</span>
                    </div>

                    {/* File Area */}
                    <div
                        className="flex-1 overflow-auto p-6 bg-white"
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
                                    <p className="text-slate-600">Loading...</p>
                                </div>
                            </div>
                        ) : filteredFiles.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="text-8xl mb-4">📂</div>
                                    <p className="text-slate-600 text-lg">{searchQuery ? 'No files found' : 'This folder is empty'}</p>
                                    <p className="text-slate-400 text-sm mt-2">
                                        {searchQuery ? 'Try a different search' : 'Drag files here or click Upload'}
                                    </p>
                                </div>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                {filteredFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        onDoubleClick={() => file.isFolder && this.openFolder(file)}
                                        className="bg-white hover:bg-slate-50 rounded-lg p-3 cursor-pointer border border-slate-200 hover:border-blue-400 transition group"
                                    >
                                        <div className="text-5xl mb-2 text-center">{this.getFileIcon(file.type, file.isFolder)}</div>
                                        <p className="text-sm font-medium text-slate-800 truncate text-center mb-1" title={file.name}>{file.name}</p>
                                        {!file.isFolder && <p className="text-xs text-slate-400 text-center">{this.formatFileSize(file.size)}</p>}

                                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                                            {!file.isFolder && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); this.downloadFile(file); }}
                                                    className="flex-1 bg-blue-100 text-blue-600 rounded px-2 py-1 text-xs hover:bg-blue-200"
                                                >
                                                    ⬇
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); this.deleteFile(file); }}
                                                className="flex-1 bg-red-100 text-red-600 rounded px-2 py-1 text-xs hover:bg-red-200"
                                            >
                                                🗑
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
