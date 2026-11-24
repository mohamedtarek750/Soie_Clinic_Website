"""Crawl the generated files with JavaScript disabled and verify the publishing contracts."""
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
from urllib.parse import unquote, urljoin, urlsplit
import uuid
import xml.etree.ElementTree as ET

from site_support import DIST, ROOT, Document, SiteTest, norm, read_pages

NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9", "xhtml": "http://www.w3.org/1999/xhtml"}
BOTS = """GPTBot OAI-SearchBot ChatGPT-User ClaudeBot Claude-SearchBot Claude-User PerplexityBot
Perplexity-User Google-Extended Applebot-Extended Bingbot CCBot""".split()
BANNED_KEYS = {"price", "priceRange", "offers", "review", "aggregateRating"}
BANNED_TYPES = {"Person", "Physician", "Review", "AggregateRating"}
PRICE = re.compile(r"(?:[$]|\bEGP\s*|\bLE\s*)\s*\d|\d\s*(?:EGP\b|L\.?E\.?\b|ج\.?\s?م(?:\.|\b)|جنيه|[$])", re.I)
PERSON = re.compile(r"(?<!\w)(?:(?i:dr)(?:\.\s*|\s+)[^\W\d_]{2,}|(?:د\.\s*|(?:ال)?دكتور(?:ة)?\s+)(?!(?:تغذية|أسنان|تجميل|جلدية|مختص|متخصص|معالج|الأسنان|التغذية)\b)[ء-ي]{2,})")
PLACEHOLDER = re.compile(r"\b(null|undefined|TODO|PENDING)\b")
ARABIC = re.compile(r"[ء-ي]{2}")
CURRENCY_RATING = re.compile(r"[★⭐]|\b\d(?:\.\d)?\s*(?:out of 5|stars)\b|\b\d+\s+(?:Google )?reviews\b", re.I)


def normalized_path(path, prefix):
    return (prefix + path).rstrip("/") or "/"


def walk(value):
    if isinstance(value, list):
        for item in value:
            yield from walk(item)
    elif isinstance(value, dict):
        yield value
        for item in value.values():
            yield from walk(item)


def source_items():
    for lang in ("en", "ar"):
        for f in (ROOT / "src/content" / lang).rglob("*.json"):
            page = json.loads(f.read_text())
            yield normalized_path(page["path"], "/ar" if lang == "ar" else ""), page


def check_schema_urls(test, nodes, site):
    origin = site["origin"]
    profiles = set(site["brand"]["sameAs"])
    if site["brand"].get("facebookUrl"):
        profiles.add(site["brand"]["facebookUrl"])
    maps = {b["mapUrl"] for b in site["branches"] if b["mapUrl"]}
    for node in walk(nodes):
        for key, value in node.items():
            for url in value if isinstance(value, list) else [value]:
                if not isinstance(url, str):
                    continue
                if key == "sameAs":
                    test.assertIn(url, profiles)
                elif key == "hasMap":
                    test.assertIn(url, maps)
                elif key in ("medicalSpecialty", "dayOfWeek"):
                    test.assertTrue(url.startswith("https://schema.org/"), url)
                elif key in {"@id", "url", "logo", "image", "contentUrl", "thumbnailUrl", "item", "embedUrl"} or url.startswith(("https://", "http://", "/")):
                    test.assertTrue(url.startswith(origin + "/"), (key, url))


