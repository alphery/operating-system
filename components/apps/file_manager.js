import React, { Component } from 'react';
import FirebaseFileService from '../../utils/firebase_file_service';
import JSZip from 'jszip';
import { useAuth } from '../../context/AuthContext-new';

function FileManagerWithAuth(props) {
    const { platformUser, user, loading } = useAuth();

    // Wait for both platform user AND Firebase user to be ready
    // This ensures custom claims are set before File Manager tries to access Firestore
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div style={{ color: '#fff', fontSize: '14px' }}>Initializing...</div>
            </div>
        );
    }

    if (!platformUser) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div style={{ color: '#fff', fontSize: '14px' }}>Please sign in to access files</div>
            </div>
        );
    }

    // CRITICAL: Only render File Manager when Firebase user exists
    // This ensures Firestore rules can see request.auth
    if (!user) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div style={{ color: '#fff', fontSize: '14px' }}>Syncing authentication...</div>
            </div>
        );
    }

    return <FileManager platformUser={platformUser} firebaseUser={user} {...props} />;
}

export class FileManager extends Component {
    constructor() {
        super();
        this.state = {
            files: [],
            currentPath: '/Home',
            folderStack: [{ name: 'Home', id: 'root' }],
            currentFolderId: 'root',
            loading: true,
            viewMode: 'grid',
            showNewFolderModal: false,
            newFolderName: '',
            searchQuery: '',
            uploadProgress: 0,
            isUploading: false,
            storageUsed: 0,
            storageQuota: 5 * 1024 * 1024 * 1024, // 5GB
            error: null,
            selectedFolder: 'home',
            user: null,

            // New Features State
            contextMenu: null,
            renamingItem: null, // {id, name}
            selectedItems: [], // array of ids
            previewItem: null,
            isDragging: false,
            trashItems: [],

            // Ultra-Premium State
            navHistory: [{ id: 'root', name: 'Home' }],
            historyIndex: 0,
            sortMode: 'name', // 'name', 'date', 'size'
            showStarredOnly: false
        };
        this.fileInputRef = React.createRef();
        this.unsubscribeAuth = null;
    }

