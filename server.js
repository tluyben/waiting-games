import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;
const HOST = '0.0.0.0';
const DOCS_DIR = join(__dirname, 'docs');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.md': 'text/plain'
};

const server = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  let filePath = req.url === '/' ? '/index.html' : req.url;

  // Remove query strings
  filePath = filePath.split('?')[0];

  const fullPath = join(DOCS_DIR, filePath);

  // Security: prevent directory traversal
  if (!fullPath.startsWith(DOCS_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!existsSync(fullPath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const stat = statSync(fullPath);
  if (stat.isDirectory()) {
    // Try index.html in directory
    const indexPath = join(fullPath, 'index.html');
    if (existsSync(indexPath)) {
      serveFile(indexPath, res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
    return;
  }

  serveFile(fullPath, res);
});

function serveFile(filePath, res) {
  const ext = extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const content = readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}

server.listen(PORT, HOST, () => {
  console.log(`🕹️  Waiting Games dev server running at http://${HOST}:${PORT}`);
  console.log(`📁 Serving files from: ${DOCS_DIR}`);
  console.log(`❤️  Health check: http://${HOST}:${PORT}/health`);
  console.log('\nPress Ctrl+C to stop');
});
