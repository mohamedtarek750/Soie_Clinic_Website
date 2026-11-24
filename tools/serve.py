#!/usr/bin/env python3
"""Serve the static build with Vercel-style clean URLs and language-specific errors."""

import argparse
import io
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
CONFIG = json.loads((ROOT / "vercel.json").read_text())
REDIRECTS = {
    rule["source"]: rule["destination"]
    for rule in CONFIG["redirects"]
    if not rule.get("has") and ":" not in rule["source"]
}


class SiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=DIST, **kwargs):
        super().__init__(*args, directory=str(directory), **kwargs)

    def send_head(self):
        request = urlsplit(self.path)
        path = unquote(request.path)
        # The migration rule takes precedence when the request carries the old host.
        hostname = self.headers.get("Host", "").partition(":")[0].lower()
        for rule in CONFIG["redirects"]:
            conditions = rule.get("has", [])
            if (rule["source"] == "/:path*" and len(conditions) == 1
                    and conditions[0].get("type") == "host" and conditions[0].get("value") == hostname):
                location = rule["destination"].replace("/:path*", request.path)
                return self.send_redirect(location, request.query)

        destination = REDIRECTS.get(path)
        if not destination and path.rstrip("/").endswith(("/index", "/index.html")):
            destination = path.rstrip("/").rsplit("/", 1)[0] or "/"
        if not destination and path.endswith("/") and path != "/":
            destination = path.rstrip("/")
        if not destination and path.endswith(".html"):
            destination = path[:-5]
        if destination:
            return self.send_redirect(quote(destination, safe="/-._~"), request.query)

        root = Path(self.directory).resolve()
        candidate = root / ("index.html" if path == "/" else path.lstrip("/"))
        if not candidate.suffix:
            candidate = candidate.with_suffix(".html")
        candidate = candidate.resolve()
        if not candidate.is_relative_to(root) or not candidate.is_file() or path in ("/404", "/ar/404"):
            return self.not_found(path)
        self.path = "/" + quote(candidate.relative_to(root).as_posix())
        return super().send_head()

    def send_redirect(self, location, query):
        self.send_response(308)
        # Keep the query verbatim, including legacy booking selections.
        self.send_header("Location", location + ("?" + query if query else ""))
        self.send_header("Content-Length", "0")
        self.end_headers()
        return None

    def end_headers(self):
        # Mirror static deployment headers so the local browser checks exercise the CSP.
        path = urlsplit(self.path).path
        headers = {}
        for rule in CONFIG.get("headers", []):
            pattern = rule["source"]
            if pattern == "/(.*)" or (pattern.startswith(("/assets/", "/static/", "/api/"))
                                      and path.startswith(pattern.split(":")[0])):
                headers.update({item["key"]: item["value"] for item in rule["headers"]})
        for key, value in headers.items():
            self.send_header(key, value)
        super().end_headers()

    def not_found(self, path):
        page = "ar/404.html" if path == "/ar" or path.startswith("/ar/") else "404.html"
        try:
            body = (Path(self.directory) / page).read_bytes()
        except FileNotFoundError:
            body = b"Page not found."
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        return io.BytesIO(body)

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError):
            pass  # A browser can stop loading a video when navigating away.


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--bind", default="127.0.0.1")
    parser.add_argument("--directory", default=str(DIST), type=Path)
    args = parser.parse_args()
    if not (args.directory / "index.html").is_file():
        parser.error("Build the site first with node build.mjs.")
    handler = partial(SiteHandler, directory=args.directory)
    with ThreadingHTTPServer((args.bind, args.port), handler) as server:
        print(f"Soie Clinics preview on {args.bind}:{args.port}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
