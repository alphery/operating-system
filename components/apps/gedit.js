import React, { Component } from 'react';

export class Gedit extends Component {
    constructor() {
        super();
        this.state = {
            text: '',
            fileName: 'Untitled.txt',
            isSaved: true,
            showFilePicker: false,
            fileList: [],
            status: 'Ready'
        };
        this.rootHandle = null;
        this.currentFileHandle = null;
    }

    async componentDidMount() {
        try {
            this.rootHandle = await navigator.storage.getDirectory();
            // Try to create/get Alphery OS folder
            await this.rootHandle.getDirectoryHandle('Alphery OS', { create: true });

            // Handle Ctrl+S and Ctrl+O
            document.addEventListener('keydown', this.handleKeyDown);
        } catch (e) {
            console.error("FS Init error", e);
        }
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveFile();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            this.openFileList();
        }
    }

    handleChange = (e) => {
        this.setState({ text: e.target.value, isSaved: false, status: 'Unsaved' });
    }

    getFileList = async () => {
        if (!this.rootHandle) return [];
        try {
            const osFolder = await this.rootHandle.getDirectoryHandle('Alphery OS', { create: true });
            const files = [];
            for await (const entry of osFolder.values()) {
                if (entry.kind === 'file' && (entry.name.endsWith('.txt') || entry.name.endsWith('.md') || entry.name.endsWith('.js') || entry.name.endsWith('.css') || entry.name.endsWith('.json') || entry.name.endsWith('.html'))) {
                    files.push(entry);
                }
            }
            return files;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    openFileList = async () => {
        const files = await this.getFileList();
        this.setState({ showFilePicker: true, fileList: files });
    }

    loadFile = async (fileHandle) => {
        try {
            const file = await fileHandle.getFile();
            const text = await file.text();
            this.currentFileHandle = fileHandle;
            this.setState({
                text,
                fileName: fileHandle.name,
                isSaved: true,
                showFilePicker: false,
                status: 'Opened ' + fileHandle.name
            });
        } catch (e) {
            alert('Failed to read file');
        }
    }

    saveFile = async () => {
        if (!this.rootHandle) return;

        try {
            this.setState({ status: 'Saving...' });
            const osFolder = await this.rootHandle.getDirectoryHandle('Alphery OS', { create: true });

            let fileHandle = this.currentFileHandle;
            if (!fileHandle) {
                // Save as new file
                let name = prompt("Enter file name:", this.state.fileName);
                if (!name) {
                    this.setState({ status: 'Save Cancelled' });
                    return;
                }
                if (!name.includes('.')) name += '.txt';
                fileHandle = await osFolder.getFileHandle(name, { create: true });
                this.currentFileHandle = fileHandle;
                this.setState({ fileName: name });
            }

            const writable = await fileHandle.createWritable();
            await writable.write(this.state.text);
            await writable.close();

            this.setState({ isSaved: true, status: 'Saved' });
            setTimeout(() => this.setState({ status: 'Ready' }), 2000);
        } catch (e) {
            console.error(e);
            alert('Failed to save file');
            this.setState({ status: 'Error saving' });
        }
    }

    newFile = () => {
        if (!this.state.isSaved && !window.confirm("You have unsaved changes. Discard them?")) return;
        this.setState({
            text: '',
            fileName: 'Untitled.txt',
            isSaved: true,
            status: 'New File'
        });
        this.currentFileHandle = null;
    }

    render() {
        return (
            <div className="w-full h-full flex flex-col bg-white text-slate-800 font-sans">
                {/* Toolbar */}
                <div className="h-10 bg-slate-100 border-b border-slate-200 flex items-center px-2 gap-1 select-none flex-shrink-0">
                    <button onClick={this.newFile} className="px-3 py-1 hover:bg-slate-200 rounded text-xs font-medium flex items-center gap-2 transition">
                        📄 New
                    </button>
                    <button onClick={this.openFileList} className="px-3 py-1 hover:bg-slate-200 rounded text-xs font-medium flex items-center gap-2 transition">
                        📂 Open
                    </button>
                    <button onClick={this.saveFile} className="px-3 py-1 hover:bg-slate-200 rounded text-xs font-medium flex items-center gap-2 transition">
                        💾 Save
                    </button>
                    <div className="border-l border-slate-300 h-4 mx-2"></div>
                    <span className="text-xs text-slate-500 font-medium">{this.state.fileName}</span>
                    {!this.state.isSaved && <span className="text-xs text-amber-500 ml-1">●</span>}
                    <div className="flex-grow"></div>
                    <span className="text-xs text-slate-400 mr-2">{this.state.status}</span>
                </div>

                {/* Editor Area */}
                <textarea
                    className="flex-grow w-full resize-none outline-none p-4 font-mono text-sm leading-relaxed text-slate-800 selection:bg-orange-100"
                    placeholder="Start typing..."
                    value={this.state.text}
                    onChange={this.handleChange}
                    spellCheck="false"
                />

                {/* File Picker Modal */}
                {this.state.showFilePicker && (
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50" onClick={() => this.setState({ showFilePicker: false })}>
                        <div className="bg-white rounded-lg shadow-xl w-80 max-h-96 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-3 border-b border-slate-200 font-bold bg-slate-50 text-sm flex justify-between items-center">
                                <span>Open File</span>
                                <button onClick={() => this.setState({ showFilePicker: false })} className="hover:text-red-500">✕</button>
                            </div>
                            <div className="overflow-y-auto p-2 flex-grow">
                                {this.state.fileList.length === 0 ? (
                                    <p className="text-center text-slate-400 text-xs py-4">No text files found in Alphery OS folder.</p>
                                ) : (
                                    this.state.fileList.map((file, i) => (
                                        <button
                                            key={i}
                                            onClick={() => this.loadFile(file)}
                                            className="w-full text-left p-2 hover:bg-blue-50 text-sm rounded flex items-center gap-2 transition"
                                        >
                                            📄 {file.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }
}

export const displayGedit = () => {
    return <Gedit />;
};

export default Gedit;
