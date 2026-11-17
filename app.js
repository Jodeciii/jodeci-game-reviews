(() => {
  'use strict';
  const reviews = Array.isArray(window.JODECI_REVIEWS) ? window.JODECI_REVIEWS : [];
  const homeRoot=new URL('.',new URL(document.querySelector('script[src$="app.js"]')?.getAttribute('src')||'app.js',document.baseURI));
  const sharedReviewId=window.JODECI_SHARED_REVIEW||null;
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const reviewLink=r=>new URL(`review/${encodeURIComponent(r.id)}.html`,homeRoot).href;
  const shareSection=(r,section)=>`${reviewLink(r)}${section?'?section='+encodeURIComponent(section):''}`;
  let galleryObservers=[],galleryTimers=new Map();
  function cleanupGalleries(){galleryObservers.forEach(o=>o.disconnect());galleryObservers=[];galleryTimers.forEach(t=>clearInterval(t));galleryTimers.clear();}

  const root = document.getElementById('content');
  const rich = window.JODECI_RICH;
  const scoreLabels = {0:'Awful',1:'Bad',2:'Okay',3:'Good',4:'Great',5:'Excellent'};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeImage = url => {let s=String(url||'').trim();return /^(https:\/\/[^\s"'<>]+|assets\/[a-z0-9_./ -]+)$/i.test(s) && !s.includes('..') ? s : '';};
  const stars = (review,withLabel=false) => {
    if(review.masterpiece) return `<span class="starline" aria-label="Masterpiece">🌟</span>${withLabel?'<span class="star-caption">MASTERPIECE</span>':''}`;
    if(review.abysmal) return `<span class="starline" aria-label="Abysmal">💩</span>${withLabel?'<span class="star-caption">ABYSMAL</span>':''}`;
    const n=Math.max(0,Math.min(5,Math.round(Number(review.rating)||0)));
    return `<span class="starline" aria-label="${n} out of 5 stars">${'★'.repeat(n)}<span class="star-empty">${'☆'.repeat(5-n)}</span></span>${withLabel?`<span class="star-caption">${esc(scoreLabels[n])}</span>`:''}`;
  };
  const label = r => r.masterpiece?'Masterpiece':r.abysmal?'Abysmal':scoreLabels[r.rating]??'Unrated';
  const img = (r,cls='') => safeImage(r.image)?`<img class="${cls}" src="${esc(safeImage(r.image))}" alt="Promotional artwork for ${esc(r.title)}" loading="lazy" referrerpolicy="no-referrer">`:'';
  const draftTag = r => r.draft?'<span class="draft-tag">DRAFT</span>':'';
  const link = r => `#review/${encodeURIComponent(r.id)}`;
  const ordered = () => [...reviews].sort((a,b)=>(String(b.date||'').localeCompare(String(a.date||''))));
  const sectionHeading = (small,title) => `<div class="section-kicker">${small}</div><h2 class="section-title">${title}</h2>`;
  const card = r => `<article class="review-card"><a href="${link(r)}" aria-label="Read ${esc(r.title)} review"><div class="card-image ${esc(r.theme||'ember')}">${img(r)}<div class="card-title-overlay">${esc(r.title)}</div></div></a><div class="card-body"><div class="card-kicker"><span>${esc(r.year||'')} / ${esc(r.platform||'')}</span>${draftTag(r)}</div><p class="card-excerpt">${esc(r.excerpt||'')}</p><div class="card-bottom">${stars(r)}<a class="text-link" href="${link(r)}">READ REVIEW <span aria-hidden="true">↗</span></a></div></div></article>`;
  const emptyCard = `<div class="empty-card"><div class="empty-plus">+</div><div><h3>More reviews<br>coming soon.</h3><p>The archive grows with every game finished, and every opinion earned.</p><a class="text-link" href="#reviews">EXPLORE THE ARCHIVE <span aria-hidden="true">↗</span></a></div></div>`;
  function home(){
    const featured=reviews.find(r=>r.featured)||ordered()[0];
    const recent=ordered().slice(0,2);
    return `<section class="hero"><div class="container hero-inner"><div class="hero-copy"><span class="eyebrow">WELCOME TO MY GAME RECORD</span><h1 class="hero-title">PLAY IT.<br>JUDGE IT.<br><span>OWN IT.</span></h1><p class="hero-subline">Unfiltered game reviews from someone who actually finishes what he starts. The highs, the flaws, and everything in between.</p><div class="hero-actions"><a class="btn btn-primary" href="#reviews">EXPLORE REVIEWS <span aria-hidden="true">↗</span></a><a class="btn btn-outline" href="#ratings">MY RATINGS</a></div></div><div class="hero-side"><div class="hero-visual ${esc(featured?.theme||'ember')}">${featured?img(featured):''}</div><div class="hero-vertical">GAMES PLAYED. OPINIONS EARNED.</div>${featured?`<div class="hero-feature"><div class="feature-top"><span class="tiny-label">LATEST FEATURED REVIEW</span>${draftTag(featured)}</div><h2>${esc(featured.title)}</h2><p>${esc(featured.excerpt)}</p><div class="feature-bottom"><span>${stars(featured,true)}</span><a class="text-link" href="${link(featured)}">READ <span aria-hidden="true">↗</span></a></div></div>`:''}</div></div></section>
    <div class="ticker">THE GOOD <b>✳</b> THE BAD <b>✳</b> THE UNFORGETTABLE</div>
    <section class="section"><div class="container"><div class="section-header"><div>${sectionHeading('THE LATEST','FRESHLY REVIEWED.')}</div><a href="#reviews" class="text-link">VIEW ALL REVIEWS <span aria-hidden="true">↗</span></a></div><div class="review-grid">${recent.map(card).join('')}${emptyCard}</div></div></section>
    `;
  }
  function archive(){return `<section class="page-hero"><div class="container"><span class="eyebrow">EVERY FINISHED GAME HAS A STORY</span><h1 class="page-title">THE ARCHIVE.</h1><p>Every review in one place. Search a game, filter by score, and decide what deserves your time.</p></div></section><section class="section" style="padding-top:25px"><div class="container"><div class="archive-toolbar"><input class="field" id="review-search" type="search" placeholder="Search titles, developers or platforms…" aria-label="Search reviews"><select class="select-field" id="review-rating" aria-label="Filter by rating"><option value="all">ALL RATINGS</option><option value="masterpiece">🌟 MASTERPIECE</option><option value="5">★★★★★ EXCELLENT</option><option value="4">★★★★☆ GREAT</option><option value="3">★★★☆☆ GOOD</option><option value="2">★★☆☆☆ OKAY</option><option value="1">★☆☆☆☆ BAD</option><option value="0">☆☆☆☆☆ AWFUL</option><option value="abysmal">💩 ABYSMAL</option></select><select class="select-field" id="review-sort" aria-label="Sort reviews"><option value="newest">NEWEST FIRST</option><option value="oldest">OLDEST FIRST</option><option value="high">HIGHEST RATED</option><option value="low">LOWEST RATED</option><option value="az">TITLE A–Z</option></select></div><p class="result-count" id="result-count"></p><div class="review-grid" id="archive-grid"></div></div></section>`;}
  function setupArchive(){
    const search=document.getElementById('review-search'),rating=document.getElementById('review-rating'),sort=document.getElementById('review-sort'),grid=document.getElementById('archive-grid'),count=document.getElementById('result-count');
    if(!search)return;
    const update=()=>{
      const q=search.value.trim().toLowerCase(),filter=rating.value;
      let items=reviews.filter(r=>`${r.title} ${r.developer||''} ${r.platform||''}`.toLowerCase().includes(q) && (filter==='all'||(filter==='masterpiece'?!!r.masterpiece:filter==='abysmal'?!!r.abysmal:(!r.masterpiece&&!r.abysmal&&r.rating===Number(filter)))));
      const sorting=sort.value;
      const rank=r=>r.masterpiece?6:r.abysmal?-1:Number(r.rating)||0;
      items.sort((a,b)=>sorting==='oldest'?String(a.date).localeCompare(String(b.date)):sorting==='high'?rank(b)-rank(a):sorting==='low'?rank(a)-rank(b):sorting==='az'?a.title.localeCompare(b.title):String(b.date).localeCompare(String(a.date)));
      count.textContent=`${items.length} ${items.length===1?'REVIEW':'REVIEWS'} FOUND`;
      grid.innerHTML=items.length?items.map(card).join(''):'<div class="empty-results" style="grid-column:1/-1"><h3>NO MATCHES FOUND.</h3><p>Try another search or rating filter.</p></div>';
    };
    [search,rating,sort].forEach(el=>el.addEventListener(el===search?'input':'change',update));update();
  }
  function paragraph(text){return rich.render(text);}
  function detail(r){
    const sections=[['positives','The Positives'],['negatives','The Negatives'],['moments','Standout Moments']].filter(([key])=>r[key]&&String(r[key]).trim());
    let body=sections.map(([key,title],i)=>key==='moments'?`<div class="article-section" id="${key}"><h2><span>0${i+1}.</span>${title}</h2><details class="spoiler-details"><summary>REVEAL STANDOUT MOMENTS — MAY CONTAIN SPOILERS</summary><div class="spoiler-body rich-content">${paragraph(r[key])}</div></details></div>`:`<section class="article-section" id="${key}"><h2><span>0${i+1}.</span>${title}</h2><div class="rich-content">${paragraph(r[key])}</div></section>`).join('');
    return `<div class="container"><a class="article-back" href="#reviews"><span aria-hidden="true">←</span> BACK TO ALL REVIEWS</a></div><article><div class="container article-top"><div class="article-grid"><div><span class="article-eyebrow">THE JODECI REVIEW ${r.draft?' / EDITABLE DRAFT':''}</span><h1 class="article-title">${esc(r.title)}</h1><div class="article-meta"><span>${esc(r.year||'')}</span><span class="meta-separator">/</span><span>${esc(r.platform||'')}</span>${r.developer?`<span class="meta-separator">/</span><span>${esc(r.developer)}</span>`:''}</div><div class="article-intro rich-content">${paragraph(r.lead||r.excerpt||'')}</div><div class="article-share-tools"><button type="button" class="share-review" data-share-review="${esc(r.id)}">↗ SHARE REVIEW</button><span class="share-feedback" role="status" aria-live="polite"></span></div>${r.draft?'<span class="draft-tag">SAMPLE WRITE-UP — NOT FINAL COPY</span>':''}<div class="article-score"><div class="article-score-number">${r.masterpiece?'🌟':r.abysmal?'💩':`${esc(r.rating)}<small>/5</small>`}</div><div><span class="article-score-label">${esc(label(r))}</span>${stars(r)}</div></div></div><div class="review-art ${esc(r.theme||'ember')}">${img(r)}</div></div></div>${r.showcase&&String(r.showcase).includes('review-gallery')?`<section class="article-showcase" aria-label="Game screenshots"><div class="container"><div class="showcase-heading"><div><span class="section-kicker">IN-GAME GALLERY</span><h2>THROUGH THE LENS.</h2></div><span class="showcase-subline">SCREENSHOTS &amp; MOMENTS</span></div><div class="rich-content showcase-content">${paragraph(r.showcase)}</div></div></section>`:''}<div class="article-content"><div class="container article-layout"><aside class="article-toc" aria-label="Review sections"><div class="article-toc-heading">IN THIS REVIEW</div>${sections.map(([key,title])=>`<div class="article-toc-entry"><a href="#${r.id}-${key}" data-jump="${key}">${esc(title)}</a><button type="button" class="toc-copy" data-share-section="${key}" aria-label="Copy link to ${title}" title="Copy link to this section">⧉</button></div>`).join('')}<div class="article-toc-entry"><a href="#${r.id}-overall" data-jump="overall">The Verdict</a><button type="button" class="toc-copy" data-share-section="overall" aria-label="Copy link to the verdict" title="Copy link to this section">⧉</button></div></aside><div class="article-text">${body}<section class="article-overall" id="overall"><h2>THE VERDICT.</h2><div class="rich-content">${paragraph(r.overall)}</div>${stars(r,true)}</section></div></div></div></article><section class="related-section"><div class="container"><div class="section-header">${sectionHeading('KEEP READING','MORE REVIEWS.')}</div><div class="review-grid">${reviews.filter(other=>other.id!==r.id).slice(0,3).map(card).join('')||emptyCard}</div></div></section>`;
  }
  function ratingGuide(){
    const ratings=[
      ['💩','Abysmal','abysmal'],
      ['☆☆☆☆☆','Awful','awful'],
      ['★☆☆☆☆','Bad','bad'],
      ['★★☆☆☆','Okay','okay'],
      ['★★★☆☆','Good','good'],
      ['★★★★☆','Great','great'],
      ['★★★★★','Excellent','excellent'],
      ['🌟','Masterpiece','masterpiece']
    ];
    return `<section class="page-hero"><div class="container"><span class="eyebrow">THE JODECI STANDARD</span><h1 class="page-title">THE RATINGS.</h1></div></section><section class="section rating-section"><div class="container"><div class="section-header">${sectionHeading('WHAT EACH SCORE MEANS','EVERY STAR IS EARNED.')}</div><ol class="rating-list" aria-label="Game rating scale">${ratings.map(([symbol,name,kind])=>`<li class="rating-row ${kind?`rating-row--${kind}`:''}"><span class="rating-symbol" aria-hidden="true">${symbol}</span><h3>${esc(name)}</h3></li>`).join('')}</ol></div></section>`;
  }
  function route(){
    cleanupGalleries();
    const hash=decodeURIComponent(location.hash.slice(1))||(sharedReviewId?`review/${sharedReviewId}`:'home');
    let page=hash;
    if(hash.startsWith('review/')){
      const id=hash.slice(7),r=reviews.find(x=>x.id===id);
      root.innerHTML=r?detail(r):`<section class="section"><div class="container"><h1 class="section-title">REVIEW NOT FOUND.</h1><p>That review does not exist.</p><a href="#reviews" class="btn btn-primary">BACK TO REVIEWS</a></div></section>`;
      page='reviews';document.title=`${r?r.title:'Review not found'} — JODECI`;
      // Give each Example a clear, compact lead-in directly above the card.
      // Do not edit the saved review HTML or draw a disconnected connector line.
      root.querySelectorAll('.rich-content aside.callout--example').forEach((box,i)=>{
        const ignoreBlank=node=>node && ((node.matches('p,div')&&!node.textContent.trim()&&!node.querySelector('img,video,iframe')) || node.matches('br'));
        let prior=box.previousElementSibling;
        while(ignoreBlank(prior))prior=prior.previousElementSibling;
        if(!prior || !prior.matches('p,h3,blockquote,ul,ol') || !prior.textContent.trim())return;
        const id=`review-example-${i+1}`;
        box.id=id;
        box.classList.add('example-linked');
        box.tabIndex=-1;
        const lead=document.createElement('div');lead.className='example-lead';
        const cue=document.createElement('a');cue.className='example-cue';cue.href=`#${id}`;
        cue.textContent='↳ Example';cue.setAttribute('aria-label','Jump to example for the point above');
        cue.addEventListener('click',event=>{
          event.preventDefault();
          box.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
          box.focus({preventScroll:true});box.classList.add('example-focused');
          setTimeout(()=>box.classList.remove('example-focused'),1700);
        });
        lead.append(cue);box.before(lead);
      });
      root.querySelectorAll('[data-jump]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();document.getElementById(el.dataset.jump)?.scrollIntoView({behavior:'smooth',block:'start'});}));
    } else if(hash==='reviews'){root.innerHTML=archive();setupArchive();document.title='All Reviews — JODECI';}
    else if(hash==='ratings'){root.innerHTML=ratingGuide();document.title='Ratings — JODECI';}
    else{root.innerHTML=home();page='home';document.title='JODECI — Game Reviews';}
    if(page==='reviews' && hash.startsWith('review/')){
      setupGalleries();
      const section=new URLSearchParams(location.search).get('section');
      if(sharedReviewId&&section&&['positives','negatives','moments','overall'].includes(section)){
        requestAnimationFrame(()=>document.getElementById(section)?.scrollIntoView({block:'start'}));
      }
    }
    updateReadingProgress();
    document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===page));
    document.getElementById('mobile-nav').hidden=true;
    document.getElementById('mobile-menu-toggle').setAttribute('aria-expanded','false');
    if(!sharedReviewId||!new URLSearchParams(location.search).has('section'))window.scrollTo({top:0,behavior:'instant'});
  }
  document.getElementById('footer-year').textContent=new Date().getFullYear();
  const toggle=document.getElementById('mobile-menu-toggle'),nav=document.getElementById('mobile-nav');
  toggle.addEventListener('click',()=>{nav.hidden=!nav.hidden;toggle.setAttribute('aria-expanded',String(!nav.hidden));});
  // Reader gallery: CSS crossfade with 3-second looping autoplay.
  // Any manual navigation permanently pauses this gallery until the page is reopened.
  function setupGalleries(){
    root.querySelectorAll('figure.review-gallery').forEach(figure=>{
      const slides=[...figure.querySelectorAll(':scope > .gallery-slide')];
      if(!slides.length)return;
      const layout=figure.dataset.layout||'slideshow';
      figure.dataset.activeIndex='0';
      if(layout!=='slideshow'){
        figure.classList.add('gallery-grid-mode');
        slides.forEach(slide=>{slide.classList.add('is-active');slide.removeAttribute('aria-hidden');});
        return;
      }
      const stage=document.createElement('div');stage.className='gallery-stage';
      slides.forEach(slide=>stage.append(slide));figure.prepend(stage);
      const controls=document.createElement('div');controls.className='gallery-controls';
      const prev=document.createElement('button');prev.type='button';prev.className='gallery-arrow';
      prev.dataset.galleryDir='-1';prev.textContent='‹';prev.setAttribute('aria-label','Previous image; pauses autoplay');
      const count=document.createElement('span');count.className='gallery-count';count.setAttribute('aria-live','off');
      const next=document.createElement('button');next.type='button';next.className='gallery-arrow';
      next.dataset.galleryDir='1';next.textContent='›';next.setAttribute('aria-label','Next image; pauses autoplay');
      controls.append(prev,count,next);
      const thumbs=document.createElement('div');thumbs.className='gallery-thumbs';thumbs.setAttribute('aria-label','Choose gallery image; pauses autoplay');
      slides.forEach((slide,i)=>{
        const thumb=document.createElement('button');thumb.type='button';thumb.className='gallery-thumb';thumb.dataset.galleryIndex=i;
        thumb.setAttribute('aria-label',`Show image ${i+1} of ${slides.length}`);
        const image=document.createElement('img');image.src=slide.querySelector('img')?.getAttribute('src')||'';image.alt='';image.loading='lazy';
        thumb.append(image);thumbs.append(thumb);
      });
      stage.append(controls);figure.append(thumbs);
      if(slides.length===1){prev.hidden=true;next.hidden=true;thumbs.hidden=true;}
      updateGallery(figure,0);
      requestAnimationFrame(()=>figure.classList.add('gallery-ready'));
      if(slides.length>1){
        const observer=new IntersectionObserver(entries=>{
          const visible=entries[0]?.intersectionRatio>=0.25;
          figure.dataset.inView=visible?'true':'false';
          if(visible)startGallery(figure);else stopGallery(figure);
        },{threshold:[0,.25,.6]});observer.observe(figure);galleryObservers.push(observer);
      }
      let touch=null;
      figure.addEventListener('touchstart',event=>{
        touch=event.touches.length===1&&event.target.closest('.gallery-stage')?
          {x:event.touches[0].clientX,y:event.touches[0].clientY}:null;
      },{passive:true});
      figure.addEventListener('touchend',event=>{
        if(!touch||!event.changedTouches.length)return;
        const dx=event.changedTouches[0].clientX-touch.x,dy=event.changedTouches[0].clientY-touch.y;
        if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4){pauseGallery(figure);updateGallery(figure,Number(figure.dataset.activeIndex)+(dx<0?1:-1));}
        touch=null;
      },{passive:true});
    });
  }
  function stopGallery(figure){const timer=galleryTimers.get(figure);if(timer)clearInterval(timer);galleryTimers.delete(figure);}
  function startGallery(figure){
    if(galleryTimers.has(figure)||figure.dataset.manualPause==='true'||figure.dataset.inView!=='true'||document.hidden||reduceMotion.matches||lightbox.open)return;
    galleryTimers.set(figure,setInterval(()=>{
      if(document.hidden||lightbox.open||figure.dataset.manualPause==='true'){stopGallery(figure);return;}
      updateGallery(figure,Number(figure.dataset.activeIndex)+1);
    },3000));
  }
  function pauseGallery(figure){figure.dataset.manualPause='true';stopGallery(figure);figure.classList.add('gallery-paused');}
  document.addEventListener('visibilitychange',()=>{
    for(const figure of galleryTimers.keys())if(document.hidden)stopGallery(figure);
    if(!document.hidden)root.querySelectorAll('.review-gallery[data-in-view="true"]').forEach(startGallery);
  });
  reduceMotion.addEventListener?.('change',()=>{
    if(reduceMotion.matches)for(const figure of galleryTimers.keys())stopGallery(figure);
    else root.querySelectorAll('.review-gallery[data-in-view="true"]').forEach(startGallery);
  });
  function updateGallery(figure,n){
    const slides=[...figure.querySelectorAll('.gallery-slide')];if(!slides.length)return;
    const index=(n%slides.length+slides.length)%slides.length;
    figure.dataset.activeIndex=String(index);
    slides.forEach((slide,i)=>{slide.classList.toggle('is-active',i===index);slide.setAttribute('aria-hidden',String(i!==index));});
    figure.querySelectorAll('.gallery-thumb').forEach((button,i)=>{
      button.classList.toggle('is-active',i===index);button.setAttribute('aria-pressed',String(i===index));
    });
    const count=figure.querySelector('.gallery-count');if(count)count.textContent=`${index+1} / ${slides.length}`;
    const strip=figure.querySelector('.gallery-thumbs'),active=figure.querySelector('.gallery-thumb.is-active');
    if(strip&&active){
      const left=active.offsetLeft-strip.offsetLeft-(strip.clientWidth-active.clientWidth)/2;
      strip.scrollTo({left:Math.max(0,left),behavior:reduceMotion.matches?'instant':'smooth'});
    }
  }
  // One reusable fullscreen viewer for both normal images and gallery slides.
  const lightbox=document.createElement('dialog');lightbox.className='review-lightbox';
  lightbox.setAttribute('aria-label','Image viewer');
  lightbox.innerHTML='<div class="lightbox-bar"><span class="lightbox-count"></span><span class="lightbox-help">HOVER THUMBNAILS · ARROW KEYS TO NAVIGATE · ESC TO CLOSE</span><button type="button" class="lightbox-close" aria-label="Close image viewer">×</button></div><div class="lightbox-image-wrap"><button type="button" class="lightbox-prev" aria-label="Previous fullscreen image">‹</button><div class="lightbox-stage"><img class="lightbox-layer is-current" alt=""><img class="lightbox-layer" alt=""></div><button type="button" class="lightbox-next" aria-label="Next fullscreen image">›</button></div><div class="lightbox-bottom"><p class="lightbox-caption"></p><div class="lightbox-thumbs" role="group" aria-label="Fullscreen gallery thumbnails"></div></div>';
  document.body.append(lightbox);
  let lightboxItems=[],lightboxIndex=0,lightboxActive=0,lightboxRequest=0;
  const lightboxLayers=[...lightbox.querySelectorAll('.lightbox-layer')];
  const lightboxStrip=lightbox.querySelector('.lightbox-thumbs');
  function showLightboxSlide(initial=false){
    const item=lightboxItems[lightboxIndex];if(!item)return;
    const request=++lightboxRequest;
    const display=()=>{
      if(request!==lightboxRequest)return;
      const nextLayer=initial?lightboxLayers[lightboxActive]:lightboxLayers[1-lightboxActive];
      nextLayer.src=item.src;nextLayer.alt=item.alt||item.caption||'Review image';
      if(initial){lightboxLayers.forEach((img,i)=>img.classList.toggle('is-current',i===lightboxActive));}
      else{
        nextLayer.classList.add('is-current');
        lightboxLayers[lightboxActive].classList.remove('is-current');
        lightboxActive=1-lightboxActive;
      }
    };
    if(initial){display();}else{
      const preloader=new Image();preloader.onload=display;preloader.onerror=display;
      preloader.src=item.src;
      if(preloader.complete)display();
    }
    lightbox.querySelector('.lightbox-caption').textContent=item.caption||'';
    lightbox.querySelector('.lightbox-count').textContent=lightboxItems.length>1?`${lightboxIndex+1} / ${lightboxItems.length}`:'';
    lightbox.querySelector('.lightbox-prev').hidden=lightboxItems.length<2;
    lightbox.querySelector('.lightbox-next').hidden=lightboxItems.length<2;
    lightboxStrip.querySelectorAll('.lightbox-thumb').forEach((button,i)=>{
      button.classList.toggle('is-active',i===lightboxIndex);
      button.setAttribute('aria-pressed',String(i===lightboxIndex));
    });
    lightboxStrip.querySelector('.is-active')?.scrollIntoView({block:'nearest',inline:'nearest',behavior:reduceMotion.matches?'instant':'smooth'});
  }
  function openLightbox(images,index=0){
    lightboxItems=images;lightboxIndex=Math.max(0,index);lightboxActive=0;lightboxRequest++;
    lightboxLayers.forEach(layer=>{layer.src='';layer.classList.remove('is-current');});
    lightboxStrip.replaceChildren();
    images.forEach((item,i)=>{
      const button=document.createElement('button');button.type='button';button.className='lightbox-thumb';
      button.setAttribute('aria-label',`View fullscreen image ${i+1}`);button.dataset.index=i;
      const thumb=document.createElement('img');thumb.src=item.src;thumb.alt='';thumb.loading='lazy';button.append(thumb);
      lightboxStrip.append(button);
    });
    lightboxStrip.hidden=images.length<=1;
    lightbox.showModal();showLightboxSlide(true);
    lightbox.querySelector('.lightbox-close').focus();
  }
  function moveLightbox(delta){
    if(lightboxItems.length<=1)return;
    lightboxIndex=(lightboxIndex+delta+lightboxItems.length)%lightboxItems.length;showLightboxSlide();
  }
  lightboxStrip.addEventListener('click',event=>{
    const button=event.target.closest('.lightbox-thumb');if(!button)return;
    lightboxIndex=Number(button.dataset.index);showLightboxSlide();
  });
  lightboxStrip.addEventListener('pointerover',event=>{
    if(event.pointerType==='touch')return;
    const button=event.target.closest('.lightbox-thumb');if(!button||button.contains(event.relatedTarget))return;
    if(lightboxIndex===Number(button.dataset.index))return;
    lightboxIndex=Number(button.dataset.index);showLightboxSlide();
  });
  lightbox.querySelector('.lightbox-close').addEventListener('click',()=>lightbox.close());
  lightbox.querySelector('.lightbox-prev').addEventListener('click',()=>moveLightbox(-1));
  lightbox.querySelector('.lightbox-next').addEventListener('click',()=>moveLightbox(1));
  lightbox.addEventListener('click',event=>{if(event.target===lightbox)lightbox.close();});
  lightbox.addEventListener('close',()=>root.querySelectorAll('.review-gallery[data-in-view="true"]').forEach(startGallery));
  document.addEventListener('keydown',event=>{
    if(!lightbox.open)return;
    if(event.key==='ArrowLeft'){event.preventDefault();moveLightbox(-1);}
    if(event.key==='ArrowRight'){event.preventDefault();moveLightbox(1);}
  });
  let lightboxTouch=null;
  lightbox.querySelector('.lightbox-image-wrap').addEventListener('touchstart',e=>{
    if(e.touches.length===1)lightboxTouch={x:e.touches[0].clientX,y:e.touches[0].clientY};
  },{passive:true});
  lightbox.querySelector('.lightbox-image-wrap').addEventListener('touchend',e=>{
    if(!lightboxTouch||!e.changedTouches.length)return;
    const dx=e.changedTouches[0].clientX-lightboxTouch.x,dy=e.changedTouches[0].clientY-lightboxTouch.y;
    if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)moveLightbox(dx<0?1:-1);
    lightboxTouch=null;
  },{passive:true});
  root.addEventListener('pointerover',event=>{
    if(event.pointerType==='touch')return;
    const thumb=event.target.closest?.('.review-gallery .gallery-thumb');
    if(!thumb||thumb.contains(event.relatedTarget))return;
    const figure=thumb.closest('.review-gallery');if(!figure)return;
    pauseGallery(figure);updateGallery(figure,Number(thumb.dataset.galleryIndex));
  });
  root.addEventListener('click',event=>{
    const galleryButton=event.target.closest?.('[data-gallery-dir],[data-gallery-index]');
    if(galleryButton){
      const figure=galleryButton.closest('.review-gallery');if(!figure)return;
      pauseGallery(figure);
      if(galleryButton.hasAttribute('data-gallery-dir'))updateGallery(figure,Number(figure.dataset.activeIndex)+Number(galleryButton.dataset.galleryDir));
      else updateGallery(figure,Number(galleryButton.dataset.galleryIndex));
      return;
    }
    const img=event.target.closest?.('figure.review-gallery .gallery-slide > img, figure.review-media > img');
    if(!img)return;
    const gallery=img.closest('.review-gallery');
    if(gallery){
      pauseGallery(gallery);
      const slides=[...gallery.querySelectorAll('.gallery-slide')];
      const items=slides.map(slide=>({src:slide.querySelector('img')?.getAttribute('src')||'',alt:slide.querySelector('img')?.alt||'',caption:slide.querySelector('figcaption')?.textContent||''}));
      openLightbox(items,slides.findIndex(slide=>slide.contains(img))>=0?slides.findIndex(slide=>slide.contains(img)):Number(gallery.dataset.activeIndex)||0);
    }else{
      const figure=img.closest('figure.review-media');
      openLightbox([{src:img.getAttribute('src'),alt:img.alt,caption:figure.querySelector('figcaption')?.textContent||''}]);
    }
  });
  // Reveal individual spoiler phrases on click or keyboard activation.
  function revealInlineSpoiler(target){
    if(!target || !root.contains(target))return;
    const revealed=target.classList.toggle('is-revealed');
    target.setAttribute('aria-pressed',String(revealed));
    target.setAttribute('aria-label',revealed?'Spoiler revealed. Activate to hide.':'Hidden spoiler. Activate to reveal.');
  }
  root.addEventListener('click',event=>{
    const spoiler=event.target.closest?.('.inline-spoiler[data-spoiler="inline"]');
    if(spoiler)revealInlineSpoiler(spoiler);
  });
  root.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const spoiler=event.target.closest?.('.inline-spoiler[data-spoiler="inline"]');
    if(!spoiler)return;
    event.preventDefault();revealInlineSpoiler(spoiler);
  });
  // Long-review reading progress and scroll-to-top control.
  const progress=document.createElement('div');progress.className='reading-progress';progress.setAttribute('aria-hidden','true');
  progress.innerHTML='<div class="reading-progress-fill"></div>';document.body.append(progress);
  const backTop=document.createElement('button');backTop.type='button';backTop.className='back-to-top';
  backTop.textContent='↑';backTop.setAttribute('aria-label','Back to top');backTop.title='Back to top';document.body.append(backTop);
  backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:reduceMotion.matches?'instant':'smooth'}));
  function updateReadingProgress(){
    const article=root.querySelector('article');
    const reading=!!(root.querySelector('.article-layout')&&article);
    progress.classList.toggle('is-visible',reading);
    // Progress starts at the beginning of the review, including its introduction.
    // The muted track is visible even at 0%, so readers can discover the feature.
    const articleBottom=article?article.getBoundingClientRect().bottom+window.scrollY:0;
    const total=Math.max(1,articleBottom-window.innerHeight*0.70);
    const pct=reading?Math.max(0,Math.min(100,window.scrollY/total*100)):0;
    progress.firstElementChild.style.width=pct.toFixed(2)+'%';
    backTop.classList.toggle('is-visible',reading&&window.scrollY>320);
  }
  addEventListener('scroll',updateReadingProgress,{passive:true});addEventListener('resize',updateReadingProgress,{passive:true});
  async function copyShare(url,button){
    const notice=button.closest('.article-share-tools')?.querySelector('.share-feedback');
    try{
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(url);
      else{const area=document.createElement('textarea');area.value=url;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();if(!document.execCommand('copy'))throw Error('Copy unsupported');area.remove();}
      if(notice)notice.textContent='LINK COPIED';
      else{button.dataset.copied='true';button.title='Link copied';setTimeout(()=>{delete button.dataset.copied;button.title='Copy link to this section';},1800);}
    }catch(error){window.prompt('Copy this link:',url);}
  }
  root.addEventListener('click',event=>{
    const section=event.target.closest?.('[data-share-section]');
    const review=event.target.closest?.('[data-share-review]');
    if(!section&&!review)return;
    const id=decodeURIComponent(location.hash.slice(1)).startsWith('review/')?decodeURIComponent(location.hash.slice(8)):sharedReviewId;
    const record=reviews.find(r=>r.id===id);
    if(!record)return;
    const url=shareSection(record,section?.dataset.shareSection||'');
    copyShare(url,section||review);
  });
  window.addEventListener('hashchange',route);route();
})();
