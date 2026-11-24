// Static editorial pages use the same page hero, section, branch and gallery
// classes as the original site. All links and copy are available without JS.
const heroPhotography = {
  about: 'about', contact: 'contact', results: 'before-after',
  branch: 'services', legal: 'book', hub: 'services',
};

function heroPicture(photo) {
  const base = '/assets/images/bg/' + photo;
  const sizes = '(max-width: 780px) 90vw, 40vw';
  const sources = ['avif', 'webp'].map(format =>
    `<source type="image/${format}" srcset="${base}-960.${format} 960w, ${base}-1920.${format} 1920w" sizes="${sizes}">`
  );
  return `<picture>${sources.join('')}
    <img class="hero-bg__media" src="${base}-1920.jpg" srcset="${base}-960.jpg 960w, ${base}-1920.jpg 1920w"
      sizes="${sizes}" width="1920" height="1080" alt="" fetchpriority="high" decoding="async">
  </picture>`;
}

export function hero(p, ctx) {
  const {ar, esc, url} = ctx;
  const photo = p.heroPhoto || heroPhotography[p.type] || (p.path.includes('laser') ? 'laser' : p.path.includes('botox') ? 'botox' : 'about');
  const video = p.heroVideo && '/assets/videos/bg-' + esc(p.heroVideo);
  const media = video
    ? `<video class="film hero-bg__media" muted loop playsinline preload="none"
        poster="/assets/videos/posters/bg-${esc(p.heroVideo)}.jpg" data-film data-src="${video}.mp4"
        data-src-portrait="${video}-portrait.mp4" aria-hidden="true" tabindex="-1" width="1600" height="900"></video>`
    : heroPicture(esc(photo));
  const pause = video ? `<button class="film-toggle film-toggle--hero" type="button" data-media-toggle
    aria-label="${ar?'إيقاف الفيديو مؤقتًا':'Pause video'}" aria-pressed="false"></button>` : '';
  const parent = ctx.pages.find(entry => entry.path === p.path.slice(0, p.path.lastIndexOf('/')));
  const parentLink = parent ? `<a href="${url(parent.path)}">${esc(parent.h1)}</a> · ` : '';
  return `<section class="page-hero">
    <div class="page-hero__art" data-bg="${esc(p.heroVideo || photo)}" aria-hidden="true">${media}</div>${pause}
    <div class="container">
      <nav class="crumbs" aria-label="${ar?'مسار التنقل':'Breadcrumb'}">
        <a href="${url('/')}">${ar?'الرئيسية':'Home'}</a> · ${parentLink}<span aria-current="page">${esc(p.h1)}</span>
      </nav>
      <h1 class="page-hero__title">${esc(p.h1)}</h1><p class="page-hero__lede">${esc(p.answer)}</p>
    </div>
  </section>`;
}

