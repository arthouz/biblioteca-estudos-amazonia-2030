// Servidor estático mínimo com suporte a HTTP Range (necessário para abrir PDFs grandes sem baixar tudo).
import http from "node:http";
import { createReadStream, statSync, existsSync } from "node:fs";
import path from "node:path";

const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".pdf": "application/pdf", ".woff": "font/woff", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".wasm": "application/wasm", ".bcmap": "application/octet-stream", ".pfb": "application/octet-stream", ".ttf": "font/ttf", ".icc": "application/octet-stream", ".txt": "text/plain; charset=utf-8", ".map": "application/json" };

export function start(rootDir = "dist", portNum = 0) {
  const root = path.resolve(rootDir);
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const file = path.join(root, p);
    if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }); return res.end("Não encontrado"); }
    const size = statSync(file).size;
    const type = types[path.extname(file).toLowerCase()] || "application/octet-stream";
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = m[1] ? parseInt(m[1]) : 0, end = m[2] ? parseInt(m[2]) : size - 1;
      if (!m[1] && m[2]) { start = size - parseInt(m[2]); end = size - 1; }
      res.writeHead(206, { "content-type": type, "content-range": `bytes ${start}-${end}/${size}`, "accept-ranges": "bytes", "content-length": end - start + 1 });
      return createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { "content-type": type, "content-length": size, "accept-ranges": "bytes" });
    createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(portNum, "127.0.0.1", () => r({ server, port: server.address().port })));
}
if (import.meta.url === `file://${process.argv[1]}`) start(process.argv[2] || "dist", Number(process.argv[3] || process.env.PORT || 4173)).then(({ port }) => console.log(`http://127.0.0.1:${port}`));
