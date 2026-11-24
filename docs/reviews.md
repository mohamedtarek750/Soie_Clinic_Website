# Patient reviews

## Owner-supplied reviews

Add only public reviews that the clinic has permission to reproduce to `reviews.curated` in `data/site.json`. Each entry uses `source` (the platform name), `author` (the public display name), `text` (the complete original review), `date` (the publication date), `url` (the public HTTPS source) and `branch` (`new-cairo` or `mohandessin`). Preserve the author's spelling, language, punctuation and paragraph breaks. Check for identifiable practitioners and prices before adding an entry. Exclude the entire entry if it conflicts with clinic publication rules.

The build skips empty reviews, missing authors or sources, unsafe links, and entries that appear to contain a currency amount or a named practitioner. The same quotation appears in each language. The full sections show branch-specific reviews, and compact sections show the first qualifying curated review for each relevant branch. The website emits no review or rating schema.

## Branch links

The HTML shows a reviews link when the owner has supplied the branch's Google Maps listing URL. New Cairo has a confirmed link. Add the verified Mohandessin listing URL to that branch's `mapUrl` to enable its fallback. The homepage also contains the existing client-supplied WhatsApp screenshots.

## Google Places API

The owner controls the Google Cloud project, billing and credentials. Enable Places API (New) and restrict the key to that API. Store it as `GOOGLE_MAPS_API_KEY` in Vercel server-side environment settings. Use an environment or secret manager for local testing. Keep keys and Places review responses out of source control, build output, logs and public configuration.

The current release renders the curated list and confirmed Maps links. The automatic feed and Place ID resolver are pending implementation because the setup environment returned HTTP 403 for the official policy pages.

Before implementing the automatic feed, verify Google's current Places API policies and Maps service terms for the account. Confirm the correct Place ID and address for each branch through Places Text Search (New) with the owner-supplied coordinates and persist only the confirmed Place ID. Do not use a geographical search or reviews for a different branch as the fallback.

- [Places API policies and attribution](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Google Maps Platform service-specific terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)
- [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search)
