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
            status: 'Ready',
            wordWrap: true,
            font: 'Consolas',
            fontSize: 14,
            showFind: false,
            findText: '',
            replaceText: '',
            showGoTo: false,
            gotoLine: '',
            zoom: 100
        };
        this.rootHandle = null;
        this.currentFileHandle = null;
        this.textareaRef = React.createRef();
    }

    async componentDidMount() {
        try {
            this.rootHandle = await navigator.storage.getDirectory();
            await this.rootHandle.getDirectoryHandle('Alphery OS', { create: true });
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
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            this.setState({ showFind: true });
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
            e.preventDefault();
            this.setState({ showGoTo: true });
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            this.selectAll();
        }
        if (e.ctrlKey && e.key === '+') {
            e.preventDefault();
            this.zoomIn();
        }
        if (e.ctrlKey && e.key === '-') {
            e.preventDefault();
            this.zoomOut();
        }
        if (e.ctrlKey && e.key === '0') {
            e.preventDefault();
            this.setState({ zoom: 100 });
        }
    }

    handleChange = (e) => {
        this.setState({ text: e.target.value, isSaved: false, status: 'Modified' });
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

    openLocalFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md,.js,.css,.json,.html';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const text = await file.text();
                this.setState({
                    text,
                    fileName: file.name,
                    isSaved: true,
                    status: 'Opened from disk'
                });
                this.currentFileHandle = null;
            }
        };
        input.click();
    }

    saveFile = async () => {
        if (!this.rootHandle) return;

        try {
            this.setState({ status: 'Saving...' });
            const osFolder = await this.rootHandle.getDirectoryHandle('Alphery OS', { create: true });

            let fileHandle = this.currentFileHandle;
            if (!fileHandle) {
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

    saveAs = async () => {
        if (!this.rootHandle) return;

        try {
            this.setState({ status: 'Saving...' });
            const osFolder = await this.rootHandle.getDirectoryHandle('Alphery OS', { create: true });

            let name = prompt("Enter file name:", this.state.fileName);
            if (!name) {
                this.setState({ status: 'Save Cancelled' });
                return;
            }
            if (!name.includes('.')) name += '.txt';

            const fileHandle = await osFolder.getFileHandle(name, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(this.state.text);
            await writable.close();

            this.currentFileHandle = fileHandle;
            this.setState({ fileName: name, isSaved: true, status: 'Saved As ' + name });
            setTimeout(() => this.setState({ status: 'Ready' }), 2000);
        } catch (e) {
            console.error(e);
            this.setState({ status: 'Error saving' });
        }
    }

    downloadFile = () => {
        const blob = new Blob([this.state.text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.state.fileName;
        a.click();
        URL.revokeObjectURL(url);
        this.setState({ status: 'Downloaded' });
    }

    print = () => {
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`<pre style="font-family: monospace; white-space: pre-wrap;">${this.state.text}</pre>`);
        printWindow.document.close();
        printWindow.print();
    }

    selectAll = () => {
        if (this.textareaRef.current) {
            this.textareaRef.current.select();
        }
    }

    findNext = () => {
        const { text, findText } = this.state;
        if (!findText) return;

        const textarea = this.textareaRef.current;
        const startPos = textarea.selectionEnd;
        const foundIndex = text.indexOf(findText, startPos);

        if (foundIndex !== -1) {
            textarea.setSelectionRange(foundIndex, foundIndex + findText.length);
            textarea.focus();
        } else {
            const fromStart = text.indexOf(findText);
            if (fromStart !== -1) {
                textarea.setSelectionRange(fromStart, fromStart + findText.length);
                textarea.focus();
            }
        }
    }

    replaceNext = () => {
        const { text, findText, replaceText } = this.state;
        if (!findText) return;

        const textarea = this.textareaRef.current;
        const selectedText = text.substring(textarea.selectionStart, textarea.selectionEnd);

        if (selectedText === findText) {
            const before = text.substring(0, textarea.selectionStart);
            const after = text.substring(textarea.selectionEnd);
            this.setState({ text: before + replaceText + after, isSaved: false });
        }
        this.findNext();
    }

    replaceAll = () => {
        const { text, findText, replaceText } = this.state;
        if (!findText) return;

        const newText = text.split(findText).join(replaceText);
        this.setState({ text: newText, isSaved: false, status: 'Replaced all occurrences' });
    }

    goToLine = () => {
        const { gotoLine, text } = this.state;
        const lineNumber = parseInt(gotoLine);
        if (!lineNumber || lineNumber < 1) return;

        const lines = text.split('\n');
        if (lineNumber > lines.length) return;

        let position = 0;
        for (let i = 0; i < lineNumber - 1; i++) {
            position += lines[i].length + 1;
        }

        const textarea = this.textareaRef.current;
        textarea.setSelectionRange(position, position + lines[lineNumber - 1].length);
        textarea.focus();
        this.setState({ showGoTo: false, gotoLine: '' });
    }

    getWordCount = () => {
        const words = this.state.text.trim().split(/\s+/).filter(w => w.length > 0);
        return words.length;
    }

    getLineCount = () => {
        return this.state.text.split('\n').length;
    }

    getCharCount = () => {
        return this.state.text.length;
    }

    zoomIn = () => {
        this.setState(prev => ({ zoom: Math.min(prev.zoom + 10, 200) }));
    }

    zoomOut = () => {
        this.setState(prev => ({ zoom: Math.max(prev.zoom - 10, 50) }));
    }

    render() {
        const { text, fileName, isSaved, showFilePicker, fileList, status, wordWrap, fontSize, showFind, findText, replaceText, showGoTo, gotoLine, zoom } = this.state;

        return (
            <div className="w-full h-full flex flex-col bg-white text-slate-800 font-sans overflow-hidden">
                {/* Menu Bar */}
                <div className="h-8 bg-slate-50 border-b border-slate-200 flex items-center px-2 gap-1 select-none text-xs">
                    {/* File Menu */}
                    <div className="relative group">
                        <button className="px-3 py-1 hover:bg-slate-200 rounded font-medium">File</button>
                        <div className="hidden group-hover:block absolute top-full left-0 bg-white border border-slate-200 shadow-lg rounded-lg mt-1 min-w-48 z-50">
                            <button onClick={this.newFile} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>New</span>
                                <span className="text-slate-400">Ctrl+N</span>
                            </button>
                            <button onClick={this.openFileList} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>Open</span>
                                <span className="text-slate-400">Ctrl+O</span>
                            </button>
                            <button onClick={this.openLocalFile} className="w-full text-left px-4 py-2 hover:bg-blue-50">Open Local File</button>
                            <div className="border-t border-slate-200 my-1"></div>
                            <button onClick={this.saveFile} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>Save</span>
                                <span className="text-slate-400">Ctrl+S</span>
                            </button>
                            <button onClick={this.saveAs} className="w-full text-left px-4 py-2 hover:bg-blue-50">Save As...</button>
                            <button onClick={this.downloadFile} className="w-full text-left px-4 py-2 hover:bg-blue-50">Download</button>
                            <div className="border-t border-slate-200 my-1"></div>
                            <button onClick={this.print} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>Print</span>
                                <span className="text-slate-400">Ctrl+P</span>
                            </button>
                            <div className="border-t border-slate-200 my-1"></div>
                            <button onClick={() => window.close()} className="w-full text-left px-4 py-2 hover:bg-blue-50">Exit</button>
                        </div>
                    </div>

                    {/* Edit Menu */}
                    <div className="relative group">
                        <button className="px-3 py-1 hover:bg-slate-200 rounded font-medium">Edit</button>
                        <div className="hidden group-hover:block absolute top-full left-0 bg-white border border-slate-200 shadow-lg rounded-lg mt-1 min-w-48 z-50">
                            <button onClick={() => document.execCommand('undo')} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>Undo</span>
                                <span className="text-slate-400">Ctrl+Z</span>
                            </button>
                            <div className="border-t border-slate-200 my-1"></div>
                            <button onClick={() => document.execCommand('cut')} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>Cut</span>
                                <span className="text-slate-400">Ctrl+X</span>
                            </button>
                            <button onClick={() => document.execCommand('copy')} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>Copy</span>
                                <span className="text-slate-400">Ctrl+C</span>
                            </button>
                            <button onClick={() => document.execCommand('paste')} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>Paste</span>
                                <span className="text-slate-400">Ctrl+V</span>
                            </button>
                            <button onClick={() => this.setState({ text: '' })} className="w-full text-left px-4 py-2 hover:bg-blue-50">Delete</button>
                            <div className="border-t border-slate-200 my-1"></div>
                            <button onClick={() => this.setState({ showFind: true })} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>Find</span>
                                <span className="text-slate-400">Ctrl+F</span>
                            </button>
                            <button onClick={this.findNext} className="w-full text-left px-4 py-2 hover:bg-blue-50">Find Next</button>
                            <button onClick={this.replaceNext} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>Replace</span>
                                <span className="text-slate-400">Ctrl+H</span>
                            </button>
                            <button onClick={() => this.setState({ showGoTo: true })} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>Go To</span>
                                <span className="text-slate-400">Ctrl+G</span>
                            </button>
                            <div className="border-t border-slate-200 my-1"></div>
                            <button onClick={this.selectAll} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>Select All</span>
                                <span className="text-slate-400">Ctrl+A</span>
                            </button>
                        </div>
                    </div>

                    {/* Format Menu */}
                    <div className="relative group">
                        <button className="px-3 py-1 hover:bg-slate-200 rounded font-medium">Format</button>
                        <div className="hidden group-hover:block absolute top-full left-0 bg-white border border-slate-200 shadow-lg rounded-lg mt-1 min-w-48 z-50">
                            <button onClick={() => this.setState({ wordWrap: !wordWrap })} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2">
                                <span>{wordWrap ? '✓' : '\u00A0\u00A0'}</span>
                                <span>Word Wrap</span>
                            </button>
                            <div className="border-t border-slate-200 my-1"></div>
                            <button onClick={() => this.setState({ fontSize: 12 })} className="w-full text-left px-4 py-2 hover:bg-blue-50">Font Size: Small</button>
                            <button onClick={() => this.setState({ fontSize: 14 })} className="w-full text-left px-4 py-2 hover:bg-blue-50">Font Size: Medium</button>
                            <button onClick={() => this.setState({ fontSize: 16 })} className="w-full text-left px-4 py-2 hover:bg-blue-50">Font Size: Large</button>
                        </div>
                    </div>

                    {/* View Menu */}
                    <div className="relative group">
                        <button className="px-3 py-1 hover:bg-slate-200 rounded font-medium">View</button>
                        <div className="hidden group-hover:block absolute top-full left-0 bg-white border border-slate-200 shadow-lg rounded-lg mt-1 min-w-48 z-50">
                            <button onClick={this.zoomIn} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>Zoom In</span>
                                <span className="text-slate-400">Ctrl++</span>
                            </button>
                            <button onClick={this.zoomOut} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>Zoom Out</span>
                                <span className="text-slate-400">Ctrl+-</span>
                            </button>
                            <button onClick={() => this.setState({ zoom: 100 })} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between">
                                <span>Reset Zoom</span>
                                <span className="text-slate-400">Ctrl+0</span>
                            </button>
                            <div className="border-t border-slate-200 my-1"></div>
                            <div className="px-4 py-2 text-slate-600">Zoom: {zoom}%</div>
                        </div>
                    </div>

                    {/* Help Menu */}
                    <div className="relative group">
                        <button className="px-3 py-1 hover:bg-slate-200 rounded font-medium">Help</button>
                        <div className="hidden group-hover:block absolute top-full left-0 bg-white border border-slate-200 shadow-lg rounded-lg mt-1 min-w-48 z-50">
                            <button onClick={() => alert('Text Editor v1.0\nAlphery OS')} className="w-full text-left px-4 py-2 hover:bg-blue-50">About Text Editor</button>
                        </div>
                    </div>

                    <div className="flex-grow"></div>
                    <span className="text-slate-500">{fileName}</span>
                    {!isSaved && <span className="text-amber-500 ml-1">●</span>}
                </div>

                {/* Status Bar */}
                <div className="h-7 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-4 select-none text-xs text-slate-600">
                    <span>{status}</span>
                    <div className="border-l border-slate-300 h-4"></div>
                    <span>Lines: {this.getLineCount()}</span>
                    <span>Words: {this.getWordCount()}</span>
                    <span>Characters: {this.getCharCount()}</span>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-hidden relative">
                    <textarea
                        ref={this.textareaRef}
                        className="w-full h-full resize-none outline-none p-4 font-mono leading-relaxed text-slate-800 selection:bg-blue-200"
                        placeholder="Start typing..."
                        value={text}
                        onChange={this.handleChange}
                        spellCheck="false"
                        style={{
                            fontSize: `${fontSize}px`,
                            whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'top left',
                            width: `${100 / (zoom / 100)}%`,
                            height: `${100 / (zoom / 100)}%`
                        }}
                    />
                </div>

                {/* Find Dialog */}
                {showFind && (
                    <div className="absolute top-16 right-4 bg-white border border-slate-300 shadow-xl rounded-lg p-4 w-96 z-50">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-sm">Find and Replace</h3>
                            <button onClick={() => this.setState({ showFind: false })} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <input
                            type="text"
                            placeholder="Find what..."
                            value={findText}
                            onChange={(e) => this.setState({ findText: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && this.findNext()}
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <input
                            type="text"
                            placeholder="Replace with..."
                            value={replaceText}
                            onChange={(e) => this.setState({ replaceText: e.target.value })}
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div className="flex gap-2">
                            <button onClick={this.findNext} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition">Find Next</button>
                            <button onClick={this.replaceNext} className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition">Replace</button>
                            <button onClick={this.replaceAll} className="flex-1 bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 transition">Replace All</button>
                        </div>
                    </div>
                )}

                {/* Go To Dialog */}
                {showGoTo && (
                    <div className="absolute top-16 right-4 bg-white border border-slate-300 shadow-xl rounded-lg p-4 w-72 z-50">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-sm">Go To Line</h3>
                            <button onClick={() => this.setState({ showGoTo: false, gotoLine: '' })} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <input
                            type="number"
                            placeholder="Line number..."
                            value={gotoLine}
                            onChange={(e) => this.setState({ gotoLine: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && this.goToLine()}
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            min="1"
                        />
                        <button onClick={this.goToLine} className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition">Go</button>
                    </div>
                )}

                {/* File Picker Modal */}
                {showFilePicker && (
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50" onClick={() => this.setState({ showFilePicker: false })}>
                        <div className="bg-white rounded-lg shadow-xl w-96 max-h-96 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-3 border-b border-slate-200 font-bold bg-slate-50 text-sm flex justify-between items-center">
                                <span>Open File</span>
                                <button onClick={() => this.setState({ showFilePicker: false })} className="hover:text-red-500">✕</button>
                            </div>
                            <div className="overflow-y-auto p-2 flex-grow">
                                {fileList.length === 0 ? (
                                    <p className="text-center text-slate-400 text-xs py-4">No text files found in Alphery OS folder.</p>
                                ) : (
                                    fileList.map((file, i) => (
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
