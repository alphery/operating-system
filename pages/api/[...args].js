export default async function handler(req, res) {
    // This catch-all route handles resources that "leaked" out of the proxy
    // and are being requested relative to /api/ on localhost.

    // 1. Get the context from the cookie
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/proxy_url=([^;]+)/);

    if (!match) {
        return res.status(404).send('Resource not found (no proxy context)');
    }

    const origin = decodeURIComponent(match[1]);

    // 2. Construct the target URL
    // We assume the request path relative to /api/ maps to the origin root or relative path
    // Remove '/api' prefix
    let cleanPath = req.url;
    if (cleanPath.startsWith('/api')) {
        cleanPath = cleanPath.substring(4); // Remove '/api'
    }

    const targetUrl = new URL(cleanPath, origin).href;

    // 3. Proxy the request
    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
        });

        const contentType = response.headers.get('content-type');

        // Forward content
        const buffer = await response.arrayBuffer();

        if (contentType) res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');

        res.send(Buffer.from(buffer));

    } catch (e) {
        console.error('Catch-all proxy error:', e);
        res.status(404).send('Not found');
    }
}
