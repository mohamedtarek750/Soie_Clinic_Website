# Phase pull requests

Each comparison uses the preceding phase as its base. The links open a GitHub comparison with a prepared pull request title and description. Each phase was built and tested at its branch tip.

## Phase 1 · Generate clean English URLs on the configured origin

Base `main` · Head `seo/01-indexability`

Generate the English static site from page data, centralize the production origin, publish the sitemap and robots file, and redirect the old HTML paths while preserving queries.

All four baseline device regressions pass against the build. Chromium screenshots of the home, Botox and INDIBA pages matched the old pages pixel for pixel at 1366×900 and 390×844.

Production redirect chains and indexing require a production deployment.

[Open the prepared comparison](https://github.com/mohamedtarek750/Soie_Clinic_Website/compare/main...seo/01-indexability?expand=1&title=Generate+clean+English+URLs+on+the+configured+origin&body=%23%23+Changes%0A%0AGenerate+the+English+static+site+from+page+data%2C+centralize+the+production+origin%2C+publish+the+sitemap+and+robots+file%2C+and+redirect+the+old+HTML+paths+while+preserving+queries.%0A%0A%23%23+Verification%0A%0AAll+four+baseline+device+regressions+pass+against+the+build.+Chromium+screenshots+of+the+home%2C+Botox+and+INDIBA+pages+matched+the+old+pages+pixel+for+pixel+at+1366%C3%97900+and+390%C3%97844.%0A%0A%23%23+Outstanding%0A%0AProduction+redirect+chains+and+indexing+require+a+production+deployment.%0A)

## Phase 2 · Publish static Arabic pages and reciprocal language links

Base `seo/01-indexability` · Head `seo/02-arabic`

Generate the existing site in both languages from shared layouts. Deliver Arabic text and right-to-left direction in the original HTTP response. Replace the language preference swap with ordinary alternate-page links.

Five tests passed, including raw Arabic content checks and sitemap alternate coverage. Checked language links, keyboard controls and persisted booking entries on real Chromium.

English-only products intentionally has no Arabic indexable counterpart.

[Open the prepared comparison](https://github.com/mohamedtarek750/Soie_Clinic_Website/compare/seo/01-indexability...seo/02-arabic?expand=1&title=Publish+static+Arabic+pages+and+reciprocal+language+links&body=%23%23+Changes%0A%0AGenerate+the+existing+site+in+both+languages+from+shared+layouts.+Deliver+Arabic+text+and+right-to-left+direction+in+the+original+HTTP+response.+Replace+the+language+preference+swap+with+ordinary+alternate-page+links.%0A%0A%23%23+Verification%0A%0AFive+tests+passed%2C+including+raw+Arabic+content+checks+and+sitemap+alternate+coverage.+Checked+language+links%2C+keyboard+controls+and+persisted+booking+entries+on+real+Chromium.%0A%0A%23%23+Outstanding%0A%0AEnglish-only+products+intentionally+has+no+Arabic+indexable+counterpart.%0A)

## Phase 3 · Connect the bilingual site with medical organization and branch entities

Base `seo/02-arabic` · Head `seo/03-entities`

Emit a localized JSON-LD graph identifying the organization, both clinics, Mohandessin dentistry, the website, breadcrumbs and the appropriate page-specific entities.

Six tests passed. Checked branch identity, phone, parent organization, optional hours, device films and visible FAQ agreement.

Search-engine rich result eligibility is decided by the search engines.

[Open the prepared comparison](https://github.com/mohamedtarek750/Soie_Clinic_Website/compare/seo/02-arabic...seo/03-entities?expand=1&title=Connect+the+bilingual+site+with+medical+organization+and+branch+entities&body=%23%23+Changes%0A%0AEmit+a+localized+JSON-LD+graph+identifying+the+organization%2C+both+clinics%2C+Mohandessin+dentistry%2C+the+website%2C+breadcrumbs+and+the+appropriate+page-specific+entities.%0A%0A%23%23+Verification%0A%0ASix+tests+passed.+Checked+branch+identity%2C+phone%2C+parent+organization%2C+optional+hours%2C+device+films+and+visible+FAQ+agreement.%0A%0A%23%23+Outstanding%0A%0ASearch-engine+rich+result+eligibility+is+decided+by+the+search+engines.%0A)

## Phase 4 · Publish bilingual treatments, guides, branches and consented results

Base `seo/03-entities` · Head `seo/04-clinic-content`

Publish the 33 treatment and dentistry routes, partner plastic surgery hub, two branch pages, three guides, privacy page and data-driven gallery. Add photographic share cards, editorial review states, curated reviews and Maps fallbacks.

Thirteen tests passed. Checked all treatment routes in both languages, FAQ agreement, branch availability, booking links, image dimensions, result consent and metadata lengths. Built 53 indexable URLs per language.

Clinical and privacy approvals are outstanding. The environment denied access to Google’s current Places policy. The automatic Places feed and lookup remain pending. No live booking or live Google review requests were sent.

[Open the prepared comparison](https://github.com/mohamedtarek750/Soie_Clinic_Website/compare/seo/03-entities...seo/04-clinic-content?expand=1&title=Publish+bilingual+treatments%2C+guides%2C+branches+and+consented+results&body=%23%23+Changes%0A%0APublish+the+33+treatment+and+dentistry+routes%2C+partner+plastic+surgery+hub%2C+two+branch+pages%2C+three+guides%2C+privacy+page+and+data-driven+gallery.+Add+photographic+share+cards%2C+editorial+review+states%2C+curated+reviews+and+Maps+fallbacks.%0A%0A%23%23+Verification%0A%0AThirteen+tests+passed.+Checked+all+treatment+routes+in+both+languages%2C+FAQ+agreement%2C+branch+availability%2C+booking+links%2C+image+dimensions%2C+result+consent+and+metadata+lengths.+Built+53+indexable+URLs+per+language.%0A%0A%23%23+Outstanding%0A%0AClinical+and+privacy+approvals+are+outstanding.+The+environment+denied+access+to+Google%E2%80%99s+current+Places+policy.+The+automatic+Places+feed+and+lookup+remain+pending.+No+live+booking+or+live+Google+review+requests+were+sent.%0A)

## Phase 5 · Generate the bilingual answer-engine summary and IndexNow submissions

Base `seo/04-clinic-content` · Head `seo/05-discovery`

Generate llms.txt from the clinic data and published pages. Publish the IndexNow ownership key and add an explicit post-deployment notification command that validates its input.

Fourteen tests passed, including a full build with an alternate origin and absent Places key. Ran the IndexNow dry run against English and Arabic paths.

Live IndexNow submission and Search Console and Bing verification are post-deployment owner actions.

[Open the prepared comparison](https://github.com/mohamedtarek750/Soie_Clinic_Website/compare/seo/04-clinic-content...seo/05-discovery?expand=1&title=Generate+the+bilingual+answer-engine+summary+and+IndexNow+submissions&body=%23%23+Changes%0A%0AGenerate+llms.txt+from+the+clinic+data+and+published+pages.+Publish+the+IndexNow+ownership+key+and+add+an+explicit+post-deployment+notification+command+that+validates+its+input.%0A%0A%23%23+Verification%0A%0AFourteen+tests+passed%2C+including+a+full+build+with+an+alternate+origin+and+absent+Places+key.+Ran+the+IndexNow+dry+run+against+English+and+Arabic+paths.%0A%0A%23%23+Outstanding%0A%0ALive+IndexNow+submission+and+Search+Console+and+Bing+verification+are+post-deployment+owner+actions.%0A)

## Phase 6 · Optimize page delivery and verify the complete static build

Base `seo/05-discovery` · Head `seo/06-performance`

Load the booking JavaScript only on booking pages. Consolidate and fingerprint the Signature styles, serve cache and security headers, and validate all 109 HTML documents, including localized errors and the English-only products page.

The final standard-library suite passes. Chromium exercised English and Arabic navigation, booking deep links, keyboard and no-JavaScript behavior, mocked booking submissions and analytics. The homepage loads 46,372 bytes of external JavaScript compared with 223,761 bytes before the rebuild.

Checks ran against local dist output. Production delivery, indexing and field performance require deployment. See OWNER_TODO.md for clinical, verification, privacy and review prerequisites.

[Open the prepared comparison](https://github.com/mohamedtarek750/Soie_Clinic_Website/compare/seo/05-discovery...seo/06-performance?expand=1&title=Optimize+page+delivery+and+verify+the+complete+static+build&body=%23%23+Changes%0A%0ALoad+the+booking+JavaScript+only+on+booking+pages.+Consolidate+and+fingerprint+the+Signature+styles%2C+serve+cache+and+security+headers%2C+and+validate+all+109+HTML+documents%2C+including+localized+errors+and+the+English-only+products+page.%0A%0A%23%23+Verification%0A%0AThe+final+standard-library+suite+passes.+Chromium+exercised+English+and+Arabic+navigation%2C+booking+deep+links%2C+keyboard+and+no-JavaScript+behavior%2C+mocked+booking+submissions+and+analytics.+The+homepage+loads+46%2C372+bytes+of+external+JavaScript+compared+with+223%2C761+bytes+before+the+rebuild.%0A%0A%23%23+Outstanding%0A%0AChecks+ran+against+local+dist+output.+Production+delivery%2C+indexing+and+field+performance+require+deployment.+See+OWNER_TODO.md+for+clinical%2C+verification%2C+privacy+and+review+prerequisites.%0A)
