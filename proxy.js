const http = require('http');
const https = require('https');
const url = require('url');


const server = http.createServer((req, res) => {
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

    // Extract lang parameter from the incoming request or default to 'uz'
    const incomingLang = queryObject.lang || 'uz';

    // Modify query parameters to include the desired language
    const queryParams = new URLSearchParams(parsedTargetUrl.query);
    queryParams.set('lang', incomingLang);
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

    console.log('Proxied URL:', modifiedPath); // Log the modified path
    console.log('Request Headers:', proxyOptions.headers); // Log the request headers

    const proxyRequest = protocol.request(proxyOptions, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
            ...proxyRes.headers,
            'Access-Control-Allow-Origin': '*',
        });
        console.log('Response Headers:', proxyRes.headers); // Log the response headers
        proxyRes.pipe(res);
    });

    proxyRequest.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Error: Unable to proxy the request. ${err.message}\n`);
    });

    req.pipe(proxyRequest);
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
    console.log(`To proxy a URL, visit http://localhost:${PORT}/?url=http://example.com&lang=uz`);
});
