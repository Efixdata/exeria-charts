import { createServer } from "node:http";
import { existsSync, createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stat } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { registerCcxtRoutes } = require("../server/ccxtProxy.cjs");
const { registerTwelveDataRoutes } = require("../server/twelveDataProxy.cjs");
const { registerFinageRoutes } = require("../server/finageProxy.cjs");
const { registerFinnhubRoutes } = require("../server/finnhubProxy.cjs");
const { registerMassiveRoutes } = require("../server/massiveProxy.cjs");
const { registerCoinbaseRoutes } = require("../server/coinbaseProxy.cjs");
const { registerEodhdRoutes } = require("../server/eodhdProxy.cjs");
const { registerGateRoutes } = require("../server/gateProxy.cjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, "..");
const buildDir = path.join(docsRoot, "build");
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

if (!existsSync(buildDir)) {
  console.error(`[serve-with-api-proxy] Missing build directory at ${buildDir}`);
  console.error("Run `npm run build` in apps/docs first.");
  process.exit(1);
}

const routes = new Map();
const expressLike = {
  get(route, handler) {
    routes.set(route, handler);
  },
};

registerCcxtRoutes(expressLike);
registerTwelveDataRoutes(expressLike);
registerFinageRoutes(expressLike);
registerFinnhubRoutes(expressLike);
registerMassiveRoutes(expressLike);
registerCoinbaseRoutes(expressLike);
registerEodhdRoutes(expressLike);
registerGateRoutes(expressLike);

function sendFile(res, filePath) {
  const stream = createReadStream(filePath);
  stream.on("error", () => {
    res.statusCode = 404;
    res.end("Not found");
  });
  stream.pipe(res);
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
}

async function resolveStaticPath(urlPath) {
  const safePath = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  const normalized =
    safePath === "/" ? "/index.html" : safePath.endsWith("/") ? `${safePath}index.html` : safePath;

  const candidates = [
    path.join(buildDir, normalized),
    path.join(buildDir, `${normalized}.html`),
    path.join(buildDir, normalized, "index.html"),
  ];

  for (const candidate of candidates) {
    try {
      const fileStat = await stat(candidate);
      if (fileStat.isFile()) {
        return candidate;
      }
    } catch {
      // try next candidate
    }
  }

  return path.join(buildDir, "404.html");
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
  const apiHandler = routes.get(url.pathname);

  if (apiHandler && req.method === "GET") {
    apiHandler(req, res);
    return;
  }

  void resolveStaticPath(url.pathname).then((filePath) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType(filePath));
    sendFile(res, filePath);
  });
});

server.listen(port, host, () => {
  console.log(`[serve-with-api-proxy] http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`);
});
