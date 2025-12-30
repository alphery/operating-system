import React, { Component } from 'react';
import ERPDatabase from '../util components/database';

export class ZMail extends Component {
    constructor() {
        super();
        this.state = {
            activeFolder: 'inbox',
            emails: [],
            selectedMail: null,
            showCompose: false,
            newDraft: { to: '', subject: '', body: '' }
        }
    }

    componentDidMount() {
        this.refreshData();
    }

    refreshData = () => {
        const emails = ERPDatabase.getEmails(this.state.activeFolder);
        this.setState({ emails, selectedMail: null });
    }

    changeFolder = (folder) => {
        this.setState({ activeFolder: folder.toLowerCase() }, this.refreshData);
    }

    handleInputChange = (e) => {
        this.setState({
            newDraft: { ...this.state.newDraft, [e.target.name]: e.target.value }
        });
    }

    sendEmail = () => {
        const { to, subject, body } = this.state.newDraft;
        if (!to) return;

        ERPDatabase.sendEmail({ to, subject, body });

        // Simulating delay for effect
        setTimeout(() => {
            this.setState({
                showCompose: false,
                newDraft: { to: '', subject: '', body: '' }
            });
            if (this.state.activeFolder === 'sent') this.refreshData(); // Refresh if looking at sent
        }, 500);
    }

    // Auto refresh to check for new mails (replies)
    interval = null;
    componentDidMount() {
        this.refreshData();
        this.interval = setInterval(() => {
            if (this.state.activeFolder === 'inbox') {
                const currentCount = this.state.emails.length;
                const newMails = ERPDatabase.getEmails('inbox');
                if (newMails.length !== currentCount) {
                    this.setState({ emails: newMails });
                }
            }
        }, 5000);
    }

    componentWillUnmount() {
        if (this.interval) clearInterval(this.interval);
    }

    render() {
        const { emails, selectedMail, activeFolder, showCompose } = this.state;

        return (
            <div className="w-full h-full flex bg-white overflow-hidden text-sm relative">
                {/* Sidebar */}
                <div className="w-48 bg-gray-50 border-r border-gray-200 flex flex-col pt-4">
                    <div className="px-4 mb-6">
                        <button
                            onClick={() => this.setState({ showCompose: true })}
                            className="w-full bg-blue-600 text-white rounded-full py-2 font-medium shadow hover:bg-blue-700 transition flex items-center justify-center gap-2">
                            <span>+</span> Compose
                        </button>
                    </div>
                    <nav className="flex-1 space-y-1">
                        {['Inbox', 'Sent', 'Drafts', 'Trash'].map(item => (
                            <div key={item}
                                onClick={() => this.changeFolder(item)}
                                className={`flex items-center px-4 py-2 cursor-pointer ${activeFolder === item.toLowerCase() ? 'bg-blue-50 text-blue-600 font-bold border-r-4 border-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}>
                                <span>{item}</span>
                                {item === 'Inbox' && activeFolder !== 'inbox' && <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-1.5 rounded-full">!</span>}
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Mail List */}
                <div className="w-72 md:w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <input type="text" placeholder={`Search ${activeFolder}...`} className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-sm outline-none focus:border-blue-400" />
                    </div>
                    {emails.map((mail) => (
                        <div key={mail.id}
                            onClick={() => this.setState({ selectedMail: mail })}
                            className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition ${selectedMail && selectedMail.id === mail.id ? 'bg-blue-50 border-l-4 border-blue-500 pl-3' : 'hover:bg-gray-50'}`}>
                            <div className="flex justify-between mb-1">
                                <span className={`font-semibold text-gray-800 truncate ${selectedMail && selectedMail.id === mail.id ? 'text-blue-700' : ''}`}>{mail.from || mail.to}</span>
                                <span className="text-xs text-gray-400">{new Date(mail.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="font-medium text-gray-900 truncate mb-0.5">{mail.subject}</div>
                            <div className="text-gray-500 text-xs truncate">{mail.body}</div>
                        </div>
                    ))}
                    {emails.length === 0 && <div className="p-4 text-center text-gray-400 italic">No mails in {activeFolder}</div>}
                </div>

                {/* Mail Content */}
                <div className="flex-1 bg-white flex flex-col relative">
                    {selectedMail ? (
                        <div className="flex-1 flex flex-col p-8 overflow-y-auto animate-in fade-in duration-200">
                            <div className="border-b pb-4 mb-4">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedMail.subject}</h2>
                                <div className="flex justify-between items-center text-gray-500 text-sm">
                                    <div className="flex gap-2">
                                        <span className="font-bold text-gray-700">{activeFolder === 'sent' ? 'To:' : 'From:'}</span>
                                        <span>{activeFolder === 'sent' ? selectedMail.to : selectedMail.from}</span>
                                    </div>
                                    <span>{new Date(selectedMail.date).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {selectedMail.body}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            <p>Select an email to read</p>
                        </div>
                    )}
                </div>

                {/* Compose Modal */}
                {showCompose && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-white w-2/3 h-3/4 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
                            <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
                                <span className="font-bold">New Message</span>
                                <button onClick={() => this.setState({ showCompose: false })} className="hover:text-red-400">✕</button>
                            </div>
                            <div className="flex flex-col flex-1 p-4 gap-4">
                                <input name="to" value={this.state.newDraft.to} onChange={this.handleInputChange} className="border-b p-2 outline-none focus:border-blue-500" placeholder="To" autoFocus />
                                <input name="subject" value={this.state.newDraft.subject} onChange={this.handleInputChange} className="border-b p-2 outline-none focus:border-blue-500" placeholder="Subject" />
                                <textarea name="body" value={this.state.newDraft.body} onChange={this.handleInputChange} className="flex-1 border p-2 rounded outline-none focus:ring-1 focus:ring-blue-500 scrollbar-none resize-none" placeholder="Type your message here..."></textarea>
                            </div>
                            <div className="p-4 border-t bg-gray-50 flex justify-end">
                                <button onClick={this.sendEmail} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
                                    <span>Send</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export const displayMail = () => {
    return <ZMail />;
};
