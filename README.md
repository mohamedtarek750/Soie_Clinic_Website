# Soie Clinic — Website

Luxury aesthetic clinic in New Cairo & Mohandseen. A fully static,
dependency-free site: hand-crafted HTML + CSS + vanilla JavaScript.
No build step — open `index.html` or serve the folder with any static server.

## Site map

| Page | File |
|---|---|
| Home (landing) | `index.html` |
| About | `about.html` |
| Services | `services.html` → `service-<treatment>.html` (11 treatment pages) |
| Products | `products.html` |
| Devices | `devices.html` → `device-indiba.html`, `device-cutera.html` |
| Before & After | `before-after.html` |
| Book Appointment | `book.html` |
| Contact | `contact.html` |
| FAQ | `faq.html` |

Shared assets: `style.css` (design tokens + all components), `script.js`
(all behaviour, element-guarded so one file serves every page),
`sitemap.xml`, `robots.txt`.

`devices.html` uses accessible tabs: INDIBA is selected initially, and selecting
Cutera swaps the complete details and video into the same place below the tabs.
The selected tab stays highlighted, and videos pause when their tab is hidden.
Unopened device videos load only when their tab is selected and approached.
The URL fragment can restore a selected device without navigating to another page.
The standalone device URLs remain available for existing links and search.
When changing device copy, update its inline panel and standalone page together.

## English and Arabic

English is the default. The header on every page offers **English / العربية**;
the choice is saved in local storage and Arabic uses right-to-left layout.
Switching languages preserves the current booking form and selected time.

- `i18n-ar.js` contains the Arabic copy, keyed by the English text with whitespace
  collapsed. When editing HTML copy or adding a page, add its translation here,
  including image descriptions, accessible labels and page metadata.
- `i18n.js` translates text and labels without replacing links, controls, media or
  their event handlers. The original English HTML remains readable without JS.
- Dynamic UI in `script.js` uses `SoieI18n.t()` and updates on
  `soie:languagechange`. Mark those elements `data-i18n-live` so the static
  translator does not overwrite them. Keep patient input and booking API values
  separate from translated display labels.
- `i18n.css` contains the language control and Arabic typography/layout overrides.
  Manufacturer PDFs and text embedded in original photographs remain unchanged.

Serve the folder locally and check both languages at mobile and desktop sizes.
Include menu and modal controls, FAQ, gallery filters, saved language on navigation,
and switching languages with a partially completed booking. Intercept the Apps
Script POST in browser tests; never submit test requests to reception.

## Booking

`book.html` lets visitors choose **branch → contact details → treatment →
date → time**. Requests go to the selected branch's reception through its
Apps Script endpoint in `BOOKING_ENDPOINTS` in `script.js`, with a WhatsApp
fallback if the request cannot be sent. The reception team confirms appointments.
Treatment pages deep-link with `book.html?service=<slug>`.

## Content that still needs owner input

- **Products** — `products.html` lists the Soie skincare selection; replace
  with the clinic's actual retail range (brand, product, price) when
  confirmed.
- **Clinic statistics** — a commented-out block in the homepage stats
  section is ready for verified figures (happy clients, years of
  experience, treatments performed, patient satisfaction). Un-comment
  and replace the `XX` placeholders only with confirmed numbers.

The homepage shows selected original client feedback about the Soie experience
(`assets/images/reviews/`). Only screenshots without individual practitioner
names are included in the public assets.

## Editing notes

- Design tokens (palette, type, shadows, easing) live at the top of
  `style.css`; all pages inherit them.
- Keep the website focused on Soie Clinic, its services, devices and branches.
  Do not publish individual practitioner names, personal profiles or social links
  in copy, metadata, image text, captions, alt text or booking options. Check
  review screenshots and result images before adding them to public assets.
- Inner pages were scaffolded from a shared template, so nav / footer /
  modal markup is identical across files — if you change one, mirror the
  change in the others (or ask your developer to regenerate).
