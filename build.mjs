import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { errorPage } from './src/templates/error.mjs';
import { head } from './src/templates/head.mjs';
import { layout, localizeFacts, legacyMain } from './src/templates/layout.mjs';
import { graph } from './src/templates/schema.mjs';
import { pagesContent, pageFaqs, resultCaption } from './src/templates/pages.mjs';
import { treatment } from './src/templates/treatment.mjs';
import { socialImage } from './src/templates/social.mjs';
import { reviewBlock } from './src/templates/reviews.mjs';
import { robots, sitemap, llms } from './src/discovery.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const {values} = parseArgs({options:{site:{type:'string',default:join(root,'data/site.json')},out:{type:'string',default:join(root,'dist')}}});
const out = resolve(values.out);
process.chdir(root);
const json = path => JSON.parse(readFileSync(path,'utf8'));
const site = json(values.site);
if (new URL(site.origin).origin !== site.origin || !site.origin.startsWith('https://')) throw new Error('origin must be an HTTPS origin without a trailing slash');
const results = json('data/results.json');
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
const branchMap = asset('src/templates/branch-map.js');
const assets = {
  css: ['style.css','devices.css','i18n.css','signature.css','src/templates/pages.css'].map(asset),
  js: ['script.js'].map(asset)
};
if (site.analytics.ga4) {
  const id = site.analytics.ga4;
  if (!/^G-[A-Z0-9]+$/.test(id)) throw new Error('Unexpected GA4 measurement ID');
  assets.js.push(fingerprint('analytics.js', 'window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments)}\ngtag("js",new Date());\ngtag("config",'+JSON.stringify(id)+');\n'));
  assets.js.push('https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id));
}
// Never ship a withdrawn case or its alternate sizes in a new deployment.
function caseAssets(item) {
  return [item.image, ...(item.variants || []).map(v => v.src),
    item.comparison?.before?.src, item.comparison?.after?.src].filter(Boolean);
}
const publicCases = new Set(results.filter(item => item.consent === true).flatMap(caseAssets));
const withdrawn = new Set(results.filter(item => item.consent !== true).flatMap(caseAssets)
  .filter(path => !publicCases.has(path)));
cpSync('assets', join(out,'assets'), {
  recursive: true,
  filter(source) {
    const file = relative(root, resolve(source));
    return !withdrawn.has('/' + file);
  }
});
for (const path of withdrawn) {
  const file = resolve(out,'.'+path);
  if (file.startsWith(join(out,'assets')+'/') && existsSync(file)) unlinkSync(file);
}
const languages = {};
for (const lang of ['en','ar']) {
  languages[lang] = readdirSync('src/content/'+lang).filter(f=>f.endsWith('.json')).sort().map(file => {
    const source = join('src/content', lang, file);
    const page = localizeFacts(json(source), {ar:lang==='ar',site,esc});
    if (!/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(page.path)) throw new Error('Invalid page path in '+source);
    if (page.path === '/products' || page.path === '/404') page.noindex = true;
    if (['/treatments/laser','/treatments/laser-hair-removal'].includes(page.path)) page.branches = site.branches.filter(b=>b.services.laserHairRemoval).map(b=>b.id);
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
    const ctx = {ar,site,url,esc,pages,results,resultCaption,assets,hasAlternate};
    ctx.reviewBlock = (ids,compact) => reviewBlock(ids,compact,ctx);
    if (p.type === 'branch') ctx.assets = {...assets, js:[...assets.js,branchMap]};
    let main;
    if (p.type === '404') main = errorPage(p,ctx);
    else if (p.html) main = legacyMain(p,ctx);
    else if (['treatment','surgery'].includes(p.type)) main = treatment(p,ctx);
    else main = pagesContent(p,ctx);
    const image = socialImage(p,ctx);
    if (!existsSync(join(root,image))) throw new Error('Missing social card: '+image);
    const schema = graph({...p,faqs:pageFaqs(p,ctx)},ctx);
    const page = layout(p,ctx,main,head(p,ctx,schema,image));
    const route = url(p.path);
    write((route==='/'?'/index':route)+'.html',page);
    if (!p.noindex) entries.push({title:p.h1,href:site.origin+route,updated:p.lastmod,en:site.origin+p.path,ar:site.origin+localized(p.path,true)});
  }
}
write('sitemap.xml',sitemap(entries,esc));
write('robots.txt',robots(site.origin));
write('llms.txt',llms(site,entries,languages.en));
const key = readFileSync('data/indexnow-key.txt','utf8').trim();
write(key+'.txt',key+'\n');
// Only retire files the previous build recorded (removed translations and old fingerprints).
const manifest = join(out,'.soie-build.json');
if (existsSync(manifest)) for (const file of json(manifest)) {
  if (!generated.has(file) && resolve(out,file).startsWith(out+'/') && existsSync(join(out,file))) unlinkSync(join(out,file));
}
writeFileSync(manifest, JSON.stringify([...generated].sort()));
console.log('Built '+entries.length+' indexable pages in '+out);
