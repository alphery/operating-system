import React, { Component } from 'react';

export class Chrome extends Component {
    constructor() {
        super();
        this.home_url = 'https://www.google.com';

        this.state = {
            currentUrl: 'https://www.google.com',
            bookmarks: [],
            showBookmarks: false,
        }
    }

    componentDidMount() {
        let savedBookmarks = localStorage.getItem("chrome-bookmarks");
        if (savedBookmarks) {
            try {
                this.setState({ bookmarks: JSON.parse(savedBookmarks) });
            } catch (e) {
                console.error("Failed to load bookmarks:", e);
            }
        }
    }

    saveBookmarks = () => {
        localStorage.setItem("chrome-bookmarks", JSON.stringify(this.state.bookmarks));
    }

    openInPopup = (url) => {
        let processedUrl = url.trim();
        if (processedUrl.length === 0) return;

        // Check if it's a search query or URL
        if (!processedUrl.includes('.') && !processedUrl.startsWith('http')) {
            // It's a search query - use Google
            processedUrl = `https://www.google.com/search?q=${encodeURIComponent(processedUrl)}`;
        } else {
            // It's a URL
            if (processedUrl.indexOf("http://") !== 0 && processedUrl.indexOf("https://") !== 0) {
                processedUrl = "https://" + processedUrl;
            }
        }

        // Open in popup - smaller size (1000x700)
        const width = 1000;
        const height = 700;
        const left = Math.floor((window.screen.width - width) / 2);
        const top = Math.floor((window.screen.height - height) / 2);

        const popup = window.open(
            processedUrl,
            '_blank',
            `width=${width},height=${height},left=${left},top=${top},toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes`
        );

        if (popup) {
            popup.focus();
            this.setState({ currentUrl: processedUrl });
        } else {
            alert('Popup blocked! Please allow popups for this site.');
        }
    }

    goToHome = () => {
        this.openInPopup(this.home_url);
    }

    handleUrlBarKeyDown = (e) => {
        if (e.key === "Enter") {
            this.openInPopup(e.target.value);
            e.target.blur();
        }
    }

    handleUrlBarChange = (e) => {
        this.setState({ currentUrl: e.target.value });
    }

    handleUrlBarFocus = (e) => {
        e.target.select();
    }

    addBookmark = () => {
        const url = this.state.currentUrl;
        if (url && !this.state.bookmarks.find(b => b.url === url)) {
            this.setState(prevState => ({
                bookmarks: [...prevState.bookmarks, {
                    url: url,
                    title: new URL(url).hostname,
                    id: Date.now()
                }]
            }), this.saveBookmarks);
        }
    }

    removeBookmark = (bookmarkId, e) => {
        e.stopPropagation();
        this.setState(prevState => ({
            bookmarks: prevState.bookmarks.filter(b => b.id !== bookmarkId)
        }), this.saveBookmarks);
    }

    toggleBookmarks = () => {
        this.setState(prevState => ({ showBookmarks: !prevState.showBookmarks }));
    }

