import { header } from './header.mjs';
import { footer, area, address, branchLinks } from './footer.mjs';
import { dialog } from './dialog.mjs';

export function localizeFacts(page, ctx) {
  const { ar, site } = ctx;
  const brand = ar && site.brand.nameAr ? `${site.brand.nameAr} (${site.brand.nameEn})` : site.brand.nameEn;
  const substitute = (value, html = false) => {
    if (Array.isArray(value)) return value.map(v => substitute(v));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, substitute(v, k === 'html')]));
    if (typeof value !== 'string') return value;
    return value.replace(/\{\{(brand|origin|area|address)(?::([\w-]+))?\}\}/g, (_,key,id)=>{
      const branch = id && site.branches.find(b=>b.id === id);
      const fact = key === 'brand' ? brand : key === 'origin' ? site.origin : key === 'area' ? area(branch,ar) : address(branch,ar);
      return html ? ctx.esc(fact) : fact;
    });
  };
  return substitute(page);
}

const bookingKeys = {'new-cairo':'New Cairo', mohandessin:'Mohandseen'};
const oldOptions = {botox:'Botox','dermal-filler':'Dermal Filler',dentistry:'Dentistry',laser:'Laser',facial:'Medical Facials',hydrafacial:'Hydrafacial','skin-boosters':'Skin Boosters',peeling:'Chemical Peeling',exosomes:'Exosomes','body-contouring':'Body Contouring',veneers:'Veneers'};
function bookingOptions(ctx) {
  return ctx.pages.filter(p=>p.path === '/plastic-surgery' || /^\/(?:treatments\/|dentistry(?:\/|$))/.test(p.path)).map(p=>{
    const slug = p.path.split('/').pop();
    const branch = p.branches?.length === 1 ? bookingKeys[p.branches[0]] : p.path.startsWith('/dentistry') ? bookingKeys.mohandessin : '';
    const visible = p.name || p.h1;
    return `<option value="${ctx.esc(oldOptions[slug] || slug)}" data-slug="${ctx.esc(slug)}"${branch ? ` data-branch="${ctx.esc(branch)}"` : ''}>${ctx.esc(visible)}</option>`;
  }).join('');
}
function branchInputs(ctx) {
  const { site, ar, esc: e } = ctx;
  return site.branches.map((b,i)=>`<label class="opt">
<input type="radio" name="bkBranch" value="${e(bookingKeys[b.id])}" data-name="${e(area(b,ar))}" data-branch="${b.id}" data-wa="${e(b.whatsapp.split('/').pop())}" data-hours="${e(JSON.stringify(b.hours || []))}"${i===0?' checked':''}>
<span class="opt__name">${e(area(b,ar))}</span><span class="opt__meta">${e(address(b,ar))}</span></label>`).join('');
}
export function legacyMain(p,ctx) {
  const { ar, site, esc: e, url, pages } = ctx;
  let main = p.html;
  if (p.path === '/') {
    const branches = site.branches.map(b=>{
      const target = '/branches/'+b.id;
      const label = e(area(b,ar));
      return `<div><p class="sig-branch-name">${pages.some(p=>p.path===target) ? `<a href="${url(target)}">${label}</a>` : label}</p><p class="sig-branch-address">${e(address(b,ar))}</p></div>`;
    }).join('');
    main = main.replace('{{homeBranches}}',branches)
      .replace('{{homeReviews}}',ctx.reviewBlock ? ctx.reviewBlock(site.branches.map(b=>b.id),false) : '');
  }
  if (p.path === '/book') {
    main = main.replace('{{branchInputs}}',branchInputs(ctx)).replace('{{serviceOptions}}',bookingOptions(ctx))
      .replace('{{branchContacts}}',site.branches.map(b=>`<span>${e(area(b,ar))} · ${branchLinks(b,ctx)}</span>`).join('<br>'));
    if (pages.some(p=>p.path==='/privacy')) main += `<p class="container"><a href="${url('/privacy')}">${ar?'كيف نستخدم بيانات الحجز':'How we use your booking details'}</a></p>`;
  }
  if (p.type === 'device') {
    const slug = p.path.split('/').pop();
    const related = {'cutera-excel-hr':'laser-hair-removal','indiba-deep-care':'body-contouring','finexel-fractional-co2':'fractional-co2-laser'}[slug];
    const treatment = pages.find(t=>t.path==='/treatments/'+related);
    main += `<aside class="container device-source">${treatment ? `<a href="${url(treatment.path)}">${e(treatment.h1)}</a>` : ''}
<p>${ar?'معلومات طبية عامة. آخر تحديث':'General medical information. Updated'} <time datetime="${e(p.updated)}">${e(p.updated)}</time>.</p></aside>`;
  }
  return main;
}

export function layout(p,ctx,main,head) {
  const { ar, url, esc: e, assets } = ctx;
  const home = p.path === '/';
  const bookLabel = ar ? 'احجز موعدًا' : 'Book appointment';
  return `<!doctype html>
<html lang="${ar?'ar-EG':'en'}" dir="${ar?'rtl':'ltr'}" class="no-js">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f4f1eb">
${head}
<link rel="icon" href="/assets/images/favicon.png" type="image/png">
${home ? '<link rel="preload" as="image" type="image/webp" href="/assets/images/cat-derma-900.webp" imagesrcset="/assets/images/cat-derma-900.webp 900w" imagesizes="(max-width: 720px) 90vw, 450px" fetchpriority="high">' : ''}
${assets.css.map(src=>`<link rel="stylesheet" href="${e(src)}">`).join('\n')}
${assets.js.map(src=>`<script src="${e(src)}" defer></script>`).join('\n')}</head>
<body class="signature-site${home?' signature-home':''}" data-page="${e(p.path)}">
${header(p,ctx)}
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="sig-arrow" viewBox="0 0 24 24"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></symbol></svg>
<main id="main">${main}</main>
${footer(p,ctx)}${dialog(ctx)}
<button class="to-top" id="toTop" aria-label="${ar?'العودة إلى أعلى الصفحة':'Back to top'}">↑</button>
${home || p.path==='/results' ? `<div class="lightbox" id="lightbox" aria-hidden="true"><button class="lightbox__close" id="lbClose" aria-label="${ar?'إغلاق':'Close'}">×</button><button class="lightbox__nav lightbox__nav--prev" id="lbPrev" aria-label="${ar?'السابق':'Previous'}">←</button><figure class="lightbox__fig"><img id="lbImg" alt="" width="960" height="960" loading="lazy"><figcaption id="lbCap"></figcaption></figure><button class="lightbox__nav lightbox__nav--next" id="lbNext" aria-label="${ar?'التالي':'Next'}">→</button></div>` : ''}
${home ? `<div class="signature-bookbar" data-signature-bookbar hidden inert aria-hidden="true"><span>${ar?'وقت قصير من أجلك.':'A little time for you.'}</span><a class="btn btn--gold" href="${url('/book')}" data-open-booking>${bookLabel} →</a></div>` : ''}
</body></html>`;
}
