import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { head } from './src/templates/head.mjs';
import { layout, localizeFacts, legacyMain } from './src/templates/layout.mjs';
import { graph } from './src/templates/device-graph.mjs';
import { robots, sitemap, llms } from './src/discovery.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const {values} = parseArgs({options:{site:{type:'string',default:join(root,'data/site.json')},out:{type:'string',default:join(root,'dist')}}});
const out = resolve(values.out);
process.chdir(root);
const json = path => JSON.parse(readFileSync(path,'utf8'));
const site = json(values.site);
if (new URL(site.origin).origin !== site.origin || !site.origin.startsWith('https://')) throw new Error('origin must be an HTTPS origin without a trailing slash');
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const localized = (path, ar) => ar ? '/ar'+(path === '/' ? '' : path) : path;
const generated = new Set();
function write(path, body) {
  const name = path.replace(/^\//,'');
  generated.add(name);
  mkdirSync(dirname(join(out,name)), {recursive:true});
  writeFileSync(join(out,name),body);
}
function fingerprint(name, content) {
  const hash = createHash('sha256').update(content).digest('hex').slice(0,12);
  const path = '/static/'+name.replace(/(\.[^.]+)$/, '.'+hash+'$1');
  write(path,content);
  return path;
}
function asset(file) { return fingerprint(basename(file), readFileSync(file)); }
const assets = {
  css: ['style.css','devices.css','i18n.css','signature.css'].map(asset),
  js: ['script.js'].map(asset)
};
if (site.analytics.ga4) {
  const id = site.analytics.ga4;
  if (!/^G-[A-Z0-9]+$/.test(id)) throw new Error('Unexpected GA4 measurement ID');
  assets.js.push(fingerprint('analytics.js', 'window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments)}\ngtag("js",new Date());\ngtag("config",'+JSON.stringify(id)+');\n'));
  assets.js.push('https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id));
}
cpSync('assets', join(out,'assets'), {recursive:true});
const languages = {};
for (const lang of ['en','ar']) {
  languages[lang] = readdirSync('src/content/'+lang).filter(f=>f.endsWith('.json')).sort().map(file => {
    const source = join('src/content', lang, file);
    const page = localizeFacts(json(source), {ar:lang==='ar',site,esc});
    if (!/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(page.path)) throw new Error('Invalid page path in '+source);
    if (page.path === '/products' || page.path === '/404') page.noindex = true;
    if (page.path === '/treatments/laser-hair-removal') page.branches = site.branches.filter(b=>b.services.laserHairRemoval).map(b=>b.id);
    let lastChange;
    try { lastChange = execFileSync('git',['log','-1','--format=%cs','--',source],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); } catch { /* Source archives use their editorial date. */ }
    page.lastmod = [lastChange,page.updated,page.lastReviewed].filter(Boolean).sort().at(-1);
    return page;
  });
  if (new Set(languages[lang].map(p=>p.path)).size !== languages[lang].length) throw new Error('Duplicate '+lang+' route');
}
const entries = [];
for (const [lang,pages] of Object.entries(languages)) {
  const ar = lang==='ar';
  const url = path => localized(path,ar);
  const translated = languages[ar?'en':'ar'];
  for (const p of pages) {
    const hasAlternate = translated.some(other=>other.path===p.path);
    if (!p.noindex && !hasAlternate) throw new Error('Missing translation: '+p.path);
    const ctx = {ar,site,url,esc,pages,assets,hasAlternate};
    const errorLinks = [['/treatments',ar?'العلاجات':'Treatments'],[pages.some(row=>row.path==='/branches')?'/branches':'/contact',ar?'الفروع':'Branches'],['/book',ar?'حجز موعد':'Book an appointment']];
    const main = p.type === '404' ? '<section class="section container"><h1>'+esc(p.h1)+'</h1><p>'+esc(p.description)+'</p><ul>'+errorLinks.map(([path,title])=>'<li><a href="'+url(path)+'">'+title+'</a></li>').join('')+'</ul></section>' : legacyMain(p,ctx);
    const page = layout(p,ctx,main,head(p,ctx,graph(p,ctx),'/assets/images/hero-poster.jpg'));
    const route = url(p.path);
    write((route==='/'?'/index':route)+'.html',page);
    if (!p.noindex) entries.push({title:p.h1,href:site.origin+route,updated:p.lastmod,en:site.origin+p.path,ar:site.origin+localized(p.path,true)});
  }
}
write('sitemap.xml',sitemap(entries,esc));
write('robots.txt',robots(site.origin));
// Only retire files the previous build recorded (removed translations and old fingerprints).
const manifest = join(out,'.soie-build.json');
if (existsSync(manifest)) for (const file of json(manifest)) {
  if (!generated.has(file) && resolve(out,file).startsWith(out+'/') && existsSync(join(out,file))) unlinkSync(join(out,file));
}
writeFileSync(manifest, JSON.stringify([...generated].sort()));
console.log('Built '+entries.length+' indexable pages in '+out);
