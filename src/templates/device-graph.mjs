// Preserve the device catalogue and its original video and procedure information.
export function graph(page,ctx) {
  const nodes = [...(page.graph || [])];
  const here = ctx.site.origin + ctx.url(page.path);
  if(page.path!=='/') nodes.push({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:ctx.ar?'الرئيسية':'Home',item:ctx.site.origin+ctx.url('/')},{'@type':'ListItem',position:2,name:page.h1,item:here}]});
  if(page.type==='catalogue') nodes.push({'@type':'ItemList',itemListElement:ctx.pages.filter(p=>p.type==='device').map((p,i)=>({'@type':'ListItem',position:i+1,url:ctx.site.origin+ctx.url(p.path)}))});
  if(page.faqs.length) nodes.push({'@type':'FAQPage',mainEntity:page.faqs.map(({q,a})=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))});
  nodes.push({'@type':page.type==='device'?'MedicalWebPage':'WebPage','@id':here+'#page',url:here,name:page.title,inLanguage:ctx.ar?'ar-EG':'en'});
  return {'@context':'https://schema.org','@graph':nodes};
}
