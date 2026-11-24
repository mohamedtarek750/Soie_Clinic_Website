# Owner actions

## Business facts awaiting confirmation

These fields are null in `data/site.json`. Supply confirmed values here before publication of the corresponding fact.

| Record | Fields and action |
| --- | --- |
| Brand | `brand.nameAr` (approved Arabic spelling), `brand.foundingYear`, `brand.facebookUrl` (permanent official page). The legacy footer link is retained until the permanent URL is supplied. |
| New Cairo | `googlePlaceId`, `licenceNumber`. Verify the Places listing against the supplied address and coordinates. |
| Mohandessin | `floor`, `postalCode`, `mapUrl`, `googlePlaceId`, `hours`, `licenceNumber`, `services.laserHairRemoval`. Confirm opening and closing times for each day, the branch-specific Maps listing, and laser hair removal availability. |
| Partner surgery | `plasticSurgery.facility`. Confirm where operations take place and which public description is approved. Expand the single bilingual hub into individual surgical pages only after clinical review. |
| Search verification | `verification.google`, `verification.bing`. Enter each service's meta-tag content value, rebuild, deploy, and finish verification in the corresponding webmaster account. |
| Measurement | `analytics.ga4`. Supply an approved GA4 measurement ID and review the clinic's consent and privacy requirements before activation. |

## Owner-controlled launch work

- Supply real, attributable reviews with public source links and permission for republication. Add them verbatim to `reviews.curated`. Confirm both branch Place IDs and the Mohandessin Maps URL. Enable Places API (New) and billing, restrict the key, and store `GOOGLE_MAPS_API_KEY` in Vercel's server-side environment settings. The automatic feed still requires the policy verification described in [docs/reviews.md](docs/reviews.md).
- Approve the privacy policy in English and Arabic against reception's actual handling of booking records, WhatsApp requests, deletion requests and retention. Confirm that both branch inboxes support the approved treatment names.
- Supply correctly labelled real photographs of each branch, approved landmarks, and confirmed information about parking and payment methods if these should appear on the branch pages.
- Supply additional before-and-after cases with documented publication consent, bilingual descriptions and verified treatment, interval, sessions and branch. Existing entries with missing details omit them. Confirm the actual products list before reconsidering its noindex status.
- After deployment, verify both the current URL-prefix property in Google Search Console and the Bing Webmaster Tools property. Submit the generated sitemap to both. Inspect the live English and Arabic homepages, treatments and branches, then monitor crawl and indexing reports.
- Set the New Cairo Google Business Profile website to `/branches/new-cairo` and the Mohandessin profile website to `/branches/mohandessin` on the configured origin. Update Instagram and directory links. Follow [the migration runbook](docs/domain-migration.md) for a future domain change.

## Medical review queue

Review both language versions of each path below. English uses the listed path and Arabic adds the prefix `/ar`. A clinician should check indications, contraindications, preparation, side effects, aftercare, actual availability and all claims before promotion. Pending pages display the editorial update date. Record the real clinical review date when the team signs off.

<!-- review-list -->
- [ ] `/dentistry` and `/ar/dentistry`
- [ ] `/dentistry/childrens-dentistry` and `/ar/dentistry/childrens-dentistry`
- [ ] `/dentistry/dental-implants` and `/ar/dentistry/dental-implants`
- [ ] `/dentistry/fillings-and-crowns` and `/ar/dentistry/fillings-and-crowns`
- [ ] `/dentistry/hollywood-smile` and `/ar/dentistry/hollywood-smile`
- [ ] `/dentistry/root-canal` and `/ar/dentistry/root-canal`
- [ ] `/dentistry/teeth-whitening` and `/ar/dentistry/teeth-whitening`
- [ ] `/dentistry/veneers` and `/ar/dentistry/veneers`
- [ ] `/devices/cutera-excel-hr` and `/ar/devices/cutera-excel-hr`
- [ ] `/devices/finexel-fractional-co2` and `/ar/devices/finexel-fractional-co2`
- [ ] `/devices/indiba-deep-care` and `/ar/devices/indiba-deep-care`
- [ ] `/guides/botox-or-filler` and `/ar/guides/botox-or-filler`
- [ ] `/guides/first-nutrition-consultation` and `/ar/guides/first-nutrition-consultation`
- [ ] `/guides/laser-hair-removal-sessions` and `/ar/guides/laser-hair-removal-sessions`
- [ ] `/plastic-surgery` and `/ar/plastic-surgery`
- [ ] `/treatments/acne-treatment` and `/ar/treatments/acne-treatment`
- [ ] `/treatments/body-contouring` and `/ar/treatments/body-contouring`
- [ ] `/treatments/botox` and `/ar/treatments/botox`
- [ ] `/treatments/dermal-filler` and `/ar/treatments/dermal-filler`
- [ ] `/treatments/exosomes` and `/ar/treatments/exosomes`
- [ ] `/treatments/facial` and `/ar/treatments/facial`
- [ ] `/treatments/fat-dissolving-injections` and `/ar/treatments/fat-dissolving-injections`
- [ ] `/treatments/fractional-co2-laser` and `/ar/treatments/fractional-co2-laser`
- [ ] `/treatments/hair-and-scalp` and `/ar/treatments/hair-and-scalp`
- [ ] `/treatments/hydrafacial` and `/ar/treatments/hydrafacial`
- [ ] `/treatments/iv-therapy` and `/ar/treatments/iv-therapy`
- [ ] `/treatments/laser-hair-removal` and `/ar/treatments/laser-hair-removal`
- [ ] `/treatments/laser` and `/ar/treatments/laser`
- [ ] `/treatments/lip-filler` and `/ar/treatments/lip-filler`
- [ ] `/treatments/mesotherapy` and `/ar/treatments/mesotherapy`
- [ ] `/treatments/microneedling` and `/ar/treatments/microneedling`
- [ ] `/treatments/nutrition-and-weight-management` and `/ar/treatments/nutrition-and-weight-management`
- [ ] `/treatments/oxygeneo` and `/ar/treatments/oxygeneo`
- [ ] `/treatments/peeling` and `/ar/treatments/peeling`
- [ ] `/treatments/profhilo` and `/ar/treatments/profhilo`
- [ ] `/treatments/prp` and `/ar/treatments/prp`
- [ ] `/treatments/radiesse` and `/ar/treatments/radiesse`
- [ ] `/treatments/sculptra` and `/ar/treatments/sculptra`
- [ ] `/treatments/skin-boosters` and `/ar/treatments/skin-boosters`
- [ ] `/treatments/skin-tag-removal` and `/ar/treatments/skin-tag-removal`
