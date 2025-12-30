import React, { Component } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, or, and, orderBy, onSnapshot, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

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
            loading: true
        };
        this.unsubscribeMessages = null;
    }

    componentDidMount() {
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

        // Load all users from Firestore
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
                .filter(u => u.uid !== this.props.user.uid); // Exclude current user

            this.setState({
                otherUsers: users,
                loading: false
            });

            // Auto-select first user if available
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

        // Query messages between current user and selected user
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

        // Real-time listener
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
            // Add message to Firestore
            await addDoc(collection(db, 'messages'), {
                from: currentUser.uid,
                to: selectedUser.uid,
                text: messageText.trim(),
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

    scrollToBottom = () => {
        setTimeout(() => {
            const chatBox = document.getElementById('chat-history-box');
            if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        }, 50);
    }

    render() {
        const { otherUsers, selectedUser, messages, messageText, currentUser, loading } = this.state;

        // Show loading or login prompt
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
                {/* Sidebar - Contact List */}
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
                            !this.state.searchQuery ||
                            (u.displayName && u.displayName.toLowerCase().includes(this.state.searchQuery.toLowerCase())) ||
                            (u.email && u.email.toLowerCase().includes(this.state.searchQuery.toLowerCase()))
                        ).map(user => (
                            <div key={user.uid}
                                onClick={() => this.selectUser(user)}
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
                            <div id="chat-history-box" className="flex-1 overflow-y-auto p-6 space-y-4">
                                {messages.map((msg) => {
                                    const isMe = msg.from === currentUser.uid;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow-sm text-sm
                                                ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                                                <p>{msg.text}</p>
                                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-teal-200' : 'text-gray-400'}`}>
                                                    {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                                {messages.length === 0 && (
                                    <div className="flex justify-center mt-20">
                                        <div className="text-center text-gray-400">
                                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                            </div>
                                            <p className="font-medium text-gray-600">Start the conversation!</p>
                                            <p className="text-xs mt-1">Send a message to {selectedUser.displayName || selectedUser.email}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white border-t border-gray-200">
                                <form onSubmit={this.handleSend} className="flex gap-2">
                                    <input
                                        className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none transition"
                                        placeholder="Type a message..."
                                        value={messageText}
                                        onChange={(e) => this.setState({ messageText: e.target.value })}
                                        autoFocus
                                    />
                                    <button type="submit" className="w-10 h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-full flex items-center justify-center transition shadow-md disabled:opacity-50" disabled={!messageText.trim()}>
                                        <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                    </button>
                                </form>
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
            </div>
        );
    }
}

export const displayMessenger = () => {
    return <MessengerWithAuth />;
};
