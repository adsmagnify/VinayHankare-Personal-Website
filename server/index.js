import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createBookingHandler, loadEnvFile } from "./booking.js";

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnvFile(path.join(here, "../.env"));

const handler = createBookingHandler(process.env);
const root = path.resolve(here, "../dist");
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    if (url === "/api/booking") {
      handler(req, res, () => {});
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.statusCode = 405;
      res.end();
      return;
    }
    const filePath = path.normalize(path.join(root, url));
    if (!filePath.startsWith(root)) {
      res.statusCode = 403;
      res.end();
      return;
    }
    let file = filePath;
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, "index.html");
    if (!fs.existsSync(file)) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => {
    console.log("Site and booking form listening on http://localhost:" + port);
  });
