import { cpSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

process.chdir(dirname(fileURLToPath(import.meta.url)));
const { values } = parseArgs({ options: { site: { type:'string', default:'data/site.json' }, out:{type:'string',default:'dist'} } });
const site = JSON.parse(readFileSync(values.site));
const languages = ['en'];
const locations = [];
function write(path, body) {
  const dest = join(values.out, path);
  mkdirSync(dirname(dest), {recursive:true});
  writeFileSync(dest, body);
}
for (const lang of languages) {
  for (const file of readdirSync('src/content/' + lang)) {
    const page = JSON.parse(readFileSync('src/content/' + lang + '/' + file));
    let html = page.html.replaceAll('{{origin}}',site.origin).replace(/(?<![\w/])assets\//g,'/assets/');
    for (const [key, name] of [['google','google-site-verification'],['bing','msvalidate.01']]) {
      if (site.verification[key]) html = html.replace('</head>', '<meta name="'+name+'" content="'+site.verification[key].replaceAll('"','&quot;')+'"></head>');
    }
    write((page.path === '/' ? '/index' : page.path)+'.html', html);
    if (page.path !== '/products') locations.push('<url><loc>'+site.origin+page.path+'</loc><lastmod>'+page.updated+'</lastmod></url>');
  }
}
for (const [path, lang, heading, links] of [['/404','en','Page not found',['Treatments','Contact','Book']],['/ar/404','ar','الصفحة غير موجودة',['العلاجات','تواصل معنا','حجز موعد']]]) {
  write(path+'.html', '<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8"><title>'+heading+'</title><meta name="robots" content="noindex"><link rel="canonical" href="'+site.origin+path+'"></head><body><main><h1>'+heading+'</h1>'+['/treatments','/contact','/book'].map((u,i)=>'<p><a href="'+u+'">'+links[i]+'</a></p>').join('')+'</main></body></html>');
}
for (const asset of ['assets','style.css','i18n.css','signature.css','devices.css','script.js','i18n.js','i18n-ar.js']) cpSync(asset,join(values.out,asset),{recursive:true});
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+locations.join('\n')+'</urlset>');
write('robots.txt',['*','GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-SearchBot','Claude-User','PerplexityBot','Perplexity-User','Google-Extended','Applebot-Extended','Bingbot','CCBot'].map(agent=>'User-agent: '+agent+'\nAllow: /\n').join('\n')+'\nSitemap: '+site.origin+'/sitemap.xml\n');
