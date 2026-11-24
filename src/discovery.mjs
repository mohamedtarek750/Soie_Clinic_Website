const agents = ['*','GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-SearchBot','Claude-User','PerplexityBot','Perplexity-User','Google-Extended','Applebot-Extended','Bingbot','CCBot'];
export function robots(origin) {
  return agents.map(a=>'User-agent: '+a+'\nAllow: /\n').join('\n')+'\nSitemap: '+origin+'/sitemap.xml\n';
}
export function sitemap(entries, esc) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries.map(({href,updated,en,ar})=>'<url><loc>'+esc(href)+'</loc><lastmod>'+updated+'</lastmod>'+
    Object.entries({en,ar,'x-default':en}).map(([lang,target])=>'<xhtml:link rel="alternate" hreflang="'+lang+'" href="'+esc(target)+'"/>').join('')+'</url>').join('\n')+'\n</urlset>\n';
}
export function llms(site, entries, pages) {
  const days = {Sa:'Sat',Su:'Sun',Mo:'Mon',Tu:'Tue',We:'Wed',Th:'Thu',Fr:'Fri'};
  const sections = ['# '+site.brand.nameEn, '> Medical aesthetic, laser, body and nutrition, and dental care in Greater Cairo, Egypt. The clinic arranges plastic surgery consultations with partner consultant surgeons.'];
  for (const b of site.branches) {
    const lines = ['## '+b.nameEn,b.streetAddressEn+', '+b.localityEn+', '+b.regionEn+'.',
      'Appointments: '+b.telephone+' · [WhatsApp]('+b.whatsapp+').'];
    if (b.hours) lines.push(...b.hours.map(h=>h.days.map(day=>days[day]).join(', ')+' '+h.opens+'–'+h.closes+' (local time).'));
    const categories = new Set(pages.filter(p => p.type === 'treatment' && p.branches.includes(b.id)).map(p => p.category));
    if (categories.size) lines.push('Areas of care: ' + [...categories].join(', ') + '.');
    if (b.services.dental) lines.push('Dentistry is available here.');
    if (b.services.laserHairRemoval) lines.push('Laser hair removal is available here.');
    sections.push(lines.join('\n'));
  }
  sections.push('## Pages in English and Arabic');
  for (const row of entries.filter(row=>row.href===row.en)) sections.push('- ['+row.title+']('+row.en+') · [العربية]('+row.ar+')');
  return sections.join('\n\n')+'\n';
}
