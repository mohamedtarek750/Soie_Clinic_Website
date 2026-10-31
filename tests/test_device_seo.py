"""Device architecture checks. Run: python3 -m unittest discover -s tests -v."""

from html.parser import HTMLParser
from functools import partial
from http.server import ThreadingHTTPServer
import json
from pathlib import Path
import re
import sys
import threading
import unittest
from urllib.error import HTTPError
from urllib.parse import urljoin, urlsplit
from urllib.request import build_opener, HTTPRedirectHandler, Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from serve import SiteHandler  # noqa: E402

ORIGIN = "https://soie-clinic.vercel.app"
DEVICES = {
    "indiba-deep-care": ("indiba", "INDIBA", "indiba-session.mp4"),
    "cutera-excel-hr": ("cutera", "Cutera", "cutera-excel-hr.mp4"),
    "finexel-fractional-co2": ("finexel", "FineXel", "finexel-fractional-co2.mp4"),
}


def normalise(text):
    return " ".join(text.split())


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.source = source
        self.elements = []
        self.faqs = []
        self.field = None
        self.in_details = False
        self.feed(source)
        self.graph = []
        for raw in re.findall(r'<script type="application/ld\+json">(.*?)</script>', source, re.S):
            schema = json.loads(raw)
            self.graph.extend(schema.get("@graph", [schema]))

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))
        if tag == "details":
            self.in_details = True
            self.faqs.append({"name": "", "text": ""})
        if self.in_details and tag in ("summary", "p"):
            self.field = "name" if tag == "summary" else "text"

    def handle_endtag(self, tag):
        if tag == "details":
            self.in_details = False
        if tag in ("summary", "p", "details"):
            self.field = None

    def handle_data(self, data):
        if self.in_details and self.field:
            self.faqs[-1][self.field] += data

    def find(self, tag):
        return [attrs for name, attrs in self.elements if name == tag]


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class QuietHandler(SiteHandler):
    def log_message(self, *args):
        pass


class DeviceSEOTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = "http://127.0.0.1:" + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def document(self, path):
        with urlopen(self.base + path) as response:
            self.assertEqual(response.status, 200)
            return Document(response.read().decode())

    def test_catalogue_and_home_link_to_separate_pages_without_video_downloads(self):
        expected = {"/devices/" + slug for slug in DEVICES}
        for path in ("/", "/devices"):
            doc = self.document(path)
            cards = [a for a in doc.find("a") if "device-card" in a.get("class", "").split()]
            self.assertEqual({a["href"] for a in cards}, expected)
            self.assertEqual(len(cards), 3)
            self.assertFalse(doc.find("video"))
            self.assertNotIn('role="tab"', doc.source)
        listing = next(n for n in doc.graph if n["@type"] == "ItemList")
        self.assertEqual({n["url"] for n in listing["itemListElement"]}, {ORIGIN + p for p in expected})
        self.assertNotIn("FAQPage", {n["@type"] for n in doc.graph})

    def test_details_have_matching_metadata_faqs_schema_and_original_media(self):
        titles = set()
        for slug, (key, name, video) in DEVICES.items():
            path = "/devices/" + slug
            doc = self.document(path)
            canonical = next(a["href"] for a in doc.find("link") if a.get("rel") == "canonical")
            self.assertEqual(canonical, ORIGIN + path)
            title = re.search(r"<title>(.*?)</title>", doc.source, re.S)[1]
            titles.add(title)
            self.assertIn(name, title)
            self.assertIn("Cairo", title)
            self.assertEqual(len(doc.find("h1")), 1)
            self.assertEqual(len(doc.find("video")), 1)
            media = doc.find("video")[0]
            self.assertEqual(media["data-src"], "/assets/videos/" + video)
            self.assertEqual(media["preload"], "none")
            self.assertTrue(all(attr in media for attr in ("muted", "loop", "playsinline")))
            self.assertNotIn("src", media)
            types = {n["@type"] for n in doc.graph}
            self.assertTrue({"MedicalWebPage", "MedicalDevice", "MedicalProcedure", "FAQPage", "BreadcrumbList", "VideoObject"} <= types)
            faq = next(n for n in doc.graph if n["@type"] == "FAQPage")["mainEntity"]
            self.assertEqual(len(faq), len(doc.faqs))
            for visible, structured in zip(doc.faqs, faq):
                self.assertEqual(normalise(visible["name"]), structured["name"])
                self.assertEqual(normalise(visible["text"]), structured["acceptedAnswer"]["text"])
            self.assertTrue(any("cost" in q["name"].lower() for q in faq))
            video_schema = next(n for n in doc.graph if n["@type"] == "VideoObject")
            self.assertEqual(video_schema["contentUrl"], ORIGIN + media["data-src"])
            self.assertEqual(video_schema["thumbnailUrl"], ORIGIN + media["poster"])
            for tag, attrs in doc.elements:
                for attribute in ("href", "src", "poster", "data-src"):
                    value = attrs.get(attribute, "")
                    if not value or value.startswith("#") or urlsplit(value).scheme:
                        continue
                    resolved = urljoin(self.base + path, value)
                    with urlopen(Request(resolved, method="HEAD")) as response:
                        self.assertEqual(response.status, 200, (slug, tag, attribute, value))
        self.assertEqual(len(titles), 3)

    def test_old_links_and_file_aliases_permanently_redirect(self):
        aliases = {"/devices.html": "/devices", "/devices/index.html": "/devices", "/devices/": "/devices"}
        for slug, (key, _, _) in DEVICES.items():
            path = "/devices/" + slug
            aliases["/device-" + key + ".html"] = path
            aliases[path + "/index.html"] = path
            aliases[path + "/"] = path
        opener = build_opener(NoRedirect())
        for old, new in aliases.items():
            with self.assertRaises(HTTPError) as result:
                opener.open(self.base + old + "?utm_source=test")
            self.assertEqual(result.exception.code, 308)
            self.assertEqual(result.exception.headers["Location"], new + "?utm_source=test")
        with self.assertRaises(HTTPError) as result:
            urlopen(self.base + "/devices/not-an-existing-device")
        self.assertEqual(result.exception.code, 404)

    def test_sitemap_canonicals_and_internal_device_links_agree(self):
        sitemap = (ROOT / "sitemap.xml").read_text()
        self.assertIn(ORIGIN + "/sitemap.xml", (ROOT / "robots.txt").read_text())
        for page in ROOT.rglob("*.html"):
            doc = Document(page.read_text())
            canonical = next(a["href"] for a in doc.find("link") if a.get("rel") == "canonical")
            self.assertTrue(canonical.startswith(ORIGIN + "/"), page)
            self.assertIn("<loc>" + canonical + "</loc>", sitemap)
            self.assertNotIn("https://soieclinic.com", doc.source)
            ids = [a["id"] for _, a in doc.elements if "id" in a]
            self.assertEqual(len(ids), len(set(ids)), page)
            for a in doc.find("a"):
                self.assertNotRegex(a.get("href", ""), r"(?:^|/)(?:device-(?:indiba|cutera|finexel)|devices)\.html")


if __name__ == "__main__":
    unittest.main()
