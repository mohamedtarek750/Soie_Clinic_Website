export function header(page, ctx) {
  const { ar, url, esc: e, site } = ctx;
  const brand = e(site.brand.nameEn);
  const navigation = [
    ['/', 'Home', 'الرئيسية', true],
    ['/about', 'About', 'عن العيادات', true],
    ['/treatments', 'Treatments', 'العلاجات'],
    ['/devices', 'Devices', 'الأجهزة'],
    ['/results', 'Before & After', 'قبل وبعد'],
    ['/faq', 'FAQ', 'أسئلة شائعة', true],
    ['/contact', 'Visit us', 'تواصل معنا']
  ];
  const nav = navigation.map(([path, en, arabic, secondary]) =>
    `<a href="${url(path)}" class="nav__link${secondary ? ' nav__link--secondary' : ''}${page.path === path ? ' is-active' : ''}"${page.path === path ? ' aria-current="page"' : ''}>${e(ar ? arabic : en)}</a>`
  ).join('\n');
  const other = ar ? page.path : '/ar' + page.path.replace(/\/$/, '');
  const langSwitch = page.path === '/products' || ctx.hasAlternate === false ? '' :
    `<a class="language-switch" data-language-link href="${other}" hreflang="${ar ? 'en' : 'ar'}" lang="${ar ? 'en' : 'ar'}">${ar ? 'English' : 'العربية'}</a>`;
  const book = ar ? 'احجز موعدًا' : 'Book appointment';
  return `<a href="#main" class="skip-link">${ar ? 'انتقل إلى المحتوى' : 'Skip to content'}</a>
<header class="nav" id="nav"><div class="nav__wrap">
<a href="${url('/')}" class="nav__logo" aria-label="${ar ? 'الصفحة الرئيسية · ' + brand : brand + ' home'}"><img src="/assets/images/logo.png" alt="${brand}" width="68" height="64"><span class="nav__logo-tag">CLINICS</span></a>
<nav class="nav__links" id="navLinks" aria-label="${ar ? 'التنقل الرئيسي' : 'Primary'}">${nav}<a href="${url('/book')}" class="btn btn--gold nav__menu-book">${book}</a></nav>
${langSwitch}<a href="${url('/book')}" class="nav__cta" data-open-booking>${book}</a>
<button type="button" class="nav__burger" id="burger" aria-label="${ar ? 'افتح القائمة' : 'Open menu'}" aria-expanded="false" aria-controls="navLinks"><span></span><span></span><span></span></button>
</div></header>`;
}
