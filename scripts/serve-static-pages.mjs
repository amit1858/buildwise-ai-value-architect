import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "out");
const basePath = "/buildwise-ai-value-architect";
const port = Number(process.env.PORT || 3002);
const types = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".txt": "text/plain" };

createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === basePath) pathname = "/";
  else if (pathname.startsWith(`${basePath}/`)) pathname = pathname.slice(basePath.length);
  const relative = normalize(pathname).replace(/^([/\\])+/, "");
  if (relative.startsWith("..")) {
    response.writeHead(400, { "Content-Type": "text/plain" });
    response.end("Invalid path");
    return;
  }
  let file = join(root, relative);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  if (!existsSync(file)) {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => console.log(`Static Pages server listening on ${port}`));
