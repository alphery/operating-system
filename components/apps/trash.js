import React, { Component } from 'react';
import FirebaseFileService from '../../utils/firebase_file_service';
import { auth } from '../../config/firebase';

export class Trash extends Component {
    constructor() {
        super();
        this.state = {
            trashItems: [],
            loading: true,
            selectedId: null,
            contextMenu: null
        }
    }

    componentDidMount() {
        this.unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                // Subscribe to real-time updates
                this.unsubscribeTrash = FirebaseFileService.subscribeToTrash((files) => {
                    this.setState({ trashItems: files, loading: false });
                });
            } else {
                this.setState({ trashItems: [], loading: false });
            }
        });
        window.addEventListener('click', this.closeContextMenu);
    }

    componentWillUnmount() {
        if (this.unsubscribeAuth) this.unsubscribeAuth();
        if (this.unsubscribeTrash) this.unsubscribeTrash();
        window.removeEventListener('click', this.closeContextMenu);
    }

    // No longer needed manually, but kept for forceful updates if needed
    loadTrashedFiles = async () => {
        // Subscription handles this
    }

    emptyTrash = async () => {
        if (!window.confirm("Are you sure you want to permanently delete all items in the Trash?")) return;
        try {
            await FirebaseFileService.emptyTrash();
        } catch (error) {
            console.error(error);
        }
    };

    restoreItem = async (item) => {
        try {
            await FirebaseFileService.restoreFromTrash(item);
        } catch (error) {
            console.error(error);
        }
    }

    deletePermanently = async (item) => {
        if (!window.confirm(`Permanently delete "${item.name}"?`)) return;
        try {
            await FirebaseFileService.permanentlyDelete(item);
        } catch (error) {
            console.error(error);
        }
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

    handleContextMenu = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            contextMenu: {
                x: e.clientX,
                y: e.clientY,
                item: item
            },
            selectedId: item.id
        });
    }

    closeContextMenu = () => {
        if (this.state.contextMenu) this.setState({ contextMenu: null });
    }

    renderContextMenu = () => {
        const { contextMenu } = this.state;
        if (!contextMenu) return null;

        return (
            <div
                className="absolute bg-white border border-slate-200 shadow-xl rounded-lg py-1 w-48 z-50 animate-in fade-in duration-100"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onClick={(e) => e.stopPropagation()}
            >
                <div onClick={() => { this.restoreItem(contextMenu.item); this.closeContextMenu(); }} className="px-4 py-2 hover:bg-blue-50 hover:text-blue-600 text-sm cursor-pointer flex items-center gap-2">
                    <span>♻️</span> Restore
                </div>
                <div className="h-px bg-slate-100 my-1"></div>
                <div onClick={() => { this.deletePermanently(contextMenu.item); this.closeContextMenu(); }} className="px-4 py-2 hover:bg-red-50 hover:text-red-600 text-sm cursor-pointer flex items-center gap-2 text-red-500">
                    <span>🗑</span> Delete Forever
                </div>
            </div>
        )
    }

    emptyScreen = () => {
        return (
            <div className="flex-grow flex flex-col justify-center items-center opacity-60">
                <div className="text-6xl mb-4">🗑️</div>
                <span className="font-bold text-xl text-slate-500">Trash is Empty</span>
                <span className="text-sm text-slate-400 mt-2">No deleted files here</span>
            </div>
        );
    }

    showTrashItems = () => {
        return (
            <div className="flex-1 overflow-y-auto p-6" onClick={() => this.setState({ selectedId: null })}>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {this.state.trashItems.map((item) => (
                        <div
                            key={item.id}
                            onContextMenu={(e) => this.handleContextMenu(e, item)}
                            onClick={(e) => { e.stopPropagation(); this.setState({ selectedId: item.id }); }}
                            className={`flex flex-col items-center p-4 rounded-xl cursor-pointer border transition-all relative group
                                ${this.state.selectedId === item.id ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-white border-transparent hover:bg-white/50 hover:shadow-sm'}
                            `}
                        >
                            <div className="text-4xl mb-3 filter drop-shadow-sm transition-transform group-hover:scale-110">
                                {this.getFileIcon(item.type || 'file', item.isFolder)}
                            </div>
                            <span className="text-sm font-medium text-slate-700 text-center line-clamp-2 leading-tight w-full break-words">
                                {item.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    render() {
        return (
            <div className="w-full h-full flex flex-col bg-[#f0f2f5] select-none font-sans relative">
                {/* Header */}
                <div className="flex items-center justify-between w-full bg-white/80 backdrop-blur-md border-b border-slate-200 h-14 px-4 flex-shrink-0 z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🗑️</span>
                        <span className="font-bold text-slate-800">Trash</span>
                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-2">
                            {this.state.trashItems.length} items
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {this.state.trashItems.length > 0 && (
                            <button
                                onClick={this.emptyTrash}
                                className="px-4 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-500 hover:text-white transition-all text-sm font-bold flex items-center gap-2 active:scale-95"
                            >
                                Empty Trash
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                {this.state.loading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    this.state.trashItems.length === 0
                        ? this.emptyScreen()
                        : this.showTrashItems()
                )}

                {this.renderContextMenu()}
            </div>
        )
    }
}

export default Trash;

export const displayTrash = () => {
    return <Trash> </Trash>;
}
