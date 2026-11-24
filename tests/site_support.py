"""Parse the static response and make local requests without loading external resources."""
from functools import cache, partial
from html.parser import HTMLParser
from http.server import ThreadingHTTPServer
import json
from pathlib import Path
import subprocess
import sys
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import build_opener, HTTPRedirectHandler, ProxyHandler, Request

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
sys.path.insert(0, str(ROOT / "tools"))
from serve import SiteHandler  # noqa: E402


def norm(value):
    return " ".join(value.split())


class Element:
    def __init__(self, tag, attrs):
        self.tag, self.attrs, self.parts = tag, dict(attrs), []

    @property
    def text(self):
        return norm("".join(self.parts))


class Document(HTMLParser):
    void = set("area base br col embed hr img input link meta param source track wbr".split())

    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.elements, self.stack, self.details, self.figures = [], [], [], []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        el = Element(tag, attrs)
        self.elements.append(el)
        if tag == "details" and any(e.tag == "main" for e in self.stack):
            self.details.append(el)
        if tag == "figure":
            self.figures.append(el)
        if tag == "br":
            self.handle_data(" ")
        if tag not in self.void:
            self.stack.append(el)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.void:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i].tag == tag:
                if tag == "summary":
                    detail = next((e for e in reversed(self.stack[:i]) if e.tag == "details"), None)
                    if detail:
                        detail.question = self.stack[i].text
                        detail.answer = []
                del self.stack[i:]
                break

    def handle_data(self, value):
        if self.stack and self.stack[-1].tag in ("script", "style"):
            self.stack[-1].parts.append(value)
            return
        for el in self.stack:
            if el.tag in ("main", "body", "title", "h1", "h2", "h3", "h4", "h5", "h6", "summary", "figcaption"):
                el.parts.append(value)
            if el.tag == "details" and hasattr(el, "answer"):
                el.answer.append(value)

    def tags(self, tag):
        return [e for e in self.elements if e.tag == tag]

    def attrs(self, tag, **match):
        return [e.attrs for e in self.tags(tag) if match.items() <= e.attrs.items()]

    def first(self, tag, attr, **match):
        (item,) = self.attrs(tag, **match)
        return item[attr]

    def meta(self, key, value):
        return self.first("meta", "content", **{key: value})

    @property
    def canonical(self):
        return self.first("link", "href", rel="canonical")

    @property
    def alternates(self):
        return {a["hreflang"]: a["href"] for a in self.attrs("link", rel="alternate") if "hreflang" in a}

    @property
    def faqs(self):
        return [(el.question, norm("".join(el.answer))) for el in self.details if hasattr(el, "question")]

    @property
    def graph(self):
        (el,) = [s for s in self.tags("script") if s.attrs.get("type") == "application/ld+json"]
        payload = json.loads("".join(el.parts))
        assert payload["@context"] == "https://schema.org"
        return payload["@graph"]


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class QuietHandler(SiteHandler):
    def log_message(self, *args):
        pass


@cache
def prepare():
    subprocess.run(["node", "build.mjs"], cwd=ROOT, check=True)
    return json.loads((ROOT / "data/site.json").read_text())


def read_pages(tree):
    result = {}
    for f in sorted(tree.rglob("*.html")):
        path = "/" + f.relative_to(tree).with_suffix("").as_posix()
        if path.endswith("/index"):
            path = path[:-6] or "/"
        if path in result:
            raise ValueError(f"Conflicting output for {path}")
        result[path] = Document(f.read_text())
    if "/" not in result:
        raise ValueError("Build did not emit a homepage")
    return result


class SiteTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.site = prepare()
        cls.origin = cls.site["origin"]
        cls.docs = read_pages(DIST)
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(DIST)))
        thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        thread.start()
        cls.addClassCleanup(thread.join)
        cls.addClassCleanup(cls.server.server_close)
        cls.addClassCleanup(cls.server.shutdown)
        cls.opener = build_opener(ProxyHandler({}), NoRedirect())
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def http(cls, path, method="GET"):
        try:
            response = cls.opener.open(Request(cls.base + path, method=method), timeout=10)
        except HTTPError as error:
            response = error
        with response:
            return response.status, response.headers, response.read()
