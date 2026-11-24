const agents = ['*','GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-SearchBot','Claude-User','PerplexityBot','Perplexity-User','Google-Extended','Applebot-Extended','Bingbot','CCBot'];
export function robots(origin) {
  return agents.map(a=>'User-agent: '+a+'\nAllow: /\n').join('\n')+'\nSitemap: '+origin+'/sitemap.xml\n';
}
export function sitemap(entries, esc) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries.map(({href,updated,en,ar})=>'<url><loc>'+esc(href)+'</loc><lastmod>'+updated+'</lastmod>'+
    Object.entries({en,ar,'x-default':en}).map(([lang,target])=>'<xhtml:link rel="alternate" hreflang="'+lang+'" href="'+esc(target)+'"/>').join('')+'</url>').join('\n')+'\n</urlset>\n';
}
