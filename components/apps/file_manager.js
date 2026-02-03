import React, { Component } from 'react';
import FirebaseFileService from '../../utils/firebase_file_service';
import { auth } from '../../config/firebase';

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
            storageQuota: 0,
            error: null,
            selectedFolder: 'home',
            user: null
        };
        this.fileInputRef = React.createRef();
        this.unsubscribeAuth = null;
    }

    componentDidMount() {
        this.unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                this.setState({ user }, () => {
                    this.loadFiles();
                });
            } else {
                this.setState({
                    user: null,
                    files: [],
                    loading: false,
                    error: "Please log in to access your files."
                });
            }
        });
    }

    componentWillUnmount() {
        if (this.unsubscribeAuth) this.unsubscribeAuth();
    }

    loadFiles = async () => {
        if (!this.state.user) return;

        this.setState({ loading: true, error: null });

        try {
            const files = await FirebaseFileService.getFiles(this.state.currentFolderId);
            this.setState({ files, loading: false });
        } catch (error) {
            console.error('Error loading files:', error);
            this.setState({ loading: false, error: 'Failed to load files: ' + error.message });
        }
    }

    uploadFile = async (file) => {
        if (!this.state.user) return;

        this.setState({ isUploading: true, uploadProgress: 0 });

        try {
            await FirebaseFileService.uploadFile(
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
        if (!window.confirm(`Delete "${item.name}"?`)) return;

        try {
            await FirebaseFileService.deleteItem(item);
            await this.loadFiles();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item: ' + error.message);
        }
    }

    openFolder = (folder) => {
        const newStack = [...this.state.folderStack, { name: folder.name, id: folder.id }];
        const path = '/' + newStack.map(f => f.name).join('/');

        this.setState({
            folderStack: newStack,
            currentFolderId: folder.id,
            currentPath: path,
            selectedFolder: null // clear sidebar selection
        }, () => this.loadFiles());
    }

    navigateToBreadcrumb = (index) => {
        const newStack = this.state.folderStack.slice(0, index + 1);
        const folder = newStack[newStack.length - 1];
        const path = '/' + newStack.map(f => f.name).join('/');

        this.setState({
            folderStack: newStack,
            currentFolderId: folder.id,
            currentPath: path
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
                await FirebaseFileService.createFolder(folderName, 'root', [{ name: 'Home', id: 'root' }]);
                const refreshed = await FirebaseFileService.getFiles('root');
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
                    <p>Please log in with Google to access your files.</p>
                </div>
            );
        }

        const filteredFiles = searchQuery
            ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : files;

        return (
            <div className="w-full h-full flex bg-white text-slate-900 font-sans overflow-hidden">
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
                                <button onClick={() => this.navigateToBase('Home')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${selectedFolder === 'home' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}>
                                    <span className="text-xl">🏠</span><span className="font-medium">Home</span>
                                </button>
                                <button onClick={() => this.navigateToBase('Documents')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${selectedFolder === 'documents' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}>
                                    <span className="text-xl">📄</span><span className="font-medium">Documents</span>
                                </button>
                                <button onClick={() => this.navigateToBase('Pictures')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${selectedFolder === 'pictures' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}>
                                    <span className="text-xl">📷</span><span className="font-medium">Pictures</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                <button onClick={() => this.loadFiles()} className="p-2 hover:bg-white rounded transition" title="Refresh">↻</button>
                            </div>
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-1 text-sm ml-4 overflow-hidden">
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
                        <div className="flex-grow"></div>
                        <span className="text-xs text-slate-500">{filteredFiles.length} items</span>
                    </div>

                    {/* File Area */}
                    <div className="flex-1 overflow-auto p-6 bg-white relative">
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
                                    <div className="text-4xl mb-4">☁️</div>
                                    <p className="text-slate-600 text-lg">No files here yet</p>
                                </div>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                {filteredFiles.map((file) => (
                                    <div key={file.id}
                                        onDoubleClick={() => file.isFolder && this.openFolder(file)}
                                        className="bg-white hover:bg-slate-50 rounded-lg p-3 cursor-pointer border border-slate-200 hover:border-blue-400 transition group relative"
                                    >
                                        <div className="text-5xl mb-2 text-center">{this.getFileIcon(file.type || 'file', file.isFolder)}</div>
                                        <p className="text-sm font-medium text-slate-800 truncate text-center mb-1">{file.name}</p>
                                        {!file.isFolder && <p className="text-xs text-slate-400 text-center">{this.formatFileSize(file.size)}</p>}

                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition bg-white bg-opacity-90 rounded shadow">
                                            {file.url && (
                                                <a href={file.url} target="_blank" rel="noopener noreferrer" download className="p-1 hover:text-blue-600" title="Download" onClick={e => e.stopPropagation()}>⬇</a>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); this.deleteItem(file); }} className="p-1 hover:text-red-600" title="Delete">🗑</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b">
                                    <tr>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Size</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredFiles.map((file) => (
                                        <tr key={file.id} onDoubleClick={() => file.isFolder && this.openFolder(file)} className="hover:bg-slate-50 cursor-pointer group">
                                            <td className="px-4 py-2 font-medium flex items-center gap-2">
                                                <span>{this.getFileIcon(file.type || 'file', file.isFolder)}</span> {file.name}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-slate-500">{this.formatDate(file.createdAt)}</td>
                                            <td className="px-4 py-2 text-sm text-slate-500">{this.formatFileSize(file.size)}</td>
                                            <td className="px-4 py-2 text-right opacity-0 group-hover:opacity-100 transition">
                                                <div className="flex gap-2 justify-end">
                                                    {file.url && (
                                                        <a href={file.url} download target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline text-sm">Download</a>
                                                    )}
                                                    <button onClick={(e) => { e.stopPropagation(); this.deleteItem(file); }} className="text-red-600 hover:underline text-sm">Delete</button>
                                                </div>
                                            </td>
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
                            <input
                                autoFocus
                                type="text"
                                placeholder="Folder name"
                                value={newFolderName}
                                onChange={(e) => this.setState({ newFolderName: e.target.value })}
                                onKeyPress={(e) => e.key === 'Enter' && this.createFolder()}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                            />
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => this.setState({ showNewFolderModal: false })} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                                <button onClick={this.createFolder} disabled={!newFolderName.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50">Create</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                    <div className="absolute bottom-6 right-6 bg-white rounded-xl shadow-2xl p-4 w-80 border border-slate-200 z-[100]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            <span className="font-semibold text-slate-800">Uploading... {Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
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
