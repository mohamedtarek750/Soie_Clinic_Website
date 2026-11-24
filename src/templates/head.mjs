export function head(p, ctx, schema, image) {
  const {ar, site, esc, url, hasAlternate} = ctx;
  const en = site.origin + p.path;
  const alternate = site.origin + '/ar' + (p.path === '/' ? '' : p.path);
  const canonical = site.origin + url(p.path);
  const tag = (name, content) => '<meta ' + (name.startsWith('og:') ? 'property' : 'name') + '="' + name + '" content="' + esc(content) + '">';
  const link = (rel, href, lang) => '<link rel="' + rel + '" href="' + esc(href) + '"' + (lang ? ' hreflang="' + lang + '"' : '') + '>';
  const social = site.origin + image;
  return [
    '<title>'+esc(p.title)+'</title>', tag('description', p.description), link('canonical',canonical),
    hasAlternate && link('alternate',en,'en'), hasAlternate && link('alternate',alternate,'ar'),
    hasAlternate && link('alternate',en,'x-default'),
    p.noindex && tag('robots','noindex,follow'),
    tag('og:site_name',site.brand.nameEn), tag('og:type',p.type === 'article' ? 'article' : 'website'),
    tag('og:title',p.title), tag('og:description',p.description), tag('og:url',canonical),
    tag('og:image',social), tag('og:image:alt',p.h1), tag('og:image:width','1200'), tag('og:image:height','630'),
    tag('og:locale',ar ? 'ar_EG' : 'en_US'), hasAlternate && tag('og:locale:alternate',ar ? 'en_US' : 'ar_EG'),
    tag('twitter:card','summary_large_image'), tag('twitter:image',social), tag('twitter:title',p.title), tag('twitter:description',p.description),
    site.verification.google && tag('google-site-verification',site.verification.google),
    site.verification.bing && tag('msvalidate.01',site.verification.bing),
    '<script type="application/ld+json">' + JSON.stringify(schema).replaceAll('<','\\u003c') + '</script>'
  ].filter(Boolean).join('\n');
}
