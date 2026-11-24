// Submit only explicitly selected URLs after deploying their content and key file.
import {readFile} from 'node:fs/promises';

const help = 'Usage: node tools/indexnow.mjs [--dry-run] /changed-path [/ar/changed-path ...]';
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(help);
  process.exit(0);
}
const dryRun = args.includes('--dry-run');
const paths = args.filter(arg => arg !== '--dry-run');
if (!paths.length || paths.length > 10000) throw new Error(help);
const {origin} = JSON.parse(await readFile(new URL('../data/site.json', import.meta.url)));
const key = (await readFile(new URL('../data/indexnow-key.txt', import.meta.url), 'utf8')).trim();
if (!/^[a-z0-9-]{8,128}$/i.test(key)) throw new Error('Invalid IndexNow key.');
const urls = paths.map(input => {
  const url = new URL(input, origin);
  if ((!input.startsWith('/') && !input.startsWith(origin + '/')) ||
      input.startsWith('//') || url.origin !== origin || url.search || url.hash || url.username || url.password) {
    throw new Error('Supply canonical site paths without query strings or fragments.');
  }
  return url.href;
});
const body = {host: new URL(origin).hostname, key, keyLocation: new URL('/' + key + '.txt', origin).href, urlList: [...new Set(urls)]};
if (dryRun) {
  console.log(JSON.stringify(body, null, 2));
} else {
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: {'Content-Type':'application/json; charset=utf-8'},
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('IndexNow returned HTTP ' + response.status + ': ' + await response.text());
  console.log('IndexNow accepted ' + body.urlList.length + ' URL(s), HTTP ' + response.status + '.');
}
