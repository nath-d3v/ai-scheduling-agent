import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/scheduler.js', ['scheduler.js', 'text/javascript']],
]);

createServer(async (request, response) => {
  const asset = assets.get(new URL(request.url, 'http://localhost').pathname);
  if (!asset) {
    response.writeHead(404).end('Not found');
    return;
  }
  const [path, type] = asset;
  try {
    const content = await readFile(new URL(path, import.meta.url));
    response.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` }).end(content);
  } catch {
    response.writeHead(500).end('Could not read demo asset');
  }
}).listen(4173, '127.0.0.1', () => console.log('Demo: http://127.0.0.1:4173'));
