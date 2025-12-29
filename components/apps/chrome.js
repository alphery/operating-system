import React, { Component } from 'react';

export class Chrome extends Component {
    constructor() {
        super();
        this.home_url = 'https://www.google.com/webhp?igu=1';
        this.iframeRefs = {};

        // Proxy server configuration
        // Using AllOrigins - reliable public CORS proxy for iframe embedding
        this.proxyUrl = 'https://api.allorigins.win/raw?url=';
        this.useProxy = true; // Set to false to disable proxy

        this.state = {
            tabs: [
                {
                    id: 1,
                    url: 'https://www.google.com/webhp?igu=1',
                    display_url: "https://www.google.com",
                    title: "Google",
                    history: ['https://www.google.com/webhp?igu=1'],
                    historyIndex: 0,
                    loadError: false,
                }
            ],
            activeTabId: 1,
            nextTabId: 2,
            bookmarks: [],
            showBookmarks: false,
        }
    }

    componentDidMount() {
        // Load saved tabs
        let savedTabs = localStorage.getItem("chrome-tabs");
        let savedBookmarks = localStorage.getItem("chrome-bookmarks");

        if (savedTabs) {
            try {
                const parsedTabs = JSON.parse(savedTabs);
                const activeTabId = parseInt(localStorage.getItem("chrome-active-tab")) || 1;
                const nextTabId = parseInt(localStorage.getItem("chrome-next-tab-id")) || 2;

                this.setState({
                    tabs: parsedTabs,
                    activeTabId: activeTabId,
                    nextTabId: nextTabId
                });
            } catch (e) {
                console.error("Failed to load tabs:", e);
            }
        }

        if (savedBookmarks) {
            try {
                this.setState({ bookmarks: JSON.parse(savedBookmarks) });
            } catch (e) {
                console.error("Failed to load bookmarks:", e);
            }
        }
    }

    saveTabs = () => {
        localStorage.setItem("chrome-tabs", JSON.stringify(this.state.tabs));
        localStorage.setItem("chrome-active-tab", this.state.activeTabId);
        localStorage.setItem("chrome-next-tab-id", this.state.nextTabId);
    }

    saveBookmarks = () => {
        localStorage.setItem("chrome-bookmarks", JSON.stringify(this.state.bookmarks));
    }

    getActiveTab = () => {
        return this.state.tabs.find(tab => tab.id === this.state.activeTabId);
    }

    updateTab = (tabId, updates) => {
        this.setState(prevState => ({
            tabs: prevState.tabs.map(tab =>
                tab.id === tabId ? { ...tab, ...updates } : tab
            )
        }), this.saveTabs);
    }

