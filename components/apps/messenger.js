import React, { Component } from 'react';
import ERPDatabase from '../util components/database';
import SessionManager from '../util components/session';

export class Messenger extends Component {
    constructor() {
        super();
        this.state = {
            currentUser: null,
            otherUsers: [],
            selectedUser: null,
            messages: [],
            messageText: '',
            searchQuery: ''
        };
        this.interval = null;
    }

    componentDidMount() {
        const userId = SessionManager.getUserId();
        const allUsers = ERPDatabase.getSystemUsers();

        // Filter out current user from the contact list
        const otherUsers = allUsers.filter(u => u.username !== userId);

        this.setState({
            currentUser: userId,
            otherUsers: otherUsers,
            selectedUser: null
        }, () => {
            // Check if we need to open a specific chat
            const targetUsername = SessionManager.getItem('messenger_target_user');
            if (targetUsername) {
                const targetUser = otherUsers.find(u => u.username === targetUsername);
                if (targetUser) {
                    this.selectUser(targetUser);
                }
                // Clear the intent
                localStorage.removeItem(`${userId}_messenger_target_user`);
                SessionManager.setItem('messenger_target_user', '');
            } else {
                // Default logic if desired, or stay empty
                if (otherUsers.length > 0) this.selectUser(otherUsers[0]);
            }
        });

        // Poll for new messages every 2 seconds
        this.interval = setInterval(this.loadMessages, 2000);
    }

    componentWillUnmount() {
        if (this.interval) clearInterval(this.interval);
    }

    loadMessages = () => {
        if (!this.state.selectedUser || !this.state.currentUser) return;

        const messages = ERPDatabase.getChatHistory(
            this.state.currentUser,
            this.state.selectedUser.username
        );

        // Optimisation: Only update state if length changed (simple check)
        if (messages.length !== this.state.messages.length) {
            this.setState({ messages }, this.scrollToBottom);
        }
    }

    selectUser = (user) => {
        this.setState({ selectedUser: user, messages: [] }, this.loadMessages);
    }

    handleSend = (e) => {
        e.preventDefault();
        const { messageText, currentUser, selectedUser } = this.state;
        if (!messageText.trim() || !selectedUser) return;

        ERPDatabase.saveMessage(currentUser, selectedUser.username, messageText);
        this.setState({ messageText: '' });
        this.loadMessages(); // Instant update
    }

    scrollToBottom = () => {
        setTimeout(() => {
            const chatBox = document.getElementById('chat-history-box');
            if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        }, 50);
    }

    render() {
        const { otherUsers, selectedUser, messages, messageText, currentUser } = this.state;

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
                                placeholder="Search by Name or Emp ID..."
                                value={this.state.searchQuery || ''}
                                onChange={(e) => this.setState({ searchQuery: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {otherUsers.filter(u =>
                            !this.state.searchQuery ||
                            u.displayName.toLowerCase().includes(this.state.searchQuery.toLowerCase()) ||
                            String(u.id).includes(this.state.searchQuery)
                        ).map(user => (
                            <div key={user.id}
                                onClick={() => this.selectUser(user)}
                                className={`flex items-center px-4 py-3 cursor-pointer transition border-b border-gray-100 group
                                ${selectedUser && selectedUser.id === user.id ? 'bg-teal-50 border-teal-200' : 'hover:bg-gray-100'}`}>
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                        <img src={user.image} alt={user.username} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div className="ml-3 overflow-hidden">
                                    <p className="font-semibold text-gray-800 truncate">{user.displayName}</p>
                                    <div className="flex gap-2 text-[10px] text-gray-400 font-mono">
                                        <span>@{user.username}</span>
                                        <span>ID:{user.id}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {otherUsers.length === 0 && <div className="p-4 text-center text-gray-400 text-xs">No contacts found.</div>}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-slate-50 relative">
                    {selectedUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                        <img src={selectedUser.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{selectedUser.displayName}</h3>
                                        <div className="flex items-center text-xs text-green-500">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span> Online
                                        </div>
                                    </div>
                                </div>
                                <div className="text-gray-400">
                                    <svg className="w-5 h-5 cursor-pointer hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                                </div>
                            </div>

                            {/* Messages */}
                            <div id="chat-history-box" className="flex-1 overflow-y-auto p-6 space-y-4">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.from === currentUser;
                                    return (
                                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow-sm text-sm
                                                ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                                                <p>{msg.text}</p>
                                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-teal-200' : 'text-gray-400'}`}>
                                                    {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                            <p>No messages yet. Say hello!</p>
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
    return <Messenger />;
};
