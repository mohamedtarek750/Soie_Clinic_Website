export function errorPage(page, ctx) {
  const {ar, esc, url} = ctx;
  const links = [
    ['/treatments', ar ? 'العلاجات' : 'Treatments'],
    ['/branches', ar ? 'الفروع' : 'Branches'],
    ['/book', ar ? 'حجز موعد' : 'Book an appointment']
  ];
  const items = links.map(([path,label]) => '<li><a href="'+url(path)+'">'+label+'</a></li>');
  return '<section class="section container"><h1>'+esc(page.h1)+'</h1><p>'+esc(page.description)+'</p><ul>'+items.join('')+'</ul></section>';
}
