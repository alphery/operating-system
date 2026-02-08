import React from 'react';
import { Editor } from '@tiptap/react';

interface ToolbarProps {
    editor: Editor | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
            {/* History */}
            <div className="flex gap-1 border-r border-gray-300 pr-2 mr-1">
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().chain().focus().undo().run()}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                    title="Undo"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().chain().focus().redo().run()}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                    title="Redo"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                </button>
            </div>

            {/* Text Style */}
            <select
                className="h-7 text-sm border-gray-300 rounded hover:border-blue-400 focus:ring-0 focus:border-blue-500 mr-2"
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'p') editor.chain().focus().setParagraph().run();
                    else if (val.startsWith('h')) editor.chain().focus().toggleHeading({ level: parseInt(val[1]) as any }).run();
                }}
            >
                <option value="p">Normal text</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
            </select>

            {/* Font Family (Mock) */}
            <select className="h-7 text-sm w-24 border-gray-300 rounded hover:border-blue-400 focus:ring-0 focus:border-blue-500 mr-2">
                <option>Arial</option>
                <option>Times New Roman</option>
                <option>Verdana</option>
            </select>

            {/* Font Size (Mock) */}
            <select className="h-7 text-sm w-16 border-gray-300 rounded hover:border-blue-400 focus:ring-0 focus:border-blue-500 mr-2 border-r border-gray-300 pr-2">
                <option>11</option>
                <option>12</option>
                <option>14</option>
                <option>18</option>
                <option>24</option>
            </select>

            {/* Basic Formatting */}
            <div className="flex gap-1 border-r border-gray-300 pr-2 mr-1">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1 rounded hover:bg-gray-200 font-bold ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : ''}`}
                    title="Bold"
                >
                    B
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1 rounded hover:bg-gray-200 italic ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : ''}`}
                    title="Italic"
                >
                    I
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-1 rounded hover:bg-gray-200 underline ${editor.isActive('underline') ? 'bg-blue-100 text-blue-600' : ''}`}
                    title="Underline"
                >
                    U
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-1 rounded hover:bg-gray-200 line-through ${editor.isActive('strike') ? 'bg-blue-100 text-blue-600' : ''}`}
                    title="Strikethrough"
                >
                    S
                </button>
            </div>

            {/* Alignment */}
            <div className="flex gap-1 border-r border-gray-300 pr-2 mr-1">
                <button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`p-1 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-600' : ''}`}
                    title="Align Left"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`p-1 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-600' : ''}`}
                    title="Align Center"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`p-1 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-600' : ''}`}
                    title="Align Right"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" /></svg>
                </button>
            </div>

            {/* Lists */}
            <div className="flex gap-1 border-r border-gray-300 pr-2 mr-1">
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : ''}`}
                    title="Bullet List"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : ''}`}
                    title="Ordered List"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h12M7 12h12M7 17h12M3 7h1M3 12h1M3 17h1" /></svg>
                </button>
            </div>

            {/* Insert */}
            <div className="flex gap-1">
                <button
                    onClick={setLink}
                    className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-blue-100 text-blue-600' : ''}`}
                    title="Insert Link"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                </button>
                <button
                    onClick={() => {
                        const url = window.prompt('Image URL');
                        if (url) editor.chain().focus().setImage({ src: url }).run();
                    }}
                    className="p-1 rounded hover:bg-gray-200"
                    title="Insert Image"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
            </div>
        </div>
    );
};

export default Toolbar;
