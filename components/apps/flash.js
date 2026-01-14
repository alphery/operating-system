import React, { Component } from 'react';

export class Flash extends Component {
    constructor() {
        super();
        this.home_url = 'about:blank'; // Use local start page
        this.iframeRef = React.createRef();

        // Sites that work better in popup mode
        this.popupOnlySites = [
            'netflix.com',
            'disneyplus.com',
            'hulu.com',
            'spotify.com',
            'whatsapp.com',
            'web.whatsapp.com',
            'bankofamerica.com',
            'chase.com',
            'paypal.com'
        ];

        this.state = {
            currentUrl: this.home_url,
            displayUrl: '', // Empty by default for start page
            bookmarks: [],
            showBookmarks: false,
            loading: false,
            useProxy: true,
            isStartPage: true, // Track if we are on start page
        }
    }

    // ... componentDidMount ...

    shouldUsePopup = (url) => {
        try {
            if (url === 'about:blank') return false;
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            return this.popupOnlySites.some(site => hostname.includes(site));
        } catch (e) {
            return false;
        }
    }

    navigateTo = (url) => {
        let processedUrl = url.trim();
        if (processedUrl.length === 0) return;

        // Start Page
        if (processedUrl === 'about:blank') {
            this.setState({
                currentUrl: 'about:blank',
                displayUrl: '',
                isStartPage: true,
                useProxy: true,
                loading: false
            });
            return;
        }

        // Search vs URL
        if (!processedUrl.includes('.') && !processedUrl.startsWith('http') && !processedUrl.startsWith('about:')) {
            // Search - Use Google (Proxy handles it now!)
            processedUrl = `https://www.google.com/search?q=${encodeURIComponent(processedUrl)}`;
        } else {
            if (processedUrl.indexOf("http://") !== 0 && processedUrl.indexOf("https://") !== 0 && processedUrl.indexOf("about:") !== 0) {
                processedUrl = "https://" + processedUrl;
            }
        }

        // Smart checks
        const shouldPopup = this.shouldUsePopup(processedUrl);

        if (shouldPopup) {
            this.setState({
                displayUrl: processedUrl,
                useProxy: false, // Switch UI to popup mode
                isStartPage: false
            });
            this.openInPopup(processedUrl);
            return;
        }

        // Embedded load
        if (this.state.useProxy) {
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(processedUrl)}`;
            this.setState({
                currentUrl: proxyUrl,
                displayUrl: processedUrl,
                loading: true,
                isStartPage: false
            });
        } else {
            this.openInPopup(processedUrl);
            this.setState({ displayUrl: processedUrl, isStartPage: false });
        }
    }

    goToHome = () => {
        this.navigateTo('about:blank');
    }

    componentDidMount() {
        let savedBookmarks = localStorage.getItem("flash-bookmarks");
        if (savedBookmarks) {
            try {
                this.setState({ bookmarks: JSON.parse(savedBookmarks) });
            } catch (e) {
                console.error("Failed to load bookmarks:", e);
            }
        }
    }

    saveBookmarks = () => {
        localStorage.setItem("flash-bookmarks", JSON.stringify(this.state.bookmarks));
    }



    goBack = () => {
        if (this.iframeRef.current && this.iframeRef.current.contentWindow) {
            this.iframeRef.current.contentWindow.history.back();
        }
    }

    goForward = () => {
        if (this.iframeRef.current && this.iframeRef.current.contentWindow) {
            this.iframeRef.current.contentWindow.history.forward();
        }
    }

    reload = () => {
        if (this.state.useProxy) {
            this.navigateTo(this.state.displayUrl);
        } else if (this.iframeRef.current) {
            this.iframeRef.current.src = this.iframeRef.current.src;
        }
    }

    handleUrlBarKeyDown = (e) => {
        if (e.key === "Enter") {
            this.navigateTo(e.target.value);
            e.target.blur();
        }
    }

    handleUrlBarChange = (e) => {
        this.setState({ displayUrl: e.target.value });
    }

    handleUrlBarFocus = (e) => {
        e.target.select();
    }

    handleIframeLoad = () => {
        this.setState({ loading: false });
    }

    addBookmark = () => {
        const url = this.state.displayUrl;
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

    toggleMode = () => {
        this.setState(prevState => ({ useProxy: !prevState.useProxy }));
    }

    render() {
        const { displayUrl, currentUrl, showBookmarks, bookmarks, loading, useProxy, isStartPage } = this.state;
        const isBookmarked = bookmarks.find(b => b.url === displayUrl);

        return (
            <div className="h-full w-full flex flex-col bg-ub-cool-grey">
                {/* Toolbar */}
                <div className="w-full py-2 px-2 flex justify-start items-center text-white text-sm border-b border-gray-900 bg-ub-grey">
                    {/* Navigation buttons */}
                    <button
                        onClick={this.goBack}
                        className="p-1.5 rounded-full hover:bg-gray-700 ml-1"
                        title="Back"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={this.goForward}
                        className="p-1.5 rounded-full hover:bg-gray-700"
                        title="Forward"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    <button
                        onClick={this.reload}
                        className="p-1.5 rounded-full hover:bg-gray-700"
                        title="Reload"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>

                    <button
                        onClick={this.goToHome}
                        className="p-1.5 rounded-full hover:bg-gray-700"
                        title="Home"
                    >
                        <img className="w-4 h-4" src="./themes/Yaru/status/chrome_home.svg" alt="Home" />
                    </button>

                    {/* URL bar */}
                    <div className="flex-1 mx-2 flex items-center bg-ub-cool-grey rounded-full px-3 py-1">
                        {loading && (
                            <div className="w-4 h-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            onKeyDown={this.handleUrlBarKeyDown}
                            onChange={this.handleUrlBarChange}
                            onFocus={this.handleUrlBarFocus}
                            value={displayUrl}
                            className="outline-none bg-transparent flex-1 text-gray-300 text-sm focus:text-white"
                            type="text"
                            spellCheck={false}
                            autoComplete="off"
                            placeholder="Search or enter website..."
                        />
                    </div>

                    {/* Mode Toggle */}
                    <button
                        onClick={this.toggleMode}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold mr-2 transition-colors ${useProxy
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        title={useProxy ? "Embedded Mode (Proxy)" : "Popup Mode"}
                    >
                        {useProxy ? '🌐 Embedded' : '🔗 Popup'}
                    </button>

                    {/* Bookmark button */}
                    <button
                        onClick={this.addBookmark}
                        className={`p-1.5 rounded-full hover:bg-gray-700 ${isBookmarked ? 'text-yellow-400' : ''}`}
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
                                onClick={() => this.navigateTo(bookmark.url)}
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

                {/* Browser Content */}
                <div className="flex-1 relative bg-white overflow-hidden">
                    {/* Start Page */}
                    {isStartPage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-10">
                            <h1 className="text-6xl font-bold mb-8 flex items-center gap-4">
                                <span className="text-yellow-500">⚡</span>
                                <span>Flash</span>
                            </h1>
                            <div className="w-full max-w-2xl px-4">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        className="w-full py-4 pl-12 pr-4 rounded-full bg-gray-800 border-2 border-gray-700 focus:border-blue-500 focus:bg-gray-800 outline-none text-lg shadow-lg transition-all"
                                        placeholder="Search the web or enter URL..."
                                        onKeyDown={this.handleUrlBarKeyDown}
                                        autoFocus
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>
                                <div className="mt-8 grid grid-cols-4 gap-4">
                                    {[
                                        { name: 'Google', url: 'google.com', color: 'bg-white text-gray-900' },
                                        { name: 'Bing', url: 'bing.com', color: 'bg-blue-600' },
                                        { name: 'YouTube', url: 'youtube.com', color: 'bg-red-600' },
                                        { name: 'GitHub', url: 'github.com', color: 'bg-gray-800' },
                                    ].map(site => (
                                        <button
                                            key={site.name}
                                            onClick={() => this.navigateTo(site.url)}
                                            className={`${site.color} p-4 rounded-xl hover:scale-105 transition-transform font-bold shadow-lg`}
                                        >
                                            {site.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {!isStartPage && (
                        useProxy ? (
                            <iframe
                                ref={this.iframeRef}
                                src={currentUrl}
                                onLoad={this.handleIframeLoad}
                                className="w-full h-full border-0 bg-white"
                                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                                title="Flash Browser"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-4">
                                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🔗</div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Opened in Popup</h2>
                                    <p className="text-gray-500 mb-8">
                                        This website ({new URL(displayUrl.startsWith('http') ? displayUrl : 'https://' + displayUrl).hostname}) works best in a separate window.
                                    </p>
                                    <button
                                        onClick={() => this.navigateTo(displayUrl)}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>Re-open Window</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </button>
                                    <button
                                        onClick={() => this.setState({ useProxy: true, loading: true, currentUrl: `/api/proxy?url=${encodeURIComponent(displayUrl)}` })}
                                        className="mt-4 text-sm text-gray-400 hover:text-gray-600 hover:underline"
                                    >
                                        Try forcing embedded mode (might break)
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        )
    }
}

export default Flash;

export const displayFlash = () => {
    return <Flash />;
}