function section(heading, content) {
  return `<section class="section"><div class="container editorial-section"><h2 class="section__title">${heading}</h2>${content}</div></section>`;
}
function headingSections(p, ctx) {
  return (p.sections || []).map(s => section(ctx.esc(s.heading), s.paragraphs.map(text => '<p>'+ctx.esc(text)+'</p>').join(''))).join('');
}
function contactLinks(b, {ar, esc}) {
  return `<div class="editorial-actions" data-branch="${esc(b.id)}"><a class="btn btn--wa" href="${esc(b.whatsapp)}" data-branch="${esc(b.id)}">${ar?'راسل الاستقبال على واتساب':'Message reception on WhatsApp'}</a> <a class="sig-text-link" data-branch="${esc(b.id)}" href="tel:${esc(b.telephone)}">${ar?'اتصل على':'Call'} <bdi>${esc(b.telephone)}</bdi></a></div>`;
}
function label(b, ctx) {
  return ctx.ar ? b.areaAr : b.areaEn;
}
function address(b,ar) {
  const values=ar ? [b.streetAddressAr || b.streetAddressEn,b.floor,b.localityAr || b.localityEn,b.regionAr || b.regionEn,b.postalCode,b.countryAr || b.country] : [b.streetAddressEn,b.floor,b.localityEn,b.regionEn,b.postalCode,b.country];
  return values.filter(Boolean).join(ar?'، ':', ');
}
function branchCards(ctx) {
  const {ar,site,url,esc}=ctx;
  return section(ar?'عناوين الفروع ووسائل التواصل':'Branch addresses and contacts',`<div class="branches">${site.branches.map(b=>`<article class="branch"><h3 class="branch__city"><a href="${url('/branches/'+b.id)}">${esc(label(b,ctx))}</a></h3><p class="branch__addr" dir="${ar?'rtl':'ltr'}">${esc(address(b,ar))}</p>${contactLinks(b,ctx)}</article>`).join('')}</div>`);
}
function linkList(list, ctx) {
  return `<ul class="editorial-links">${list.map(item=>`<li><a href="${ctx.url(item.path)}">${ctx.esc(item.h1)}</a></li>`).join('')}</ul>`;
}
function relatedPages(paths, ctx) {
  return paths.map(path=>ctx.pages.find(entry=>entry.path===path)).filter(Boolean);
}
const categoryLabels = {
  'Injectables':'الحقن التجميلي', 'Skin and hair':'البشرة والشعر', 'Laser':'الليزر',
  'Body and nutrition':'الجسم والتغذية', 'Dentistry':'الأسنان', 'Plastic surgery':'جراحات التجميل',
};
const categoryPhotos = {
  'Injectables': 'bg/botox-960', 'Skin and hair': 'cat-derma-900',
  'Laser': 'bg/laser-960', 'Body and nutrition': 'cat-nutrition-900',
  'Dentistry': 'cat-dentistry-900', 'Plastic surgery': 'cat-plastic-surgery-900',
};
function treatmentLinks(list, ctx) {
  const {ar, url, esc} = ctx;
  const cards = Object.entries(categoryLabels).map(([category, arabic]) => {
    const group = list.filter(p => p.category === category || (category === 'Plastic surgery' && p.type === 'surgery'));
    if (!group.length) return '';
    const photo = '/assets/images/' + categoryPhotos[category];
    const wide = photo.includes('/bg/');
    const links = group.map(p => `<a class="cat-chip" href="${url(p.path)}">${esc(p.name || p.h1)}</a>`).join(' ');
    const sources = ['avif', 'webp'].map(format => {
      const variants = wide
        ? photo+'.'+format+' 960w, '+photo.replace('-960','-1920')+'.'+format+' 1920w'
        : photo+'.'+format+' 900w';
      return `<source type="image/${format}" srcset="${variants}" sizes="(min-width: 960px) 45vw, 90vw">`;
    });
    return `<article class="cat-card">
      <picture class="cat-card__img">${sources.join('')}<img loading="lazy" decoding="async" src="${photo}.jpg"
        alt="" width="${wide?960:900}" height="${wide?540:502}"></picture>
      <div class="cat-card__body"><h2 class="cat-card__title">${ar?arabic:category}</h2>
        <div class="cat-chips">${links}</div></div>
    </article>`;
  });
  return `<section class="section services" aria-label="${ar?'فئات العلاج':'Treatment categories'}">
    <div class="container"><div class="cat-grid">${cards.join('')}</div></div>
  </section>`;
}
const weekdays = {
  Sa:['Saturday','السبت'],Su:['Sunday','الأحد'],Mo:['Monday','الاثنين'],Tu:['Tuesday','الثلاثاء'],
  We:['Wednesday','الأربعاء'],Th:['Thursday','الخميس'],Fr:['Friday','الجمعة'],
};
function hours(b,ctx) {
  return b.hours.map(rule=>{
    const days=rule.days.map(k=>weekdays[k][ctx.ar?1:0]).join(ctx.ar?'، ':', ');
    return `<dt>${ctx.esc(days)}</dt><dd><bdi>${ctx.esc(rule.opens)} – ${ctx.esc(rule.closes)}</bdi></dd>`;
  }).join('');
}
function directions(b) {
  return b.mapUrl || 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(b.geo.lat+','+b.geo.lng);
}
// Draw the two geocoded points at their relative latitude and longitude.
// The map link opens the detailed street map only after the visitor activates it.
function locationMap(branch,ctx) {
  const {ar,esc,site}=ctx;
  const minLng=Math.min(...site.branches.map(b=>b.geo.lng));
  const maxLng=Math.max(...site.branches.map(b=>b.geo.lng));
  const centerLat=(Math.max(...site.branches.map(b=>b.geo.lat))+Math.min(...site.branches.map(b=>b.geo.lat)))/2;
  const scale=370/Math.max(.01,(maxLng-minLng));
  const points=site.branches.map(b=>{
    const x=95+(b.geo.lng-minLng)*scale;
    const y=100+(centerLat-b.geo.lat)*scale/Math.cos(centerLat*Math.PI/180);
    const active=b.id===branch.id;
    return `<circle cx="${x}" cy="${y}" r="${active?9:5}" fill="${active?'#894a52':'#716759'}"/><text x="${x}" y="${y+29}" text-anchor="middle" fill="#43342c" font-size="15">${esc(ar?b.areaAr:b.localityEn)}</text>`;
  }).join('');
  const embed = 'https://www.google.com/maps?q='+encodeURIComponent(branch.geo.lat+','+branch.geo.lng)+'&z=16&output=embed';
  const title=ar?'عرض الموقع على خرائط Google':'Open location in Google Maps';
  return `<a class="editorial-map" data-embed-map="${esc(embed)}" data-event="map_click" href="${esc(directions(branch))}" data-branch="${esc(branch.id)}" target="_blank" rel="noopener noreferrer"><svg role="img" aria-label="${esc(ar?'موقع الفرعين بالنسبة إلى بعضهما في القاهرة الكبرى':'Locations of the two branches in Greater Cairo')}" viewBox="0 0 560 200" width="560" height="200"><rect width="560" height="200" fill="#f0e9de"/><g stroke="#d8cfc0" stroke-width="1"><path d="M0 50h560M0 100h560M0 150h560M70 0v200M140 0v200M210 0v200M280 0v200M350 0v200M420 0v200M490 0v200"/></g>${points}<text x="25" y="30" text-anchor="middle" fill="#514535">↑ N</text></svg><span>${title}</span></a>`;
}
export function pageFaqs(p,ctx) {
  if(p.type!=='branch') return p.faqs || [];
  const {ar,site}=ctx;
  const b=site.branches.find(item=>item.id===p.branchId);
  const name=ar && site.brand.nameAr ? site.brand.nameAr+' ('+site.brand.nameEn+')' : site.brand.nameEn;
  return [{
    q:ar?'أين يقع فرع '+name+' في '+b.areaAr+'؟':'Where is '+name+' in '+b.localityEn+'?',
    a:ar?'عنوان الفرع هو '+address(b,ar)+'.':'The branch address is '+address(b,ar)+'.',
  },{
    q:ar?'كيف أحجز موعدًا في هذا الفرع؟':'How do I arrange an appointment at this branch?',
    a:ar?'اتصل على '+b.telephone+' أو أرسل رسالة واتساب إلى استقبال الفرع، أو أرسل طلبًا عبر نموذج الحجز. يؤكد الاستقبال الموعد معك.':'Call '+b.telephone+', message branch reception on WhatsApp or send the booking form. Reception will contact you to confirm your appointment.',
  },...(p.faqs||[])];
}
function faqList(entries,ctx) {
  return entries.length ? section(ctx.ar?'أسئلة عن زيارة الفرع':'Questions about your visit',`<div class="acc">${entries.map(({q,a})=>`<details class="acc__item"><summary>${ctx.esc(q)}</summary><p class="acc__a">${ctx.esc(a)}</p></details>`).join('')}</div>`) : '';
}
function branch(p,ctx) {
  const {ar,esc,site,url}=ctx;
  const b=site.branches.find(item=>item.id===p.branchId);
  const treatments=ctx.pages.filter(page=>page.branches?.includes(b.id) && page.type==='treatment');
  const facts=`<dl class="editorial-facts"><dt>${ar?'العنوان':'Address'}</dt><dd><bdi>${esc(address(b,ar))}</bdi></dd><dt>${ar?'هاتف الاستقبال':'Reception telephone'}</dt><dd><a href="tel:${esc(b.telephone)}" data-branch="${esc(b.id)}"><bdi>${esc(b.telephone)}</bdi></a></dd>${b.licenceNumber?`<dt>${ar?'رقم الترخيص':'Licence number'}</dt><dd>${esc(b.licenceNumber)}</dd>`:''}</dl>`;
  const photos=(b.photos||[]).map(photo=>`<figure><img src="${esc(photo.src)}" alt="${esc(photo.alt[ar?'ar':'en'])}" width="${photo.width}" height="${photo.height}" loading="lazy"></figure>`).join('');
  return section(ar?'العنوان والحجز':'Address and appointments',facts+contactLinks(b,ctx)+`<p><a href="${url('/book')}">${ar?'طلب موعد عبر نموذج الحجز':'Request an appointment online'}</a></p>`)
    +(b.hours?section(ar?'مواعيد العمل':'Opening hours','<dl class="editorial-facts">'+hours(b,ctx)+'</dl>'):'')
    +section(ar?'الوصول إلى الفرع':'Directions',locationMap(b,ctx)+(b.landmarks?.length?'<p>'+esc(b.landmarks.join(', '))+'</p>':'')+photos)
    +(treatments.length?section(ar?'العلاجات المتاحة في الفرع':'Treatments at this branch',linkList(treatments,ctx)):'')
    +faqList(pageFaqs(p,ctx),ctx)+ctx.reviewBlock([b.id],false);
}
export function resultCaption(item,ctx) {
  const lang=ctx.ar?'ar':'en';
  const getText=value=>typeof value==='object' && value ? value[lang] : value;
  const details=[item.caption[lang], getText(item.productFamily),
    item.sessions != null ? (ctx.ar?'عدد الجلسات: ':'Sessions: ')+item.sessions : '',
    item.interval ? (ctx.ar?'الفاصل الزمني: ':'Interval: ')+getText(item.interval) : '',
    item.branch ? label(ctx.site.branches.find(b=>b.id===item.branch),ctx) : ''];
  return details.filter(Boolean).join(' · ');
}
function comparison(item,ctx) {
  if (!item) return '';
  const {ar,esc}=ctx;
  const lang=ar?'ar':'en';
  const pair=item.comparison;
  const photo=key=>`<img class="cmp__${key}" src="${esc(pair[key].src)}" width="${pair.width}" height="${pair.height}"
    loading="lazy" alt="${esc(pair[key].alt[lang])}">`;
  return `<div class="cmp-feature"><div class="cmp">
    ${photo('after')}${photo('before')}
    <span class="cmp__tag cmp__tag--before">${ar?'قبل':'Before'}</span>
    <span class="cmp__tag cmp__tag--after">${ar?'بعد':'After'}</span>
    <input type="range" class="cmp__range" min="0" max="100" value="50"
      aria-label="${esc(ar?'قارن صور '+item.treatment.ar+' قبل وبعد':'Compare before and after '+item.treatment.en)}">
    <div class="cmp__divider" aria-hidden="true"></div><div class="cmp__grip" aria-hidden="true">↔</div>
  </div></div>`;
}
function resultsGallery(ctx) {
  const {esc,ar,results}=ctx;
  const items=results.filter(item=>item.consent===true);
  if (!items.length) return '';
  const categories={all:['All','الكل'],dental:['Dental','الأسنان'],lips:['Lips','الشفايف'],eyes:['Under the eyes','تحت العين'],botox:['Botox','البوتوكس'],contour:['Contour','تحديد الملامح'],skinhair:['Skin and hair','البشرة والشعر']};
  const shown=Object.entries(categories).filter(([key])=>key==='all'||items.some(item=>item.category===key));
  const filters=shown.map(([key,names])=>`<button type="button" class="filter${key==='all'?' is-active':''}" aria-pressed="${key==='all'}" data-filter="${key}">${names[ar?1:0]}</button>`).join('');
  const cases=items.map(item=>{
    const variants=[...(item.variants||[]),{src:item.image,width:item.width}].map(v=>esc(v.src)+' '+v.width+'w').join(', ');
    return `<figure id="case-${esc(item.id)}" class="ba" data-cat="${esc(item.category)}"><img src="${esc(item.image)}" srcset="${variants}" sizes="(min-width: 981px) 275px, 40vw" alt="${esc(item.alt[ar?'ar':'en'])}" width="${item.width}" height="${item.height}" loading="lazy" decoding="async"><figcaption class="ba__cap"><span class="ba__name">${esc(resultCaption(item,ctx))}</span></figcaption></figure>`;
  }).join('');
  const compare=comparison(items.find(item=>item.comparison),ctx);
  return section(ar?'معرض الحالات':'Treatment gallery',compare+`<div class="filters" role="group" aria-label="${ar?'تصفية الصور':'Filter case photographs'}">${filters}</div><div id="galleryGrid" class="gallery__grid">${cases}</div>`);
}
export function pagesContent(p,ctx) {
  const {ar,esc,site,pages}=ctx;
  let body=headingSections(p,ctx);
  if (p.type==='branch') body+=branch(p,ctx);
  if (p.type==='results') body+=resultsGallery(ctx);
  if (p.path==='/treatments') body+=treatmentLinks(pages,ctx);
  if (p.path==='/guides') body+=section(ar?'قبل الزيارة':'Before you book',linkList(pages.filter(entry=>entry.type==='article'),ctx));
  if (p.type==='article') {
    body+=section(ar?'علاجات مرتبطة بهذا الدليل':'Related treatment information',linkList(relatedPages(p.treatmentPaths,ctx),ctx));
    const reviewed=p.reviewStatus==='reviewed' && p.lastReviewed;
    body+=`<div class="container editorial-note"><p>${ar?'إعداد':'By'} ${esc(site.brand.nameEn)} · ${ar?'معلومات طبية عامة':'General medical information'}</p><p>${reviewed?(ar?'راجعه فريق Soie Clinics الطبي في':'Reviewed by the Soie Clinics medical team on'):(ar?'آخر تحديث':'Updated')} <time datetime="${esc(reviewed||p.updated)}">${esc(reviewed||p.updated)}</time></p></div>`;
  }
  if(p.type==='about'){
    const devices=pages.filter(entry=>entry.type==='device');
    body+=section(ar?'الأجهزة المستخدمة في العيادات':'Devices used at the clinics',linkList(devices,ctx));
    if(site.brand.foundingYear) body+=section(ar?'سنة التأسيس':'Year founded','<p>'+esc(String(site.brand.foundingYear))+'</p>');
    for(const b of site.branches.filter(b=>b.licenceNumber)) body+=section(ar?'ترخيص '+esc(label(b,ctx)):esc(label(b,ctx))+' licence','<p>'+esc(b.licenceNumber)+'</p>');
  }
  if (['/branches','/contact','/about','/privacy'].includes(p.path)) body+=branchCards(ctx);
  if (p.type==='results' && !ctx.results.some(item=>item.consent===true)) {
    const answer=ar?'ناقش مع الفريق الفائدة المتوقعة وفترة التعافي وحدود العلاج المناسبة لحالتك.':'Discuss the benefits, recovery and limits of a treatment for your own situation at consultation.';
    return hero({...p,answer},ctx)+body;
  }
  return hero(p,ctx)+body;
}
