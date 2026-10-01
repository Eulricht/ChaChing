const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const host = "127.0.0.1";
const port = Number(process.argv[2] || process.env.PORT || 8000);
const root = path.resolve(__dirname);

// Add MIME types here if a future project introduces another asset format.
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp"
};

function sendError(response, status, message) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
}

const server = http.createServer((request, response) => {
  let pathname;

  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${host}`).pathname);
  } catch {
    sendError(response, 400, "Bad request");
    return;
  }

  const requestedPath = path.resolve(root, `.${pathname}`);
  if (requestedPath !== root && !requestedPath.startsWith(`${root}${path.sep}`)) {
    sendError(response, 403, "Forbidden");
    return;
  }

  fs.stat(requestedPath, (statError, stats) => {
    const filePath = !statError && stats.isDirectory()
      ? path.join(requestedPath, "index.html")
      : requestedPath;

    fs.readFile(filePath, (readError, content) => {
      if (readError) {
        sendError(response, readError.code === "ENOENT" ? 404 : 500, "Not found");
        return;
      }

      response.writeHead(200, {
        // Disable caching so local CSS and JavaScript edits appear on refresh.
        "Cache-Control": "no-store",
        "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
      });
      response.end(content);
    });
  });
});

server.on("error", error => {
  console.error(`Unable to start local preview: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Local preview: http://${host}:${port}/`);
  console.log("Keep this window open. Press Ctrl+C to stop the preview.");
});
