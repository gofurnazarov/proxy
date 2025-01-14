const http = require('http');
const https = require('https');
const url = require('url');

// Create an HTTP server
const server = http.createServer((req, res) => {
    // Parse the query string to get the target URL
    const queryObject = url.parse(req.url, true).query;
    const targetUrl = queryObject.url;

    if (!targetUrl) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Error: Please provide a URL using the "url" query parameter.\n');
        return;
    }

    // Parse the target URL
    const parsedTargetUrl = url.parse(targetUrl);

    // Determine the appropriate module to use (http or https)
    const protocol = parsedTargetUrl.protocol === 'https:' ? https : http;

    // Make the request to the target URL
    const proxyRequest = protocol.request(targetUrl, (proxyRes) => {
        // Forward status and headers
        res.writeHead(proxyRes.statusCode, proxyRes.headers);

        // Pipe the response from the target server to the client
        proxyRes.pipe(res);
    });

    proxyRequest.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Error: Unable to proxy the request. ${err.message}\n`);
    });

    // Forward the client's request body (if any) to the target server
    req.pipe(proxyRequest);
});

// Start the server
const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
    console.log(`To proxy a URL, visit http://localhost:${PORT}/?url=http://example.com`);
});
