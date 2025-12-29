const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Proxy server is running' });
});

// Main proxy endpoint
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({
            error: 'Missing URL parameter. Usage: /proxy?url=https://example.com'
        });
    }

    try {
        console.log(`[PROXY] Fetching: ${targetUrl}`);

        // Fetch the target website
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            maxRedirects: 5,
            validateStatus: function (status) {
                return status >= 200 && status < 600; // Accept any status
            },
            timeout: 30000, // 30 second timeout
            responseType: 'arraybuffer' // Get raw response
        });

        // Get content type
        const contentType = response.headers['content-type'] || 'text/html';

        // Set response headers, stripping CSP and X-Frame-Options
        res.setHeader('Content-Type', contentType);

        // Copy relevant headers (but exclude security headers that block iframes)
        const allowedHeaders = [
            'content-encoding',
            'content-language',
            'cache-control',
            'expires',
            'last-modified',
            'etag'
        ];

        allowedHeaders.forEach(header => {
            if (response.headers[header]) {
                res.setHeader(header, response.headers[header]);
            }
        });

        // IMPORTANT: Don't set these headers (they block iframes)
        // - x-frame-options
        // - content-security-policy
        // - x-content-security-policy

        // Send the response
        res.status(response.status).send(response.data);

        console.log(`[PROXY] ✓ Success: ${targetUrl} (${response.status})`);

    } catch (error) {
        console.error(`[PROXY] ✗ Error fetching ${targetUrl}:`, error.message);

        if (error.response) {
            // Server responded with error
            return res.status(error.response.status).json({
                error: 'Target server error',
                status: error.response.status,
                message: error.message
            });
        } else if (error.request) {
            // No response received
            return res.status(503).json({
                error: 'No response from target server',
                message: error.message
            });
        } else {
            // Error in setting up request
            return res.status(500).json({
                error: 'Proxy server error',
                message: error.message
            });
        }
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  🚀 Q-OS Proxy Server Running                           ║
║  📡 Port: ${PORT}                                         ║
║  🌐 Endpoint: http://localhost:${PORT}/proxy?url=<URL>   ║
║  ❤️  Health Check: http://localhost:${PORT}/health       ║
╚══════════════════════════════════════════════════════════╝
    `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});
