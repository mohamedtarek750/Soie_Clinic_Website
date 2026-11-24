# Soie Clinics website

Soie Clinics offers aesthetic, laser, nutrition and dental care in Greater Cairo. This repository builds the English and Arabic website for the Vercel project `soie-clinic`. The production address is the `origin` in `data/site.json`.

## Develop locally

Use Node.js 22 or later and Python 3. Run these commands from the repository root. The build and tests use standard libraries.

```sh
node build.mjs
python3 -m unittest discover -s tests -v
python3 tools/serve.py --port 8000
```

Open the local server and try the English home, `/ar`, a nested device page and a legacy booking link with a service query. Rebuild after editing source files. The preview serves the generated `dist/` directory and handles clean URLs, permanent redirects and localized errors. Vercel runs the same build command. Use `node build.mjs --site /path/to/site.json --out /path/to/output` to test a configuration separately.

## Content and layouts

- `data/site.json` holds the origin, brand, branch names, addresses, contacts, hours, service availability, review sources and optional verification and analytics values. Omit unconfirmed facts from the rendered page using JSON null in the data. Enter credentials only in server-side environment settings.
- `src/content/en/` and `src/content/ar/` each hold one JSON file per page. Both language files use the same English `path`. The Arabic route has an `/ar` prefix. Products is English-only and excluded from indexing.
- `src/templates/` holds the shared layout, navigation, footer, booking dialog, medical and editorial templates, reviews and JSON-LD. The copy, FAQ answers, links and branch contacts appear in the delivered HTML. JavaScript enhances booking and other interactive controls.
- `build.mjs` renders every page, writes discovery files and fingerprints stylesheets and scripts. Change source files and rebuild. The source of truth for a page's editorial update is its `updated` field. The sitemap also takes the content file's Git history into account.

### Add a treatment

1. Copy the nearest treatment content file in each language. Use the same new clean path in both. Give each file a unique search title (up to 60 characters), description (120–160 characters), location-specific H1 and a standalone answer of 40–60 words.
2. Fill the category, confirmed branch IDs, key facts, suitability, preparation, visit, recovery, risks and patient FAQs. Link the relevant device, related treatments and genuine consented cases. The booking selector, hub and branch lists read this content. Verify that the new service is accepted by reception before promoting booking for it.
3. Write Arabic for people searching in Egypt, keeping brand and product names in Latin script. Mark new medical content `pending-clinical-review` and record the page pair in `OWNER_TODO.md`. After clinical review, set `reviewStatus` to `reviewed`, record the actual `lastReviewed` date and synchronize `updated` with the reviewed revision.
4. Supply a 1200×630 photographic share card in `assets/social/{en,ar}/` for each language. The optional `python3 tools/social-cards.py` authoring tool regenerates them using local photography, Pillow with Raqm, DejaVu Serif and DejaVu Sans. The deployment build uses the committed cards.
5. Build and run the suite. Inspect both language pages at mobile and desktop widths, keyboard navigation, the booking deep link and the page source with JavaScript disabled.

### Add a results case

Place owner-approved photographs in `assets/images/` and append one case to `data/results.json`. Include a stable ID, the original image URL and dimensions, optional responsive variants, category, linked treatment path, bilingual treatment name, descriptive alt text and a visible caption in each language. Add product or device family, sessions, interval and branch only when documented. Record permission with `consent: true` before publication. The gallery and its structured data render only consented cases. To withdraw a case, set consent to false, rebuild and redeploy. Remove obsolete copies and review previous deployments and caches when handling deletion requests. Individual outcomes vary.

## Editorial and booking rules

- The public entity is **Soie Clinics**. Never publish practitioner names or individual profiles in text, images, metadata, structured data or booking options. Use Latin-script Soie Clinics on Arabic pages until an Arabic brand name is approved.
- Never publish prices, offers, discounts or price ranges. Explain which factors affect a quote and link to the appropriate branch's WhatsApp and telephone.
- Preserve the Signature design, original clinic media, the headline **Unleash your beauty.**, skip link, keyboard and reduced-motion behavior. Use plain language about consultation, recovery, uncertainty and risks. Medical information stays general.
- Use confirmed clinic facts only. Keep Mohandessin hours and unverified availability out of public copy. While the surgical facility is unconfirmed, describe surgery as arranged through partner consultant surgeons. FineXel's model and CO2 laser type are documented. Further manufacturer claims require primary documentation.
- Preserve public reviews verbatim and link to the source. Follow the review instructions in [docs/reviews.md](docs/reviews.md).
- Preserve the two Apps Script URLs in `BOOKING_ENDPOINTS`. Automated browser checks must intercept the POST and any WhatsApp navigation before interacting with submit. Confirm the booking form in both languages with mocked responses.

## Deployment and discovery

Review [OWNER_TODO.md](OWNER_TODO.md) for approvals, search-engine verification and business profile updates. The [domain migration runbook](docs/domain-migration.md) covers DNS, Vercel, Search Console, Bing and the IndexNow submission command. IndexNow runs manually after deployment. Ensure both branch profiles link to their own canonical branch page.
