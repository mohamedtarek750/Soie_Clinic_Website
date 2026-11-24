import { area, address } from './footer.mjs';

export function dialog(ctx) {
  const { ar, site, url, esc: e } = ctx;
  const branches = site.branches.map(b=>`<div><a class="modal__branch" href="${e(b.whatsapp)}" data-branch="${e(b.id)}"><span><span class="modal__branch-city">${e(area(b,ar))}</span><span class="modal__branch-addr">${e(address(b,ar))}</span></span><span>WhatsApp</span></a><a class="modal__phone" href="tel:${e(b.telephone)}" data-branch="${e(b.id)}">${ar ? 'اتصل' : 'Call'} <bdi>${e(b.telephone)}</bdi></a></div>`).join('');
  return `<dialog id="bookingModal" class="modal" aria-hidden="true" aria-labelledby="modalTitle">
<div class="modal__backdrop" data-close-booking></div><div class="modal__panel">
<button class="modal__close" data-close-booking aria-label="${ar ? 'إغلاق' : 'Close'}">×</button>
<p class="eyebrow modal__eyebrow">${ar ? 'حجز موعد' : 'Book your appointment'}</p><h2 class="modal__title" id="modalTitle">${ar ? 'اختر فرعك' : 'Choose your branch'}</h2>
<p class="modal__sub">${ar ? 'راسل الفرع المناسب وسيساعدك فريق الاستقبال في حجز موعدك.' : 'Message the branch you would like to visit. Our reception team will help you book.'}</p>
<div class="modal__branches">${branches}</div><p class="bk__wa-note"><a href="${url('/book')}">${ar ? 'اختر علاجك وتاريخ زيارتك من صفحة الحجز' : 'Choose your treatment and date on the booking page'} →</a></p></div></dialog>`;
}
