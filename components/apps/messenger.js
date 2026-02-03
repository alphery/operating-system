import React, { Component } from 'react';
import { db, storage } from '../../config/firebase';
import { collection, query, where, or, and, orderBy, onSnapshot, addDoc, getDocs, serverTimestamp, updateDoc, doc, getDoc, deleteField, setDoc, deleteDoc } from 'firebase/firestore';
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
            onlineUsers: new Set(), // Legacy support
            userStatuses: new Map(), // NEW: detailed status map

            // NEW: Typing & Reply & Search states
            otherUserTyping: false,
            typingTimeout: null,
            replyingTo: null,
            searchResults: [],
            isSearching: false,
            userStatus: 'online', // 'online', 'away', 'offline'

            // NEW: Conversations (privacy feature)
            conversations: [],
            showNewChatModal: false,
            searchEmail: '',
            searchEmail: '',
            searchedUsers: [],

            // Audio Recording
            isRecording: false,
            recordingDuration: 0,
            audioRecorder: null,
            audioChunks: [],

            // Group Chat
            showGroupModal: false,
            groupName: '',
            selectedGroupMembers: [],

            // New Features
            messageLimit: 20,
            chatTheme: 'bg-white', // 'bg-white', 'bg-blue-50', 'bg-gray-900', etc.
            showThemeModal: false,

            // Video Call
            callStatus: 'idle', // idle, calling, ringing, connected
            callDuration: 0,
            localStream: null,
            remoteStream: null,
            isVideoEnabled: true,
            isAudioEnabled: true
        };
        this.unsubscribeMessages = null;
        this.unsubscribePresence = null;
        this.unsubscribeTyping = null;
        this.unsubscribeConversations = null;

        // AI Bot Definition
        this.AI_BOT_ID = 'alphery_ai_assistant';
        this.AI_BOT_USER = {
            uid: this.AI_BOT_ID,
            displayName: 'Alphery AI 🤖',
            email: 'ai@alphery.os',
            photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=AlpheryAI',
            isBot: true
        };

        this.fileInputRef = React.createRef();
        this.searchInputRef = React.createRef();
        this.chatContainerRef = React.createRef(); // For scroll handling
        this.audioInterval = null;
        this.callInterval = null;
    }

    componentDidMount() {
        // Load hidden users from localStorage

        if (this.props.user) {
            const hiddenUsersKey = `hidden_chats_${this.props.user.uid}`;
            const hiddenUsers = JSON.parse(localStorage.getItem(hiddenUsersKey) || '[]');
            this.setState({ hiddenUsers });


            // Load conversations - NOW using Firestore Realtime
            this.subscribeToConversations();
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
            // Presence is now initialized in initializeMessenger


            // Mark as offline on page unload
            window.addEventListener('beforeunload', () => {
                this.updateMyPresence('offline');
            });
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
        if (this.unsubscribePresence) {
            this.unsubscribePresence();
        }
        if (this.unsubscribeConversations) {
            this.unsubscribeConversations();
        }
        // Mark as offline when leaving
        this.updateMyPresence('offline');
    }

    initializeMessenger = async () => {
        const { user, userData } = this.props;

        if (!user || !userData) {
            console.log('No user logged in');
            return;
        }

        const currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: userData.displayName || user.displayName,
            photoURL: userData.photoURL || user.photoURL
        };

        this.setState({
            currentUser: currentUser
        }, async () => {
            // Start online presence tracking immediately after user is set
            this.subscribeToPresence();
            await this.updateMyPresence('online');

            // Load users afterwards
            this.loadUsers();
        });
    }

    loadUsers = async () => {
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);



            // Request notification permission on mount
            this.requestNotificationPermission();

            // Listen for incoming calls
            this.subscribeToIncomingCalls();

            // Load hidden chats
            const hidden = JSON.parse(localStorage.getItem(`messenger_hidden_${this.props.user.uid}`) || '[]');
            this.setState({ hiddenUsers: hidden });

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

            // Removed auto-selection of user to prevent default chat loading
            // if (users.length > 0 && !this.state.selectedUser) {
            //     this.selectUser(users[0]);
            // }
        } catch (error) {
            console.error('Error loading users:', error);
            this.setState({ loading: false });
        }
    }

    selectUser = (user) => {
        // Unsubscribe from previous typing status
        if (this.unsubscribeTyping) {
            this.unsubscribeTyping();
        }

        this.setState({ selectedUser: user, messages: [], replyingTo: null });
        this.loadMessagesForUser(user);
        // Subscribe to new user's typing status
        setTimeout(() => this.subscribeToTypingStatus(), 0);
    }

    loadMessagesForUser = (selectedUser) => {
        if (this.unsubscribeMessages) {
            this.unsubscribeMessages();
        }

        if (!this.state.currentUser || !selectedUser) return;

        const currentUid = this.state.currentUser.uid;
        const selectedUid = selectedUser.uid;

        let chatId;
        if (selectedUser.isGroup) {
            chatId = selectedUser.uid;
        } else {
            chatId = [currentUid, selectedUid].sort().join('_');
        }

        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            where('chatId', '==', chatId),
            orderBy('timestamp', 'desc'),
            limit(this.state.messageLimit)
        );

        this.unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).reverse();

            // If we are scrolling up (loading more), maintain position
            const container = this.chatContainerRef.current;
            const previousHeight = container ? container.scrollHeight : 0;
            const previousScrollTop = container ? container.scrollTop : 0;

            this.setState({ messages, loading: false }, () => {
                // If it was a generic load (limit 20), scroll to bottom.
                // If we loaded MORE (limit > 20), restore position.
                if (this.state.messageLimit === 20) {
                    this.scrollToBottom();
                } else if (container) {
                    // Primitive scroll restoration
                    container.scrollTop = container.scrollHeight - previousHeight + previousScrollTop;
                }

                // Mark incoming messages as read
                setTimeout(() => this.markMessagesAsRead(), 500);

                // Check for notifications
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const msg = change.doc.data();
                        if (msg.from !== this.state.currentUser.uid) {
                            // Only notify if window hidden or not focused on this user? 
                            // Basic check:
                            this.sendNotification(`New message from ${msg.fromName}`, msg.text || (msg.type === 'image' ? 'Sent an image' : 'Sent a file'));

                            // Play sound?
                            const audio = new Audio('/sounds/message.mp3'); // Assuming file exists, or skip
                            // audio.play().catch(e => {}); // Silent fail
                        }
                    }
                });
            });
        }, (error) => {
            console.error('Error loading messages:', error);
        });
    }

    // ============ NOTIFICATIONS ============
    requestNotificationPermission = async () => {
        if (!("Notification" in window)) return;
        if (Notification.permission === "granted") return;
        await Notification.requestPermission();
    }

    sendNotification = (title, body) => {
        if (document.visibilityState === 'visible') return; // Don't notify if focused
        if (!("Notification" in window) || Notification.permission !== "granted") return;

        new Notification(title, {
            body: body,
            icon: '/favicon.ico' // Or app icon
        });
    }

    // ============ AUDIO RECORDING ============
    startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                this.uploadAudio(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            this.setState({
                isRecording: true,
                audioRecorder: mediaRecorder,
                audioChunks: chunks,
                recordingDuration: 0
            });

            this.audioInterval = setInterval(() => {
                this.setState(prev => ({ recordingDuration: prev.recordingDuration + 1 }));
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone');
        }
    }

    stopRecording = () => {
        if (this.state.audioRecorder && this.state.isRecording) {
            this.state.audioRecorder.stop();
            clearInterval(this.audioInterval);
            this.setState({ isRecording: false, recordingDuration: 0 });
        }
    }

    cancelRecording = () => {
        if (this.state.audioRecorder && this.state.isRecording) {
            // Stop but don't upload (hacky way, just clear event handler?)
            this.state.audioRecorder.onstop = null;
            this.state.audioRecorder.stop();
            this.state.audioRecorder.stream.getTracks().forEach(track => track.stop());
            clearInterval(this.audioInterval);
            this.setState({ isRecording: false, recordingDuration: 0 });
        }
    }

    uploadAudio = async (blob) => {
        const { currentUser, selectedUser } = this.state;
        if (!currentUser || !selectedUser) return;
        const _this = this;

        // Validation for small audio? 

        const filename = `audio/${currentUser.uid}/${Date.now()}.webm`;
        const storageRef = ref(storage, filename);

        try {
            // Note: skipping progress for audio as it's usually small
            const uploadTask = await uploadBytesResumable(storageRef, blob);
            const downloadURL = await getDownloadURL(uploadTask.ref);

            const chatId = this.getChatId(currentUser.uid, selectedUser.uid);

            await addDoc(collection(db, 'messages'), {
                from: currentUser.uid,
                to: selectedUser.uid, // might be group ID
                type: 'audio',
                fileURL: downloadURL,
                timestamp: serverTimestamp(), // Note: was getting error here? No.
                fromName: currentUser.displayName,
                chatId: chatId,
                duration: _this.state.recordingDuration
            });

            await this.updateConversationMetadata(selectedUser, '🎤 Voice Message', 'audio');

        } catch (error) {
            console.error('Audio upload error', error);
        }
    }

    formatDuration = (sec) => {
        const min = Math.floor(sec / 60);
        const s = sec % 60;
        return `${min}:${s < 10 ? '0' + s : s}`;
    }

    // ============ GROUPS ============
    createGroup = async () => {
        const { groupName, selectedGroupMembers, currentUser } = this.state;
        if (!groupName.trim() || selectedGroupMembers.length === 0) return;

        try {
            const groupRef = doc(collection(db, 'chats')); // Auto ID
            const participants = [currentUser.uid, ...selectedGroupMembers.map(u => u.uid)];

            // Build User Info map for all participants
            const userInfo = {
                [currentUser.uid]: {
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                    email: currentUser.email
                }
            };
            selectedGroupMembers.forEach(u => {
                userInfo[u.uid] = {
                    displayName: u.displayName,
                    photoURL: u.photoURL,
                    email: u.email
                };
            });

            await setDoc(groupRef, {
                isGroup: true,
                groupName: groupName,
                groupOwner: currentUser.uid,
                participants: participants,
                userInfo: userInfo,
                timestamp: serverTimestamp(),
                lastMessage: 'Group created'
            });

            this.setState({
                showGroupModal: false,
                groupName: '',
                selectedGroupMembers: [],
                showNewChatModal: false
            });

            // Select this new group
            // We need a pseudo "User" object to represent the group for 'selectUser' compatibility
            const groupObj = {
                uid: groupRef.id, // Important: For groups, uid IS the chat ID
                displayName: groupName,
                isGroup: true,
                photoURL: null, // Default group icon
                participants: participants
            };
            this.selectUser(groupObj);

        } catch (error) {
            console.error("Error creating group:", error);
            alert("Failed to create group");
        }
    }

    toggleGroupMember = (user) => {
        const { selectedGroupMembers } = this.state;
        if (selectedGroupMembers.find(u => u.uid === user.uid)) {
            this.setState({ selectedGroupMembers: selectedGroupMembers.filter(u => u.uid !== user.uid) });
        } else {
            this.setState({ selectedGroupMembers: [...selectedGroupMembers, user] });
        }
    }

    handleSend = async (e) => {
        e.preventDefault();
        const { messageText, currentUser, selectedUser, replyingTo } = this.state;

        if (!messageText.trim() || !selectedUser || !currentUser) return;

        try {
            // Stop typing indicator immediately
            this.updateTypingStatus(false);
            if (this.state.typingTimeout) clearTimeout(this.state.typingTimeout);

            const chatId = this.getChatId(currentUser.uid, selectedUser.uid);

            // Add message to subcollection or main collection (keeping main for now for simplicity in querying)
            await addDoc(collection(db, 'messages'), {
                from: currentUser.uid,
                to: selectedUser.uid,
                text: messageText.trim(),
                type: 'text',
                timestamp: serverTimestamp(),
                fromName: currentUser.displayName,
                toName: selectedUser.displayName,
                readBy: [currentUser.uid],
                replyTo: replyingTo ? replyingTo.id : null,
                replyToText: replyingTo ? replyingTo.text : null,
                replyToFrom: replyingTo ? (replyingTo.fromName || 'User') : null,
                chatId: chatId // Add chat ID reference
            });

            // Update Conversation Metadata
            await this.updateConversationMetadata(selectedUser, messageText.trim());

            // AI BOT LOGIC
            if (selectedUser.uid === this.AI_BOT_ID) {
                this.handleAIResponse(messageText.trim());
            }

            this.setState({ messageText: '', replyingTo: null });
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    }

    getChatId = (uid1, uid2) => {
        // Warning: This logic only works for 1-on-1. For groups, the selectedUser.uid IS the chat ID.
        if (this.state.selectedUser && this.state.selectedUser.isGroup) {
            return this.state.selectedUser.uid;
        }
        return [uid1, uid2].sort().join('_'); // Standard DM ID
    }

    updateConversationMetadata = async (otherUser, lastMessageText, type = 'text') => {
        if (!this.state.currentUser) return;

        let chatId, chatData;

        if (otherUser.isGroup) {
            chatId = otherUser.uid;
            const chatRef = doc(db, 'chats', chatId);
            chatData = {
                lastMessage: type === 'image' ? '📷 Image' : type === 'audio' ? '🎤 Voice' : type === 'file' ? '📎 File' : lastMessageText,
                timestamp: serverTimestamp(),
            }; // Can't update participants simply here, assumes static group for now
            await setDoc(chatRef, chatData, { merge: true });
        } else {
            chatId = this.getChatId(this.state.currentUser.uid, otherUser.uid);
            const chatRef = doc(db, 'chats', chatId);
            chatData = {
                participants: [this.state.currentUser.uid, otherUser.uid],
                lastMessage: type === 'image' ? '📷 Image' : type === 'audio' ? '🎤 Voice' : type === 'file' ? '📎 File' : lastMessageText,
                timestamp: serverTimestamp(),
                userInfo: {
                    [this.state.currentUser.uid]: {
                        displayName: this.state.currentUser.displayName,
                        photoURL: this.state.currentUser.photoURL,
                        email: this.state.currentUser.email
                    },
                    [otherUser.uid]: {
                        displayName: otherUser.displayName,
                        photoURL: otherUser.photoURL,
                        email: otherUser.email
                    }
                }
            };
            // setDoc with merge: true handles both create and update
            await setDoc(chatRef, chatData, { merge: true });
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
        const _this = this; // Capture 'this' for callback

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
                    const fileType = _this.getFileType(file);

                    // Save message with file
                    const chatId = _this.getChatId(currentUser.uid, selectedUser.uid);
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
                        toName: selectedUser.displayName,
                        chatId: chatId
                    });

                    // Update metadata
                    await _this.updateConversationMetadata(selectedUser, '', fileType);

                    _this.setState({ uploading: false, uploadProgress: 0, showAttachMenu: false });
                    _this.fileInputRef.current.value = '';
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
        if (!emojiObject || !emojiObject.emoji) return;

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

    // ============ ONLINE STATUS ============
    updateMyPresence = async (status) => {
        if (!this.state.currentUser || !db) return;

        try {
            const presenceRef = doc(db, 'user_presence', this.state.currentUser.uid);
            await setDoc(presenceRef, {
                status: status,
                lastSeen: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating presence:', error);
        }
    }

    changeUserStatus = async (status) => {
        this.setState({ userStatus: status });
        await this.updateMyPresence(status);
    }

    subscribeToPresence = () => {
        if (!db) return;

        // Unsubscribe from existing listener if present
        if (this.unsubscribePresence) {
            this.unsubscribePresence();
        }

        try {
            const presenceRef = collection(db, 'user_presence');
            this.unsubscribePresence = onSnapshot(presenceRef, (snapshot) => {
                const userStatuses = new Map();
                snapshot.docs.forEach(doc => {
                    userStatuses.set(doc.id, doc.data().status);
                });
                this.setState({ userStatuses });
            });
        } catch (error) {
            console.error('Error subscribing to presence:', error);
        }
    }

    // ============ READ RECEIPTS ============
    markAsRead = async (messageId) => {
        if (!this.state.currentUser) return;

        try {
            const messageRef = doc(db, 'messages', messageId);
            const messageDoc = await getDoc(messageRef);

            if (!messageDoc.exists()) return;

            const readBy = messageDoc.data().readBy || [];
            if (!readBy.includes(this.state.currentUser.uid)) {
                await updateDoc(messageRef, {
                    readBy: [...readBy, this.state.currentUser.uid],
                    readAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }

    markMessagesAsRead = () => {
        // Mark all visible messages as read
        this.state.messages.forEach(msg => {
            if (msg.from !== this.state.currentUser.uid) {
                this.markAsRead(msg.id);
            }
        });
    }

    // ============ TYPING INDICATORS ============
    updateTypingStatus = async (isTyping) => {
        if (!this.state.selectedUser || !this.state.currentUser) return;

        const typingDocId = `${this.state.currentUser.uid}_${this.state.selectedUser.uid}`;
        const typingRef = doc(db, 'typing_status', typingDocId);

        try {
            if (isTyping) {
                await setDoc(typingRef, {
                    userId: this.state.currentUser.uid,
                    chatWith: this.state.selectedUser.uid,
                    isTyping: true,
                    lastUpdate: serverTimestamp()
                });
            } else {
                await deleteDoc(typingRef);
            }
        } catch (error) {
            console.error('Error updating typing status:', error);
        }
    }

    handleTyping = (e) => {
        this.setState({ messageText: e.target.value });
        this.updateTypingStatus(true);

        if (this.state.typingTimeout) {
            clearTimeout(this.state.typingTimeout);
        }

        const timeout = setTimeout(() => {
            this.updateTypingStatus(false);
        }, 2000);

        this.setState({ typingTimeout: timeout });
    }

    subscribeToTypingStatus = () => {
        if (!this.state.selectedUser || !this.state.currentUser) return;

        const typingDocId = `${this.state.selectedUser.uid}_${this.state.currentUser.uid}`;
        const typingRef = doc(db, 'typing_status', typingDocId);

        this.unsubscribeTyping = onSnapshot(typingRef, (doc) => {
            this.setState({
                otherUserTyping: doc.exists() && doc.data().isTyping
            });
        });
    }

    // ============ MESSAGE REPLIES ============
    setReplyTo = (message) => {
        this.setState({ replyingTo: message });
        const input = document.querySelector('input[placeholder="Type a message..."]');
        if (input) input.focus();
    }

    clearReply = () => {
        this.setState({ replyingTo: null });
    }

    // ============ MESSAGE SEARCH ============
    handleSearch = (query) => {
        this.setState({ searchQuery: query, isSearching: query.length > 0 });

        if (!query) {
            this.setState({ searchResults: [] });
            return;
        }

        const results = this.state.messages.filter(msg =>
            msg.text && msg.text.toLowerCase().includes(query.toLowerCase())
        );

        this.setState({ searchResults: results });
    }

    scrollToMessage = (messageId) => {
        this.setState({ searchQuery: '', searchResults: [] });
        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-yellow-100', 'transition-colors', 'duration-1000');
            setTimeout(() => element.classList.remove('bg-yellow-100'), 2000);
        }
    }

    // ============ SCROLL & THEMES ============
    handleScroll = (e) => {
        const { scrollTop } = e.target;
        if (scrollTop === 0 && !this.state.loading) {
            // Load more messages
            // Check if we have more? For now just try to load more
            this.setState(prev => ({ messageLimit: prev.messageLimit + 20 }), () => {
                this.subscribeToMessages();
            });
        }
    }

    setTheme = async (themeClass) => {
        this.setState({ chatTheme: themeClass, showThemeModal: false });
        if (this.state.selectedUser && !this.state.selectedUser.isBot) {
            // Save preference? For now just local state for session
        }
    }

    // ============ AI BOT ============
    handleAIResponse = async (userMessage) => {
        this.setState({ otherUserTyping: true });

        // Simulate thinking time
        setTimeout(async () => {
            const responses = [
                "I'm Alphery AI 🤖! I can help you organize your tasks.",
                "That sounds interesting! Tell me more.",
                "I've noted that down for you.",
                "Could you clarify what you mean?",
                "Processing your request... Done! ✅",
                "Start a video call to test the new features! 📹"
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            const replyText = `AI: ${randomResponse}`; // Simple echo for now

            await addDoc(collection(db, 'messages'), {
                from: this.AI_BOT_ID,
                to: this.state.currentUser.uid,
                text: replyText,
                type: 'text',
                timestamp: serverTimestamp(),
                fromName: 'Alphery AI',
                toName: this.state.currentUser.displayName,
                readBy: [],
                chatId: this.getChatId(this.AI_BOT_ID, this.state.currentUser.uid)
            });
            this.setState({ otherUserTyping: false });
        }, 1500);
    }

    // ============ VIDEO CALL (SIMULATED/BASIC) ============
    // ============ REAL WEB RTC VIDEO CALLING ============

    subscribeToIncomingCalls = () => {
        const { currentUser } = this.state;
        const callsRef = collection(db, 'calls');
        const q = query(callsRef, where('calleeId', '==', currentUser.uid), where('status', '==', 'calling'));

        this.unsubscribeIncomingCalls = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const callData = change.doc.data();
                    // Check if not expired (e.g., created in last minute) - omitted for simplicity
                    this.setState({
                        incomingCall: { id: change.doc.id, ...callData },
                        callStatus: 'incoming' // Show answering UI
                    });

                    // Play ringtone (Simulator)
                    // const ringtone = new Audio('/sounds/ringtone.mp3'); ringtone.play();
                }
            });
        });
    }

    createPeerConnection = () => {
        const servers = {
            iceServers: [
                {
                    urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
                }
            ]
        };
        this.pc = new RTCPeerConnection(servers);

        // Handle network candidates
        this.pc.onicecandidate = (event) => {
            if (event.candidate && this.state.callId) {
                const candidatesCol = this.state.isCaller
                    ? 'offerCandidates'
                    : 'answerCandidates';
                // We add to our OWN collection
                const candidatesRef = collection(db, 'calls', this.state.callId, candidatesCol);
                addDoc(candidatesRef, event.candidate.toJSON());
            }
        };

        // Handle remote stream
        this.pc.ontrack = (event) => {
            console.log("Remote track received");
            event.streams[0].getTracks().forEach(track => {
                this.setState({ remoteStream: event.streams[0] });
                if (this.remoteVideoRef.current) {
                    this.remoteVideoRef.current.srcObject = event.streams[0];
                }
            });
        };

        // Push local tracks
        if (this.state.localStream) {
            this.state.localStream.getTracks().forEach(track => {
                this.pc.addTrack(track, this.state.localStream);
            });
        }
    }

    startVideoCall = async () => {
        const { currentUser, selectedUser } = this.state;
        if (!selectedUser) return;

        try {
            // 1. Get Local Media
            const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            this.setState({ localStream, callStatus: 'calling', isCaller: true });

            // 2. Create PC
            this.createPeerConnection();

            // 3. Create Offer
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);

            // 4. Create Call Doc in Firestore
            const callDocRef = doc(collection(db, 'calls'));
            const callId = callDocRef.id;

            await setDoc(callDocRef, {
                callerId: currentUser.uid,
                callerName: currentUser.displayName,
                callerPhoto: currentUser.photoURL,
                calleeId: selectedUser.uid, // Assuming 1-on-1 for now
                offer: { type: offer.type, sdp: offer.sdp },
                status: 'calling',
                timestamp: serverTimestamp()
            });

            this.setState({ callId });

            // 5. Listen for Answer
            this.unsubscribeCallData = onSnapshot(callDocRef, async (snapshot) => {
                const data = snapshot.data();
                if (data && data.answer && !this.pc.currentRemoteDescription) {
                    const answerDescription = new RTCSessionDescription(data.answer);
                    await this.pc.setRemoteDescription(answerDescription);
                    this.setState({ callStatus: 'connected' });
                    this.startCallTimer();
                }
                if (data && data.status === 'ended') {
                    this.endCall(false); // don't write ended status again
                }
            });

            // 6. Listen for Remote ICE Candidates
            this.listenForCandidates(callId, 'answerCandidates');

        } catch (error) {
            console.error("Error starting call:", error);
            alert("Could not start call. Access denied.");
        }
    }

    answerCall = async () => {
        const { incomingCall } = this.state;
        if (!incomingCall) return;

        try {
            // 1. Get Local Media
            const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            this.setState({ localStream, callStatus: 'connected', callId: incomingCall.id, isCaller: false });

            // 2. Create PC
            this.createPeerConnection();

            // 3. Set Remote (Offer)
            await this.pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

            // 4. Create Answer
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);

            // 5. Update Firestore
            const callRef = doc(db, 'calls', incomingCall.id);
            await updateDoc(callRef, {
                answer: { type: answer.type, sdp: answer.sdp },
                status: 'connected'
            });

            // 6. Listen for Caller ICE Candidates
            this.listenForCandidates(incomingCall.id, 'offerCandidates');

            // 7. Cleanup incoming call listener
            this.startCallTimer();

        } catch (error) {
            console.error("Error answering call:", error);
        }
    }

    listenForCandidates = (callId, collectionName) => {
        const q = collection(db, 'calls', callId, collectionName);
        onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const candidate = new RTCIceCandidate(data);
                    this.pc.addIceCandidate(candidate);
                }
            });
        });
    }

    endCall = async (notifyFirestore = true) => {
        if (this.state.localStream) {
            this.state.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }

        if (notifyFirestore && this.state.callId) {
            try {
                await updateDoc(doc(db, 'calls', this.state.callId), { status: 'ended' });
            } catch (e) { }
        }

        this.setState({ callStatus: 'idle', callDuration: 0, incomingCall: null, callId: null, localStream: null, remoteStream: null });
        if (this.callInterval) clearInterval(this.callInterval);
        if (this.unsubscribeCallData) {
            this.unsubscribeCallData();
            this.unsubscribeCallData = null;
        }
    }

    startCallTimer = () => {
        this.callInterval = setInterval(() => {
            this.setState(prev => ({ callDuration: prev.callDuration + 1 }));
        }, 1000);
    }

    // ============ CONVERSATIONS (REALTIME FIRESTORE) ============
    subscribeToConversations = () => {
        if (!this.props.user) return;

        // Unsubscribe previous listener
        if (this.unsubscribeConversations) this.unsubscribeConversations();

        // Query chats where I am a participant
        const chatsRef = collection(db, 'chats');
        const q = query(
            chatsRef,
            where('participants', 'array-contains', this.props.user.uid),
            orderBy('timestamp', 'desc')
        );

        this.unsubscribeConversations = onSnapshot(q, (snapshot) => {
            const conversations = snapshot.docs.map(doc => {
                const data = doc.data();

                if (data.isGroup) {
                    return {
                        uid: doc.id, // Group ID is chat ID
                        chatId: doc.id,
                        lastMessage: data.lastMessage,
                        timestamp: data.timestamp,
                        displayName: data.groupName, // Use group name
                        photoURL: null, // Custom group icon logic?
                        isGroup: true,
                        ...data
                    };
                }

                const otherUid = data.participants.find(uid => uid !== this.props.user.uid);
                const otherUserInfo = data.userInfo ? data.userInfo[otherUid] : {};

                return {
                    uid: otherUid, // Key for selection logic
                    chatId: doc.id,
                    lastMessage: data.lastMessage,
                    timestamp: data.timestamp,
                    displayName: otherUserInfo?.displayName || 'Unknown User',
                    photoURL: otherUserInfo?.photoURL,
                    email: otherUserInfo?.email,
                    ...data // include everything else
                };
            });
            this.setState({ conversations });
        }, (error) => {
            console.error("Error subscribing to chats:", error);
        });
    }

    // ============ HIDE / DELETE CHAT ============
    hideChat = (chatId) => {
        const hidden = JSON.parse(localStorage.getItem(`messenger_hidden_${this.state.currentUser.uid}`) || '[]');
        if (!hidden.includes(chatId)) {
            hidden.push(chatId);
            localStorage.setItem(`messenger_hidden_${this.state.currentUser.uid}`, JSON.stringify(hidden));
            this.setState({ hiddenUsers: hidden });
        }
    }

    unhideChat = (chatId) => {
        const hidden = JSON.parse(localStorage.getItem(`messenger_hidden_${this.state.currentUser.uid}`) || '[]');
        const newHidden = hidden.filter(id => id !== chatId);
        localStorage.setItem(`messenger_hidden_${this.state.currentUser.uid}`, JSON.stringify(newHidden));
        this.setState({ hiddenUsers: newHidden });
    }

    handleUserContextMenu = (e, user) => {
        e.preventDefault();
        this.setState({
            contextMenu: {
                x: e.clientX,
                y: e.clientY,
                type: 'user',
                data: user
            }
        });
    }

    handleDeleteChat = async (user) => {
        if (!window.confirm("Are you sure you want to delete this chat permanently? History will be lost for everyone.")) return;

        try {
            const chatId = user.chatId;
            await deleteDoc(doc(db, 'chats', chatId));

            // Should also delete messages? Skipped for safety/performance in this demo context.

            this.setState({ contextMenu: null, selectedUser: null });
        } catch (e) {
            console.error("Delete error", e);
            alert("Could not delete chat");
        }
    }

    searchUserByEmail = async (email) => {
        if (!email.trim()) {
            this.setState({ searchedUsers: [] });
            return;
        }

        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);

            const results = snapshot.docs
                .map(doc => ({ uid: doc.id, ...doc.data() }))
                .filter(u =>
                    u.uid !== this.props.user.uid &&
                    (
                        (u.email && u.email.toLowerCase().includes(email.toLowerCase())) ||
                        (u.displayName && u.displayName.toLowerCase().includes(email.toLowerCase()))
                    )
                );

            this.setState({ searchedUsers: results });
        } catch (error) {
            console.error('Error searching users:', error);
        }
    }

    startConversation = (user) => {
        // Remove from hidden users if they were hidden
        if (this.state.hiddenUsers.includes(user.uid)) {
            const hiddenUsersKey = `hidden_chats_${this.props.user?.uid || 'guest'}`;
            const newHiddenUsers = this.state.hiddenUsers.filter(uid => uid !== user.uid);
            localStorage.setItem(hiddenUsersKey, JSON.stringify(newHiddenUsers));
            this.setState({ hiddenUsers: newHiddenUsers });
        }

        // Create empty chat to start if it doesn't exist
        this.updateConversationMetadata(user, 'Started a new conversation');
        this.setState({
            showNewChatModal: false,
            searchEmail: '',
            searchedUsers: []
        });
        this.selectUser(user);
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
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
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
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
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

        if (msg.type === 'audio') {
            return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm
                        ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white bg-opacity-20">
                            🎤
                        </div>
                        <div>
                            <audio controls src={msg.fileURL} className="w-48 h-8" />
                            {msg.duration && <p className="text-[10px] mt-1 opacity-70">{this.formatDuration(msg.duration)}</p>}
                        </div>
                    </div>
                </div>
            )
        }

        if (['pdf', 'document', 'spreadsheet', 'archive', 'file'].includes(msg.type)) {
            return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
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
                        {/* Reply Preview */}
                        {msg.replyTo && (
                            <div className={`mb-2 pb-2 border-l-4 pl-2 text-xs ${isMe ? 'border-teal-300 bg-teal-700 bg-opacity-30' : 'border-gray-300 bg-gray-100'
                                } cursor-pointer`} onClick={() => this.scrollToMessage(msg.replyTo)}>
                                <p className="font-semibold">{msg.replyToFrom}</p>
                                <p className="opacity-75 truncate">{msg.replyToText}</p>
                            </div>
                        )}

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

                        {/* Timestamp & Read Receipts */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                            <p className={`text-[10px] ${isMe ? 'text-teal-200' : 'text-gray-400'}`}>
                                {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                            </p>

                            {/* Read Receipts (for messages you sent) */}
                            {isMe && msg.readBy && (
                                <span className={`text-xs ${msg.readBy.length > 1 ? 'text-blue-300' : 'text-teal-200'}`}>
                                    {msg.readBy.length > 1 ? '✓✓' : '✓'}
                                </span>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {!isEditing && (
                            <div className="absolute top-0 right-0 hidden group-hover:flex gap-1 bg-white/80 backdrop-blur-sm rounded-bl shadow-sm p-0.5">
                                <button
                                    onClick={() => this.setReplyTo(msg)}
                                    className="p-1 hover:bg-black/10 rounded text-xs text-gray-600"
                                    title="Reply"
                                >
                                    💬
                                </button>
                                {isMe && (
                                    <button
                                        onClick={() => this.startEditMessage(msg)}
                                        className="p-1 hover:bg-black/10 rounded text-xs text-gray-600"
                                        title="Edit"
                                    >
                                        ✏️
                                    </button>
                                )}
                            </div>
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
        const { otherUsers, selectedUser, messages, messageText, currentUser, loading, uploading, uploadProgress, showAttachMenu, isRecording, chatTheme, callStatus } = this.state;

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
                <div className={`w-full md:w-1/4 bg-gray-50 border-r border-gray-200 flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                    <div className="flex flex-col border-b border-gray-200 bg-white shadow-sm z-10">
                        <div className="h-16 flex items-center justify-between px-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path></svg>
                                </div>
                                <span className="font-bold text-lg text-teal-600">Chats</span>
                            </div>

                            {/* New Chat Button */}
                            <button
                                onClick={() => this.setState({ showNewChatModal: true })}
                                className="p-2 hover:bg-gray-100 rounded-full transition"
                                title="New Chat"
                            >
                                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                            </button>
                        </div>
                        <div className="px-4 pb-3">
                            <input
                                className="w-full bg-gray-100 border border-transparent focus:bg-white focus:border-teal-500 rounded-md px-3 py-1.5 text-xs outline-none transition text-gray-900"
                                placeholder="Search conversations..."
                                value={this.state.searchQuery || ''}
                                onChange={(e) => this.setState({ searchQuery: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {/* AI BOT PINNED */}
                        <div
                            onClick={() => this.selectUser(this.AI_BOT_USER)}
                            className={`flex items-center px-4 py-3 cursor-pointer transition border-b border-gray-100 group bg-purple-50 hover:bg-purple-100`}
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl">
                                    🤖
                                </div>
                            </div>
                            <div className="ml-3 overflow-hidden">
                                <p className="font-bold text-indigo-900">Alphery AI</p>
                                <p className="text-xs text-indigo-600">Your AI Assistant</p>
                            </div>
                        </div>

                        {this.state.conversations.filter(u =>
                            !this.state.hiddenUsers.includes(u.chatId) && ( // Filter by Chat ID
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
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-bold">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg">{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                    {/* Online Status Indicator */}
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${this.state.userStatuses.get(user.uid) === 'online' ? 'bg-green-500' :
                                        this.state.userStatuses.get(user.uid) === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                                        }`}></div>
                                </div>
                                <div className="ml-3 overflow-hidden flex-1">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-semibold text-gray-900 truncate">{user.displayName || 'Anonymous'}</p>
                                        <span className="text-[10px] text-gray-400 ml-2">
                                            {user.timestamp ? new Date(user.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                        {/* Typing or Last Message */}
                                        {/* Simplified typing check for now, can be improved */}
                                        {/* <span>{user.lastMessage || 'Start created'}</span> */}
                                        <span className="text-gray-500 font-medium">{user.lastMessage || 'New Chat'}</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                        {this.state.conversations.length === 0 && (
                            <div className="p-4 text-center text-gray-400 text-xs">
                                <p>No chats yet.</p>
                                <p className="mt-2">Start a conversation!</p>
                            </div>
                        )}
                    </div>

                    {/* My Status Section */}
                    <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {currentUser.photoURL ? (
                                    <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    (currentUser.displayName || 'Me')[0].toUpperCase()
                                )}
                            </div>
                            <div className="truncate">
                                <p className="text-xs font-semibold text-gray-700 truncate">{currentUser.displayName || 'Me'}</p>
                                <p className="text-[10px] text-gray-500 capitalize">{this.state.userStatus}</p>
                            </div>
                        </div>

                        <div className="relative group">
                            <button className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 transition text-gray-700">
                                <span className={`w-2 h-2 rounded-full ${this.state.userStatus === 'online' ? 'bg-green-500' :
                                    this.state.userStatus === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                                    }`}></span>
                                <span className="capitalize">{this.state.userStatus}</span>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>

                            {/* Status Dropdown */}
                            <div className="absolute bottom-full right-0 mb-1 w-32 bg-white rounded-lg shadow-xl border border-gray-200 hidden group-hover:block overflow-hidden z-50">
                                <button onClick={() => this.changeUserStatus('online')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                                </button>
                                <button onClick={() => this.changeUserStatus('away')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Away
                                </button>
                                <button onClick={() => this.changeUserStatus('offline')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span> Offline
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex-col bg-slate-50 relative ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
                    {selectedUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white shadow-sm z-10">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <button
                                        onClick={() => this.setState({ showThemeModal: true })}
                                        className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 mr-1"
                                        title="Change Theme"
                                    >
                                        🎨
                                    </button>
                                    <button
                                        onClick={this.startVideoCall}
                                        className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 mr-2"
                                        title="Video Call"
                                    >
                                        📹
                                    </button>
                                    <button
                                        onClick={() => this.setState({ selectedUser: null })}
                                        className="md:hidden p-1 mr-1 text-gray-600 hover:bg-gray-100 rounded-full"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 overflow-hidden flex items-center justify-center text-white font-bold text-sm relative">
                                        {selectedUser.photoURL ? (
                                            <img src={selectedUser.photoURL} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{(selectedUser.displayName || selectedUser.email || 'U')[0].toUpperCase()}</span>
                                        )}
                                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${this.state.userStatuses.get(selectedUser.uid) === 'online' ? 'bg-green-500' :
                                            this.state.userStatuses.get(selectedUser.uid) === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                                            }`}></div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{selectedUser.displayName || 'Anonymous'}</h3>
                                        <div className="text-xs">
                                            {this.state.userStatuses.get(selectedUser.uid) === 'online' ? (
                                                <span className="text-green-500 flex items-center gap-1">● Online</span>
                                            ) : this.state.userStatuses.get(selectedUser.uid) === 'away' ? (
                                                <span className="text-yellow-500 flex items-center gap-1">● Away</span>
                                            ) : (
                                                <span className="text-gray-400">Offline</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Message Search */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search in chat..."
                                        value={this.state.searchQuery}
                                        onChange={(e) => this.handleSearch(e.target.value)}
                                        className="pl-3 pr-8 py-1.5 text-sm bg-gray-100 border-transparent focus:bg-white focus:border-teal-500 border rounded-full outline-none transition w-40 focus:w-60 text-gray-900"
                                    />
                                    <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>

                                    {this.state.searchResults.length > 0 && (
                                        <div className="absolute top-10 right-0 w-64 bg-white shadow-xl rounded-lg border border-gray-100 max-h-60 overflow-y-auto z-50">
                                            {this.state.searchResults.map(msg => (
                                                <div
                                                    key={msg.id}
                                                    onClick={() => this.scrollToMessage(msg.id)}
                                                    className="p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer text-xs"
                                                >
                                                    <p className="truncate font-medium text-gray-700">{msg.text}</p>
                                                    <p className="text-gray-400 mt-1">{msg.timestamp?.toDate().toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                id="chat-history-box"
                                ref={this.chatContainerRef}
                                onScroll={this.handleScroll}
                                className={`flex-1 overflow-y-auto p-6 ${this.state.selectedUser?.isBot ? 'bg-slate-900' : chatTheme} transition-colors duration-300`}
                            >
                                {messages.length === 0 && loading && (
                                    <div className="flex justify-center p-4"><span className="animate-spin">⌛</span></div>
                                )}

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
                                {/* Reply Preview */}
                                {this.state.replyingTo && (
                                    <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between border-l-4 border-teal-500">
                                        <div className="flex-1 text-sm overflow-hidden">
                                            <p className="font-semibold text-teal-600 text-xs mb-0.5">Replying to {this.state.replyingTo.fromName || 'User'}</p>
                                            <p className="text-gray-600 truncate text-xs">{this.state.replyingTo.text}</p>
                                        </div>
                                        <button
                                            onClick={this.clearReply}
                                            className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        </button>
                                    </div>
                                )}

                                {/* Typing Indicator */}
                                {this.state.otherUserTyping && (
                                    <div className="flex items-center gap-2 mb-2 ml-4 text-xs text-gray-500 font-medium animate-pulse">
                                        <div className="flex gap-0.5">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                        {selectedUser.displayName} is typing...
                                    </div>
                                )}

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


                                    {/* Audio Record Button */}
                                    {isRecording ? (
                                        <div className="flex items-center gap-3 px-3 py-1 bg-red-50 rounded-full border border-red-200 flex-1">
                                            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                                            <span className="text-red-600 font-mono text-xs">{this.formatDuration(this.state.recordingDuration)}</span>
                                            <div className="flex-1"></div>
                                            <button type="button" onClick={this.cancelRecording} className="text-gray-500 hover:text-red-500 text-xs text-xs">Cancel</button>
                                            <button type="button" onClick={this.stopRecording} className="p-1 bg-red-500 text-white rounded-full">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4v12l10-6-10-6z" /></svg> {/* Icon mimics send/stop */}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={this.startRecording}
                                                className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition text-gray-600"
                                                title="Record Voice"
                                            >
                                                🎤
                                            </button>
                                            <input
                                                className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none transition text-gray-900"
                                                placeholder="Type a message..."
                                                value={messageText}
                                                onChange={this.handleTyping}
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
                                        </>
                                    )}
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

                {/* Call Overlay */}
                {/* Call Overlay */}
                {(callStatus === 'calling' || callStatus === 'connected' || callStatus === 'incoming') && (
                    <div className="absolute inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center text-white">
                        {callStatus === 'connected' ? (
                            <div className="w-full h-full flex flex-col">
                                <div className="flex-1 relative bg-black">
                                    {/* Remote Video */}
                                    {this.state.remoteStream ? (
                                        <video
                                            ref={this.remoteVideoRef}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            playsInline
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center z-0">
                                            <img src={selectedUser?.photoURL} className="w-24 h-24 rounded-full opacity-50" />
                                            <p className="mt-4 absolute bottom-10">Waiting for video...</p>
                                        </div>
                                    )}

                                    <div className="absolute top-4 right-4 w-32 h-48 bg-gray-800 rounded-lg border-2 border-white shadow-lg overflow-hidden z-10">
                                        {/* Local Video - Mirror */}
                                        <video
                                            ref={(ref) => {
                                                if (ref && this.state.localStream && ref.srcObject !== this.state.localStream) {
                                                    ref.srcObject = this.state.localStream;
                                                    ref.muted = true;
                                                }
                                            }}
                                            className="w-full h-full object-cover scale-x-[-1]"
                                            autoPlay
                                            playsInline
                                            muted
                                        />
                                    </div>
                                </div>
                                <div className="h-24 bg-gray-900 flex items-center justify-center gap-6">
                                    <div className="text-xl font-mono">{this.formatDuration(this.state.callDuration)}</div>
                                    <button onClick={() => {
                                        const enabled = !this.state.isAudioEnabled;
                                        this.setState({ isAudioEnabled: enabled });
                                        if (this.state.localStream) this.state.localStream.getAudioTracks().forEach(t => t.enabled = enabled);
                                    }} className={`p-4 rounded-full ${this.state.isAudioEnabled ? 'bg-gray-700' : 'bg-red-500'}`}>🎤</button>
                                    <button onClick={() => this.endCall(true)} className="p-4 rounded-full bg-red-600 hover:bg-red-700 transform hover:scale-110 transition">☎️ End</button>
                                    <button onClick={() => {
                                        const enabled = !this.state.isVideoEnabled;
                                        this.setState({ isVideoEnabled: enabled });
                                        if (this.state.localStream) this.state.localStream.getVideoTracks().forEach(t => t.enabled = enabled);
                                    }} className={`p-4 rounded-full ${this.state.isVideoEnabled ? 'bg-gray-700' : 'bg-red-500'}`}>📹</button>
                                </div>
                            </div>
                        ) : callStatus === 'incoming' ? (
                            <div className="text-center animate-bounce-subtle">
                                <div className="w-32 h-32 rounded-full border-4 border-green-400 p-1 mx-auto mb-6">
                                    <img src={this.state.incomingCall?.callerPhoto} className="w-full h-full rounded-full object-cover" />
                                </div>
                                <h2 className="text-3xl font-bold mb-2">{this.state.incomingCall?.callerName}</h2>
                                <p className="text-green-400 mb-8 text-xl">Incoming Video Call...</p>
                                <div className="flex gap-8 justify-center">
                                    <button onClick={() => this.endCall(true)} className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-3xl hover:bg-red-600 transition shadow-lg">
                                        ❌
                                    </button>
                                    <button onClick={this.answerCall} className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-3xl hover:bg-green-600 transition shadow-lg animate-pulse">
                                        📞
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // OUTGOING CALLING STATE
                            <div className="text-center">
                                <div className="w-24 h-24 rounded-full bg-gray-700 mx-auto mb-6 flex items-center justify-center text-4xl overflow-hidden relative">
                                    {selectedUser?.photoURL ? <img src={selectedUser.photoURL} className="w-full h-full object-cover" /> : selectedUser?.displayName?.[0]}
                                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                        <div className="animate-ping w-16 h-16 rounded-full border-2 border-white"></div>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold mb-2">{selectedUser?.displayName}</h2>
                                <p className="text-gray-400 animate-pulse mb-8">Calling...</p>
                                <button onClick={() => this.endCall(true)} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-2xl hover:bg-red-600 transition">
                                    ☎️
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Theme Modal */}
                {
                    this.state.showThemeModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]" onClick={() => this.setState({ showThemeModal: false })}>
                            <div className="bg-white rounded-lg p-6 w-80">
                                <h3 className="font-bold mb-4">Choose Theme</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => this.setTheme('bg-white')} className="p-4 border rounded hover:bg-gray-50 text-center">Default (White)</button>
                                    <button onClick={() => this.setTheme('bg-slate-50')} className="p-4 border rounded bg-slate-50 hover:bg-slate-100 text-center">Slate</button>
                                    <button onClick={() => this.setTheme('bg-orange-50')} className="p-4 border rounded bg-orange-50 hover:bg-orange-100 text-center">Warm</button>
                                    <button onClick={() => this.setTheme('bg-blue-50')} className="p-4 border rounded bg-blue-50 hover:bg-blue-100 text-center">Blue</button>
                                    <button onClick={() => this.setTheme('bg-pink-50')} className="p-4 border rounded bg-pink-50 hover:bg-pink-100 text-center">Pink</button>
                                    <button onClick={() => this.setTheme('bg-gradient-to-br from-indigo-50 to-purple-50')} className="p-4 border rounded bg-gradient-to-br from-indigo-50 to-purple-50 text-center">Dreamy</button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Context Menu */}
                {/* Context Menu */}
                {this.state.contextMenu && (
                    <div
                        className="fixed bg-white shadow-xl rounded-lg border border-gray-200 py-1 z-[80] w-[200px]"
                        style={{ top: this.state.contextMenu.y, left: this.state.contextMenu.x }}
                    >
                        {this.state.contextMenu.type === 'message' ? (
                            <>
                                <button onClick={() => this.setReplyTo(this.state.contextMenu.data)} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-xs text-gray-700">Reply</button>
                                {this.state.contextMenu.data.from === this.state.currentUser.uid && (
                                    <>
                                        <button onClick={() => this.startEditMessage(this.state.contextMenu.data)} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-xs text-gray-700">Edit</button>
                                        <button onClick={() => this.deleteMessage(this.state.contextMenu.data)} className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-xs">Delete</button>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <button onClick={() => this.hideChat(this.state.contextMenu.data.chatId)} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-xs text-gray-700">Hide Chat</button>
                                <div className="border-t my-1"></div>
                                <button onClick={() => this.handleDeleteChat(this.state.contextMenu.data)} className="block w-full text-left px-4 py-2 hover:bg-red-50 text-xs text-red-600">Delete Permanently</button>
                            </>
                        )}
                        <div className="border-t my-1"></div>
                        <button onClick={() => this.setState({ contextMenu: null })} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-xs text-gray-400">Cancel</button>
                    </div>
                )}

                {/* Create Group Modal */}
                {
                    this.state.showGroupModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => this.setState({ showGroupModal: false })}>
                            <div className="bg-white rounded-lg shadow-2xl w-96 p-6" onClick={(e) => e.stopPropagation()}>
                                <h3 className="font-bold text-lg mb-4">Create Group</h3>
                                <input
                                    className="w-full border rounded px-3 py-2 mb-4"
                                    placeholder="Group Name"
                                    value={this.state.groupName}
                                    onChange={e => this.setState({ groupName: e.target.value })}
                                />
                                <p className="text-xs font-bold text-gray-500 mb-2">Select Members:</p>
                                <div className="h-40 overflow-y-auto border rounded mb-4">
                                    {this.state.otherUsers.map(u => (
                                        <div key={u.uid}
                                            onClick={() => this.toggleGroupMember(u)}
                                            className={`flex items-center p-2 hover:bg-gray-50 cursor-pointer ${this.state.selectedGroupMembers.find(m => m.uid === u.uid) ? 'bg-blue-50' : ''}`}>
                                            <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center ${this.state.selectedGroupMembers.find(m => m.uid === u.uid) ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}>
                                                {this.state.selectedGroupMembers.find(m => m.uid === u.uid) && '✓'}
                                            </div>
                                            <span className="text-sm truncate">{u.displayName}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => this.setState({ showGroupModal: false })} className="px-3 py-2 text-sm text-gray-600">Cancel</button>
                                    <button onClick={this.createGroup} className="px-3 py-2 text-sm bg-teal-600 text-white rounded">Create Group</button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* New Chat Modal */}
                {
                    this.state.showNewChatModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => this.setState({ showNewChatModal: false })}>
                            <div className="bg-white rounded-lg shadow-2xl w-96 max-h-[600px] flex flex-col" onClick={(e) => e.stopPropagation()}>
                                {/* Modal Header */}
                                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                    <h3 className="font-bold text-lg text-gray-800">New Chat</h3>
                                    <button
                                        onClick={() => this.setState({ showGroupModal: true })}
                                        className="p-1 hover:bg-gray-100 rounded-full mr-1 text-teal-600"
                                        title="Create Group"
                                    >
                                        <span className="text-xl">👥</span>
                                    </button>
                                    <button
                                        onClick={() => this.setState({ showNewChatModal: false, searchEmail: '', searchedUsers: [] })}
                                        className="p-1 hover:bg-gray-100 rounded-full"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>

                                {/* Search Input */}
                                <div className="p-4 border-b border-gray-200">
                                    <div className="relative">
                                        <input
                                            type="email"
                                            placeholder="Search by email address..."
                                            value={this.state.searchEmail}
                                            onChange={(e) => {
                                                this.setState({ searchEmail: e.target.value });
                                                this.searchUserByEmail(e.target.value);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-900"
                                            autoFocus
                                        />
                                        <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                        </svg>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Enter the email address of the person you want to chat with</p>
                                </div>

                                {/* Search Results */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {this.state.searchedUsers.length > 0 ? (
                                        this.state.searchedUsers.map(user => (
                                            <div
                                                key={user.uid}
                                                onClick={() => this.startConversation(user)}
                                                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition mb-2"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                                    {user.photoURL ? (
                                                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover rounded-full" />
                                                    ) : (
                                                        <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="font-semibold text-gray-800 truncate">{user.displayName || 'Anonymous'}</p>
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                </div>
                                                <div className="text-teal-600">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                                    </svg>
                                                </div>
                                            </div>
                                        ))
                                    ) : this.state.searchEmail ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                            </svg>
                                            <p className="text-sm">No users found</p>
                                            <p className="text-xs mt-1">Try a different email address</p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                            </svg>
                                            <p className="text-sm">Search for users by email</p>
                                            <p className="text-xs mt-1">Start typing to see results</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        );
    }
}

export const displayMessenger = () => {
    return <MessengerWithAuth />;
};
