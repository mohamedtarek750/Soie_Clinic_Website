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
| Devices | `devices.html` → `device-indiba.html` |
| Before & After | `before-after.html` |
| Book Appointment | `book.html` |
| Contact | `contact.html` |
| FAQ | `faq.html` |

Shared assets: `style.css` (design tokens + all components), `script.js`
(all behaviour, element-guarded so one file serves every page),
`sitemap.xml`, `robots.txt`.

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
