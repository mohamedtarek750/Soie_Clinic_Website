export function branchLinks(branch, ctx) {
  const { ar, esc: e } = ctx;
  return `<a href="${e(branch.whatsapp)}" data-branch="${e(branch.id)}">WhatsApp</a> · <a dir="ltr" href="tel:${e(branch.telephone)}" aria-label="${ar ? 'اتصل' : 'Call'} ${e(branch.telephone)}" data-branch="${e(branch.id)}">${e(branch.telephone)}</a>`;
}

export function area(branch, ar) {
  return ar ? branch.areaAr : branch.areaEn;
}

export function address(branch, ar) {
  return ar && branch.streetAddressAr ? branch.streetAddressAr : branch.streetAddressEn;
}

export function footer(page, ctx) {
  const { ar, site, pages, esc: e, url } = ctx;
  const nav = [
    ['/', 'Home', 'الرئيسية'], ['/about','About','عن العيادات'],
    ['/treatments','Treatments','العلاجات'], ['/devices','Devices','الأجهزة'],
    ['/results','Before & After','قبل وبعد'], ['/guides','Patient guides','أدلة المرضى'],
    ['/faq','FAQ','أسئلة شائعة'], ['/contact','Contact','تواصل معنا'],
    ['/book','Book appointment','احجز موعدًا'], ['/products','Products',''], ['/privacy','Privacy','الخصوصية']
  ];
  const links = nav.filter(([path])=>pages.some(p=>p.path===path)).map(([path,en,arabic])=>`<a href="${url(path)}">${e(ar ? arabic : en)}</a>`).join('');
  const brand = e(site.brand.nameEn);
  const socials = site.brand.sameAs.filter(href=>href!==site.brand.facebookUrl).map(href=>[href, href.includes('instagram.com') ? 'Instagram' : href.includes('threads.') ? 'Threads' : new URL(href).hostname]);
  socials.push([site.brand.facebookUrl || site.brand.legacyFacebookUrl,'Facebook']);
  const social = socials.map(([href,label])=>`<a href="${e(href)}" rel="noopener" aria-label="${e(label)}">${e(label)}</a>`).join('');
  const branches = site.branches.map(b=>{
    const path='/branches/'+b.id;
    const label=e(area(b,ar));
    return `<p><strong>${pages.some(p=>p.path===path) ? `<a href="${url(path)}">${label}</a>` : label}</strong><br>${e(address(b,ar))}<br>${branchLinks(b,ctx)}</p>`;
  }).join('');
  return `<footer class="footer"><div class="container signature-footer-cta"><h2>${ar ? 'خطوتك القادمة تبدأ هنا.' : 'Your next step starts here.'}</h2><a class="btn btn--gold" href="${url('/book')}" data-open-booking>${ar ? 'احجز موعدًا' : 'Book appointment'} →</a></div>
<div class="container footer__grid"><div class="footer__brand"><img src="/assets/images/logo-cream.png" alt="${brand}" width="120" height="114" loading="lazy"><p class="footer__tag">${ar ? 'عناية تجميلية في' : 'Aesthetic care at'} ${brand}.</p>
<div class="footer__social footer__social-text">${social}</div></div>
<nav class="footer__nav" aria-label="${ar ? 'تذييل الصفحة' : 'Footer'}"><h3>${ar ? 'استكشف' : 'Explore'}</h3>${links}</nav>
<div class="footer__contact"><h3>${ar ? 'الفروع' : 'Branches'}</h3>${branches}</div></div>
<div class="footer__bottom"><div class="container footer__bottom-in"><p>© ${brand}. ${ar ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p></div></div></footer>`;
}