    componentDidMount() {
        if (this.props.platformUser) {
            this.setState({ user: this.props.platformUser }, () => {
                this.loadFiles();
                this.updateStats();
            });
        }
        window.addEventListener('click', this.closeContextMenu);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.platformUser?.id !== this.props.platformUser?.id) {
            if (this.props.platformUser) {
                this.setState({ user: this.props.platformUser }, () => {
                    this.loadFiles();
                    this.updateStats();
                });
            } else {
                this.setState({ user: null, files: [], loading: false });
            }
        }
    }

    componentWillUnmount() {
        window.removeEventListener('click', this.closeContextMenu);
    }

    updateStats = async () => {
        if (!this.state.user) return;
        const stats = await FirebaseFileService.getStorageStats(this.state.user.id);
        this.setState({ storageUsed: stats.used });
    }

    // Context Menu Logic
    handleContextMenu = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            contextMenu: {
                x: e.clientX,
                y: e.clientY,
                item: item
            }
        });
    }

    closeContextMenu = () => {
        if (this.state.contextMenu) this.setState({ contextMenu: null });
    }

    // Selection Logic
    toggleSelect = (e, itemId) => {
        e.stopPropagation();
        const { selectedItems } = this.state;
        if (selectedItems.includes(itemId)) {
            this.setState({ selectedItems: selectedItems.filter(id => id !== itemId) });
        } else {
            this.setState({ selectedItems: [...selectedItems, itemId] });
        }
    }

    // Drag and Drop
    handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setState({ isDragging: true });
    }

    handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setState({ isDragging: false });
    }

    handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setState({ isDragging: false });
        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => this.uploadFile(file));
    }

    // Renaming
    startRename = (item) => {
        this.setState({ renamingItem: { id: item.id, name: item.name }, contextMenu: null });
    }

    saveRename = async () => {
        const { renamingItem, user } = this.state;
        if (!renamingItem || !renamingItem.name.trim() || !user) return;
        try {
            await FirebaseFileService.renameItem(user.id, renamingItem.id, renamingItem.name.trim());
            this.setState({ renamingItem: null });
            await this.loadFiles();
        } catch (e) {
            alert("Rename failed");
        }
    }

    // --- Ultra-Premium Features ---

    goBack = () => {
        const { historyIndex, navHistory } = this.state;
        if (historyIndex > 0) {
            const nextIndex = historyIndex - 1;
            const target = navHistory[nextIndex];
            this.setState({ historyIndex: nextIndex, currentFolderId: target.id }, () => this.loadFiles(true));
        }
    }

    goForward = () => {
        const { historyIndex, navHistory } = this.state;
        if (historyIndex < navHistory.length - 1) {
            const nextIndex = historyIndex + 1;
            const target = navHistory[nextIndex];
            this.setState({ historyIndex: nextIndex, currentFolderId: target.id }, () => this.loadFiles(true));
        }
    }

    toggleStar = async (item) => {
        const { user } = this.state;
        if (!user) return;
        try {
            await FirebaseFileService.toggleStar(user.id, item.id, item.isStarred);
            await this.loadFiles();
            this.closeContextMenu();
        } catch (e) {
            alert("Failed to toggle star");
        }
    }

    createZip = async () => {
        const selectedFiles = this.state.files.filter(f => this.state.selectedItems.includes(f.id) && !f.isFolder);
        if (selectedFiles.length === 0) {
            alert("Please select some files (folders cannot be zipped yet)");
            return;
        }

        this.setState({ isUploading: true, uploadProgress: 10 });
        const zip = new JSZip();

        try {
            // Fetch and add to ZIP
            for (const file of selectedFiles) {
                const response = await fetch(file.url);
                const blob = await response.blob();
                zip.file(file.name, blob);
            }

            const content = await zip.generateAsync({ type: "blob" });
            const zipFile = new File([content], `archive_${Date.now()}.zip`, { type: "application/zip" });

            await this.uploadFile(zipFile);
            this.setState({ selectedItems: [] });
            alert("ZIP created and uploaded successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to create ZIP: " + e.message);
        } finally {
            this.setState({ isUploading: false });
        }
    }

    setSortMode = (mode) => {
        this.setState({ sortMode: mode });
    }


    loadFiles = async (isHistoryAction = false) => {
        if (!this.state.user) return;

        this.setState({ loading: true, error: null });

        try {
            let files = await FirebaseFileService.getFiles(this.state.user.id, this.state.currentFolderId);

            // Filter starred if needed
            if (this.state.showStarredOnly) {
                files = files.filter(f => f.isStarred);
            }

            // Client-side Sort
            files.sort((a, b) => {
                if (a.isFolder && !b.isFolder) return -1;
                if (!a.isFolder && b.isFolder) return 1;

                if (this.state.sortMode === 'name') return a.name.localeCompare(b.name);
                if (this.state.sortMode === 'date') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                if (this.state.sortMode === 'size') return (b.size || 0) - (a.size || 0);
                return 0;
            });

            this.setState({ files, loading: false });
        } catch (error) {
            console.error('Error loading files:', error);
            this.setState({ loading: false, error: 'Failed to load files' });
        }
    }

    uploadFile = async (file) => {
        if (!this.state.user) return;

        this.setState({ isUploading: true, uploadProgress: 0 });

        try {
            await FirebaseFileService.uploadFile(
                this.state.user.id,
                file,
                this.state.currentFolderId,
                this.state.folderStack,
                (progress) => this.setState({ uploadProgress: progress })
            );

            await this.loadFiles();
            this.setState({ isUploading: false, uploadProgress: 0 });
        } catch (error) {
            console.error('Upload error:', error);
            this.setState({ isUploading: false, uploadProgress: 0 });
            alert('Upload failed: ' + error.message);
        }
    }

    createFolder = async () => {
        const { newFolderName, currentFolderId, folderStack } = this.state;
        if (!newFolderName.trim()) return;

        try {
            await FirebaseFileService.createFolder(
                this.state.user.id,
                newFolderName.trim(),
                currentFolderId,
                folderStack
            );
            await this.loadFiles();
            this.setState({ showNewFolderModal: false, newFolderName: '' });
        } catch (error) {
            console.error('Error creating folder:', error);
            alert('Failed to create folder: ' + error.message);
        }
    }

    deleteItem = async (item) => {
        if (!this.state.user || !window.confirm(`Delete "${item.name}"?`)) return;

        try {
            await FirebaseFileService.deleteItem(this.state.user.id, item);
            await this.loadFiles();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item: ' + error.message);
        }
    }

    openFolder = (folder) => {
        const newStack = [...this.state.folderStack, { name: folder.name, id: folder.id }];
        const path = '/' + newStack.map(f => f.name).join('/');

        // Update History
        const { navHistory, historyIndex } = this.state;
        const newHistory = navHistory.slice(0, historyIndex + 1);
        newHistory.push({ id: folder.id, name: folder.name });

        this.setState({
            folderStack: newStack,
            currentFolderId: folder.id,
            currentPath: path,
            selectedFolder: null,
            navHistory: newHistory,
            historyIndex: newHistory.length - 1
        }, () => this.loadFiles());
    }

    navigateToBreadcrumb = (index) => {
        const newStack = this.state.folderStack.slice(0, index + 1);
        const folder = newStack[newStack.length - 1];
        const path = '/' + newStack.map(f => f.name).join('/');

        // Update History
        const { navHistory, historyIndex } = this.state;
        const newHistory = navHistory.slice(0, historyIndex + 1);
        newHistory.push({ id: folder.id, name: folder.name });

        this.setState({
            folderStack: newStack,
            currentFolderId: folder.id,
            currentPath: path,
            navHistory: newHistory,
            historyIndex: newHistory.length - 1
        }, () => this.loadFiles());
    }

    navigateToBase = (folderName) => {
        if (folderName === 'Home') {
            this.setState({
                folderStack: [{ name: 'Home', id: 'root' }],
                currentFolderId: 'root',
                currentPath: '/Home',
                selectedFolder: 'home'
            }, () => this.loadFiles());
        } else {
            this.findOrCreateSystemFolder(folderName);
        }
    }

    findOrCreateSystemFolder = async (folderName) => {
        try {
            this.setState({ loading: true });
            const rootFiles = await FirebaseFileService.getFiles('root');
            let target = rootFiles.find(f => f.isFolder && f.name === folderName);

            if (!target) {
                await FirebaseFileService.createFolder(this.state.user.id, folderName, 'root', [{ name: 'Home', id: 'root' }]);
                const refreshed = await FirebaseFileService.getFiles(this.state.user.id, 'root');
                target = refreshed.find(f => f.isFolder && f.name === folderName);
            }

            if (target) {
                this.openFolder(target);
                this.setState({ selectedFolder: folderName.toLowerCase() });
            }
        } catch (err) {
            console.error("Error navigating to system folder", err);
        }
    }

    handleFileInputChange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => this.uploadFile(file));
    }

    getFileIcon = (type, isFolder) => {
        if (isFolder) return '📁';
        const icons = {
            image: '🖼️', video: '🎥', audio: '🎵', pdf: '📕',
            document: '📝', spreadsheet: '📊', presentation: '📽️',
            archive: '🗜️', text: '📃', code: '💻', file: '📄'
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
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    render() {
        const { loading, files, viewMode, showNewFolderModal, newFolderName,
            isUploading, uploadProgress, searchQuery, error, selectedFolder, user, folderStack } = this.state;

        if (!user && !loading) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-white flex-col gap-4 text-slate-800">
                    <div className="text-6xl">🔒</div>
                    <h2 className="text-2xl font-bold">Authentication Required</h2>
                    <p>Please log in with your alphery account to access your files.</p>
                </div>
            );
        }

        const filteredFiles = searchQuery
            ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : files;

        return (
            <div
                className={`w-full h-full flex bg-white text-slate-900 font-sans overflow-hidden relative ${this.state.isDragging ? 'ring-4 ring-blue-400 ring-inset' : ''}`}
                onDragOver={this.handleDragEnter}
                onDragEnter={this.handleDragEnter}
                onDragLeave={this.handleDragLeave}
                onDrop={this.handleDrop}
            >
                {/* Sidebar */}
                <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0">
                    <div className="h-14 flex items-center px-4 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <div className="text-2xl">☁️</div>
                            <span className="font-bold text-lg">Cloud Drive</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3">
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 px-2">Favorites</h3>
                            <div className="space-y-1">
                                <button onClick={() => { this.setState({ showStarredOnly: false }, () => this.navigateToBase('Home')) }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${selectedFolder === 'home' && !this.state.showStarredOnly ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}>
                                    <span className="text-xl">🏠</span><span className="font-medium">Home</span>
                                </button>
                                <button onClick={() => { this.setState({ showStarredOnly: true, selectedFolder: 'starred' }, () => this.loadFiles()) }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${this.state.showStarredOnly ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-100'}`}>
                                    <span className="text-xl">⭐️</span><span className="font-medium">Starred</span>
                                </button>
                                <button onClick={() => { this.setState({ showStarredOnly: false }, () => this.navigateToBase('Documents')) }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${selectedFolder === 'documents' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}>
                                    <span className="text-xl">📄</span><span className="font-medium">Documents</span>
                                </button>
                                <button onClick={() => { this.setState({ showStarredOnly: false }, () => this.navigateToBase('Pictures')) }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${selectedFolder === 'pictures' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}>
                                    <span className="text-xl">📷</span><span className="font-medium">Pictures</span>
                                </button>
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-200 p-2">
                            <div className="bg-slate-200 h-2 rounded-full mb-2 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (this.state.storageUsed / this.state.storageQuota) * 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">
                                Storage: {this.formatFileSize(this.state.storageUsed)} / {this.formatFileSize(this.state.storageQuota)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            {/* Navigation history */}
                            <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                <button
                                    onClick={this.goBack}
                                    disabled={this.state.historyIndex <= 0}
                                    className="p-1.5 hover:bg-white rounded transition disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    ⬅️
                                </button>
                                <button
                                    onClick={this.goForward}
                                    disabled={this.state.historyIndex >= this.state.navHistory.length - 1}
                                    className="p-1.5 hover:bg-white rounded transition disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    ➡️
                                </button>
                                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                <button onClick={() => { this.loadFiles(); this.updateStats(); }} className="p-1.5 hover:bg-white rounded transition" title="Refresh">↻</button>
                            </div>

                            {/* Breadcrumb */}
                            <div className="flex items-center gap-1 text-sm overflow-hidden">
                                {folderStack.map((folder, index) => (
                                    <React.Fragment key={folder.id}>
                                        {index > 0 && <span className="text-slate-400">/</span>}
                                        <button
                                            onClick={() => this.navigateToBreadcrumb(index)}
                                            className="hover:text-blue-600 font-medium px-1 truncate max-w-[150px]"
                                        >
                                            {folder.name}
                                        </button>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => this.setState({ searchQuery: e.target.value })}
                                className="pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm w-48 transition-all focus:w-64"
                            />

                            {/* Sort Dropdown */}
                            <select
                                className="bg-slate-100 border-none rounded-lg text-sm px-2 py-2 outline-none cursor-pointer hover:bg-slate-200"
                                value={this.state.sortMode}
                                onChange={(e) => this.setState({ sortMode: e.target.value }, () => this.loadFiles())}
                            >
                                <option value="name">Sort: Name</option>
                                <option value="date">Sort: Date</option>
                                <option value="size">Sort: Size</option>
                            </select>

                            <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                                <button onClick={() => this.setState({ viewMode: 'grid' })} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}>⊞</button>
                                <button onClick={() => this.setState({ viewMode: 'list' })} className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}>☰</button>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-6 gap-2 flex-shrink-0">
                        <button onClick={() => this.setState({ showNewFolderModal: true })} className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm font-medium">
                            + New Folder
                        </button>
                        <button onClick={() => this.fileInputRef.current.click()} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                            Upload
                        </button>

                        {this.state.selectedItems.length > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="w-px h-6 bg-slate-300 mx-2"></div>
                                <button
                                    onClick={this.createZip}
                                    className="px-4 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition text-sm font-medium flex items-center gap-1"
                                >
                                    📦 ZIP Selected ({this.state.selectedItems.length})
                                </button>
                                <button
                                    onClick={() => { if (confirm(`Delete ${this.state.selectedItems.length} items?`)) this.state.selectedItems.forEach(id => this.deleteItem({ id })) }}
                                    className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                                >
                                    🗑 Delete
                                </button>
                            </div>
                        )}
                        <div className="flex-grow"></div>
                        <span className="text-xs text-slate-500">{filteredFiles.length} items</span>
                    </div>

                    {/* File Area */}
                    <div className="flex-1 overflow-auto p-6 bg-white relative" onClick={() => this.setState({ selectedItems: [] })}>
                        {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-slate-600">Loading your files...</p>
                                </div>
                            </div>
                        ) : filteredFiles.length === 0 ? (
                            <div className="flex items-center justify-center h-full opacity-60">
                                <div className="text-center">
                                    <div className="text-5xl mb-4">{this.state.showStarredOnly ? '⭐️' : '☁️'}</div>
                                    <p className="text-slate-600 text-lg">{this.state.showStarredOnly ? 'No starred items' : 'No files here yet'}</p>
                                    <p className="text-slate-400 text-sm">Drag files here to upload</p>
                                </div>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                {filteredFiles.map((file) => (
                                    <div key={file.id}
                                        onDoubleClick={() => file.isFolder ? this.openFolder(file) : this.setState({ previewItem: file })}
                                        onContextMenu={(e) => this.handleContextMenu(e, file)}
                                        onClick={(e) => this.toggleSelect(e, file.id)}
                                        className={`bg-white rounded-xl p-3 cursor-pointer border transition group relative
                                            ${this.state.selectedItems.includes(file.id) ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-400 hover:shadow-sm'}
                                        `}
                                    >
                                        <div className="text-5xl mb-2 text-center select-none transform transition group-hover:scale-105">
                                            {this.getFileIcon(file.type || 'file', file.isFolder)}
                                        </div>

                                        {this.state.renamingItem?.id === file.id ? (
                                            <input
                                                autoFocus
                                                className="w-full text-xs text-center border border-blue-500 rounded px-1 outline-none"
                                                value={this.state.renamingItem.name}
                                                onChange={e => this.setState({ renamingItem: { ...this.state.renamingItem, name: e.target.value } })}
                                                onBlur={this.saveRename}
                                                onKeyPress={e => e.key === 'Enter' && this.saveRename()}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-slate-800 truncate text-center mb-1 select-none flex items-center justify-center gap-1">
                                                {file.isStarred && <span className="text-amber-500 text-[10px]">⭐️</span>}
                                                {file.name}
                                            </p>
                                        )}

                                        {!file.isFolder && <p className="text-[10px] text-slate-400 text-center uppercase tracking-tighter">{this.formatFileSize(file.size)}</p>}

                                        {/* Multi-select indicator */}
                                        <div className={`absolute top-2 left-2 w-4 h-4 rounded border transition-all ${this.state.selectedItems.includes(file.id) ? 'bg-blue-500 border-blue-500 scale-110' : 'bg-white border-slate-300 opacity-0 group-hover:opacity-100'}`}>
                                            {this.state.selectedItems.includes(file.id) && <span className="text-[10px] text-white flex items-center justify-center">✓</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <table className="w-full text-left" onClick={e => e.stopPropagation()}>
                                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b">
                                    <tr>
                                        <th className="px-4 py-3 w-10"></th>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Size</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredFiles.map((file) => (
                                        <tr
                                            key={file.id}
                                            onDoubleClick={() => file.isFolder ? this.openFolder(file) : this.setState({ previewItem: file })}
                                            onContextMenu={(e) => this.handleContextMenu(e, file)}
                                            onClick={(e) => this.toggleSelect(e, file.id)}
                                            className={`hover:bg-slate-50 cursor-pointer group transition ${this.state.selectedItems.includes(file.id) ? 'bg-blue-50' : ''}`}
                                        >
                                            <td className="px-4 py-2">
                                                <div className={`w-4 h-4 rounded border transition-all ${this.state.selectedItems.includes(file.id) ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300 opacity-0 group-hover:opacity-100'}`}>
                                                    {this.state.selectedItems.includes(file.id) && <span className="text-[10px] text-white flex items-center justify-center">✓</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 font-medium flex items-center gap-2">
                                                <span className="text-xl">{this.getFileIcon(file.type || 'file', file.isFolder)}</span>
                                                {this.state.renamingItem?.id === file.id ? (
                                                    <input
                                                        autoFocus
                                                        className="text-sm border border-blue-500 rounded px-1 outline-none"
                                                        value={this.state.renamingItem.name}
                                                        onChange={e => this.setState({ renamingItem: { ...this.state.renamingItem, name: e.target.value } })}
                                                        onBlur={this.saveRename}
                                                        onKeyPress={e => e.key === 'Enter' && this.saveRename()}
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        {file.isStarred && <span className="text-amber-500">⭐️</span>}
                                                        {file.name}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-slate-500">{this.formatDate(file.createdAt)}</td>
                                            <td className="px-4 py-2 text-sm text-slate-500">{this.formatFileSize(file.size)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <input ref={this.fileInputRef} type="file" multiple onChange={this.handleFileInputChange} className="hidden" />

                {/* New Folder Modal */}
                {showNewFolderModal && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" onClick={() => this.setState({ showNewFolderModal: false })}>
                        <div className="bg-white rounded-2xl shadow-2xl w-96 p-6" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-xl font-bold text-slate-800 mb-4">New Folder</h3>
                            <input autoFocus type="text" placeholder="Folder name" value={newFolderName} onChange={(e) => this.setState({ newFolderName: e.target.value })} onKeyPress={(e) => e.key === 'Enter' && this.createFolder()} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4" />
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => this.setState({ showNewFolderModal: false })} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                                <button onClick={this.createFolder} disabled={!newFolderName.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50">Create</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Context Menu Overlay */}
                {this.state.contextMenu && (
                    <div
                        className="fixed bg-white shadow-2xl rounded-lg border border-slate-200 py-1 z-[200] w-48 animate-in fade-in zoom-in duration-100"
                        style={{ top: this.state.contextMenu.y, left: this.state.contextMenu.x }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => this.toggleStar(this.state.contextMenu.item)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center gap-2">
                            <span>{this.state.contextMenu.item.isStarred ? '✖️' : '⭐️'}</span> {this.state.contextMenu.item.isStarred ? 'Unstar' : 'Add to Starred'}
                        </button>
                        <button onClick={() => this.startRename(this.state.contextMenu.item)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center gap-2">
                            <span>✏️</span> Rename
                        </button>
                        {!this.state.contextMenu.item.isFolder && (
                            <a href={this.state.contextMenu.item.url} download target="_blank" rel="noreferrer" className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center gap-2">
                                <span>⬇️</span> Download
                            </a>
                        )}
                        <hr className="my-1 border-slate-100" />
                        <button onClick={() => { this.deleteItem(this.state.contextMenu.item); this.closeContextMenu(); }} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                            <span>🗑️</span> Delete
                        </button>
                    </div>
                )}

                {/* File Preview (Lightbox + Media Engine) */}
                {this.state.previewItem && (
                    <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-8 backdrop-blur-md animate-in fade-in duration-300" onClick={() => this.setState({ previewItem: null })}>
                        <button className="absolute top-6 right-6 text-white text-4xl hover:rotate-90 transition-transform duration-300">×</button>
                        <div className="max-w-5xl w-full flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
                            {this.state.previewItem.type === 'image' ? (
                                <img src={this.state.previewItem.url} className="max-w-full max-h-[80vh] rounded-lg shadow-2xl border border-white/20 animate-in zoom-in" alt="" />
                            ) : this.state.previewItem.type === 'video' ? (
                                <video controls autoPlay className="max-w-full max-h-[80vh] rounded-lg shadow-2xl border border-white/20 animate-in slide-in-from-bottom" src={this.state.previewItem.url} />
                            ) : this.state.previewItem.type === 'audio' ? (
                                <div className="bg-white/10 backdrop-blur-xl p-12 rounded-3xl border border-white/20 flex flex-col items-center gap-6 w-full max-w-md animate-in zoom-in">
                                    <div className="text-9xl animate-pulse">🎵</div>
                                    <p className="text-white text-xl font-bold text-center">{this.state.previewItem.name}</p>
                                    <audio controls autoPlay className="w-full mt-4" src={this.state.previewItem.url} />
                                </div>
                            ) : (
                                <div className="bg-white p-16 rounded-3xl flex flex-col items-center gap-6 shadow-2xl animate-in zoom-in">
                                    <div className="text-9xl drop-shadow-lg">{this.getFileIcon(this.state.previewItem.type, false)}</div>
                                    <p className="text-2xl font-black text-slate-800">{this.state.previewItem.name}</p>
                                    <p className="text-slate-400 font-medium">{this.formatFileSize(this.state.previewItem.size)}</p>
                                    <a href={this.state.previewItem.url} target="_blank" rel="noreferrer" className="mt-4 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-blue-700 hover:shadow-blue-500/50 transition-all active:scale-95">Download File</a>
                                </div>
                            )}
                            <div className="flex items-center gap-4 bg-black/40 px-6 py-2 rounded-full border border-white/10">
                                <span className="text-white/60 text-sm">{this.state.previewItem.name}</span>
                                <div className="w-px h-4 bg-white/10"></div>
                                <span className="text-white/40 text-xs uppercase">{this.state.previewItem.type}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ZIP/Upload Progress */}
                {isUploading && (
                    <div className="absolute bottom-6 right-6 bg-white rounded-2xl shadow-2xl p-5 w-80 border border-slate-200 z-[400] animate-in slide-in-from-right">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                <span className="font-bold text-slate-800 text-sm">Processing...</span>
                            </div>
                            <span className="text-blue-600 font-bold text-xs">{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-100">
                            <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export const displayFileManager = () => {
    return <FileManagerWithAuth />;
};

export default FileManager;
