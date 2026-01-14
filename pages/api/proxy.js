// Next.js API route for proxying websites
// This bypasses CORS and X-Frame-Options restrictions

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const targetUrl = decodeURIComponent(url);

        // Prevent loops: Don't proxy localhost
        if (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) {
            return res.status(400).json({ error: 'Cannot proxy localhost' });
        }

        // Fetch the website
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // Forward some headers if needed
            }
        });

        const contentType = response.headers.get('content-type') || 'text/html';
        let content = await response.text();

        // Set cookie for sticky sessions (URL resolution fallback)
        // We use the origin of the target URL as the context
        const baseUrl = new URL(targetUrl);
        const origin = baseUrl.origin;
        res.setHeader('Set-Cookie', `proxy_url=${encodeURIComponent(origin)}; Path=/; SameSite=Lax`);

        // Only rewrite HTML content
        if (contentType.includes('text/html')) {

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
                            if (typeof url !== 'string') return url;
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
                            } else if (input instanceof Request) {
                                input = new Request(rewriteUrl(input.url), input);
                            }
                            return originalFetch(input, init);
                        };

                        // Override XHR
                        XMLHttpRequest.prototype.open = function(method, url, ...args) {
                            this._originalUrl = url;
                            return originalXHROpen.call(this, method, rewriteUrl(url), ...args);
                        };
                    })();
                </script>
            `;

            // Inject script at the beginning of head
            content = content.replace('<head>', '<head>' + magicScript);

            // 2. REWRITE HTML ATTRIBUTES (Server-Side)
            // Rewrite src, href, action, srcset, data-src, poster
            const rewriteRegex = /(src|href|action|srcset|data-src|poster)=["']([^"']+)["']/g;
            content = content.replace(rewriteRegex, (match, attr, link) => {
                if (link.startsWith('data:') || link.startsWith('blob:') || link.startsWith('#')) return match;

                try {
                    let absoluteUrl = link;
                    if (link.startsWith('/')) {
                        absoluteUrl = origin + link;
                    } else if (link.startsWith('http')) {
                        absoluteUrl = link;
                    } else {
                        // Relative link
                        absoluteUrl = new URL(link, targetUrl).href;
                    }

                    return `${attr}="/api/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
                } catch (e) { return match; }
            });

            // Remove Integrity checks
            content = content.replace(/integrity=["'][^"']*["']/g, '');
            // Remove CSP
            content = content.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');
        }

        // Set headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // Remove restrictive headers
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');
        res.removeHeader('X-Content-Type-Options');

        res.send(content);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send(`Proxy Error: ${error.message}`);
    }
}
