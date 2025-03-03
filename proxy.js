const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public'); // Change this if needed

const options = {
    key: fs.readFileSync('./privkey.pem'),
    cert: fs.readFileSync('./fullchain.pem')
};

const server = https.createServer(options, (req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': 86400,
        });
        res.end();
        return;
    }

    const queryObject = url.parse(req.url, true).query;
    const targetUrl = queryObject.url;

    if (!targetUrl) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Error: Please provide a URL using the "url" query parameter.\n');
        return;
    }

    const parsedTargetUrl = url.parse(targetUrl);
    const protocol = parsedTargetUrl.protocol === 'https:' ? https : http;

    // Forward all query parameters
    const queryParams = new URLSearchParams(parsedTargetUrl.query);
    Object.keys(queryObject).forEach(key => {
        if (key !== 'url') {
            queryParams.set(key, queryObject[key]);
        }
    });
    const modifiedPath = `${parsedTargetUrl.pathname}?${queryParams.toString()}`;

    const proxyOptions = {
        hostname: parsedTargetUrl.hostname,
        port: parsedTargetUrl.port || (parsedTargetUrl.protocol === 'https:' ? 443 : 80),
        path: modifiedPath,
        method: req.method,
        headers: {
            ...req.headers,
            'Host': parsedTargetUrl.host,
        },
    };

    console.log('Proxied URL:', modifiedPath);
    console.log('Request Headers:', proxyOptions.headers);

    const proxyRequest = protocol.request(proxyOptions, (proxyRes) => {
        const headers = {
            ...proxyRes.headers,
            'Access-Control-Allow-Origin': '*', // Set only once
        };

        // Remove redundant Access-Control-Allow-Origin header if it exists
        if (proxyRes.headers['access-control-allow-origin']) {
            delete headers['access-control-allow-origin'];
        }

        res.writeHead(proxyRes.statusCode, headers);
        console.log('Response Headers:', proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyRequest.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Error: Unable to proxy the request. ${err.message}\n`);
    });

    req.pipe(proxyRequest);
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
    console.log(`To proxy a URL, visit http://localhost:${PORT}/?url=http://example.com&lang=uz&orgunit=1000034185670`);
});

