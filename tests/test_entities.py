import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ClinicEntityTests(unittest.TestCase):
    def test_branch_identity_and_verified_details(self):
        site = json.loads((ROOT / 'data/site.json').read_text())
        for page in (ROOT / 'dist').rglob('*.html'):
            with self.subTest(page=page):
                blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>',page.read_text(),re.S)
                self.assertEqual(len(blocks),1)
                graph = json.loads(blocks[0])['@graph']
                org, = [n for n in graph if n['@type']=='MedicalOrganization']
                self.assertEqual(org['@id'],site['origin']+'/#organization')
                for branch in site['branches']:
                    clinic, = [n for n in graph if n.get('@id')==site['origin']+'/branches/'+branch['id']+'#clinic']
                    self.assertEqual(clinic['telephone'],branch['telephone'])
                    self.assertEqual(clinic['parentOrganization']['@id'],org['@id'])
                    self.assertEqual('openingHoursSpecification' in clinic,bool(branch['hours']))
