/* Generates independently shareable HTML pages and metadata for static GitHub Pages. */
(()=>{
  'use strict';
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const xml=s=>escape(s);
  const safeId=id=>/^[a-z0-9][a-z0-9-]*$/i.test(id);
  const safeExternal=url=>/^https:\/\/[^\s"'<>]+$/i.test(url||'')?url:'';
  const normalizeSite=url=>{
    try{const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.username||parsed.password)return '';
      return parsed.href.replace(/\/?$/,'/');}catch(e){return '';}
  };
  function getDescription(r){
    const source=String(r.excerpt||r.lead||'');
    const plain=source.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    return (plain||`An independent review of ${r.title} by JODECI.`).slice(0,200);
  }
  function createPage(review,siteUrl){
    const id=String(review.id),slug=`review/${id}.html`;
    const title=`${review.title} — JODECI Game Review`;
    const description=getDescription(review);
    const canonical=siteUrl?new URL(slug,siteUrl).href:'';
    const image=safeExternal(review.image)||(siteUrl&&/^assets\/[a-z\d_./ -]+$/i.test(review.image||'')&&!String(review.image).includes('..')?new URL(review.image,siteUrl).href:'');
    const score=review.masterpiece?5:review.abysmal?0:Math.max(0,Math.min(5,Number(review.rating)||0));
    const schema={'@context':'https://schema.org','@type':'Review',name:title,description,datePublished:review.date||undefined,author:{'@type':'Person',name:'JODECI'},itemReviewed:{'@type':'VideoGame',name:String(review.title),datePublished:review.year?String(review.year):undefined},reviewRating:{'@type':'Rating',ratingValue:score,worstRating:0,bestRating:5}};
    const json=JSON.stringify(schema).replace(/</g,'\\u003c');
    return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<base href="../">\n<title>${escape(title)}</title>\n<meta name="description" content="${escape(description)}">\n<meta name="robots" content="index,follow,max-image-preview:large">\n<meta property="og:site_name" content="JODECI — The Game Record">\n<meta property="og:type" content="article">\n<meta property="og:title" content="${escape(title)}">\n<meta property="og:description" content="${escape(description)}">\n${canonical?`<meta property="og:url" content="${escape(canonical)}">\n<link rel="canonical" href="${escape(canonical)}">`:''}\n${image?`<meta property="og:image" content="${escape(image)}">`:''}\n<meta name="twitter:card" content="${image?'summary_large_image':'summary'}">\n<meta name="twitter:title" content="${escape(title)}">\n<meta name="twitter:description" content="${escape(description)}">\n${image?`<meta name="twitter:image" content="${escape(image)}">`:''}\n<script type="application/ld+json">${json}</script>\n<meta name="theme-color" content="#0c0d10">\n<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="styles.css">\n<script>window.JODECI_SHARED_REVIEW=${JSON.stringify(id)};<\/script>\n<script defer src="reviews.js"></script>
<script defer src="galleries.js"></script>\n<script defer src="richtext.js"></script>\n<script defer src="app.js"></script>\n</head>\n<body>\n<a class="skip-link" href="#content">Skip to content</a>\n<div class="announcement">INDEPENDENT GAME REVIEWS <span class="announcement-mid">/</span> NO FANBOYING. NO SUGARCOATING.</div>\n<header class="site-header"><div class="container header-inner"><a class="brand" href="index.html#home"><span class="brand-mark">J</span><span class="brand-name">JODECI<span class="brand-subtitle">THE GAME RECORD</span></span></a><nav class="desktop-nav" aria-label="Main navigation"><a href="index.html#home" data-nav="home">HOME</a><a href="index.html#reviews" data-nav="reviews">REVIEWS</a><a href="index.html#ratings" data-nav="ratings">RATINGS</a><a href="index.html#galleries" data-nav="galleries">GALLERIES</a></nav><div class="header-tools"><span class="header-independent">INDEPENDENT. ALWAYS.</span><button class="menu-button" id="mobile-menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false">☰</button></div></div><nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation" hidden><a href="index.html#home">HOME</a><a href="index.html#reviews">REVIEWS</a><a href="index.html#ratings">RATINGS</a><a href="index.html#galleries">GALLERIES</a></nav></header>\n<main id="content" tabindex="-1" aria-live="polite"><article class="container"><h1>${escape(review.title)}</h1><p>${escape(description)}</p></article></main>\n<footer class="site-footer"><div class="container footer-grid"><div><a href="index.html#home" class="brand footer-brand"><span class="brand-mark">J</span><span class="brand-name">JODECI<span class="brand-subtitle">THE GAME RECORD</span></span></a><p>Games played. Opinions earned.</p></div><div class="footer-links"><a href="index.html#reviews">ALL REVIEWS</a><a href="index.html#ratings">RATINGS</a><a href="index.html#galleries">GALLERIES</a></div><div class="footer-right"><span>© <span id="footer-year"></span> JODECI.</span><span>INDEPENDENT GAME REVIEWS</span></div></div></footer>\n</body></html>`;
  }
  function generate(reviews,rawSite){
    const siteUrl=normalizeSite(rawSite);
    const pages=[];const urls=[];
    const list=reviews.filter(r=>r&&safeId(r.id)&&!r.draft);
    for(const r of list){
      pages.push([`review/${r.id}.html`,new Blob([createPage(r,siteUrl)],{type:'text/html;charset=utf-8'})]);
      if(siteUrl)urls.push(new URL(`review/${r.id}.html`,siteUrl).href);
    }
    if(siteUrl){
      urls.unshift(new URL('index.html',siteUrl).href);
      pages.push(['sitemap.xml',new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${xml(u)}</loc></url>`).join('')}</urlset>`],{type:'application/xml'})]);
      pages.push(['robots.txt',new Blob([`User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml',siteUrl).href}\n`],{type:'text/plain'})]);
    }
    return {entries:pages,count:list.length,siteUrl};
  }
  window.JODECI_SEO={generate,normalizeSite};
})();
