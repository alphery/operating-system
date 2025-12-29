import React, { Component } from 'react';

export class ChromePopout extends Component {
    constructor() {
        super();
        this.home_url = 'https://www.google.com/webhp?igu=1';
        this.popoutWindows = {};

        this.state = {
            tabs: [
                {
                    id: 1,
                    url: 'https://www.google.com/webhp?igu=1',
                    display_url: "https://www.google.com",
                    title: "Google",
                    history: ['https://www.google.com/webhp?igu=1'],
                    historyIndex: 0,
                    isPopout: false,
                }
            ],
            activeTabId: 1,
            nextTabId: 2,
            bookmarks: [],
            showBookmarks: false,
        }
    }

    componentDidMount() {
        // Load saved tabs and bookmarks
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

    shouldOpenInPopout = (url) => {
        try {
            const hostname = new URL(url).hostname.toLowerCase();

            // Sites that don't work in iframes - open in new window
            const blockedSites = [
                'reddit.com',
                'facebook.com',
                'twitter.com',
                'x.com',
                'instagram.com',
                'linkedin.com',
                'tiktok.com',
                'pinterest.com',
            ];

            return blockedSites.some(site => hostname.includes(site));
        } catch (e) {
            return false;
        }
    }

    navigateToUrl = (url, tabId = null) => {
        const targetTabId = tabId || this.state.activeTabId;
        const tab = this.state.tabs.find(t => t.id === targetTabId);

        if (!tab) return;

        let processedUrl = url.trim();
        if (processedUrl.length === 0) return;

        // Check if it's a search query or URL
        if (!processedUrl.includes('.') && !processedUrl.startsWith('http')) {
            processedUrl = `https://www.google.com/search?igu=1&q=${encodeURIComponent(processedUrl)}`;
        } else {
            if (processedUrl.indexOf("http://") !== 0 && processedUrl.indexOf("https://") !== 0) {
                processedUrl = "https://" + processedUrl;
            }
        }

        // Check if this site should open in pop-out window
        if (this.shouldOpenInPopout(processedUrl)) {
            this.openInPopout(processedUrl, targetTabId);
            return;
        }

        // Add to history
        const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), processedUrl];

        this.updateTab(targetTabId, {
            url: processedUrl,
            display_url: processedUrl,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            title: new URL(processedUrl).hostname,
            isPopout: false,
        });
    }

    openInPopout = (url, tabId) => {
        console.log(`[CHROME POPOUT] Opening ${url} in new window/tab`);

        // Try opening in a pop-up window first
        const width = 1200;
        const height = 800;
        const left = window.screenX + 100;
        const top = window.screenY + 100;

        const features = `width=${width},height=${height},left=${left},top=${top},toolbar=yes,location=yes,directories=no,status=yes,menubar=no,scrollbars=yes,resizable=yes`;

        let popout = null;
        try {
            popout = window.open(url, `chrome-popout-${tabId}`, features);
        } catch (e) {
            console.error('[CHROME POPOUT] Error opening window:', e);
        }

        // Check if window was blocked or failed to open
        if (!popout || popout.closed || typeof popout.closed === 'undefined') {
            console.log('[CHROME POPOUT] Pop-up blocked, opening in new tab instead');
            // If pop-up blocked, just open in new tab (browsers don't block this)
            popout = window.open(url, '_blank');
        }

        // Store reference
        if (popout) {
            this.popoutWindows[tabId] = popout;
        }

        // Update tab to show it's in popout mode
        this.updateTab(tabId, {
            url: url,
            display_url: url,
            isPopout: true,
            title: new URL(url).hostname
        });

        console.log('[CHROME POPOUT] Window opened successfully!');
    }

    // [Rest of the methods from the original Chrome component...]
    // Including: goBack, goForward, refreshTab, goToHome, addNewTab, switchTab, closeTab, 
    // addBookmark, removeBookmark, toggleBookmarks, etc.

    goBack = () => {
        const tab = this.getActiveTab();
        if (tab && tab.historyIndex > 0 && !tab.isPopout) {
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
        if (tab && tab.historyIndex < tab.history.length - 1 && !tab.isPopout) {
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
            if (tab.isPopout && this.popoutWindows[tab.id]) {
                try {
                    this.popoutWindows[tab.id].location.reload();
                } catch (e) {
                    console.error('Cannot refresh popout window');
                }
            } else {
                const iframe = document.getElementById(`chrome-iframe-${tab.id}`);
                if (iframe) {
                    iframe.src = iframe.src;
                }
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
            isPopout: false,
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

        // Close popout window if exists
        if (this.popoutWindows[tabId]) {
            try {
                this.popoutWindows[tabId].close();
            } catch (e) { }
            delete this.popoutWindows[tabId];
        }

        if (this.state.tabs.length === 1) {
            this.navigateToUrl(this.home_url, tabId);
            return;
        }

        const tabIndex = this.state.tabs.findIndex(t => t.id === tabId);
        let newActiveTabId = this.state.activeTabId;

        if (tabId === this.state.activeTabId) {
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
                        {tab.isPopout && <span className="mr-1">🔵</span>}
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

                <button
                    onClick={this.refreshTab}
                    className="p-1.5 rounded-full hover:bg-gray-700 ml-1"
                    title="Refresh"
                >
                    <img className="w-4 h-4" src="./themes/Yaru/status/chrome_refresh.svg" alt="Refresh" />
                </button>

                <button
                    onClick={this.goToHome}
                    className="p-1.5 rounded-full hover:bg-gray-700 ml-1"
                    title="Home"
                >
                    <img className="w-4 h-4" src="./themes/Yaru/status/chrome_home.svg" alt="Home" />
                </button>

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

                <button
                    onClick={this.addBookmark}
                    className={`p-1.5 rounded-full hover:bg-gray-700 ${isBookmarked ? 'text-yellow-400' : ''}`}
                    title={isBookmarked ? "Bookmarked" : "Add bookmark"}
                >
                    <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                </button>

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

    renderPopoutMessage = (tab) => {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="text-center p-8 max-w-md">
                    <div className="mb-6">
                        <div className="w-24 h-24 mx-auto bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">
                        Site Opened in New Window!
                    </h2>
                    <p className="text-gray-600 mb-2">
                        <strong>{tab.title}</strong> opened in a separate browser window
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        This site doesn't support iframe embedding, so we opened it in your real browser for the best experience!
                    </p>

                    <div className="space-y-2">
                        <button
                            onClick={() => {
                                if (this.popoutWindows[tab.id]) {
                                    this.popoutWindows[tab.id].focus();
                                }
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                        >
                            Focus Window
                        </button>

                        <button
                            onClick={this.goToHome}
                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors"
                        >
                            Go to Google
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-semibold text-blue-800 mb-2">💡 Pro Tip:</p>
                        <p className="text-xs text-blue-700">
                            Arrange the pop-out window next to Q-OS for a dual-screen experience!
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
                            {tab.isPopout ? (
                                this.renderPopoutMessage(tab)
                            ) : (
                                <iframe
                                    id={`chrome-iframe-${tab.id}`}
                                    src={tab.url}
                                    className="w-full h-full"
                                    frameBorder="0"
                                    title={`Browser Tab - ${tab.title}`}
                                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals allow-popups-to-escape-sandbox"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }
}

export default ChromePopout

export const displayChromePopout = () => {
    return <ChromePopout />;
}
