# Moving the clinic to its own domain

1. Add the new hostname to the existing Vercel project and complete DNS and TLS setup. Keep the old production hostname attached. Verify the new hostname in Google Search Console and Bing Webmaster Tools. A Search Console domain property uses DNS. For a URL-prefix property, enter the supplied meta verification value under `verification.google` in `data/site.json`. Bing's meta value belongs under `verification.bing`.
2. Record the old hostname. Change the single `origin` field in `data/site.json` to the exact new HTTPS origin, with no trailing slash. Run `node build.mjs` and `python3 -m unittest discover -s tests -v`. Check both language homes, a device page, its Open Graph image, canonical and alternate links, the structured data, sitemap, robots and llms.txt.
3. Activate the rule below by inserting it **first** in the `redirects` array in `vercel.json`. Replace `OLD_HOST` with the previous hostname only and `NEW_HOST` with the new hostname only. This disabled example lives here because Vercel reads strict JSON. The host condition prevents redirect loops. Vercel forwards the path and query string.

```json
{
  "source": "/:path*",
  "has": [{ "type": "host", "value": "OLD_HOST" }],
  "destination": "https://NEW_HOST/:path*",
  "permanent": true
}
```

4. Deploy the origin and redirect rule together. Request the old home and a nested Arabic URL with a query string. Inspect the initial response without following redirects and confirm HTTP 308 and the new path, query and hostname. Follow each redirect and confirm HTTP 200 and a canonical on the new hostname. Check the new site's custom English and Arabic error pages with missing URLs.
5. Submit the new `/sitemap.xml` to the new Google Search Console and Bing properties. In the old Search Console property use **Settings → Change of address**, select the verified new property and complete validation. Use Bing's Site Move tool if available for your verified properties. Monitor indexing and crawl errors in both properties.
6. Update the website on each Google Business Profile to its matching new branch URL. Update Instagram, Threads and directory listings. Keep the host redirect and old hostname in place permanently.

## Notifying IndexNow after a deployment

The build publishes the public ownership key from `data/indexnow-key.txt` as `/<key>.txt`. Confirm the production URL returns HTTP 200 and contains that key. From the checkout, preview a submission:

```sh
node tools/indexnow.mjs --dry-run /branches/new-cairo /ar/branches/new-cairo
```

After publishing those changes, remove `--dry-run` to submit. Pass only the published URLs that changed, including both language versions when appropriate. HTTP 200 or 202 confirms receipt. Search engines decide when to crawl and index. The build does not send notifications.
