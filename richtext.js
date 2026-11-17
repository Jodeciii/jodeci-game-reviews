/* Shared rich-text formatting and safe rendering for the static JODECI site.
   Existing plain-text reviews continue to work without migration. */
(() => {
  'use strict';
  const escape = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const localPath = s => /^assets\/[a-z0-9_./ -]+$/i.test(s) && !s.includes('..') && !/[\\?#]/.test(s);
  const remoteUrl = s => /^https:\/\/[^\s"'<>\\]+$/i.test(s);
  const inlineImage = s => /^data:image\/(?:jpeg|png|gif|webp|avif);base64,[a-z0-9+/=]+$/i.test(s);
  function imageUrl(value) {
    const s=String(value||'').trim();
    return remoteUrl(s)||localPath(s)||inlineImage(s)?s:'';
  }
  function mediaUrl(value) {
    const s=String(value||'').trim();
    return remoteUrl(s)||localPath(s)?s:'';
  }
  function linkUrl(value) {
    const s=String(value||'').trim();
    return remoteUrl(s)||/^mailto:[^\s"'<>]+$/i.test(s)?s:'';
  }
  function videoSource(value) {
    const s=String(value||'').trim();
    if (!mediaUrl(s)) return null;
    if (localPath(s)) return /\.(?:mp4|webm|ogv|ogg)$/i.test(s) ? {kind:'video',src:s} : null;
    try {
      const url=new URL(s,document.baseURI);
      const host=url.hostname.toLowerCase();
      let id='';
      if (['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)) {
        if (url.pathname==='/watch')id=url.searchParams.get('v')||'';
        else id=url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})(?:\/|$)/)?.[1]||'';
        if (/^[\w-]{11}$/.test(id))return {kind:'iframe',src:`https://www.youtube-nocookie.com/embed/${id}`};
      }
      if (host==='youtu.be') {
        id=url.pathname.slice(1).split('/')[0];
        if (/^[\w-]{11}$/.test(id))return {kind:'iframe',src:`https://www.youtube-nocookie.com/embed/${id}`};
      }
      if (['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)) {
        id=url.pathname.match(/\/(?:video\/)?(\d+)/)?.[1]||'';
        if (/^\d+$/.test(id))return {kind:'iframe',src:`https://player.vimeo.com/video/${id}`};
      }
    } catch(e) {return null;}
    if (/\.(?:mp4|webm|ogv|ogg)(?:\?[^"'<>\s]*)?$/i.test(s))return {kind:'video',src:s};
    return null;
  }
  function isEmbedSrc(s) {
    return /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}$/i.test(s) ||
           /^https:\/\/player\.vimeo\.com\/video\/\d+$/i.test(s);
  }
  // Only known editorial elements are kept. Do not trust arbitrary HTML attributes or classes.
  const keep=new Set(['p','br','strong','b','em','i','u','s','strike','h2','h3','ul','ol','li','blockquote','a','figure','figcaption','img','video','iframe','div','span','aside','details','summary','hr']);
  const discard=new Set(['script','style','object','embed','svg','math','form','input','button','textarea','select','link','meta','base','template']);
  const calloutTypes={
    important:{icon:'!',label:'IMPORTANT'},question:{icon:'?',label:'QUESTION'},
    tip:{icon:'✦',label:'TIP'},note:{icon:'i',label:'NOTE'},
    highlight:{icon:'★',label:'HIGHLIGHT'},example:{icon:'▤',label:'EXAMPLE'},hot:{icon:'⚡',label:'HOT TAKE'},
    comparison:{icon:'↔',label:'SIDE BY SIDE'}
  };
  function cleanNode(node,doc){
    if(node.nodeType===Node.TEXT_NODE)return doc.createTextNode(node.textContent||'');
    if(node.nodeType!==Node.ELEMENT_NODE)return doc.createDocumentFragment();
    const tag=node.tagName.toLowerCase();
    if(discard.has(tag))return doc.createDocumentFragment();
    if(!keep.has(tag)){
      const fragment=doc.createDocumentFragment();
      [...node.childNodes].forEach(child=>fragment.appendChild(cleanNode(child,doc)));
      return fragment;
    }
    const normalTag=({b:'strong',i:'em',strike:'s',div:'p'})[tag]||tag;
    // Galleries are serialized as clean slides only; interactive controls are
    // generated on the public page, never trusted from pasted HTML.
    if(tag==='figure' && node.classList.contains('review-gallery')){
      const figure=doc.createElement('figure');
      figure.className='review-gallery';figure.setAttribute('contenteditable','false');
      const layout=node.getAttribute('data-layout');
      if(['slideshow','duo','grid','cinema'].includes(layout))figure.setAttribute('data-layout',layout);
      const sources=[...node.querySelectorAll('.gallery-slide')];
      for(const slide of sources.slice(0,60)){
        const original=slide.querySelector('img');
        if(!original)continue;
        const src=imageUrl(original.getAttribute('src'));
        if(!src)continue;
        const panel=doc.createElement('div');panel.className='gallery-slide';
        const image=doc.createElement('img');image.src=src;
        image.alt=(original.getAttribute('alt')||'').slice(0,200);
        image.loading='lazy';
        const caption=doc.createElement('figcaption');
        caption.textContent=(slide.querySelector('figcaption')?.textContent||'').trim().slice(0,500);
        panel.append(image,caption);figure.append(panel);
      }
      return figure.childElementCount?figure:doc.createDocumentFragment();
    }
    if(tag==='img') {
      const src=imageUrl(node.getAttribute('src'));
      if(!src)return doc.createDocumentFragment();
      const img=doc.createElement('img');
      img.setAttribute('src',src);img.setAttribute('alt',(node.getAttribute('alt')||'').slice(0,200));
      img.setAttribute('loading','lazy');
      return img;
    }
    if(tag==='video'){
      const src=mediaUrl(node.getAttribute('src'));
      if(!src||!/\.(?:mp4|webm|ogv|ogg)(?:\?[^"'<>\s]*)?$/i.test(src))return doc.createDocumentFragment();
      const video=doc.createElement('video');
      video.setAttribute('src',src);video.setAttribute('controls','');video.setAttribute('preload','metadata');
      video.setAttribute('playsinline','');
      return video;
    }
    if(tag==='iframe'){
      const src=String(node.getAttribute('src')||'').trim();
      if(!isEmbedSrc(src))return doc.createDocumentFragment();
      const iframe=doc.createElement('iframe');
      iframe.setAttribute('src',src); iframe.setAttribute('title','Embedded video');
      iframe.setAttribute('loading','lazy');iframe.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
      iframe.setAttribute('allow','accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen','');
      return iframe;
    }
    if(tag==='span') {
      // The spoiler is revealed only by a deliberate reader click/keypress.
      if(node.getAttribute('data-spoiler')==='inline'){
        const result=doc.createElement('span');
        result.className='inline-spoiler';result.setAttribute('data-spoiler','inline');
        result.setAttribute('role','button');result.setAttribute('tabindex','0');
        result.setAttribute('aria-label','Hidden spoiler. Activate to reveal.');
        result.setAttribute('aria-pressed','false');
        [...node.childNodes].forEach(child=>result.appendChild(cleanNode(child,doc)));
        return result;
      }
      const icon=node.getAttribute('data-callout-icon');
      if(icon && Object.hasOwn(calloutTypes,icon)){
        const result=doc.createElement('span');result.className='callout-icon';
        result.setAttribute('data-callout-icon',icon);result.setAttribute('contenteditable','false');
        result.setAttribute('aria-hidden','true');result.textContent=calloutTypes[icon].icon;
        return result;
      }
      const fragment=doc.createDocumentFragment();
      [...node.childNodes].forEach(child=>fragment.appendChild(cleanNode(child,doc)));
      return fragment;
    }
    if(tag==='aside'){
      const kind=node.getAttribute('data-callout');
      const fragment=doc.createDocumentFragment();
      if(!kind || !Object.hasOwn(calloutTypes,kind)){
        [...node.childNodes].forEach(child=>fragment.appendChild(cleanNode(child,doc)));
        return fragment;
      }
      const result=doc.createElement('aside');
      result.className=`review-callout callout--${kind}`;
      result.setAttribute('data-callout',kind);
      // Re-create the fixed icon/heading rather than trusting pasted markup.
      const icon=doc.createElement('span');icon.className='callout-icon';
      icon.setAttribute('data-callout-icon',kind);icon.setAttribute('aria-hidden','true');
      icon.setAttribute('contenteditable','false');icon.textContent=calloutTypes[kind].icon;
      const copy=doc.createElement('div');copy.className='callout-copy';
      const heading=doc.createElement('strong');heading.className='callout-label';
      heading.setAttribute('contenteditable','false');heading.textContent=calloutTypes[kind].label;
      copy.appendChild(heading);
      // Support pasted/imported content even if it was not created with our toolbar.
      const existing=node.querySelector('.callout-copy');
      if(kind==='comparison'){
        const grid=doc.createElement('div');grid.className='compare-grid';
        ['left','right'].forEach((side,i)=>{
          const original=node.querySelector(`.compare-panel[data-side="${side}"]`);
          const panel=doc.createElement('div');panel.className='compare-panel';panel.setAttribute('data-side',side);
          const title=doc.createElement('strong');title.className='compare-title';
          title.textContent=(original?.querySelector('.compare-title')?.textContent|| (i?'COMPARISON':'THIS GAME')).trim().slice(0,100);
          // Keep titles editable in Studio through the parent editor only.
          // Public review pages must not expose editable elements.
          const value=doc.createElement('div');value.className='compare-body';
          const source=original?.querySelector('.compare-body')||(!i?existing:null);
          if(source)[...source.childNodes].filter(ch=>!(ch.nodeType===1&&ch.classList.contains('callout-label'))).forEach(ch=>value.appendChild(cleanNode(ch,doc)));
          if(!value.textContent.trim()&&!value.querySelector('img,video,iframe')){
            const text=doc.createElement('p');text.textContent=i?'What are you comparing it with?':'How does this game handle it?';value.append(text);
          }
          panel.append(title,value);grid.append(panel);
        });
        copy.append(grid);result.append(icon,copy);return result;
      }
      const content=existing?[...existing.childNodes].filter(ch=>!(ch.nodeType===1&&ch.classList.contains('callout-label'))):
        [...node.childNodes].filter(ch=>!(ch.nodeType===1&&ch.classList.contains('callout-icon')));
      content.forEach(child=>copy.appendChild(cleanNode(child,doc)));
      if(!copy.querySelector('p,ul,ol,blockquote,h3,figure,details')){
        const text=copy.textContent.replace(calloutTypes[kind].label,'').trim();
        if(!text){const para=doc.createElement('p');para.textContent='Write your note here…';copy.appendChild(para);}
      }
      result.append(icon,copy);return result;
    }
    if(tag==='details'){
      if(!node.classList.contains('review-hidden-box')){
        const fragment=doc.createDocumentFragment();
        [...node.childNodes].forEach(child=>fragment.appendChild(cleanNode(child,doc)));
        return fragment;
      }
      const details=doc.createElement('details');details.className='review-hidden-box';
      const summary=doc.createElement('summary');summary.textContent='REVEAL SPOILER';
      summary.setAttribute('contenteditable','false');
      const body=doc.createElement('div');body.className='hidden-box-copy';
      const original=node.querySelector('.hidden-box-copy');
      (original?[...original.childNodes]:[...node.childNodes].filter(ch=>!(ch.nodeType===1&&ch.tagName.toLowerCase()==='summary')))
        .forEach(child=>body.appendChild(cleanNode(child,doc)));
      details.append(summary,body);return details;
    }
    if(tag==='summary')return doc.createDocumentFragment(); // Only generated inside a validated details.
    if(tag==='hr'){
      const hr=doc.createElement('hr');hr.className='review-divider';return hr;
    }
    const actualTag=tag==='div'&&['callout-copy','hidden-box-copy'].some(c=>node.classList.contains(c))?'div':normalTag;
    const result=doc.createElement(actualTag);
    if(actualTag==='div')result.className=node.classList.contains('callout-copy')?'callout-copy':'hidden-box-copy';
    if(actualTag==='a'){
      const url=linkUrl(node.getAttribute('href'));
      if(url){result.setAttribute('href',url);result.setAttribute('rel','noopener noreferrer');result.setAttribute('target','_blank');}
    }
    if(actualTag==='figure'){
      result.setAttribute('class','review-media');
      result.setAttribute('contenteditable','false');
    }
    [...node.childNodes].forEach(child=>result.appendChild(cleanNode(child,doc)));
    return result;
  }
  const looksHtml=s=>/<(?:p|div|br|strong|b|em|i|u|s|h[23]|ul|ol|li|blockquote|a|figure|img|video|iframe|span|aside|details|hr)\b/i.test(s);
  function sanitize(input){
    const html=String(input??'');
    const doc=new DOMParser().parseFromString(`<div id="rich-root">${html}</div>`,'text/html');
    const container=document.createElement('div');
    [...doc.getElementById('rich-root').childNodes].forEach(node=>container.appendChild(cleanNode(node,document)));
    // Older drafts/pasted HTML may have nested cards. Flatten their contents
    // so neither the editor nor the published site can display a box in a box.
    const boxes='aside.review-callout,details.review-hidden-box';
    [...container.querySelectorAll(boxes)].reverse().forEach(box=>{
      if(!box.parentElement?.closest(boxes))return;
      const content=box.querySelector(':scope > .callout-copy, :scope > .hidden-box-copy');
      const frag=document.createDocumentFragment();
      if(content){
        if(content.querySelector('.compare-grid')){
          content.querySelectorAll('.compare-body').forEach(panel=>[...panel.childNodes].forEach(ch=>frag.append(ch)));
        }else [...content.childNodes].filter(ch=>!(ch.nodeType===1&&ch.classList.contains('callout-label'))).forEach(ch=>frag.append(ch));
      }
      box.replaceWith(frag);
    });
    // The editor creates an empty caret paragraph after inserting media.
    // Never publish those spacer paragraphs or older saved <p><br></p> gaps.
    container.querySelectorAll('figure.review-media,figure.review-gallery').forEach(figure=>{
      let next=figure.nextElementSibling;
      while(next?.matches('p') && !next.textContent.trim() &&
            !next.querySelector('img,video,iframe,figure,aside,details')){
        const stale=next;next=next.nextElementSibling;stale.remove();
      }
    });
    return container.innerHTML;
  }
  function legacyToHtml(input){
    return String(input||'').split(/\n\s*\n/).filter(Boolean).map(p=>`<p>${escape(p).replace(/\n/g,'<br>')}</p>`).join('');
  }
  function render(input){
    const s=String(input||'');
    return looksHtml(s)?sanitize(s):legacyToHtml(s);
  }
  window.JODECI_RICH={escape,sanitize,render,imageUrl,mediaUrl,linkUrl,videoSource};
})();
