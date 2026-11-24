"""Regression tests for the catalogue, original device films and permanent aliases."""
from site_support import Document, SiteTest

DEVICES = {
    "indiba-deep-care": ("indiba", "INDIBA", "indiba-session.mp4"),
    "cutera-excel-hr": ("cutera", "Cutera", "cutera-excel-hr.mp4"),
    "finexel-fractional-co2": ("finexel", "FineXel", "finexel-fractional-co2.mp4"),
}


class DeviceSEOTests(SiteTest):
    def test_home_and_catalogue_have_three_device_links_and_no_films(self):
        for prefix in ("", "/ar"):
            targets = {prefix + "/devices/" + slug for slug in DEVICES}
            for path in (prefix or "/", prefix + "/devices"):
                with self.subTest(path=path):
                    status, _, body = self.http(path)
                    self.assertEqual(status, 200)
                    doc = Document(body.decode())
                    hrefs = {a.get("href") for a in doc.attrs("a")}
                    self.assertTrue(targets <= hrefs, targets - hrefs)
                    self.assertFalse(doc.tags("video"))

    def test_each_detail_serves_its_original_video_and_matching_faqs(self):
        for prefix in ("", "/ar"):
            for slug, (_, name, filename) in DEVICES.items():
                path = prefix + "/devices/" + slug
                with self.subTest(path=path):
                    status, _, body = self.http(path)
                    self.assertEqual(status, 200)
                    doc = Document(body.decode())
                    self.assertEqual(doc.canonical, self.origin + path)
                    self.assertIn(name, doc.tags("title")[0].text)
                    (video,) = doc.attrs("video")
                    self.assertEqual(video["data-src"], "/assets/videos/" + filename)
                    self.assertEqual(video["preload"], "none")
                    self.assertTrue({"loop", "muted", "playsinline"} <= set(video))
                    self.assertNotIn("src", video)
                    entities = {n["@type"]: n for n in doc.graph}
                    self.assertTrue({"MedicalWebPage", "MedicalDevice", "VideoObject", "MedicalProcedure",
                                     "BreadcrumbList", "FAQPage"} <= set(entities))
                    film = entities["VideoObject"]
                    self.assertEqual(film["contentUrl"], self.origin + video["data-src"])
                    self.assertEqual(film["thumbnailUrl"], self.origin + video["poster"])
                    self.assertTrue(film["uploadDate"])
                    self.assertTrue(film["duration"].startswith("PT"))
                    faq = entities["FAQPage"]["mainEntity"]
                    self.assertEqual(doc.faqs, [(q["name"], q["acceptedAnswer"]["text"]) for q in faq])

    def test_device_redirects_retain_query_parameters(self):
        redirects = {"/devices.html": "/devices", "/devices/index.html": "/devices", "/devices/": "/devices"}
        for slug, (old, _, _) in DEVICES.items():
            target = "/devices/" + slug
            for path in ("/device-" + old + ".html", target + "/index.html", target + "/"):
                redirects[path] = target
        for old, new in redirects.items():
            with self.subTest(path=old):
                query = "?utm_source=test"
                status, headers, _ = self.http(old + query)
                self.assertEqual(status, 308)
                self.assertEqual(headers["Location"], new + query)