    render() {
        const { currentUrl, showBookmarks, bookmarks } = this.state;
        const isBookmarked = bookmarks.find(b => b.url === currentUrl);

        return (
            <div className="h-full w-full flex flex-col bg-ub-cool-grey">
                {/* URL Bar */}
                <div className="w-full py-2 px-2 flex justify-start items-center text-white text-sm border-b border-gray-900 bg-ub-grey">
                    {/* Home button */}
                    <button
                        onClick={this.goToHome}
                        className="p-1.5 rounded-full hover:bg-gray-700 ml-1"
                        title="Home"
                    >
                        <img className="w-4 h-4" src="./themes/Yaru/status/chrome_home.svg" alt="Home" />
                    </button>

                    {/* URL bar */}
                    <div className="flex-1 mx-2 flex items-center bg-ub-cool-grey rounded-full px-3 py-1">
                        <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            onKeyDown={this.handleUrlBarKeyDown}
                            onChange={this.handleUrlBarChange}
                            onFocus={this.handleUrlBarFocus}
                            value={currentUrl}
                            className="outline-none bg-transparent flex-1 text-gray-300 text-sm focus:text-white"
                            type="text"
                            spellCheck={false}
                            autoComplete="off"
                            placeholder="Search Google or type a URL"
                        />
                    </div>

                    {/* Open Button */}
                    <button
                        onClick={() => this.openInPopup(currentUrl)}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-1.5 transition-colors"
                        title="Open in Browser Window"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open
                    </button>

                    {/* Bookmark button */}
                    <button
                        onClick={this.addBookmark}
                        className={`p-1.5 rounded-full hover:bg-gray-700 ml-2 ${isBookmarked ? 'text-yellow-400' : ''}`}
                        title={isBookmarked ? "Bookmarked" : "Add bookmark"}
                    >
                        <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>

                    {/* Bookmarks menu button */}
                    <button
                        onClick={this.toggleBookmarks}
                        className="p-1.5 rounded-full hover:bg-gray-700 ml-1"
                        title="Bookmarks"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Bookmarks Bar */}
                {showBookmarks && bookmarks.length > 0 && (
                    <div className="w-full bg-ub-grey border-b border-gray-900 px-3 py-1.5 flex flex-wrap gap-2">
                        {bookmarks.map(bookmark => (
                            <div
                                key={bookmark.id}
                                onClick={() => this.openInPopup(bookmark.url)}
                                className="group flex items-center px-2 py-1 bg-ub-cool-grey hover:bg-gray-700 rounded text-xs text-gray-300 cursor-pointer"
                            >
                                <span className="max-w-[120px] truncate">{bookmark.title}</span>
                                <button
                                    onClick={(e) => this.removeBookmark(bookmark.id, e)}
                                    className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Content - Landing Page */}
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
                    <div className="max-w-2xl w-full text-center">
                        {/* Google Logo Style */}
                        <div className="mb-8">
                            <h1 className="text-6xl font-bold mb-2">
                                <span className="text-blue-500">A</span>
                                <span className="text-red-500">l</span>
                                <span className="text-yellow-500">p</span>
                                <span className="text-blue-500">h</span>
                                <span className="text-green-500">e</span>
                                <span className="text-red-500">r</span>
                                <span className="text-gray-300">y</span>
                            </h1>
                            <p className="text-gray-400 text-sm">Browser</p>
                        </div>

                        {/* Quick Access */}
                        <div className="mb-8">
                            <div className="bg-gray-800 rounded-lg px-6 py-4 flex items-center gap-3 mb-4">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    onKeyDown={this.handleUrlBarKeyDown}
                                    onChange={this.handleUrlBarChange}
                                    value={currentUrl}
                                    className="outline-none bg-transparent flex-1 text-gray-200 text-base"
                                    type="text"
                                    spellCheck={false}
                                    autoComplete="off"
                                    placeholder="Search Google or type a URL and press Enter"
                                />
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            {[
                                { name: 'Google', url: 'https://www.google.com', icon: '🔍' },
                                { name: 'YouTube', url: 'https://www.youtube.com', icon: '📺' },
                                { name: 'Gmail', url: 'https://mail.google.com', icon: '📧' },
                                { name: 'GitHub', url: 'https://github.com', icon: '💻' },
                                { name: 'Twitter', url: 'https://twitter.com', icon: '🐦' },
                                { name: 'Facebook', url: 'https://facebook.com', icon: '👥' },
                                { name: 'Reddit', url: 'https://reddit.com', icon: '🔥' },
                                { name: 'LinkedIn', url: 'https://linkedin.com', icon: '💼' },
                            ].map(site => (
                                <button
                                    key={site.name}
                                    onClick={() => this.openInPopup(site.url)}
                                    className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-all hover:scale-105"
                                >
                                    <div className="text-3xl mb-2">{site.icon}</div>
                                    <div className="text-gray-300 text-xs font-medium">{site.name}</div>
                                </button>
                            ))}
                        </div>

                        {/* Info */}
                        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                            <p className="text-blue-300 text-sm font-semibold mb-2">
                                🚀 Popup Browser Mode
                            </p>
                            <p className="text-gray-400 text-xs">
                                All websites open in a new browser window. Works with <strong>ALL sites</strong> - Google, YouTube, Facebook, etc.!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Chrome

export const displayChrome = () => {
    return <Chrome />;
}
