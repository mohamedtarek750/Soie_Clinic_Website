// These entries are supplied by the clinic and reproduced verbatim in each language.
function publicLink(value) {
  try {
    const link = new URL(value);
    return link.protocol === 'https:' && !link.username && !link.password;
  } catch {
    return false;
  }
}

function displayable(review) {
  if (![review.text, review.author, review.source].every(value => typeof value === 'string' && value.trim())) return false;
  if (!publicLink(review.url)) return false;
  const published = [review.author, review.source, review.text].join('\n');
  const currency = '(?:EGP|L\\.?E\\.?|ج\\.?\\s?م\\.?|جنيه(?:ات)?|\\$)';
  const amount = '[0-9٠-٩۰-۹]';
  const price = new RegExp(currency + '\\s*' + amount + '|' + amount + '\\s*' + currency, 'iu');
  const namedPractitioner = /(?:\b(?:dr\.?|doctor|professor)\s+\p{L}|(?:^|\s)(?:د\.|دكتور(?:ة)?|الدكتور(?:ة)?)\s*[\u0621-\u064a])/iu;
  return !price.test(published) && !namedPractitioner.test(published);
}

function renderCurated(review, esc) {
  const date = review.date ? ' · <time>' + esc(review.date) + '</time>' : '';
  return '<figure class="clinic-review"><blockquote dir="auto" translate="no">' +
    esc(review.text).replace(/\r\n?|\n/g, '<br>') + '</blockquote><figcaption><bdi translate="no">' + esc(review.author) +
    '</bdi> · <a href="' + esc(review.url) + '" rel="external noreferrer"><bdi>' + esc(review.source) +
    '</bdi></a>' + date + '</figcaption></figure>';
}

export function reviewBlock(branchIDs, compact, {site, ar, esc}) {
  const sections = site.branches.filter(branch => branchIDs.includes(branch.id)).map(branch => {
    const reviews = site.reviews.curated.filter(review => review.branch === branch.id && displayable(review));
    const selected = compact ? reviews.slice(0, 1) : reviews;
    const figures = selected.map(review => renderCurated(review, esc)).join('');
    const label = ar ? 'اقرأ آراء المراجعين على خرائط Google' : 'Read our reviews on Google Maps';
    const area = esc(ar ? branch.areaAr : branch.areaEn);
    const map = publicLink(branch.mapUrl) ? '<p><a href="' + esc(branch.mapUrl) + '" data-branch="' +
      esc(branch.id) + '" data-event="map_click" rel="external noreferrer">' + label + ' <span>— ' + area +
      '</span></a></p>' : '';
    return figures || map ? '<div data-reviews-branch="' + esc(branch.id) + '">' + figures + map + '</div>' : '';
  }).join('');
  if (!sections) return '';
  return '<section class="section clinic-reviews" aria-label="' + (ar ? 'آراء المراجعين' : 'Patient reviews') +
    '"><div class="container">' + sections + '</div></section>';
}
