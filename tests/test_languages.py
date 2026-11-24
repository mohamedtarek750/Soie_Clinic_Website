from pathlib import Path
import re
import unittest
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]

class StaticLanguageTests(unittest.TestCase):
    def test_all_indexable_pages_have_static_translations(self):
        tree = ElementTree.parse(ROOT / 'dist/sitemap.xml')
        ns = {'s':'http://www.sitemaps.org/schemas/sitemap/0.9','h':'http://www.w3.org/1999/xhtml'}
        from urllib.parse import urlsplit
        for entry in tree.findall('s:url', ns):
            links = {n.get('hreflang'):urlsplit(n.get('href')).path for n in entry.findall('h:link', ns)}
            self.assertEqual(set(links), {'ar','en','x-default'})
            self.assertEqual(links['en'],links['x-default'])
            arabic = (ROOT / 'dist' / (links['ar'][1:]+'.html')).read_text()
            self.assertIn('<html lang="ar-EG" dir="rtl"', arabic)
            main = re.search(r'<main\b[^>]*>(.*?)</main>',arabic,re.S)[1]
            self.assertRegex(re.sub(r'<[^>]+>',' ',main),r'[ء-ي]{3}')
