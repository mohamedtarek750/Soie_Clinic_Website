// Page paths are identical across language trees. The image carries its localized headline.
export function socialImage(page, ctx) {
  const slug = page.path === '/' ? 'home' : page.path.slice(1).replaceAll('/', '--');
  return '/assets/social/' + (ctx.ar ? 'ar/' : 'en/') + slug + '.jpg';
}
