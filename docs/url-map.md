# Launch URL map

All paths are relative to the HTTPS origin in `data/site.json`. The sitemap contains 53 English and 53 Arabic URLs. The build regenerates the sitemap whenever pages change.

| English | Arabic |
| --- | --- |
| `/` | `/ar` |
| `/about` | `/ar/about` |
| `/book` | `/ar/book` |
| `/branches` | `/ar/branches` |
| `/branches/mohandessin` | `/ar/branches/mohandessin` |
| `/branches/new-cairo` | `/ar/branches/new-cairo` |
| `/contact` | `/ar/contact` |
| `/dentistry` | `/ar/dentistry` |
| `/dentistry/childrens-dentistry` | `/ar/dentistry/childrens-dentistry` |
| `/dentistry/dental-implants` | `/ar/dentistry/dental-implants` |
| `/dentistry/fillings-and-crowns` | `/ar/dentistry/fillings-and-crowns` |
| `/dentistry/hollywood-smile` | `/ar/dentistry/hollywood-smile` |
| `/dentistry/root-canal` | `/ar/dentistry/root-canal` |
| `/dentistry/teeth-whitening` | `/ar/dentistry/teeth-whitening` |
| `/dentistry/veneers` | `/ar/dentistry/veneers` |
| `/devices` | `/ar/devices` |
| `/devices/cutera-excel-hr` | `/ar/devices/cutera-excel-hr` |
| `/devices/finexel-fractional-co2` | `/ar/devices/finexel-fractional-co2` |
| `/devices/indiba-deep-care` | `/ar/devices/indiba-deep-care` |
| `/faq` | `/ar/faq` |
| `/guides` | `/ar/guides` |
| `/guides/botox-or-filler` | `/ar/guides/botox-or-filler` |
| `/guides/first-nutrition-consultation` | `/ar/guides/first-nutrition-consultation` |
| `/guides/laser-hair-removal-sessions` | `/ar/guides/laser-hair-removal-sessions` |
| `/plastic-surgery` | `/ar/plastic-surgery` |
| `/privacy` | `/ar/privacy` |
| `/results` | `/ar/results` |
| `/treatments` | `/ar/treatments` |
| `/treatments/acne-treatment` | `/ar/treatments/acne-treatment` |
| `/treatments/body-contouring` | `/ar/treatments/body-contouring` |
| `/treatments/botox` | `/ar/treatments/botox` |
| `/treatments/dermal-filler` | `/ar/treatments/dermal-filler` |
| `/treatments/exosomes` | `/ar/treatments/exosomes` |
| `/treatments/facial` | `/ar/treatments/facial` |
| `/treatments/fat-dissolving-injections` | `/ar/treatments/fat-dissolving-injections` |
| `/treatments/fractional-co2-laser` | `/ar/treatments/fractional-co2-laser` |
| `/treatments/hair-and-scalp` | `/ar/treatments/hair-and-scalp` |
| `/treatments/hydrafacial` | `/ar/treatments/hydrafacial` |
| `/treatments/iv-therapy` | `/ar/treatments/iv-therapy` |
| `/treatments/laser` | `/ar/treatments/laser` |
| `/treatments/laser-hair-removal` | `/ar/treatments/laser-hair-removal` |
| `/treatments/lip-filler` | `/ar/treatments/lip-filler` |
| `/treatments/mesotherapy` | `/ar/treatments/mesotherapy` |
| `/treatments/microneedling` | `/ar/treatments/microneedling` |
| `/treatments/nutrition-and-weight-management` | `/ar/treatments/nutrition-and-weight-management` |
| `/treatments/oxygeneo` | `/ar/treatments/oxygeneo` |
| `/treatments/peeling` | `/ar/treatments/peeling` |
| `/treatments/profhilo` | `/ar/treatments/profhilo` |
| `/treatments/prp` | `/ar/treatments/prp` |
| `/treatments/radiesse` | `/ar/treatments/radiesse` |
| `/treatments/sculptra` | `/ar/treatments/sculptra` |
| `/treatments/skin-boosters` | `/ar/treatments/skin-boosters` |
| `/treatments/skin-tag-removal` | `/ar/treatments/skin-tag-removal` |

The English-only `/products` page carries `noindex,follow`. Missing paths return HTTP 404 using the English or Arabic error page. Products and both error pages are excluded from the sitemap.

Legacy HTML paths, including all original service and device aliases, are listed in `vercel.json`. The server preserves query strings on redirects, including booking selections.
