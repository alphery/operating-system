// Next.js API route for proxying websites
// This bypasses CORS and X-Frame-Options restrictions

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const targetUrl = decodeURIComponent(url);

        // Fetch the website
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // Forward some headers if needed
            }
        });

        const contentType = response.headers.get('content-type') || 'text/html';
        let content = await response.text();

        // Only rewrite HTML content
        if (contentType.includes('text/html')) {
            const baseUrl = new URL(targetUrl);
            const origin = baseUrl.origin;

            // 1. INJECT MAGIC SCRIPT TO INTERCEPT FETCH/XHR
            const magicScript = `
                <script>
                    window.__PROXY_BASE__ = '/api/proxy?url=';
                    window.__TARGET_ORIGIN__ = '${origin}';
                    window.__TARGET_URL__ = '${targetUrl}';

                    (function() {
                        const originalFetch = window.fetch;
                        const originalXHROpen = XMLHttpRequest.prototype.open;

                        function rewriteUrl(url) {
                            if (!url) return url;
                            if (url.startsWith('/api/proxy')) return url;
                            if (url.startsWith('data:')) return url;
                            if (url.startsWith('blob:')) return url;
                            
                            try {
                                // Handle absolute URLs
                                if (url.startsWith('http')) {
                                    return window.__PROXY_BASE__ + encodeURIComponent(url);
                                }
                                // Handle root-relative URLs
                                if (url.startsWith('/')) {
                                    return window.__PROXY_BASE__ + encodeURIComponent(window.__TARGET_ORIGIN__ + url);
                                }
                                // Handle relative URLs
                                return window.__PROXY_BASE__ + encodeURIComponent(new URL(url, window.__TARGET_URL__).href);
                            } catch (e) { return url; }
                        }

                        // Override Fetch
                        window.fetch = function(input, init) {
                            if (typeof input === 'string') {
                                input = rewriteUrl(input);
                            }
                            return originalFetch(input, init);
                        };

                        // Override XHR
                        XMLHttpRequest.prototype.open = function(method, url, ...args) {
                            return originalXHROpen.call(this, method, rewriteUrl(url), ...args);
                        };
                    })();
                </script>
            `;

            // Inject script at the beginning of head
            content = content.replace('<head>', '<head>' + magicScript);

            // 2. REWRITE HTML ATTRIBUTES (Server-Side)
            // Rewrite src="..." and href="..."
            const rewriteRegex = /(src|href|action)=["']([^"']+)["']/g;
            content = content.replace(rewriteRegex, (match, attr, link) => {
                if (link.startsWith('http') || link.startsWith('/')) {
                    try {
                        const absoluteUrl = link.startsWith('http') ? link : origin + link;
                        return `${attr}="/api/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
                    } catch (e) { return match; }
                }
                return match;
            });

            // Remove Integrity checks (subresource integrity) because rewriting breaks hash
            content = content.replace(/integrity=["'][^"']*["']/g, '');
        }

        // Set headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        // Remove restrictive headers
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');

        res.send(content);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send(`Proxy Error: ${error.message}`);
    }
}
