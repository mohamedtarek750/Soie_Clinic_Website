// Build entity identifiers from the canonical origin. Each language has its own
// page and breadcrumbs, while both pages identify the same clinic and branches.
const ref = id => ({'@id': id});
const days = {Sa: 'Saturday', Su: 'Sunday', Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday'};
const context = 'https://schema.org';
const clinicId = (site, branchId) => site.origin + '/branches/' + branchId + '#clinic';
function branchName(b, {ar, site}) {
  if (!ar) return b.nameEn;
  const brand = [site.brand.nameAr, site.brand.nameEn].filter(Boolean).join(' · ');
  return brand + ' – ' + b.areaAr;
}

function clinic(b, ctx) {
  const {site} = ctx;
  const path = '/branches/' + b.id;
  const id = clinicId(site, b.id);
  const address = {
    '@type': 'PostalAddress', streetAddress: [ctx.ar && b.streetAddressAr || b.streetAddressEn, b.floor].filter(Boolean).join(', '),
    addressLocality: ctx.ar && b.localityAr || b.localityEn,
    addressRegion: ctx.ar && b.regionAr || b.regionEn, addressCountry: b.country,
    ...(b.postalCode && {postalCode: b.postalCode}),
  };
  const entity = {
    '@type': 'MedicalClinic', '@id': id, name: branchName(b, ctx),
    url: site.origin + ctx.url(path), parentOrganization: ref(site.origin + '/#organization'),
    address, geo: {'@type': 'GeoCoordinates', latitude: b.geo.lat, longitude: b.geo.lng},
    image: site.origin + '/assets/images/hero-poster.jpg', telephone: b.telephone,
    medicalSpecialty: [context + '/Dermatology', context + '/DietNutrition'],
  };
  if (b.hours) entity.openingHoursSpecification = b.hours.map(slot => ({
    '@type': 'OpeningHoursSpecification', dayOfWeek: slot.days.map(d => context + '/' + days[d]),
    opens: slot.opens, closes: slot.closes,
  }));
  if (b.mapUrl) entity.hasMap = b.mapUrl;
  if (b.licenceNumber) entity.identifier = b.licenceNumber;
  if (b.id === 'mohandessin') {
    entity.alternateName = ['Mohandiseen', 'Mohandseen'].map(spelling => site.brand.nameEn + ' ' + spelling);
  }
  if (b.services.dental) {
    entity.medicalSpecialty.push(context + '/Dentistry');
    entity.department = {
      '@type': 'Dentist', '@id': site.origin + path + '#dentistry',
      name: branchName(b, ctx) + (ctx.ar ? ' – طب الأسنان' : ' Dentistry'),
      parentOrganization: ref(id), address, telephone: b.telephone,
      url: site.origin + ctx.url('/dentistry'),
    };
  }
  return entity;
}

function businessNodes(ctx) {
  const {site, ar} = ctx;
  const {origin, brand} = site;
  const org = {
    '@type': 'MedicalOrganization', '@id': origin + '/#organization', name: brand.nameEn,
    alternateName: [...brand.alternateNames, ...(brand.nameAr ? [brand.nameAr] : [])],
    url: origin + '/', logo: origin + '/assets/images/logo.png', image: origin + '/assets/images/hero-poster.jpg',
    sameAs: [...new Set([...brand.sameAs, ...(brand.facebookUrl ? [brand.facebookUrl] : [])])],
    slogan: brand.slogan, areaServed: ar ? ['القاهرة', 'الجيزة'] : ['Cairo', 'Giza'], availableLanguage: ['ar', 'en'],
    subOrganization: site.branches.map(b => ref(clinicId(site, b.id))),
    ...(brand.foundingYear && {foundingDate: String(brand.foundingYear)}),
  };
  const website = {
    '@type': 'WebSite', '@id': origin + '/#website', url: origin + '/', name: brand.nameEn,
    inLanguage: ['en', 'ar-EG'], publisher: ref(org['@id']),
  };
  return [org, ...site.branches.map(b => clinic(b, ctx)), website];
}

function breadcrumbs(p, ctx) {
  const {site, pages, url, ar} = ctx;
  const parts = p.path.slice(1).split('/');
  const trails = [{path: '/', name: ar ? 'الرئيسية' : 'Home'}];
  for (let i = 1; i < parts.length; i++) {
    const path = '/' + parts.slice(0, i).join('/');
    const parent = pages.find(page => page.path === path);
    if (parent) trails.push({path, name: parent.h1});
  }
  trails.push({path: p.path, name: p.h1});
  return {
    '@type': 'BreadcrumbList', '@id': site.origin + url(p.path) + '#breadcrumbs',
    itemListElement: trails.map(({path,name}, i) => ({
      '@type': 'ListItem', position: i + 1, name, item: site.origin + url(path),
    })),
  };
}

function endpoint(value, site) {
  // Old source nodes are migrated to origin-independent asset paths.
  return new URL(value.replace('{{origin}}', site.origin), site.origin).href;
}

function deviceNodes(p, ctx, page) {
  const source = p.graph;
  const get = type => source.find(n => n['@type'] === type);
  const device = get('MedicalDevice');
  const video = get('VideoObject');
  const procedure = get('MedicalProcedure');
  const {site} = ctx;
  const id = site.origin + p.path + '#device';
  page.about = ref(id);
  page.video = ref(page.url + '#video');
  page.mainEntity = ref(page.url + '#procedure');
  return [
    {...device, '@id': id},
    {...procedure, '@id': page.mainEntity['@id'], url: page.url,
      ...(procedure.image && {image: endpoint(procedure.image, site)})},
    {...video, '@id': page.video['@id'], thumbnailUrl: endpoint(video.thumbnailUrl, site),
      contentUrl: endpoint(video.contentUrl, site), publisher: page.publisher, inLanguage: page.inLanguage},
  ];
}

function treatmentNode(p, ctx, page) {
  const id = page.url + '#procedure';
  page.mainEntity = ref(id);
  const provider = p.type === 'surgery' ? page.publisher : p.branches.map(b => ref(clinicId(ctx.site, b)));
  return {
    '@type': p.schemaType || 'MedicalProcedure', '@id': id, name: p.h1, url: page.url, description: p.answer,
    howPerformed: p.howPerformed, preparation: p.preparation, followup: p.followup,
    ...(p.bodyLocation && {bodyLocation: p.bodyLocation}), provider,
  };
}

export function graph(p, ctx) {
  const {site, ar, pages, url} = ctx;
  const nodes = businessNodes(ctx);
  const here = site.origin + url(p.path);
  const medical = ['treatment', 'surgery', 'device', 'article'].includes(p.type);
  const types = {catalogue:'CollectionPage', hub:'CollectionPage', results:'ImageGallery', about:'AboutPage', contact:'ContactPage'};
  const page = {
    '@type': medical ? 'MedicalWebPage' : (types[p.type] || 'WebPage'),
    '@id': here + '#page', url: here, name: p.title, description: p.description,
    inLanguage: ar ? 'ar-EG' : 'en', isPartOf: ref(site.origin + '/#website'),
    publisher: ref(site.origin + '/#organization'), dateModified: p.updated,
  };
  if (p.path !== '/') {
    const crumb = breadcrumbs(p, ctx);
    nodes.push(crumb);
    page.breadcrumb = ref(crumb['@id']);
  }
  if (p.reviewStatus === 'reviewed') {
    if (!p.lastReviewed) throw new Error('Missing clinical review date for ' + p.path);
    page.lastReviewed = p.lastReviewed;
    page.reviewedBy = page.publisher;
  }
  if (p.type === 'branch') page.mainEntity = ref(clinicId(site, p.path.split('/').pop()));
  if (p.type === 'treatment' || p.type === 'surgery') nodes.push(treatmentNode(p, ctx, page));
  if (p.type === 'device') nodes.push(...deviceNodes(p, ctx, page));
  if (p.type === 'catalogue') {
    const devices = pages.filter(entry => entry.type === 'device');
    const list = {
      '@type': 'ItemList', '@id': here + '#list', numberOfItems: devices.length,
      itemListElement: devices.map((entry, i) => ({
        '@type': 'ListItem', position: i + 1, url: site.origin + url(entry.path), name: entry.h1,
      })),
    };
    page.mainEntity = ref(list['@id']);
    nodes.push(list);
  }
  if (p.type === 'results') {
    const lang = ar ? 'ar' : 'en';
    page.image = ctx.results.filter(item => item.consent === true).map(item => ({
      '@type': 'ImageObject', '@id': here + '#case-' + item.id, contentUrl: endpoint(item.image, site),
      caption: ctx.resultCaption ? ctx.resultCaption(item, ctx) : item.caption[lang], description: item.alt[lang],
    }));
  }
  if (p.type === 'article') {
    const article = {
      '@type': 'Article', '@id': here + '#article', headline: p.h1, description: p.description,
      author: page.publisher, publisher: page.publisher, inLanguage: page.inLanguage,
      dateModified: page.dateModified, mainEntityOfPage: ref(page['@id']),
    };
    page.mainEntity = ref(article['@id']);
    nodes.push(article);
  }
  if (p.faqs?.length) {
    nodes.push({
      '@type': 'FAQPage', '@id': here + '#faq', isPartOf: ref(page['@id']), inLanguage: page.inLanguage,
      mainEntity: p.faqs.map(({q, a}) => ({'@type': 'Question', name:q, acceptedAnswer:{'@type':'Answer', text:a}})),
    });
  }
  return {'@context': context, '@graph': [...nodes, page]};
}
