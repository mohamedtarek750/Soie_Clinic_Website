#!/usr/bin/env python3
"""Preview this static site with the explicit routes in vercel.json."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "vercel.json").read_text())
REDIRECTS = {rule["source"]: rule["destination"] for rule in CONFIG["redirects"]}
REWRITES = {rule["source"]: rule["destination"] for rule in CONFIG["rewrites"]}


class SiteHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if not self.redirect():
            super().do_GET()

    def do_HEAD(self):
        if not self.redirect():
            super().do_HEAD()

    def redirect(self):
        parsed = urlsplit(self.path)
        destination = REDIRECTS.get(parsed.path)
        if parsed.path.endswith("/") and parsed.path.rstrip("/") in REWRITES:
            destination = parsed.path.rstrip("/")
        if not destination:
            return False
        if parsed.query:
            destination += "?" + parsed.query
        self.send_response(308)
        self.send_header("Location", destination)
        self.send_header("Content-Length", "0")
        self.end_headers()
        return True

    def translate_path(self, path):
        path = urlsplit(path).path
        return super().translate_path(REWRITES.get(path, path))

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError):
            # Browsers may stop an image or video request when navigating away.
            pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--bind", default="127.0.0.1")
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.bind, args.port), partial(SiteHandler, directory=str(ROOT)))
    print(f"Soie preview: http://{args.bind}:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