    navigateToUrl = (url, tabId = null) => {
        const targetTabId = tabId || this.state.activeTabId;
        const tab = this.state.tabs.find(t => t.id === targetTabId);

        if (!tab) return;

        let processedUrl = url.trim();
        if (processedUrl.length === 0) return;

        // Check if it's a search query or URL
        if (!processedUrl.includes('.') && !processedUrl.startsWith('http')) {
            // It's a search query
            processedUrl = `https://www.google.com/search?igu=1&q=${encodeURIComponent(processedUrl)}`;
        } else {
            // It's a URL
            if (processedUrl.indexOf("http://") !== 0 && processedUrl.indexOf("https://") !== 0) {
                processedUrl = "https://" + processedUrl;
            }
        }

        // Add to history
        const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), processedUrl];

        // Determine if we should use proxy for this URL
        const finalUrl = this.shouldUseProxy(processedUrl)
            ? this.proxyUrl + encodeURIComponent(processedUrl)
            : processedUrl;

        console.log(`[CHROME] Final URL being loaded: ${finalUrl}`);

        this.updateTab(targetTabId, {
            url: finalUrl,
            display_url: processedUrl, // Show the real URL in the address bar
            history: newHistory,
            historyIndex: newHistory.length - 1,
            title: new URL(processedUrl).hostname,
            loadError: false, // Reset error state on new navigation
        });

        // Still check for blocking (in case proxy is disabled or fails)
        if (!this.shouldUseProxy(processedUrl)) {
            setTimeout(() => {
                this.checkIfSiteIsBlocked(targetTabId, processedUrl);
            }, 2000);
        }
    }

    shouldUseProxy = (url) => {
        if (!this.useProxy) return false;

        try {
            const hostname = new URL(url).hostname.toLowerCase();

            // List of sites that need proxy
            const blockedSites = [
                'reddit.com',
                'facebook.com',
                'twitter.com',
                'x.com',
                'instagram.com',
                'linkedin.com',
                'tiktok.com',
                'pinterest.com',
                'medium.com',
                'quora.com'
            ];

            const shouldProxy = blockedSites.some(site => hostname.includes(site));

            console.log(`[CHROME] URL: ${url}`);
            console.log(`[CHROME] Hostname: ${hostname}`);
            console.log(`[CHROME] Using proxy: ${shouldProxy}`);

            return shouldProxy;
        } catch (e) {
            console.error('[CHROME] Error in shouldUseProxy:', e);
            return false;
        }
    }

    checkIfSiteIsBlocked = (tabId, url) => {
        try {
            const hostname = new URL(url).hostname.toLowerCase();

            // List of commonly blocked sites
            const blockedSites = [
                'reddit.com', 'www.reddit.com',
                'facebook.com', 'www.facebook.com',
                'twitter.com', 'www.twitter.com', 'x.com',
                'instagram.com', 'www.instagram.com',
                'linkedin.com', 'www.linkedin.com',
                'tiktok.com', 'www.tiktok.com',
                'pinterest.com', 'www.pinterest.com'
            ];

            // If it's a known blocked site, show error immediately
            if (blockedSites.some(site => hostname.includes(site))) {
                const iframe = this.iframeRefs[tabId];
                if (iframe) {
                    try {
                        // Try to access iframe document - will throw error if CSP blocked
                        const doc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (!doc || doc.location.href === 'about:blank') {
                            this.updateTab(tabId, { loadError: true });
                        }
                    } catch (e) {
                        // CSP or cross-origin error - site is blocked
                        this.updateTab(tabId, { loadError: true });
                    }
                }
            }
        } catch (e) {
            console.error("Error checking if site is blocked:", e);
        }
    }

    goBack = () => {
        const tab = this.getActiveTab();
        if (tab && tab.historyIndex > 0) {
            const newIndex = tab.historyIndex - 1;
            const url = tab.history[newIndex];
            this.updateTab(tab.id, {
                url: url,
                display_url: url,
                historyIndex: newIndex
            });
        }
    }

    goForward = () => {
        const tab = this.getActiveTab();
        if (tab && tab.historyIndex < tab.history.length - 1) {
            const newIndex = tab.historyIndex + 1;
            const url = tab.history[newIndex];
            this.updateTab(tab.id, {
                url: url,
                display_url: url,
                historyIndex: newIndex
            });
        }
    }

    refreshTab = () => {
        const tab = this.getActiveTab();
        if (tab) {
            // Force iframe reload
            const iframe = document.getElementById(`chrome-iframe-${tab.id}`);
            if (iframe) {
                iframe.src = iframe.src;
            }
        }
    }

    goToHome = () => {
        this.navigateToUrl('https://www.google.com/webhp?igu=1');
    }

    addNewTab = () => {
        const newTab = {
            id: this.state.nextTabId,
            url: this.home_url,
            display_url: "https://www.google.com",
            title: "New Tab",
            history: [this.home_url],
            historyIndex: 0,
            loadError: false,
        };

        this.setState(prevState => ({
            tabs: [...prevState.tabs, newTab],
            activeTabId: newTab.id,
            nextTabId: prevState.nextTabId + 1
        }), this.saveTabs);
    }

    switchTab = (tabId) => {
        this.setState({ activeTabId: tabId }, this.saveTabs);
    }

    closeTab = (tabId, e) => {
        e.stopPropagation();

        if (this.state.tabs.length === 1) {
            // Don't close the last tab, just navigate to home
            this.navigateToUrl(this.home_url, tabId);
            return;
        }

        const tabIndex = this.state.tabs.findIndex(t => t.id === tabId);
        let newActiveTabId = this.state.activeTabId;

        if (tabId === this.state.activeTabId) {
            // Activate the next tab or previous if it's the last one
            const newIndex = tabIndex === this.state.tabs.length - 1 ? tabIndex - 1 : tabIndex;
            newActiveTabId = this.state.tabs[newIndex].id;
        }

        this.setState(prevState => ({
            tabs: prevState.tabs.filter(tab => tab.id !== tabId),
            activeTabId: newActiveTabId
        }), this.saveTabs);
    }

    addBookmark = () => {
        const tab = this.getActiveTab();
        if (tab && !this.state.bookmarks.find(b => b.url === tab.url)) {
            this.setState(prevState => ({
                bookmarks: [...prevState.bookmarks, {
                    url: tab.url,
                    title: tab.title,
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

    handleUrlBarKeyDown = (e) => {
        if (e.key === "Enter") {
            this.navigateToUrl(e.target.value);
            e.target.blur();
        }
    }

    handleUrlBarChange = (e) => {
        const tab = this.getActiveTab();
        if (tab) {
            this.updateTab(tab.id, { display_url: e.target.value });
        }
    }

    handleUrlBarFocus = (e) => {
        e.target.select();
    }

    renderTabs = () => {
        return (
            <div className="flex items-center bg-ub-grey border-b border-gray-900 overflow-x-auto">
                {this.state.tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => this.switchTab(tab.id)}
                        className={`flex items-center px-3 py-1.5 border-r border-gray-700 cursor-pointer min-w-max max-w-xs ${tab.id === this.state.activeTabId
                            ? 'bg-ub-cool-grey text-white'
                            : 'bg-ub-grey text-gray-400 hover:bg-gray-800'
                            }`}
                    >
                        <span className="text-xs truncate mr-2 max-w-[150px]">{tab.title}</span>
                        <button
                            onClick={(e) => this.closeTab(tab.id, e)}
                            className="text-gray-400 hover:text-white text-xs ml-1"
                        >
                            ✕
                        </button>
                    </div>
                ))}
                <button
                    onClick={this.addNewTab}
                    className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800 text-sm"
                >
                    +
                </button>
            </div>
        );
    }

    renderUrlBar = () => {
        const tab = this.getActiveTab();
        const canGoBack = tab && tab.historyIndex > 0;
        const canGoForward = tab && tab.historyIndex < tab.history.length - 1;
        const isBookmarked = tab && this.state.bookmarks.find(b => b.url === tab.url);

        return (
            <div className="w-full py-2 px-2 flex justify-start items-center text-white text-sm border-b border-gray-900 bg-ub-grey">
                {/* Back button */}
                <button
                    onClick={this.goBack}
                    disabled={!canGoBack}
                    className={`p-1.5 rounded-full ${canGoBack
                        ? 'hover:bg-gray-700 cursor-pointer'
                        : 'opacity-30 cursor-not-allowed'
                        }`}
                    title="Back"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* Forward button */}
                <button
                    onClick={this.goForward}
                    disabled={!canGoForward}
                    className={`p-1.5 rounded-full ${canGoForward
                        ? 'hover:bg-gray-700 cursor-pointer'
                        : 'opacity-30 cursor-not-allowed'
                        }`}
                    title="Forward"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* Refresh button */}
                <button
                    onClick={this.refreshTab}
                    className="p-1.5 rounded-full hover:bg-gray-700 ml-1"
                    title="Refresh"
                >
                    <img className="w-4 h-4" src="./themes/Yaru/status/chrome_refresh.svg" alt="Refresh" />
                </button>

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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                        onKeyDown={this.handleUrlBarKeyDown}
                        onChange={this.handleUrlBarChange}
                        onFocus={this.handleUrlBarFocus}
                        value={tab ? tab.display_url : ''}
                        className="outline-none bg-transparent flex-1 text-gray-300 text-sm focus:text-white"
                        type="text"
                        spellCheck={false}
                        autoComplete="off"
                        placeholder="Search or enter URL"
                    />
                </div>

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

                {/* Manual site blocked button */}
                {tab && !tab.loadError && (
                    <button
                        onClick={() => this.updateTab(tab.id, { loadError: true })}
                        className="p-1.5 rounded-full hover:bg-gray-700 ml-1 text-gray-400 hover:text-orange-400"
                        title="Site not loading? Click here"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                )}
            </div>
        );
    }

    renderBookmarksBar = () => {
        if (!this.state.showBookmarks || this.state.bookmarks.length === 0) return null;

        return (
            <div className="w-full bg-ub-grey border-b border-gray-900 px-3 py-1.5 flex flex-wrap gap-2">
                {this.state.bookmarks.map(bookmark => (
                    <div
                        key={bookmark.id}
                        onClick={() => this.navigateToUrl(bookmark.url)}
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
        );
    }

    handleIframeError = (tabId) => {
        console.log("Iframe load error detected for tab:", tabId);
        this.updateTab(tabId, { loadError: true });
    }

    openInNewTab = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    renderErrorOverlay = (tab) => {
        if (!tab.loadError) return null;

        const hostname = new URL(tab.url).hostname;

        return (
            <div className="absolute inset-0 flex items-center justify-center bg-white p-8">
                <div className="max-w-md text-center">
                    <div className="mb-6">
                        <svg className="w-20 h-20 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                        {hostname} refused to connect
                    </h2>
                    <p className="text-gray-600 mb-2">
                        This website blocks iframe embedding using <strong>Content Security Policy (CSP)</strong> with the <code className="bg-gray-100 px-1 rounded">frame-ancestors</code> directive.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Sites like <strong>Reddit, Facebook, Twitter, Instagram, LinkedIn</strong> use this security feature to prevent clickjacking attacks and unauthorized embedding.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => this.openInNewTab(tab.url)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open in New Browser Tab
                        </button>

                        <button
                            onClick={this.goToHome}
                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors"
                        >
                            Go to Google
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-800 mb-2">✅ These sites work well:</p>
                        <p className="text-xs text-green-700">
                            Google, YouTube, Wikipedia, GitHub, Stack Overflow, BBC, CNN, and many more!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const activeTab = this.getActiveTab();

        return (
            <div className="h-full w-full flex flex-col bg-ub-cool-grey">
                {this.renderTabs()}
                {this.renderUrlBar()}
                {this.renderBookmarksBar()}

                <div className="flex-grow relative">
                    {this.state.tabs.map(tab => (
                        <div
                            key={tab.id}
                            className={`absolute inset-0 ${tab.id === this.state.activeTabId ? 'block' : 'hidden'}`}
                        >
                            <iframe
                                ref={(ref) => this.iframeRefs[tab.id] = ref}
                                id={`chrome-iframe-${tab.id}`}
                                src={tab.url}
                                className="w-full h-full"
                                frameBorder="0"
                                title={`Browser Tab - ${tab.title}`}
                                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals allow-popups-to-escape-sandbox"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                onError={() => this.handleIframeError(tab.id)}
                            />
                            {this.renderErrorOverlay(tab)}
                        </div>
                    ))}
                </div>
            </div>
        )
    }
}

export default Chrome

export const displayChrome = () => {
    return <Chrome />;
}
