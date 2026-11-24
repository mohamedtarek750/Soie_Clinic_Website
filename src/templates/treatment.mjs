import { area, branchLinks } from './footer.mjs';
import { hero } from './pages.mjs';

function facts(page, branches, ctx) {
  const { ar, esc, url } = ctx;
  const rows = page.facts.map(([label, value]) => `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`);
  if (branches.length) {
    const links = branches.map(branch => `<a href="${url('/branches/' + branch.id)}">${esc(area(branch, ar))}</a>`);
    rows.push(`<dt>${ar ? 'الفروع المتاحة' : 'Available at'}</dt><dd>${links.join(ar ? '، ' : ' · ')}</dd>`);
  }
  return `<h2>${ar ? 'معلومات عن العلاج' : 'Treatment facts'}</h2><dl class="editorial-facts">${rows.join('')}</dl>`;
}

function casePhotos(page, ctx) {
  const { results, ar, esc, url } = ctx;
  const cases = results.filter(item => item.consent === true && item.treatmentPath === page.path).slice(0, 3);
  if (!cases.length) return '';
  const images = cases.map(item => {
    const sources = [...(item.variants || []), { src: item.image, width: item.width }];
    const srcset = sources.map(v => esc(v.src) + ' ' + v.width + 'w').join(', ');
    const lang = ar ? 'ar' : 'en';
    return `<figure class="ba"><a href="${url('/results')}#case-${esc(item.id)}">
      <img src="${esc(item.image)}" srcset="${srcset}" sizes="(min-width: 800px) 280px, 45vw" alt="${esc(item.alt[lang])}" width="${item.width}" height="${item.height}" loading="lazy"></a>
      <figcaption class="ba__cap">${esc(ctx.resultCaption(item, ctx))}</figcaption></figure>`;
  });
  return `<h2>${ar ? 'صور من الحالات' : 'Case photographs'}</h2><div class="gallery__grid">${images.join('')}</div>
    <p>${ar ? 'تختلف النتائج من شخص لآخر.' : 'Results vary from person to person.'}</p>`;
}

function related(page, ctx) {
  const { pages, esc, ar, url } = ctx;
  const links = page.related.map(path => pages.find(entry => entry.path === path)).filter(Boolean);
  if (!links.length) return '';
  return `<h2>${ar ? 'معلومات ذات صلة' : 'Related care and guides'}</h2><ul class="editorial-links">
    ${links.map(entry => `<li><a href="${url(entry.path)}">${esc(entry.h1)}</a></li>`).join('')}</ul>`;
}

function surgerySections(page, ctx) {
  const { esc, ar, site } = ctx;
  if (page.type !== 'surgery') return '';
  const procedures = page.procedures.map(({ name, text }) =>
    `<section><h3>${esc(name)}</h3><p>${esc(text)}</p></section>`).join('');
  const facility = site.plasticSurgery.facility;
  const place = typeof facility === 'string' ? facility : facility?.[ar ? 'ar' : 'en'];
  const location = place ? `<p>${ar ? 'مكان إجراء العمليات' : 'Operating facility'} · ${esc(place)}</p>` : '';
  return `<h2>${ar ? 'العمليات التي يمكن مناقشتها' : 'Procedures to discuss'}</h2>${procedures}${location}`;
}

function clinicalNote(p, { ar, site, esc }) {
  const reviewed = p.reviewStatus === 'reviewed' && p.lastReviewed;
  const date = reviewed ? p.lastReviewed : p.updated;
  const who = ar ? `راجع المحتوى الفريق الطبي في ${esc(site.brand.nameEn)}.` : `Reviewed by the ${esc(site.brand.nameEn)} medical team.`;
  return `<aside class="container editorial-note"><p>${ar ? 'هذه معلومات طبية عامة.' : 'General medical information.'} ${reviewed ? who : ''}
    ${ar ? (reviewed ? 'آخر مراجعة' : 'آخر تحديث') : (reviewed ? 'Last reviewed' : 'Updated')} <time datetime="${esc(date)}">${esc(date)}</time>.</p></aside>`;
}

export function treatment(p, ctx) {
  const { ar, site, esc, url } = ctx;
  const branches = site.branches.filter(b => p.branches.includes(b.id));
  const surgery = p.type === 'surgery';
  const contacts = surgery ? site.branches : branches;
  const steps = p.steps || [p.preparation, p.howPerformed, ar ? 'قبل المغادرة نتفق على العناية المطلوبة وموعد مراجعة الاستجابة.' : 'Before you leave, agree on aftercare and when to review the response.'];
  const slug = p.path.split('/').at(-1);
  const bookingTitle = surgery
    ? (ar ? 'احجز استشارة مع الجراح الشريك' : 'Arrange a partner surgical consultation')
    : (ar ? 'احجز استشارة' : 'Book a consultation');
  return hero(p, ctx) + `<section class="section"><div class="container svc">
    <article class="svc__body editorial-section">
      ${facts(p, branches, ctx)}
      <h2>${ar ? 'لمن يناسب هذا الخيار؟' : 'Who might consider it?'}</h2><p>${esc(p.suitability)}</p>
      ${surgerySections(p, ctx)}
      <h2>${ar ? 'خطوات الزيارة' : 'What happens at the visit'}</h2>
      <ol class="mini-steps">${steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>
      <h2>${ar ? 'التعافي والعناية بعد الزيارة' : 'Recovery and aftercare'}</h2>
      <p>${esc(p.followup)}</p><p>${esc(p.outlook)}</p>
      <h2>${ar ? 'المخاطر والآثار الجانبية' : 'Risks and side effects'}</h2><p>${esc(p.risks)}</p>
      <h2>${ar ? 'أسئلة شائعة' : 'Patient questions'}</h2><div class="acc">
      ${p.faqs.map(({q,a}) => `<details><summary>${esc(q)}</summary><p class="acc__a">${esc(a)}</p></details>`).join('')}</div>
      ${related(p, ctx)}${casePhotos(p,ctx)}
    </article>
    <aside class="svc__aside"><div class="info-card"><span class="info-card__label">${ar ? 'استشارة' : 'Consultation'}</span>
      <p class="info-card__text">${ar ? 'نراجع الخيارات والملاءمة معك قبل اتخاذ أي قرار.' : 'Discuss suitability and alternatives before deciding on care.'}</p>
      <a class="btn btn--gold" href="${url('/book')}?service=${esc(slug)}">${bookingTitle}</a></div></aside>
    </div></section>
    ${ctx.reviewBlock(contacts.map(b => b.id),true)}
    <section class="section"><div class="container editorial-section"><h2 class="section__title">${bookingTitle}</h2>
      ${surgery ? `<p>${ar ? 'يتولى الاستقبال ترتيب الاستشارة مع الجراح الشريك.' : 'Reception can arrange a consultation with a partner consultant surgeon.'}</p>` : ''}
      ${contacts.map(b => `<p><strong>${esc(area(b,ar))}</strong> · ${branchLinks(b,ctx)}</p>`).join('')}
      <p><a class="btn btn--gold" href="${url('/book')}?service=${esc(slug)}">${ar ? 'استخدم نموذج الحجز' : 'Use the booking form'}</a></p>
    </div></section>` + clinicalNote(p, ctx);
}
