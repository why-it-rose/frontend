import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, "dist");
const INDEX_PATH = path.join(DIST_DIR, "index.html");
const PORT = Number(process.env.PORT || 4173);
const SITE_URL = (process.env.SITE_URL || "https://why-it-rose.com").replace(/\/+$/, "");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function isAssetRequest(pathname) {
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

function toPublicUrl(req) {
  const host = req.headers.host;
  if (!host) return SITE_URL;

  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol =
    typeof forwardedProto === "string" && forwardedProto.length > 0
      ? forwardedProto.split(",")[0].trim()
      : "https";

  return `${protocol}://${host}`;
}

async function readFileSafe(filePath) {
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

function withOgUrl(html, absoluteUrl) {
  const escapedUrl = escapeHtml(absoluteUrl);

  let next = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapedUrl}" />`,
  );

  if (next === html) {
    next = next.replace(
      /<\/head>/i,
      `  <meta property="og:url" content="${escapedUrl}" />\n</head>`,
    );
  }

  if (/<link rel="canonical"/i.test(next)) {
    next = next.replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${escapedUrl}" />`,
    );
  } else {
    next = next.replace(
      /<\/head>/i,
      `  <link rel="canonical" href="${escapedUrl}" />\n</head>`,
    );
  }

  return next;
}

async function serveIndex(req, res) {
  const htmlBuffer = await readFileSafe(INDEX_PATH);
  if (!htmlBuffer) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("dist/index.html not found. Run `pnpm build` first.");
    return;
  }

  const requestUrl = new URL(req.url || "/", toPublicUrl(req));
  const html = withOgUrl(htmlBuffer.toString("utf-8"), requestUrl.toString());

  res.writeHead(200, {
    "Cache-Control": "no-cache",
    "Content-Type": "text/html; charset=utf-8",
  });
  res.end(html);
}

async function serveStatic(pathname, res) {
  const safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(DIST_DIR, safePath);
  const stat = await fs.stat(filePath).catch(() => null);

  if (!stat || !stat.isFile()) return false;

  const ext = path.extname(filePath).toLowerCase();
  const body = await fs.readFile(filePath);

  res.writeHead(200, {
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
    "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
  });
  res.end(body);
  return true;
}

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || "/", "http://localhost");
    const pathname = requestUrl.pathname;

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Method Not Allowed");
      return;
    }

    if (pathname.startsWith("/api/")) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }

    const staticServed = await serveStatic(pathname, res);
    if (staticServed) return;

    if (isAssetRequest(pathname)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }

    await serveIndex(req, res);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(error instanceof Error ? error.message : "Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`OG-ready server listening on http://localhost:${PORT}`);
});
