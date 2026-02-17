import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import Toolbar from './Toolbar'; // We'll create this next
import { v4 as uuidv4 } from 'uuid';

const AlpheryDocs = () => {
    const [docId, setDocId] = useState<string>('default-doc');
    const [provider, setProvider] = useState<WebsocketProvider | null>(null);
    const [status, setStatus] = useState('connecting');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Yjs document
    const ydoc = React.useMemo(() => new Y.Doc(), []);

    // Set up provider
    useEffect(() => {
        // Connect to local y-websocket server
        const wsProvider = new WebsocketProvider(
            'ws://localhost:1234',
            docId,
            ydoc
        );

        wsProvider.on('status', (event: any) => {
            setStatus(event.status);
        });

        setProvider(wsProvider);

        return () => {
            wsProvider.destroy();
        };
    }, [docId, ydoc]);

    // Set up Editor
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                history: false,
            } as any),
            Collaboration.configure({
                document: ydoc,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Underline,
            Image,
            Link.configure({
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder: 'Write something amazing...',
            }),
        ],
        content: '<p>Start typing...</p>',
    }, [provider]); // Re-create editor if provider changes

    // Save to Backend
    const saveToBackend = async () => {
        if (!editor) return;
        setIsSaving(true);
        try {
            const content = editor.getJSON();
            const token = localStorage.getItem('token'); // Assuming auth token is here

            // In a real app, we would use the actual document ID from the URL or props
            // For now, we'll try to update 'default-doc' or create it if not exists.
            // Since we don't have a reliable ID strategy yet without routing, we'll skip the actual API call 
            // until we integrate with File Manager.

            // Mock Save for visual feedback
            await new Promise(resolve => setTimeout(resolve, 800));
            setLastSaved(new Date());

            // Actual API call would look like:
            // await axios.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/${docId}`, {
            //   content: content
            // }, { headers: { Authorization: `Bearer ${token}` } });

        } catch (error) {
            console.error('Failed to save', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-save every 30s
    useEffect(() => {
        const interval = setInterval(() => {
            if (status === 'connected') {
                saveToBackend();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [editor, status]);

    return (
        <div className="flex flex-col h-full bg-white text-gray-800 font-sans">
            {/* Header / Menu Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-4">
                    <img src="./themes/Yaru/apps/gedit.png" alt="Docs" className="w-8 h-8" />
                    <div>
                        <input
                            type="text"
                            defaultValue="Untitled Document"
                            className="text-lg font-medium bg-transparent border-none focus:ring-0 p-0"
                        />
                        <div className="text-xs text-gray-500 flex space-x-2">
                            <span className="cursor-pointer hover:text-blue-600">File</span>
                            <span className="cursor-pointer hover:text-blue-600">Edit</span>
                            <span className="cursor-pointer hover:text-blue-600">View</span>
                            <span className="cursor-pointer hover:text-blue-600">Insert</span>
                            <span className="cursor-pointer hover:text-blue-600">Format</span>
                            <span className="cursor-pointer hover:text-blue-600">Tools</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className={`text-xs px-2 py-1 rounded transition-colors ${status === 'connected'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {status === 'connected' ? 'Connected' : 'Connecting...'}
                    </div>

                    {lastSaved && (
                        <div className="text-xs text-gray-400 hidden md:block">
                            Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}

                    <button
                        onClick={saveToBackend}
                        disabled={isSaving}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
                    >
                        {isSaving ? (
                            <span>Saving...</span>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                <span>Save</span>
                            </>
                        )}
                    </button>
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                        A
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="border-b border-gray-200 bg-white p-1 sticky top-0 z-10">
                <Toolbar editor={editor} />
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center">
                <div className="w-full max-w-[816px] min-h-[1056px] bg-white shadow-lg p-[96px] cursor-text focus:outline-none ring-1 ring-gray-200" onClick={() => editor?.commands.focus()}>
                    <EditorContent editor={editor} className="prose max-w-none focus:outline-none min-h-[500px]" />
                </div>
            </div>
        </div>
    );
};

export default AlpheryDocs;