class StaticPublishingTests(SiteTest):
    def test_metadata_and_server_delivered_content(self):
        titles, descriptions = set(), set()
        for path, doc in self.docs.items():
            with self.subTest(path=path):
                ar = path == "/ar" or path.startswith("/ar/")
                self.assertEqual(doc.first("html", "lang"), "ar-EG" if ar else "en")
                self.assertEqual(doc.attrs("html")[0].get("dir", "ltr"), "rtl" if ar else "ltr")
                title, = [el.text for el in doc.tags("title")]
                desc = doc.meta("name", "description")
                self.assertTrue(0 < len(title) <= 60, title)
                self.assertTrue(120 <= len(desc) <= 160, (len(desc), desc))
                self.assertNotIn(title, titles)
                self.assertNotIn(desc, descriptions)
                titles.add(title)
                descriptions.add(desc)
                self.assertEqual(doc.canonical, self.origin + path)
                self.assertEqual(len(doc.tags("h1")), 1)
                self.assertTrue(all(el.text for el in doc.elements if el.tag in ("h1","h2","h3","h4","h5","h6")))
                main, = doc.tags("main")
                self.assertGreater(len(main.text), 30)
                if ar:
                    self.assertRegex(main.text, ARABIC)
                self.assertEqual(doc.meta("property", "og:url"), doc.canonical)
                self.assertEqual(doc.meta("name", "twitter:card"), "summary_large_image")
                self.assertTrue(doc.meta("property", "og:image").startswith(self.origin + "/"))
                self.assertTrue(doc.meta("property", "og:locale").startswith("ar" if ar else "en"))
                if doc.alternates:
                    self.assertTrue(doc.meta("property", "og:locale:alternate").startswith("en" if ar else "ar"))
                hrefs = [a.get("href", "") for a in doc.attrs("a")]
                self.assertTrue(any(h.startswith("tel:") for h in hrefs), path)
                self.assertTrue(any(h.startswith("https://wa.me/") for h in hrefs), path)
                for key, prop in (("google", "google-site-verification"), ("bing", "msvalidate.01")):
                    actual = [m["content"] for m in doc.attrs("meta", name=prop)]
                    expected = self.site["verification"][key]
                    self.assertEqual(actual, [expected] if expected else [])
                body = doc.tags("body")[0].text
                self.assertNotRegex(body, PLACEHOLDER)
                self.assertNotIn("{{", body)
                self.assertNotRegex(body + " " + title + " " + desc, PRICE)
                self.assertNotRegex(body + " " + title + " " + desc, PERSON)
                self.assertNotIn("01000033998", body)
                self.assertNotIn("عيادة سواي", body)
                for img in doc.attrs("img"):
                    self.assertIn("alt", img)
                    for attr in ("width", "height"):
                        self.assertTrue(img.get(attr, "").isdigit(), (attr, img.get("src")))
                ids = [el.attrs["id"] for el in doc.elements if "id" in el.attrs]
                self.assertEqual(len(ids), len(set(ids)), path)

    def test_reciprocal_alternates_and_sitemap(self):
        entries = {}
        tree = ET.parse(DIST / "sitemap.xml")
        for node in tree.findall("sm:url", NS):
            loc = node.findtext("sm:loc", namespaces=NS)
            self.assertTrue(loc.startswith(self.origin + "/"), loc)
            self.assertNotIn(loc, entries)
            self.assertRegex(node.findtext("sm:lastmod", namespaces=NS) or "", r"^\d{4}-\d{2}-\d{2}")
            entries[loc] = {e.attrib["hreflang"]: e.attrib["href"] for e in node.findall("xhtml:link", NS)}
        actual = set()
        for path, doc in self.docs.items():
            with self.subTest(path=path):
                robots = ",".join(m["content"] for m in doc.attrs("meta", name="robots"))
                if "noindex" in robots.lower() or path.endswith("/404"):
                    self.assertNotIn(doc.canonical, entries)
                    continue
                self.assertNotEqual(path, "/products", "Products must remain noindex")
                self.assertFalse(path.startswith("/ar/products"))
                arabic_page = path == "/ar" or path.startswith("/ar/")
                english = (path.removeprefix("/ar") or "/") if arabic_page else path
                expected = {lang: self.origin + normalized_path(english, prefix)
                            for lang, prefix in (("en", ""), ("ar", "/ar"), ("x-default", ""))}
                actual.add(doc.canonical)
                self.assertEqual(doc.alternates, expected)
                self.assertEqual(entries[doc.canonical], expected)
                status, _, body = self.http(path)
                self.assertEqual(status, 200)
                self.assertEqual(Document(body.decode()).canonical, doc.canonical)
                self.assertEqual(self.docs[urlsplit(expected["ar"]).path].alternates, doc.alternates)
                self.assertEqual(self.docs[urlsplit(expected["en"]).path].alternates, doc.alternates)
                switch = expected["en" if arabic_page else "ar"]
                self.assertIn(urlsplit(switch).path, {a.get("href") for a in doc.attrs("a")})
        self.assertEqual(set(entries), actual)
        self.assertIn("/products", self.docs)
        self.assertNotIn("/ar/products", self.docs)
        robots = (DIST / "robots.txt").read_text()
        self.assertIn("Sitemap: " + self.origin + "/sitemap.xml", robots)
        for agent in ["*", *BOTS]:
            self.assertRegex(robots, r"(?im)^User-agent:\s*" + re.escape(agent) + r"\s*$")
        self.assertNotRegex(robots, r"(?im)^Disallow:\s*/")

    def test_every_internal_reference_serves_without_redirection(self):
        tested = {}
        ids = {path: {e.attrs["id"] for e in doc.elements if "id" in e.attrs} for path, doc in self.docs.items()}
        for path, doc in self.docs.items():
            for el in doc.elements:
                attrs = el.attrs
                candidates = [attrs.get(key, "") for key in ("src", "poster", "data-src", "href", "action")]
                for key in ("srcset", "imagesrcset", "data-srcset"):
                    candidates.extend(part.split()[0] for part in attrs.get(key, "").split(",") if part.strip())
                candidates.extend(re.findall(r"""url\(['"]?([^)'"]+)""",attrs.get("style", "")))
                for target in candidates:
                    if not target or (el.tag != "a" and target.startswith("#")):
                        continue
                    full = urlsplit(urljoin(self.origin + path, target))
                    if full.netloc != urlsplit(self.origin).netloc or full.scheme not in ("http", "https"):
                        continue
                    route = full.path + (("?" + full.query) if full.query else "")
                    with self.subTest(path=path, target=target):
                        if el.tag == "a":
                            self.assertFalse(full.path.endswith(".html"), target)
                            if full.fragment and full.path in ids:
                                self.assertIn(unquote(full.fragment), ids[full.path])
                        if target.startswith("#"):
                            continue
                        if route not in tested:
                            tested[route] = self.http(route, "HEAD")[0]
                        localized_error_link = path.endswith("/404") and full.path.endswith("/404")
                        self.assertEqual(tested[route], 404 if localized_error_link else 200)
                        if el.tag == "a" and full.path.lower().endswith(".pdf"):
                            self.assertIn("nofollow", attrs.get("rel", "").split())
        self.assertGreater(len(tested), len(self.docs))

    def test_all_legacy_redirects_and_localized_404(self):
        legacy = dict(zip(("index", "about", "services", "before-after", "faq", "contact", "book", "products"),
                          ("/", "/about", "/treatments", "/results", "/faq", "/contact", "/book", "/products")))
        legacy.update({"service-" + slug: "/treatments/" + slug for slug in
                       "body-contouring botox dermal-filler exosomes facial hydrafacial laser peeling skin-boosters".split()})
        legacy.update({"service-dentistry": "/dentistry", "service-veneers": "/dentistry/veneers"})
        for old, destination in legacy.items():
            with self.subTest(old=old):
                query = "?service=botox" if old == "book" else "?utm_source=test"
                status, headers, _ = self.http("/" + old + ".html" + query)
                self.assertEqual(status, 308)
                self.assertEqual(headers["Location"], destination + query)
        for prefix in ("", "/ar"):
            status, _, body = self.http(prefix + "/not-a-real-clinic-page")
            self.assertEqual(status, 404)
            doc = Document(body.decode())
            self.assertEqual(doc.first("html", "lang"), "ar-EG" if prefix else "en")
            links = {a.get("href") for a in doc.attrs("a")}
            self.assertTrue({prefix + "/treatments", prefix + "/book"} <= links)
            self.assertTrue(any(h and h.startswith(prefix + "/branches") for h in links))


    def test_structured_data_matches_the_page_and_all_entity_references_resolve(self):
        defined, referred = set(), set()
        for path, doc in self.docs.items():
            with self.subTest(path=path):
                graph = doc.graph
                check_schema_urls(self, graph, self.site)
                types = {node["@type"] for node in graph}
                self.assertTrue({"MedicalOrganization", "WebSite", "MedicalClinic"} <= types)
                self.assertEqual("BreadcrumbList" in types, path not in ("/", "/ar"))
                for node in walk(graph):
                    if "@id" in node:
                        (defined if "@type" in node else referred).add(node["@id"])
                    self.assertFalse(BANNED_KEYS & node.keys())
                    self.assertNotIn(node.get("@type"), BANNED_TYPES)
                data_text = json.dumps(graph, ensure_ascii=False)
                self.assertNotRegex(data_text, PRICE)
                self.assertNotRegex(data_text, PERSON)
                self.assertNotRegex(data_text, PLACEHOLDER)
                self.assertNotIn("{{", data_text)
                faqs = [n for n in graph if n["@type"] == "FAQPage"]
                self.assertEqual(len(faqs), int(bool(doc.faqs)))
                if faqs:
                    self.assertEqual([(q["name"], q["acceptedAnswer"]["text"]) for q in faqs[0]["mainEntity"]], doc.faqs)
                clinic_ids = {self.origin + "/branches/" + b["id"] + "#clinic" for b in self.site["branches"]}
                self.assertEqual({n["@id"] for n in graph if n["@type"] == "MedicalClinic"}, clinic_ids)
                org, = [n for n in graph if n["@type"] == "MedicalOrganization"]
                self.assertEqual({b["@id"] for b in org["subOrganization"]}, clinic_ids)
                self.assertEqual(org["@id"], self.origin + "/#organization")
                for b in self.site["branches"]:
                    clinic, = [n for n in graph if n.get("@id") == self.origin + "/branches/" + b["id"] + "#clinic"]
                    self.assertEqual(clinic["telephone"], b["telephone"])
                    self.assertEqual(clinic["geo"]["latitude"], b["geo"]["lat"])
                    street = b.get("streetAddressAr") if path == "/ar" or path.startswith("/ar/") else None
                    self.assertIn(street or b["streetAddressEn"], clinic["address"]["streetAddress"])
                    self.assertEqual(bool(clinic.get("openingHoursSpecification")), bool(b["hours"]))
                    self.assertEqual(clinic.get("hasMap"), b["mapUrl"])
                    self.assertEqual(clinic.get("department", {}).get("@type") == "Dentist", b["services"]["dental"])
        self.assertFalse(referred - defined, referred - defined)

    def test_treatment_coverage_and_clinical_provenance(self):
        cases = dict(source_items())
        required = """laser-hair-removal lip-filler profhilo sculptra radiesse prp mesotherapy microneedling
        hair-and-scalp acne-treatment oxygeneo skin-tag-removal fractional-co2-laser nutrition-and-weight-management
        fat-dissolving-injections iv-therapy""".split()
        dental = "dental-implants teeth-whitening root-canal fillings-and-crowns childrens-dentistry hollywood-smile".split()
        for prefix in ("", "/ar"):
            paths = [normalized_path("/treatments/" + s, prefix) for s in required]
            paths += [normalized_path("/dentistry/" + s, prefix) for s in dental]
            paths += [prefix + "/plastic-surgery", prefix + "/dentistry", prefix + "/dentistry/veneers"]
            for service in ("body-contouring", "botox", "dermal-filler", "exosomes", "facial", "hydrafacial",
                            "laser", "peeling", "skin-boosters"):
                paths.append(prefix + "/treatments/" + service)
            for slug in ("branches/new-cairo", "branches/mohandessin", "privacy", "guides/laser-hair-removal-sessions",
                         "guides/botox-or-filler", "guides/first-nutrition-consultation"):
                self.assertIn(prefix + "/" + slug, self.docs)
            available = {a.get("href") for a in self.docs[prefix + "/treatments"].attrs("a")}
            self.assertTrue(set(paths) <= set(self.docs), set(paths) - set(self.docs))
            self.assertTrue(set(paths) <= available, set(paths) - available)
        for path, src in cases.items():
            if src["type"] not in ("treatment", "surgery", "article", "device"):
                continue
            with self.subTest(path=path):
                doc = self.docs[path]
                page, = [n for n in doc.graph if n["@type"] == "MedicalWebPage"]
                reviewed = src.get("reviewStatus") == "reviewed"
                visible_date = src["lastReviewed"] if reviewed else src["updated"]
                self.assertEqual(page["dateModified"], max(src["updated"], visible_date))
                self.assertTrue(any(t.get("datetime") == visible_date for t in doc.attrs("time"))
                                or visible_date in doc.tags("main")[0].text, "Show the real editorial date")
                if reviewed:
                    self.assertEqual(page["lastReviewed"], src["lastReviewed"])
                    self.assertEqual(page["reviewedBy"]["@id"], self.origin + "/#organization")
                else:
                    self.assertNotIn("lastReviewed", page)
                    self.assertNotIn("reviewedBy", page)
                if src["type"] in ("treatment", "surgery"):
                    procedure, = [n for n in doc.graph if n["@type"] in ("MedicalProcedure", "MedicalTherapy")]
                    for key in ("description", "howPerformed", "preparation", "followup"):
                        self.assertTrue(procedure[key], key)
                    self.assertGreaterEqual(len(doc.faqs), 6)
                    self.assertTrue(doc.tags("dl") or doc.tags("table"), "Supply a static key-facts list")
                    if src["path"] == "/treatments/laser-hair-removal":
                        offered = {b["id"] for b in self.site["branches"] if b["services"]["laserHairRemoval"]}
                    elif src["path"] == "/dentistry" or src["path"].startswith("/dentistry/"):
                        offered = {b["id"] for b in self.site["branches"] if b["services"]["dental"]}
                    else:
                        offered = set(src["branches"])
                    if src["type"] == "surgery" and not self.site["plasticSurgery"]["facility"]:
                        self.assertEqual(procedure["provider"], {"@id": self.origin + "/#organization"})
                    else:
                        self.assertEqual({p["@id"] for p in procedure["provider"]},
                                         {self.origin + "/branches/" + b + "#clinic" for b in offered})

    def test_gallery_describes_only_consented_cases(self):
        cases = [case for case in json.loads((ROOT / "data/results.json").read_text()) if case["consent"] is True]
        self.assertGreaterEqual(len(cases), 15)
        for path in ("/results", "/ar/results"):
            doc = self.docs[path]
            gallery, = [n for n in doc.graph if n["@type"] == "ImageGallery"]
            self.assertEqual(len(gallery["image"]), len(cases))
            captions = {e.text for e in doc.tags("figcaption")}
            alts = [c["alt"]["ar" if path.startswith("/ar/") else "en"] for c in cases]
            self.assertEqual(len(alts), len(set(alts)))
            for obj, case, alt in zip(gallery["image"], cases, alts):
                self.assertEqual(obj["@type"], "ImageObject")
                self.assertEqual(obj["contentUrl"], urljoin(self.origin + "/", case["image"]))
                self.assertIn(obj["caption"], captions)
                self.assertIn(alt, [img.get("alt") for img in doc.attrs("img")])

    def test_retired_hostname_absent_from_project_and_output(self):
        retired = ".".join(["soie-clinic", "vercel", "app"]).encode()
        paths = subprocess.check_output(["git", "ls-files", "-co", "--exclude-standard", "-z"], cwd=ROOT).split(b"\x00")
        files = {ROOT / os.fsdecode(p) for p in paths if p}
        files.update(DIST.rglob("*"))
        for file in files:
            if file.is_file() and retired in file.read_bytes():
                self.fail(f"Retired hostname found in {file.relative_to(ROOT)}")

    def test_origin_change_and_keyless_reviews_in_isolated_build(self):
        with tempfile.TemporaryDirectory() as temp:
            here = Path(temp)
            site = dict(self.site)
            site["origin"] = "https://" + uuid.uuid4().hex + ".invalid"
            site["reviews"] = {"curated": []}
            site["verification"] = {"google": "test-google-verification", "bing": "test-bing-verification"}
            config = here / "site.json"
            config.write_text(json.dumps(site))
            out = here / "output"
            env = dict(os.environ)
            env.pop("GOOGLE_MAPS_API_KEY", None)
            subprocess.run(["node", "build.mjs", "--site", str(config), "--out", str(out)], cwd=ROOT, env=env, check=True)
            for file in out.rglob("*"):
                if file.is_file() and self.origin.encode() in file.read_bytes():
                    self.fail(f"Old origin leaked into {file.relative_to(out)}")
            pages = read_pages(out)
            self.assertEqual(pages.keys(), self.docs.keys())
            for path, doc in pages.items():
                with self.subTest(path=path):
                    self.assertEqual(doc.canonical, site["origin"] + path)
                    self.assertTrue(all(u.startswith(site["origin"] + "/") for u in doc.alternates.values()))
                    self.assertEqual(doc.meta("property", "og:url"), doc.canonical)
                    self.assertTrue(doc.meta("property", "og:image").startswith(site["origin"] + "/"))
                    check_schema_urls(self, doc.graph, site)
                    self.assertEqual(doc.meta("name", "google-site-verification"), site["verification"]["google"])
                    self.assertEqual(doc.meta("name", "msvalidate.01"), site["verification"]["bing"])
                    self.assertNotRegex(doc.tags("body")[0].text, CURRENCY_RATING)
                    self.assertFalse(any("clinic-review" in e.attrs.get("class", "").split() for e in doc.elements))
            for branch in site["branches"]:
                if branch["mapUrl"]:
                    for prefix in ("", "/ar"):
                        doc = pages[prefix + "/branches/" + branch["id"]]
                        self.assertTrue(any(el.attrs.get("data-reviews-branch") == branch["id"] for el in doc.elements))
                        self.assertTrue(any(a.get("href") == branch["mapUrl"] and a.get("data-event") == "map_click"
                                            for a in doc.attrs("a")))
            for name in ("sitemap.xml", "robots.txt", "llms.txt"):
                self.assertIn(site["origin"], (out / name).read_text())
