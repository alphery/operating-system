import React, { Component } from 'react';
import { db, storage } from '../../config/firebase';
import { collection, query, where, or, and, orderBy, onSnapshot, addDoc, getDocs, serverTimestamp, updateDoc, doc, getDoc, deleteField } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import EmojiPicker from 'emoji-picker-react';

// Wrapper to use hooks in class component
function MessengerWithAuth(props) {
    const { user, userData } = useAuth();
    return <Messenger user={user} userData={userData} {...props} />;
}

class Messenger extends Component {
    constructor() {
        super();
        this.state = {
            currentUser: null,
            otherUsers: [],
            selectedUser: null,
            messages: [],
            messageText: '',
            searchQuery: '',
            loading: true,
            uploading: false,
            uploadProgress: 0,
            showAttachMenu: false,
            // Context menu state
            contextMenu: null, // { type: 'user' | 'message', x, y, item }
            hiddenUsers: [], // List of user IDs hidden by current user
            // NEW: Feature states
            showEmojiPicker: false,
            editingMessageId: null,
            editingMessageText: '',
        };
        this.unsubscribeMessages = null;
        this.fileInputRef = React.createRef();
    }

    componentDidMount() {
        // Load hidden users from localStorage
        if (this.props.user) {
            const hiddenUsersKey = `hidden_chats_${this.props.user.uid}`;
            const hiddenUsers = JSON.parse(localStorage.getItem(hiddenUsersKey) || '[]');
            this.setState({ hiddenUsers });
        }

        // Close context menu and emoji picker on any click
        document.addEventListener('click', () => {
            this.closeContextMenu();
            if (this.state.showEmojiPicker) {
                this.setState({ showEmojiPicker: false });
            }
        });

        if (this.props.user && this.props.userData) {
            this.initializeMessenger();
        }
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.user && this.props.user) {
            this.initializeMessenger();
        }
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.closeContextMenu);
        if (this.unsubscribeMessages) {
            this.unsubscribeMessages();
        }
    }

    initializeMessenger = async () => {
        const { user, userData } = this.props;

        if (!user || !userData) {
            console.log('No user logged in');
            return;
        }

        this.setState({
            currentUser: {
                uid: user.uid,
                email: user.email,
                displayName: userData.displayName || user.displayName,
                photoURL: userData.photoURL || user.photoURL
            }
        });

        await this.loadUsers();
    }

    loadUsers = async () => {
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);

            const users = snapshot.docs
                .map(doc => ({
                    uid: doc.id,
                    ...doc.data()
                }))
                .filter(u => u.uid !== this.props.user.uid);

            this.setState({
                otherUsers: users,
                loading: false
            });

            if (users.length > 0 && !this.state.selectedUser) {
                this.selectUser(users[0]);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.setState({ loading: false });
        }
    }

    selectUser = (user) => {
        this.setState({ selectedUser: user, messages: [] });
        this.loadMessagesForUser(user);
    }

    loadMessagesForUser = (selectedUser) => {
        if (this.unsubscribeMessages) {
            this.unsubscribeMessages();
        }

        if (!this.state.currentUser || !selectedUser) return;

        const currentUid = this.state.currentUser.uid;
        const selectedUid = selectedUser.uid;

        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            or(
                and(
                    where('from', '==', currentUid),
                    where('to', '==', selectedUid)
                ),
                and(
                    where('from', '==', selectedUid),
                    where('to', '==', currentUid)
                )
            ),
            orderBy('timestamp', 'asc')
        );

        this.unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.setState({ messages }, this.scrollToBottom);
        }, (error) => {
            console.error('Error loading messages:', error);
        });
    }

    handleSend = async (e) => {
        e.preventDefault();
        const { messageText, currentUser, selectedUser } = this.state;

        if (!messageText.trim() || !selectedUser || !currentUser) return;

        try {
            await addDoc(collection(db, 'messages'), {
                from: currentUser.uid,
                to: selectedUser.uid,
                text: messageText.trim(),
                type: 'text',
                timestamp: serverTimestamp(),
                fromName: currentUser.displayName,
                toName: selectedUser.displayName
            });

            this.setState({ messageText: '' });
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    }

    handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const { currentUser, selectedUser } = this.state;
        if (!selectedUser || !currentUser) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File too large! Maximum size is 10MB.');
            return;
        }

        this.uploadFile(file);
    }

    uploadFile = async (file) => {
        const { currentUser, selectedUser } = this.state;

        try {
            this.setState({ uploading: true, uploadProgress: 0 });

            // Create unique filename
            const timestamp = Date.now();
            const filename = `messages/${currentUser.uid}/${timestamp}_${file.name}`;
            const storageRef = ref(storage, filename);

            // Upload file
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    this.setState({ uploadProgress: Math.round(progress) });
                },
                (error) => {
                    console.error('Upload error:', error);
                    alert('Failed to upload file');
                    this.setState({ uploading: false, uploadProgress: 0 });
                },
                async () => {
                    // Upload complete
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    // Determine file type
                    const fileType = this.getFileType(file);

                    // Save message with file
                    await addDoc(collection(db, 'messages'), {
                        from: currentUser.uid,
                        to: selectedUser.uid,
                        type: fileType,
                        fileURL: downloadURL,
                        fileName: file.name,
                        fileSize: file.size,
                        mimeType: file.type,
                        timestamp: serverTimestamp(),
                        fromName: currentUser.displayName,
                        toName: selectedUser.displayName
                    });

                    this.setState({ uploading: false, uploadProgress: 0, showAttachMenu: false });
                    this.fileInputRef.current.value = '';
                }
            );
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
            this.setState({ uploading: false, uploadProgress: 0 });
        }
    }

    getFileType = (file) => {
        const type = file.type.toLowerCase();
        const name = file.name.toLowerCase();

        if (type.startsWith('image/')) return 'image';
        if (type.startsWith('video/')) return 'video';
        if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
        if (type.includes('document') || type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return 'document';
        if (type.includes('spreadsheet') || type.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'spreadsheet';
        if (type.includes('zip') || type.includes('rar') || name.endsWith('.zip') || name.endsWith('.rar')) return 'archive';
        return 'file';
    }

    formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    getFileIcon = (type) => {
        const icons = {
            pdf: '📄',
            document: '📝',
            spreadsheet: '📊',
            archive: '🗜️',
            file: '📎'
        };
        return icons[type] || '📎';
    }

    scrollToBottom = () => {
        setTimeout(() => {
            const chatBox = document.getElementById('chat-history-box');
            if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        }, 50);
    }

    // ============ EMOJI PICKER ============
    addEmoji = (emojiObject) => {
        this.setState({
            messageText: this.state.messageText + emojiObject.emoji,
            showEmojiPicker: false
        });
    }

    // ============ MESSAGE REACTIONS ============
    addReaction = async (messageId, emoji) => {
        if (!this.state.currentUser) return;

        try {
            const messageRef = doc(db, 'messages', messageId);
            const messageDoc = await getDoc(messageRef);

            if (!messageDoc.exists()) return;

            const currentReactions = messageDoc.data().reactions || {};
            const emojiReactions = currentReactions[emoji] || [];
            const userId = this.state.currentUser.uid;

            const newReactions = emojiReactions.includes(userId)
                ? emojiReactions.filter(id => id !== userId)
                : [...emojiReactions, userId];

            if (newReactions.length > 0) {
                await updateDoc(messageRef, { [`reactions.${emoji}`]: newReactions });
            } else {
                await updateDoc(messageRef, { [`reactions.${emoji}`]: deleteField() });
            }
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    }

    // ============ MESSAGE EDITING ============
    startEditMessage = (message) => {
        this.setState({
            editingMessageId: message.id,
            editingMessageText: message.text
        });
    }

    saveEditMessage = async () => {
        const { editingMessageId, editingMessageText } = this.state;
        if (!editingMessageText.trim()) return;

        try {
            const messageRef = doc(db, 'messages', editingMessageId);
            await updateDoc(messageRef, {
                text: editingMessageText.trim(),
                edited: true,
                editedAt: serverTimestamp()
            });

            this.setState({ editingMessageId: null, editingMessageText: '' });
        } catch (error) {
            console.error('Error editing message:', error);
        }
    }

    cancelEdit = () => {
        this.setState({ editingMessageId: null, editingMessageText: '' });
    }


    closeContextMenu = () => {
        if (this.state.contextMenu) {
            this.setState({ contextMenu: null });
        }
    }

    handleUserContextMenu = (e, user) => {
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            contextMenu: {
                type: 'user',
                x: e.clientX,
                y: e.clientY,
                item: user
            }
        });
    }

    handleMessageContextMenu = (e, message) => {
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            contextMenu: {
                type: 'message',
                x: e.clientX,
                y: e.clientY,
                item: message
            }
        });
    }

    hideUser = (user) => {
        const hiddenUsersKey = `hidden_chats_${this.props.user?.uid || 'guest'}`;
        const hiddenUsers = [...this.state.hiddenUsers, user.uid];

        localStorage.setItem(hiddenUsersKey, JSON.stringify(hiddenUsers));
        this.setState({
            hiddenUsers,
            contextMenu: null,
            selectedUser: this.state.selectedUser?.uid === user.uid ? null : this.state.selectedUser
        });
    }

    unhideUser = (userId) => {
        const hiddenUsersKey = `hidden_chats_${this.props.user?.uid || 'guest'}`;
        const hiddenUsers = this.state.hiddenUsers.filter(id => id !== userId);

        localStorage.setItem(hiddenUsersKey, JSON.stringify(hiddenUsers));
        this.setState({ hiddenUsers });
    }

    deleteUserChat = async (user) => {
        const isSuperAdmin = this.props.userData?.role === 'super_admin';

        if (!isSuperAdmin) {
            // Regular users just hide the chat
            this.hideUser(user);
            return;
        }

        // Super admin: Delete all messages between ANY users
        const confirmMsg = `🔒 SUPER ADMIN: Delete ALL messages with ${user.displayName || user.email}? This will remove them for EVERYONE and cannot be undone!`;

        if (!window.confirm(confirmMsg)) return;

        try {
            const currentUid = this.state.currentUser.uid;
            const targetUid = user.uid;

            // Query all messages between these users
            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef,
                or(
                    and(
                        where('from', '==', currentUid),
                        where('to', '==', targetUid)
                    ),
                    and(
                        where('from', '==', targetUid),
                        where('to', '==', currentUid)
                    )
                )
            );

            const snapshot = await getDocs(q);

            // Delete each message
            const { deleteDoc, doc } = await import('firebase/firestore');
            const deletePromises = snapshot.docs.map(msgDoc =>
                deleteDoc(doc(db, 'messages', msgDoc.id))
            );
            await Promise.all(deletePromises);

            alert(`Deleted ${snapshot.docs.length} messages successfully!`);

            this.setState({
                contextMenu: null,
                selectedUser: this.state.selectedUser?.uid === user.uid ? null : this.state.selectedUser
            });
        } catch (error) {
            console.error('Error deleting messages:', error);
            alert('Failed to delete messages. Please try again.');
        }
    }

    deleteMessage = async (message) => {
        const isSuperAdmin = this.props.userData?.role === 'super_admin';
        const isMyMessage = message.from === this.state.currentUser?.uid;

        if (!isSuperAdmin && !isMyMessage) {
            alert('You can only delete your own messages!');
            return;
        }

        const confirmMsg = isSuperAdmin
            ? '🔒 SUPER ADMIN: Delete this message for EVERYONE?'
            : 'Delete this message for everyone?';

        if (!window.confirm(confirmMsg)) return;

        try {
            const { deleteDoc, doc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'messages', message.id));

            this.setState({ contextMenu: null });
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete message. Please try again.');
        }
    }

    renderMessage = (msg) => {
        const { currentUser } = this.state;
        const isMe = msg.from === currentUser.uid;

        if (msg.type === 'image') {
            return (
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
                    <div className={`max-w-xs md:max-w-md rounded-2xl overflow-hidden shadow-sm
                        ${isMe ? 'bg-teal-600 rounded-br-none' : 'bg-white rounded-bl-none'}`}>
                        <img
                            src={msg.fileURL}
                            alt={msg.fileName}
                            className="w-full h-auto cursor-pointer"
                            onClick={() => window.open(msg.fileURL, '_blank')}
                        />
                        <div className={`px-3 py-1 text-xs ${isMe ? 'text-teal-200' : 'text-gray-400'}`}>
                            {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                        </div>
                    </div>
                </div>
            );
        }

        if (msg.type === 'video') {
            return (
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
                    <div className={`max-w-xs md:max-w-md rounded-2xl overflow-hidden shadow-sm
                        ${isMe ? 'bg-teal-600 rounded-br-none' : 'bg-white rounded-bl-none'}`}>
                        <video controls className="w-full h-auto">
                            <source src={msg.fileURL} type={msg.mimeType} />
                        </video>
                        <div className={`px-3 py-1 text-xs ${isMe ? 'text-teal-200' : 'text-gray-400'}`}>
                            {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                        </div>
                    </div>
                </div>
            );
        }

        if (['pdf', 'document', 'spreadsheet', 'archive', 'file'].includes(msg.type)) {
            return (
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
                    <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-sm cursor-pointer
                        ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}
                        onClick={() => window.open(msg.fileURL, '_blank')}>
                        <div className="flex items-center gap-3">
                            <div className="text-4xl">{this.getFileIcon(msg.type)}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{msg.fileName}</p>
                                <p className={`text-xs ${isMe ? 'text-teal-200' : 'text-gray-500'}`}>
                                    {this.formatFileSize(msg.fileSize)}
                                </p>
                            </div>
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                        <p className={`text-[10px] mt-2 text-right ${isMe ? 'text-teal-200' : 'text-gray-400'}`}>
                            {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                        </p>
                    </div>
                </div>
            );
        }

        // Text message
        const { editingMessageId, editingMessageText } = this.state;
        const isEditing = editingMessageId === msg.id;

        return (
            <div key={msg.id} className="relative group mb-3">
                {/* Reaction Picker (shows on hover) */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:flex bg-white rounded-full shadow-xl border border-gray-300 p-2 gap-1 z-10">
                    {['❤️', '👍', '😂', '😮', '😢', '🔥'].map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => this.addReaction(msg.id, emoji)}
                            className="w-8 h-8 hover:bg-gray-100 rounded-full flex items-center justify-center text-lg transition"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>

                {/* Message Content */}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                        className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow-sm text-sm ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'
                            }`}
                        onContextMenu={(e) => this.handleMessageContextMenu(e, msg)}
                    >
                        {/* Editing Mode */}
                        {isEditing ? (
                            <div className="flex gap-2">
                                <input
                                    value={editingMessageText}
                                    onChange={(e) => this.setState({ editingMessageText: e.target.value })}
                                    className="flex-1 px-2 py-1 border rounded text-gray-800"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') this.saveEditMessage();
                                        if (e.key === 'Escape') this.cancelEdit();
                                    }}
                                />
                                <button onClick={this.saveEditMessage} className="text-green-600 hover:text-green-700">✓</button>
                                <button onClick={this.cancelEdit} className="text-red-600 hover:text-red-700">✕</button>
                            </div>
                        ) : (
                            <>
                                <p>{msg.text}</p>
                                {msg.edited && (
                                    <span className={`text-[10px] ml-2 ${isMe ? 'text-teal-200' : 'text-gray-400'}`}>
                                        (edited)
                                    </span>
                                )}
                            </>
                        )}

                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-teal-200' : 'text-gray-400'}`}>
                            {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                        </p>

                        {/* Edit Button (for own messages) */}
                        {!isEditing && isMe && (
                            <button
                                onClick={() => this.startEditMessage(msg)}
                                className="absolute top-0 right-0 hidden group-hover:block p-1 hover:bg-teal-700 rounded text-xs"
                                title="Edit message"
                            >
                                ✏️
                            </button>
                        )}
                    </div>
                </div>

                {/* Reactions Display */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                            <button
                                key={emoji}
                                onClick={() => this.addReaction(msg.id, emoji)}
                                className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition ${users.includes(currentUser.uid)
                                    ? 'bg-blue-100 border-2 border-blue-400'
                                    : 'bg-gray-100 border border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <span>{emoji}</span>
                                <span className="text-gray-600 font-medium">{users.length}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    render() {
        const { otherUsers, selectedUser, messages, messageText, currentUser, loading, uploading, uploadProgress, showAttachMenu } = this.state;

        if (!this.props.user) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Login Required</h3>
                        <p className="text-sm text-gray-500">Please sign in to use Messenger</p>
                    </div>
                </div>
            );
        }

        if (loading) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading users...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full h-full flex bg-white overflow-hidden text-sm">
                {/* Sidebar */}
                <div className="w-1/3 md:w-1/4 bg-gray-50 border-r border-gray-200 flex flex-col">
                    <div className="flex flex-col border-b border-gray-200 bg-white shadow-sm z-10">
                        <div className="h-16 flex items-center px-4 font-bold text-lg text-teal-600 gap-2">
                            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path></svg>
                            </div>
                            Messenger
                        </div>
                        <div className="px-4 pb-3">
                            <input
                                className="w-full bg-gray-100 border border-transparent focus:bg-white focus:border-teal-500 rounded-md px-3 py-1.5 text-xs outline-none transition"
                                placeholder="Search users..."
                                value={this.state.searchQuery || ''}
                                onChange={(e) => this.setState({ searchQuery: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {otherUsers.filter(u =>
                            !this.state.hiddenUsers.includes(u.uid) && (
                                !this.state.searchQuery ||
                                (u.displayName && u.displayName.toLowerCase().includes(this.state.searchQuery.toLowerCase())) ||
                                (u.email && u.email.toLowerCase().includes(this.state.searchQuery.toLowerCase()))
                            )
                        ).map(user => (
                            <div key={user.uid}
                                onClick={() => this.selectUser(user)}
                                onContextMenu={(e) => this.handleUserContextMenu(e, user)}
                                className={`flex items-center px-4 py-3 cursor-pointer transition border-b border-gray-100 group
                                ${selectedUser && selectedUser.uid === user.uid ? 'bg-teal-50 border-teal-200' : 'hover:bg-gray-100'}`}>
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-bold">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div className="ml-3 overflow-hidden">
                                    <p className="font-semibold text-gray-800 truncate">{user.displayName || 'Anonymous'}</p>
                                    <div className="text-[10px] text-gray-400 truncate">
                                        <span>{user.email}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {otherUsers.length === 0 && (
                            <div className="p-4 text-center text-gray-400 text-xs">
                                <p>No other users yet.</p>
                                <p className="mt-2">Create another account to test messaging!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-slate-50 relative">
                    {selectedUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 overflow-hidden flex items-center justify-center text-white font-bold text-sm">
                                        {selectedUser.photoURL ? (
                                            <img src={selectedUser.photoURL} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{(selectedUser.displayName || selectedUser.email || 'U')[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{selectedUser.displayName || 'Anonymous'}</h3>
                                        <div className="flex items-center text-xs text-green-500">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span> Online
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div id="chat-history-box" className="flex-1 overflow-y-auto p-6">
                                {messages.map((msg) => this.renderMessage(msg))}
                                {messages.length === 0 && (
                                    <div className="flex justify-center mt-20">
                                        <div className="text-center text-gray-400">
                                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                            </div>
                                            <p className="font-medium text-gray-600">Start the conversation!</p>
                                            <p className="text-xs mt-1">Send a message or share a file</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Upload Progress */}
                            {uploading && (
                                <div className="px-6 pb-2">
                                    <div className="bg-white rounded-lg shadow p-3">
                                        <div className="flex items-center gap-3 mb-2">
                                            <svg className="w-5 h-5 text-teal-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                            </svg>
                                            <span className="text-sm text-gray-700">Uploading... {uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div className="bg-teal-600 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Input */}
                            <div className="p-4 bg-white border-t border-gray-200">
                                <form onSubmit={this.handleSend} className="flex gap-2">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => this.setState({ showAttachMenu: !showAttachMenu })}
                                            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                                            </svg>
                                        </button>
                                        {showAttachMenu && (
                                            <div className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-48">
                                                <button
                                                    type="button"
                                                    onClick={() => this.fileInputRef.current.click()}
                                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg text-left transition"
                                                >
                                                    <span className="text-2xl">📎</span>
                                                    <span className="text-sm text-gray-700">Attach File</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={this.fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={this.handleFileSelect}
                                        accept="*/*"
                                    />

                                    {/* Emoji Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            this.setState({ showEmojiPicker: !this.state.showEmojiPicker });
                                        }}
                                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition text-xl"
                                    >
                                        😊
                                    </button>

                                    <input
                                        className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none transition"
                                        placeholder="Type a message..."
                                        value={messageText}
                                        onChange={(e) => this.setState({ messageText: e.target.value })}
                                        autoFocus
                                        disabled={uploading}
                                    />
                                    <button
                                        type="submit"
                                        className="w-10 h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-full flex items-center justify-center transition shadow-md disabled:opacity-50"
                                        disabled={!messageText.trim() || uploading}
                                    >
                                        <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                    </button>
                                </form>

                                {/* Emoji Picker */}
                                {this.state.showEmojiPicker && (
                                    <div className="absolute bottom-20 right-4 z-50" onClick={(e) => e.stopPropagation()}>
                                        <EmojiPicker
                                            onEmojiClick={this.addEmoji}
                                            width={320}
                                            height={400}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
                            </div>
                            <p className="text-lg font-medium">Select a user to start messaging</p>
                        </div>
                    )}
                </div>

                {/* Context Menu */}
                {this.state.contextMenu && (
                    <div
                        className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50 min-w-[200px]"
                        style={{
                            left: `${this.state.contextMenu.x}px`,
                            top: `${this.state.contextMenu.y}px`
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {this.state.contextMenu.type === 'user' && (
                            <>
                                <button
                                    onClick={() => this.hideUser(this.state.contextMenu.item)}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-sm text-gray-700 transition"
                                >
                                    <span>👁️‍🗨️</span>
                                    <span>Hide Chat</span>
                                </button>
                                <button
                                    onClick={() => this.deleteUserChat(this.state.contextMenu.item)}
                                    className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600 transition"
                                >
                                    <span>🗑️</span>
                                    <span>
                                        {this.props.userData?.role === 'super_admin'
                                            ? '🔒 Delete Chat (Admin)'
                                            : 'Delete Chat'}
                                    </span>
                                </button>
                            </>
                        )}

                        {this.state.contextMenu.type === 'message' && (
                            <button
                                onClick={() => this.deleteMessage(this.state.contextMenu.item)}
                                className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600 transition"
                            >
                                <span>🗑️</span>
                                <span>
                                    {this.props.userData?.role === 'super_admin'
                                        ? '🔒 Delete for Everyone'
                                        : 'Delete Message'}
                                </span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }
}

export const displayMessenger = () => {
    return <MessengerWithAuth />;
};
