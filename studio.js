(() => {
  'use strict';
  const KEY='jodeci-review-studio-v1';
  const rich=window.JODECI_RICH;
  const media=window.JODECI_MEDIA;
  const blobPaths=new Map();
  const previews=new Map();
  async function previewUrl(path){
    if(previews.has(path))return previews.get(path);
    const record=await media.get(path);
    if(!record?.blob)return null;
    const url=URL.createObjectURL(record.blob);previews.set(path,url);blobPaths.set(url,path);
    return url;
  }
  async function hydrateImages(editor){
    const images=[...editor.querySelectorAll('img')];
    for(const img of images){
      const path=img.getAttribute('src')||'';
      if(!path.startsWith('assets/uploads/'))continue;
      try{
        const url=await previewUrl(path);
        if(url&&editor.contains(img)&&img.getAttribute('src')===path)img.src=url;
      }catch(e){status('Some locally uploaded images are unavailable in this browser. Reinsert them if needed.');}
    }
  }
  function exportableHtml(editor){
    const clone=editor.cloneNode(true);
    for(const img of clone.querySelectorAll('img')){
      const src=img.getAttribute('src')||'';
      if(blobPaths.has(src))img.setAttribute('src',blobPaths.get(src));
    }
    clone.querySelectorAll('p.media-caret').forEach(p=>{if(!p.textContent.trim())p.remove();else p.removeAttribute('class');});
    return rich.sanitize(clone.innerHTML);
  }
  const onDisk=Array.isArray(window.JODECI_REVIEWS)?window.JODECI_REVIEWS:[];
  const copy=list=>JSON.parse(JSON.stringify(list));
  const clean=list=>copy(list).map(({wishes,genre,imageCredit,...review})=>review);
  let reviews=clean(onDisk);
  try {const saved=localStorage.getItem(KEY);if(saved){const parsed=JSON.parse(saved);if(Array.isArray(parsed))reviews=clean(parsed);}} catch(e) { /* storage may be disabled */ }
  let selected=reviews[0]?.id||null;
  const el=id=>document.getElementById(id);
  const form=el('review-form');
  let dirty=false,volatile=false;
  function setDirty(value){dirty=!!value;el('studio-unsaved').hidden=!dirty;if(dirty&&typeof queueAutosave==='function')queueAutosave();}
  function confirmLeave(){return !dirty||confirm('You have unsaved changes in this review. Discard them?');}
  window.addEventListener('beforeunload',event=>{if(dirty||volatile){event.preventDefault();event.returnValue='';}});

  const VERSION_KEY='jodeci-review-revisions-v15';
  const NEW_KEY='jodeci-review-unsaved-new-v15';
  let revisions={},autosaveTimer=null,lastRevisionAt=0,selectedMedia=null;
  try{const stored=JSON.parse(localStorage.getItem(VERSION_KEY)||'{}');if(stored&&typeof stored==='object'&&!Array.isArray(stored))revisions=stored;}catch(e){}
  const getVersions=id=>Array.isArray(revisions[id])?revisions[id]:[];
  const versionHash=r=>JSON.stringify(r);
  function saveVersion(r,kind='Autosave',force=false){
    if(!r?.id)return;
    const list=getVersions(r.id);const contents=versionHash(r);
    if(list[0]?.snapshot&&versionHash(list[0].snapshot)===contents)return;
    const now=Date.now();
    if(!force&&now-lastRevisionAt<30000)return;
    const next=[{at:now,kind,snapshot:JSON.parse(contents)},...list].slice(0,12);
    revisions[r.id]=next;
    try{localStorage.setItem(VERSION_KEY,JSON.stringify(revisions));lastRevisionAt=now;}catch(e){el('studio-autosave-status').textContent='Version history storage is full. Export a backup ZIP.';el('studio-autosave-status').classList.add('is-error');}
  }
  function renderVersions(){
    const target=el('studio-revisions');if(!target)return;
    const list=selected?getVersions(selected):[];
    target.replaceChildren();
    if(!list.length){const note=document.createElement('p');note.textContent='No saved versions yet. As you edit, recovery points will appear here.';target.append(note);return;}
    for(const entry of list){
      const row=document.createElement('div');row.className='studio-revision-item';
      const text=document.createElement('span');text.textContent=`${entry.kind} · ${new Date(entry.at).toLocaleString()}`;
      const button=document.createElement('button');button.type='button';button.textContent='RESTORE';
      button.addEventListener('click',()=>{
        if(!confirm(`Restore this version of ${current()?.title||'this review'}? Your latest saved version will remain available in history.`))return;
        const i=reviews.findIndex(r=>r.id===selected);if(i<0)return;
        saveVersion(reviews[i],'Before restore',true);
        reviews[i]=JSON.parse(JSON.stringify(entry.snapshot));
        if(!persist()){status('Could not store the restored version. Download a backup ZIP.');return;}
        render();status('Older version restored. Export your Website Update ZIP when ready.');
      });
      row.append(text,button);target.append(row);
    }
  }
  function markAutosave(msg,problem=false){
    const node=el('studio-autosave-status');node.textContent=msg;
    node.classList.toggle('is-error',problem);
  }
  function queueAutosave(){
    clearTimeout(autosaveTimer);
    markAutosave('Saving your changes locally…');
    autosaveTimer=setTimeout(()=>{
      if(!dirty)return;
      try{
        const snapshot=draftFromForm();
        if(selected){
          const index=reviews.findIndex(r=>r.id===selected);if(index<0)return;
          if(!snapshot.title||!snapshot.date){markAutosave('Enter a title and date to autosave.',true);return;}
          snapshot.id=selected;
          if(versionHash(reviews[index])!==versionHash(snapshot)){
            saveVersion(reviews[index],'Before autosave',false);
            reviews[index]=snapshot;
            if(snapshot.featured)reviews.forEach(item=>{if(item.id!==snapshot.id)item.featured=false;});
            if(!persist()){markAutosave('Browser storage is full. Export a backup ZIP now.',true);return;}
            renderList();renderVersions();
          }
          setDirty(false);markAutosave('Autosaved to this browser · '+new Date().toLocaleTimeString());
        }else{
          localStorage.setItem(NEW_KEY,JSON.stringify(snapshot));
          setDirty(false);markAutosave('New review draft recovered locally · '+new Date().toLocaleTimeString());
        }
      }catch(e){markAutosave('Autosave failed. Use Save in Browser and export a ZIP.',true);}
    },1800);
  }
  function resumeNewDraft(){
    if(selected)return;
    try{
      const saved=JSON.parse(localStorage.getItem(NEW_KEY)||'null');
      if(!saved?.title)return;
      plainFields.forEach(id=>{if(saved[id]!=null)el(id).value=String(saved[id]);});
      richFields.forEach(id=>{el(id).innerHTML=rich.render(saved[id]||'');hydrateImages(el(id));});
      el('rating').value=saved.masterpiece?'masterpiece':saved.abysmal?'abysmal':String(saved.rating);
      el('draft').checked=!!saved.draft;el('featured').checked=!!saved.featured;
      preview();markAutosave('Recovered your unfinished new-review draft.');
    }catch(e){}
  }
  const plainFields=['title','date','year','platform','developer','rating','theme','image','excerpt'];
  const richFields=['lead','showcase','positives','negatives','moments','overall'];
  const escape=rich.escape;
  const slug=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'untitled-review';
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(reviews));return true;}catch(e){return false;}};
  const status=msg=>el('studio-status').textContent=msg;
  function renderList(){
    const list=el('studio-list');
    list.innerHTML=reviews.map(r=>`<button type="button" data-id="${escape(r.id)}" class="${selected===r.id?'selected':''}"><strong>${escape(r.title||'Untitled')}</strong><small>${r.masterpiece?'🌟 Masterpiece':r.abysmal?'💩 Abysmal':`${'★'.repeat(Number(r.rating)||0)}${'☆'.repeat(5-(Number(r.rating)||0))}`}${r.draft?' · DRAFT':''}</small></button>`).join('')||'<p class="form-hint">No reviews yet. Click + New review.</p>';
    list.querySelectorAll('button[data-id]').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.id===selected||!confirmLeave())return;selected=btn.dataset.id;render();}));
  }
  function current(){return reviews.find(r=>r.id===selected)||null;}
  function render(){
    clearTimeout(autosaveTimer);selectedMedia?.classList.remove('is-editor-selected');selectedMedia=null;
    renderList();const r=current();
    el('editor-heading').textContent=r?'EDIT REVIEW':'NEW REVIEW';
    plainFields.forEach(id=>{el(id).value=(r&&r[id]!=null)?String(r[id]):(id==='rating'?'4':id==='theme'?'ember':id==='date'?new Date().toISOString().slice(0,10):'');});
    richFields.forEach(id=>{
      el(id).innerHTML=rich.render(r?.[id]||'');
      // Keep newly-added spoiler boxes editable here; sanitized published copies stay closed.
      el(id).querySelectorAll('details.review-hidden-box').forEach(details=>{details.open=true;});
      hydrateImages(el(id));
    });
    el('rating').value=r?.masterpiece?'masterpiece':r?.abysmal?'abysmal':String(r?.rating??4);
    el('draft').checked=r?r.draft!==false:true;
    el('featured').checked=!!r?.featured;
    el('delete-review').disabled=!r;
    setDirty(false);status('');preview();renderVersions();
    if(!r)resumeNewDraft();
  }
  function preview(){
    const title=el('title').value.trim()||'YOUR REVIEW',score=el('rating').value,r=Number(score)||0;
    el('preview-title').textContent=title;
    el('preview-stars').textContent=score==='masterpiece'?'🌟 MASTERPIECE':score==='abysmal'?'💩 ABYSMAL':'★'.repeat(r)+'☆'.repeat(5-r);
    el('preview-excerpt').textContent=el('excerpt').value.trim()||'Your summary will appear here as readers browse the site.';
  }
  function draftFromForm(){
    const record={id:current()?.id||'',title:'',year:0,date:'',platform:'',developer:'',rating:4,masterpiece:false,abysmal:false,draft:true,featured:false,image:'',theme:'ember',excerpt:'',lead:'',showcase:'',positives:'',negatives:'',moments:'',overall:''};
    plainFields.forEach(id=>record[id]=el(id).value.trim());
    richFields.forEach(id=>record[id]=exportableHtml(el(id)));
    record.title=record.title.trim();record.year=Number(record.year)||new Date().getFullYear();
    const score=el('rating').value;
    record.masterpiece=score==='masterpiece';record.abysmal=score==='abysmal';
    record.rating=record.masterpiece?5:record.abysmal?0:Number(score);
    record.draft=el('draft').checked;record.featured=el('featured').checked;
    return record;
  }
  form.addEventListener('input',()=>{setDirty(true);preview();});
  form.addEventListener('change',()=>{setDirty(true);preview();});
  form.addEventListener('submit',event=>{
    event.preventDefault();const r=draftFromForm();
    if(!r.title){status('Please enter a game title.');el('title').focus();return;}
    if(!r.date||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)){status('Please enter a valid review date.');el('date').focus();return;}
    if(r.image && !rich.imageUrl(r.image)){status('Artwork needs an HTTPS URL or a path such as assets/cover.jpg.');el('image').focus();return;}
    if(!selected){
      let base=slug(r.title),candidate=base,n=2;
      while(reviews.some(item=>item.id===candidate))candidate=`${base}-${n++}`;
      r.id=candidate;reviews.unshift(r);selected=candidate;
    }else{const i=reviews.findIndex(item=>item.id===selected);if(i!==-1)reviews[i]=r;else{reviews.unshift(r);selected=r.id;}}
    if(r.featured)reviews.forEach(item=>{if(item.id!==r.id)item.featured=false;});
    const saved=persist();volatile=!saved;setDirty(false);renderList();
    if(saved){saveVersion(r,'Manual save',true);try{localStorage.removeItem(NEW_KEY);}catch(e){}renderVersions();markAutosave('Saved to this browser · '+new Date().toLocaleTimeString());}
    status(saved?'Review saved. Download Website Update ZIP to publish your review and uploaded media.':'Review saved for this session, but local storage is full or disabled. Export a Website Update ZIP now to protect your work.');
  });
  el('add-review').addEventListener('click',()=>{if(!confirmLeave())return;selected=null;render();el('title').focus();});
  el('delete-review').addEventListener('click',()=>{
    const r=current();if(!r)return;
    if(!confirm(`Delete "${r.title}" from your editing list? You'll still need to upload the exported file to publish this deletion.`))return;
    clearTimeout(autosaveTimer);reviews=reviews.filter(item=>item.id!==selected);selected=reviews[0]?.id||null;persist();render();status('Review deleted locally. Download reviews.js to publish the removal.');
  });
  el('clear-drafts').addEventListener('click',()=>{
    if(!confirm('Discard browser edits and reload the reviews from the website file?'))return;
    clearTimeout(autosaveTimer);reviews=clean(onDisk);selected=reviews[0]?.id||null;
    try{localStorage.removeItem(KEY);}catch(e){}
    render();status('Reset to the reviews currently in reviews.js.');
  });
  function reviewsContent(){
    return '/* Generated with JODECI Review Studio. Replace reviews.js to publish changes. */\nwindow.JODECI_REVIEWS = '+JSON.stringify(reviews,null,2)+';\n';
  }
  function download(blob,name){
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  el('export-reviews').addEventListener('click',()=>{
    if(dirty){status('Save in Browser before exporting, so your latest edits are included.');return;}
    if(media.referencedPaths(reviews).length){
      status('Your reviews use images/GIFs uploaded from your PC. Use DOWNLOAD WEBSITE UPDATE ZIP instead, or the images will be missing after publishing.');
      return;
    }
    download(new Blob([reviewsContent()],{type:'text/javascript;charset=utf-8'}),'reviews.js');
    volatile=false;status('Downloaded reviews.js. Replace the file in your website folder to publish.');
  });
  const savedSiteUrl=localStorage.getItem('jodeci-site-url-v15')||'';
  el('site-url').value=savedSiteUrl;
  el('site-url').addEventListener('change',()=>{
    try{localStorage.setItem('jodeci-site-url-v15',el('site-url').value.trim());}catch(e){}
  });
  el('export-package').addEventListener('click',async()=>{
    if(dirty){status('Save in Browser before exporting, so your latest edits are included.');return;}
    const button=el('export-package');button.disabled=true;status('Preparing website update with your uploaded images and GIFs…');
    try{
      const url=el('site-url').value.trim();
      if(url&&!window.JODECI_SEO.normalizeSite(url))throw new Error('Website URL must be a valid HTTPS address, such as https://username.github.io/game-reviews/');
      const seo=window.JODECI_SEO.generate(reviews,url);
      const result=await media.packageReviews(reviews,reviewsContent(),seo.entries);
      download(result.zip,'jodeci-website-update.zip');
      volatile=false;status(`Website update downloaded: reviews.js, ${seo.count} individual review page(s), and ${result.count} uploaded image/GIF file(s). Keep all folders when extracting.`);
    }catch(e){status(`Export failed: ${e.message}`);}
    finally{button.disabled=false;}
  });
  el('cover-file').addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    const output=el('cover-file-status');output.textContent='Storing cover artwork…';
    try{
      const path=await media.add(file);
      el('image').value=path;setDirty(true);output.textContent=`Artwork saved: ${file.name}. Included in the Website Update ZIP.`;
    }catch(e){output.textContent=`Could not store image: ${e.message}`;}
    event.target.value='';
  });

  // Lightweight, self-contained editor. All elements survive sanitize + reviews.js export.
  const tools=[
    ['B','bold','Bold (Ctrl+B)','text'],['I','italic','Italic (Ctrl+I)','text'],['U','underline','Underline (Ctrl+U)','text'],['S̶','strikeThrough','Strikethrough','text'],
    ['H','h3','Subheading (click again to remove)','text'],['“”','blockquote','Quote (click again to remove)','text'],
    ['• List','insertUnorderedList','Bullet list','text'],['1. List','insertOrderedList','Numbered list','text'],
    ['×','removeFormat','Clear all text formatting, including headings','text'],
    ['↗','link','Insert link','media'],['IMG','image','Insert image','media'],['GIF','gif','Insert GIF','media'],['GALLERY','gallery','Insert a multi-image slideshow','media'],['▶','video','Insert video','media'],
    ['SPOILER','inlineSpoiler','Hide selected words until clicked','extras'],
    ['HIDE BOX','hiddenBox','Insert a collapsible spoiler box','extras'],
    ['—','divider','Insert a decorative section divider','extras'],
    ['!','callout-important','Insert an important remark box','callouts'],
    ['?','callout-question','Insert a question box','callouts'],
    ['TIP','callout-tip','Insert a tip box','callouts'],
    ['i','callout-note','Insert an informational note box','callouts'],
    ['EX','callout-example','Insert an example box','callouts'],
    ['⚡','callout-hot','Insert a hot take box','callouts'],
    ['↔','callout-comparison','Side-by-side comparison: two editable columns','callouts']
  ];
  const calloutDetails={
    important:['!','IMPORTANT'],question:['?','QUESTION'],tip:['✦','TIP'],
    note:['i','NOTE'],example:['▤','EXAMPLE'],highlight:['★','HIGHLIGHT'],hot:['⚡','HOT TAKE'],comparison:['↔','SIDE BY SIDE']
  };
  let activeEditor=null;
  let savedRange=null;
  function rangeInEditor(editor,range){return !!(editor&&range&&(editor.contains(range.commonAncestorContainer)||range.commonAncestorContainer===editor));}
  function rememberSelection(editor){
    const sel=window.getSelection();
    if(!sel||!sel.rangeCount)return;
    const range=sel.getRangeAt(0);
    if(rangeInEditor(editor,range)){
      savedRange=range.cloneRange();activeEditor=editor;
    }
  }
  function restoreSelection(){
    if(!activeEditor)return false;
    activeEditor.focus();
    if(!rangeInEditor(activeEditor,savedRange)){
      savedRange=document.createRange();savedRange.selectNodeContents(activeEditor);savedRange.collapse(false);
    }
    const selection=window.getSelection();selection.removeAllRanges();selection.addRange(savedRange);
    return true;
  }
  function ancestorTag(node,selector){
    const element=node?.nodeType===Node.ELEMENT_NODE?node:node?.parentElement;
    const candidate=element?.closest(selector);
    return candidate&&activeEditor?.contains(candidate)?candidate:null;
  }
  function unwrap(element){
    if(!element?.parentNode)return;
    while(element.firstChild)element.parentNode.insertBefore(element.firstChild,element);
    element.remove();
  }
  function cleanBlockFormatting(){
    const block=ancestorTag(savedRange?.startContainer,'h2,h3,blockquote,li');
    if(block?.matches('li'))document.execCommand('outdent',false,null);
    else if(block)document.execCommand('formatBlock',false,'P');
  }
  function execute(command,value){
    if(!restoreSelection())return;
    if(command==='h3'||command==='blockquote'){
      const element=ancestorTag(savedRange?.startContainer,command==='h3'?'h3':'blockquote');
      document.execCommand('formatBlock',false,element?'P':command==='h3'?'H3':'BLOCKQUOTE');
    } else if(command==='removeFormat'){
      const block=ancestorTag(savedRange?.startContainer,'h2,h3,blockquote,li');
      const spoiler=ancestorTag(savedRange?.startContainer,'span[data-spoiler="inline"]');
      document.execCommand('removeFormat',false,null);
      if(block?.isConnected){
        if(block.matches('li'))document.execCommand('outdent',false,null);
        else document.execCommand('formatBlock',false,'P');
      }
      if(spoiler?.isConnected)unwrap(spoiler);
    } else document.execCommand(command,false,value||null);
    rememberSelection(activeEditor);setDirty(true);refreshToolbarState();
  }
  function insert(html){
    if(!restoreSelection())return;
    document.execCommand('insertHTML',false,html);
    rememberSelection(activeEditor);setDirty(true);
  }
  // Insert figures as DOM blocks within the active editorial region, including callouts.
  // execCommand('insertHTML') often repairs a <figure> nested inside a <p> by
  // moving it outside the parent box. Range splitting avoids this browser quirk.
  function insertMediaBlock(html){
    if(!restoreSelection())return false;
    const range=savedRange.cloneRange();
    const container=ancestorTag(range.startContainer,'.compare-body,.hidden-box-copy,.callout-copy')||activeEditor;
    if(!container || !activeEditor.contains(container) && container!==activeEditor)return false;
    if(rangeCrossesBox()){
      status('Please place your cursor in one box or paragraph before inserting media.');
      return false;
    }
    const template=document.createElement('template');template.innerHTML=html;
    const mediaNode=template.content.querySelector('figure.review-media, figure.review-gallery');
    if(!mediaNode)return false;
    if(!range.collapsed)range.deleteContents();
    const marker=document.createElement('span');marker.setAttribute('data-editor-anchor','');
    range.insertNode(marker);
    let top=marker;
    while(top.parentNode&&top.parentNode!==container)top=top.parentNode;
    if(top===marker){
      marker.replaceWith(mediaNode);
    }else{
      const suffixRange=document.createRange();suffixRange.selectNodeContents(top);suffixRange.setStartAfter(marker);
      const suffix=suffixRange.extractContents();marker.remove();
      const trailing=top.cloneNode(false);trailing.append(suffix);
      top.after(mediaNode,trailing);
      if(emptyBlock(top))top.remove();
      if(emptyBlock(trailing))trailing.remove();
    }
    // An existing paragraph after the media is reused. Otherwise add a compact
    // caret line for editing only; export strips it if it stays empty.
    let line=mediaNode.nextElementSibling;
    if(!line || !line.matches('p,h3,blockquote,ul,ol') || line.closest('.review-callout,.review-hidden-box')!==mediaNode.closest('.review-callout,.review-hidden-box')){
      line=document.createElement('p');line.className='media-caret';line.append(document.createElement('br'));mediaNode.after(line);
    }
    setCaret(line);setDirty(true);status('Media inserted. Save your review to include it in the export.');
    return true;
  }
  function selectedHtml(){
    if(!savedRange||savedRange.collapsed)return '';
    const holder=document.createElement('div');holder.appendChild(savedRange.cloneContents());
    return rich.sanitize(holder.innerHTML);
  }
  function makeSpoiler(){
    if(!restoreSelection())return;
    const range=savedRange.cloneRange();
    // Leave selected leading/trailing spaces outside the spoiler instead of hiding them.
    if(!range.collapsed){
      const texts=[];const walker=document.createTreeWalker(activeEditor,NodeFilter.SHOW_TEXT);
      while(walker.nextNode())if(range.intersectsNode(walker.currentNode))texts.push(walker.currentNode);
      while(texts.length){
        const first=texts[0],start=range.startContainer===first?range.startOffset:0;
        const match=first.textContent.slice(start).match(/^\s+/);
        if(match){
          const offset=start+match[0].length;
          if(offset<first.length){range.setStart(first,offset);break;}
          texts.shift();if(texts.length)range.setStart(texts[0],0);
        } else break;
      }
      while(texts.length){
        const last=texts[texts.length-1],end=range.endContainer===last?range.endOffset:last.length;
        const match=last.textContent.slice(0,end).match(/\s+$/);
        if(match){
          const offset=end-match[0].length;
          if(offset>0){range.setEnd(last,offset);break;}
          texts.pop();if(texts.length)range.setEnd(texts[texts.length-1],texts[texts.length-1].length);
        } else break;
      }
    }
    const existing=ancestorTag(range.startContainer,'span[data-spoiler="inline"]');
    if(existing){unwrap(existing);activeEditor.focus();rememberSelection(activeEditor);setDirty(true);status('Spoiler formatting removed.');return;}
    if(range.collapsed||!range.toString().trim()){
      status('Select the exact words you want to hide, then click SPOILER.');return;
    }
    const wrapper=()=>{
      const node=document.createElement('span');node.className='inline-spoiler';
      node.setAttribute('data-spoiler','inline');return node;
    };
    try{
      range.surroundContents(wrapper());
    }catch(e){
      // A selection crossing tags or paragraphs cannot be wrapped in one span.
      // Wrap each overlapping text segment instead, preserving nested bold/italic.
      const walker=document.createTreeWalker(activeEditor,NodeFilter.SHOW_TEXT);
      const nodes=[];
      while(walker.nextNode())if(walker.currentNode.textContent?.trim()&&range.intersectsNode(walker.currentNode))nodes.push(walker.currentNode);
      for(const node of nodes.reverse()){
        if(ancestorTag(node,'span[data-spoiler="inline"]'))continue;
        const begin=range.startContainer===node?range.startOffset:0;
        const finish=range.endContainer===node?range.endOffset:node.textContent.length;
        if(begin>=finish)continue;
        const segment=document.createRange();segment.setStart(node,begin);segment.setEnd(node,finish);
        segment.surroundContents(wrapper());
      }
    }
    activeEditor.focus();rememberSelection(activeEditor);
    status('Selected text is now a spoiler. On the website, readers click to reveal it.');
  }
  // The editor treats callouts and spoiler cards as atomic top-level blocks.
  // Never let execCommand('insertHTML') place an <aside> inside a paragraph or another <aside>.
  const BOX_SELECTOR='aside.review-callout, details.review-hidden-box';
  function boxAtSelection(){return ancestorTag(savedRange?.startContainer,BOX_SELECTOR);}
  function rangeCrossesBox(){
    if(!savedRange||savedRange.collapsed)return false;
    return [...activeEditor.querySelectorAll(BOX_SELECTOR)].some(box=>savedRange.intersectsNode(box));
  }
  function setCaret(element,atEnd=false){
    if(!element)return;
    const r=document.createRange();r.selectNodeContents(element);r.collapse(!atEnd);
    activeEditor.focus();const selection=window.getSelection();selection.removeAllRanges();selection.addRange(r);
    savedRange=r.cloneRange();
  }
  function emptyBlock(element){
    return !element.textContent.trim() && !element.querySelector('img,iframe,video,hr,.review-callout,.review-hidden-box');
  }
  function currentBoxBody(box){
    return box.querySelector(':scope > .callout-copy, :scope > .hidden-box-copy');
  }
  function extractBoxContent(box){
    const frag=document.createDocumentFragment();
    const body=currentBoxBody(box);
    if(!body)return frag;
    const sides=body.querySelector('.compare-grid');
    if(sides){
      sides.querySelectorAll('.compare-panel').forEach(panel=>{
        const header=document.createElement('p');const strong=document.createElement('strong');
        strong.textContent=panel.querySelector('.compare-title')?.textContent||'';
        header.append(strong);frag.append(header);
        const copy=panel.querySelector('.compare-body');
        while(copy?.firstChild)frag.append(copy.firstChild);
      });
    }else{
      [...body.childNodes].filter(n=>!(n.nodeType===1&&n.classList.contains('callout-label')))
        .forEach(node=>frag.append(node));
    }
    return frag;
  }
  function removeBox(box){
    // A formatting toggle deletes the complete card, including the card's text.
    // Never unwrap its text into the surrounding review.
    const next=box.nextSibling,previous=box.previousSibling;
    box.remove();
    let target=null;
    if(next?.isConnected && !next.closest?.(BOX_SELECTOR))target=next;
    else if(previous?.isConnected && !previous.closest?.(BOX_SELECTOR))target=previous;
    if(!target || target.nodeType!==Node.ELEMENT_NODE){
      const line=document.createElement('p');line.append(document.createElement('br'));
      if(next?.isConnected)next.before(line);else activeEditor.append(line);
      target=line;
    }
    setCaret(target,true);
    setDirty(true);status('Box and its contents deleted.');
  }
  function fillBoxContent(body,content){
    const template=document.createElement('template');
    template.innerHTML=rich.sanitize(content)||'<p>Write your note here…</p>';
    body.append(template.content);
  }
  function newCallout(kind,content){
    const [icon,label]=calloutDetails[kind];
    const box=document.createElement('aside');
    box.className=`review-callout callout--${kind}`;box.dataset.callout=kind;
    const symbol=document.createElement('span');symbol.className='callout-icon';
    symbol.dataset.calloutIcon=kind;symbol.contentEditable='false';symbol.setAttribute('aria-hidden','true');symbol.textContent=icon;
    const copy=document.createElement('div');copy.className='callout-copy';
    const heading=document.createElement('strong');heading.className='callout-label';
    heading.contentEditable='false';heading.textContent=label;copy.append(heading);
    if(kind==='comparison'){
      const grid=document.createElement('div');grid.className='compare-grid';
      ['THIS GAME','COMPARISON'].forEach((title,i)=>{
        const panel=document.createElement('div');panel.className='compare-panel';panel.dataset.side=i?'right':'left';
        const caption=document.createElement('strong');caption.className='compare-title';caption.textContent=title;
        const value=document.createElement('div');value.className='compare-body';
        fillBoxContent(value,i?'<p>What are you comparing it with?</p>':content||'<p>How does this game handle it?</p>');
        panel.append(caption,value);grid.append(panel);
      });
      copy.append(grid);
    }else fillBoxContent(copy,content||(kind==='example'?'<p>Describe the example that illustrates your point above…</p>':'<p>Write your note here…</p>'));
    box.append(symbol,copy);return box;
  }
  function newHiddenBox(content){
    const box=document.createElement('details');box.className='review-hidden-box';box.open=true;
    const summary=document.createElement('summary');summary.contentEditable='false';summary.textContent='REVEAL SPOILER';
    const body=document.createElement('div');body.className='hidden-box-copy';
    fillBoxContent(body,content||'<p>Write your spoiler here…</p>');
    box.append(summary,body);return box;
  }
  function replaceBoxType(box,kind){
    // Changing from NOTE to TIP updates one existing box; it never inserts a second one.
    const fragment=extractBoxContent(box);
    const tmp=document.createElement('div');tmp.append(fragment);
    const content=tmp.innerHTML;
    const replacement=newCallout(kind,content);
    box.replaceWith(replacement);
    const body=replacement.querySelector('.compare-body,.callout-copy p,.callout-copy');
    setCaret(body);
    setDirty(true);status(`Changed box to ${calloutDetails[kind][1]}.`);
  }
  function insertAtomicBlock(node){
    if(!restoreSelection())return false;
    const range=savedRange.cloneRange();
    if(rangeCrossesBox()){
      status('Select text outside existing boxes before adding another box. Boxes cannot be nested.');return false;
    }
    if(!range.collapsed)range.deleteContents();
    const anchor=document.createElement('span');anchor.dataset.editorAnchor='';
    range.insertNode(anchor);
    let top=anchor;
    while(top.parentNode&&top.parentNode!==activeEditor)top=top.parentNode;
    if(top===anchor){
      anchor.replaceWith(node);
    }else{
      // Split the containing paragraph, heading, quote or list at the caret.
      // The new note becomes a sibling of that block, never a nested child.
      const tailRange=document.createRange();tailRange.selectNodeContents(top);tailRange.setStartAfter(anchor);
      const suffix=tailRange.extractContents();anchor.remove();
      const after=top.cloneNode(false);after.append(suffix);
      top.after(node,after);
      if(emptyBlock(top))top.remove();
      if(emptyBlock(after))after.remove();
    }
    // A blank line at the end makes it easy to keep writing outside the new box.
    let next=node.nextSibling;while(next&&next.nodeType===Node.TEXT_NODE&&!next.textContent.trim())next=next.nextSibling;
    if(!next){const p=document.createElement('p');p.append(document.createElement('br'));node.after(p);}
    const target=node.querySelector('.compare-body,.callout-copy p,.hidden-box-copy p,.callout-copy,.hidden-box-copy');
    setCaret(target||node);setDirty(true);
    return true;
  }
  function insertCallout(kind){
    if(!restoreSelection())return;
    const box=boxAtSelection();
    if(box){
      if(box.matches('aside.review-callout')){
        if(box.dataset.callout===kind)removeBox(box);
        else replaceBoxType(box,kind);
      } else status('Remove the spoiler box before adding a different box style inside it.');
      return;
    }
    // An Example illustrates the text *outside* its box. Keep any selected
    // statement intact and place the example AFTER its containing paragraph.
    // This also works if the caret was halfway through a sentence.
    if(kind==='example' && savedRange){
      let block=savedRange.startContainer;
      while(block && block!==activeEditor && block.parentNode!==activeEditor)block=block.parentNode;
      if(block && block!==activeEditor){
        const after=document.createRange();after.setStartAfter(block);after.collapse(true);
        savedRange=after;
      }
      if(insertAtomicBlock(newCallout(kind,'')))status('Example linked beneath the point above. Add your explanation, image, GIF, or video inside the box.');
      return;
    }
    const content=selectedHtml();
    if(insertAtomicBlock(newCallout(kind,content)))status(`${calloutDetails[kind][1]} box inserted. Click its icon again to delete the entire box.`);
  }
  function insertHiddenBox(){
    if(!restoreSelection())return;
    const box=boxAtSelection();
    if(box){
      if(box.matches('details.review-hidden-box'))removeBox(box);
      else status('Remove the current note box before inserting a spoiler box in the same place.');
      return;
    }
    const content=selectedHtml();
    if(insertAtomicBlock(newHiddenBox(content)))status('Spoiler box inserted. Click HIDE BOX again to delete it and its contents.');
  }
  function editorAction(command){
    if(command==='inlineSpoiler')makeSpoiler();
    else if(command==='hiddenBox')insertHiddenBox();
    else if(command==='divider'){insert('<hr class="review-divider"><p><br></p>');status('Divider inserted.');}
    else if(command.startsWith('callout-'))insertCallout(command.slice('callout-'.length));
    else execute(command);
  }
  const dialog=el('insert-dialog');
  const mediaForm=el('insert-form');
  let modalKind='image';
  let selectedText='';
  function openInsert(kind,editor){
    if(activeEditor!==editor)savedRange=null;
    activeEditor=editor;rememberSelection(editor);modalKind=kind;
    if(!savedRange || !(editor.contains(savedRange.commonAncestorContainer)||savedRange.commonAncestorContainer===editor)){
      savedRange=document.createRange();savedRange.selectNodeContents(editor);savedRange.collapse(false);
    }
    selectedText=window.getSelection()?.toString()||'';
    el('insert-dialog-title').textContent=({image:'INSERT IMAGE',gif:'INSERT GIF',video:'INSERT VIDEO',link:'INSERT LINK'})[kind];
    el('insert-file-group').hidden=!['image','gif'].includes(kind);
    el('insert-caption-group').hidden=!['image','gif'].includes(kind);
    el('insert-link-group').hidden=kind!=='link';
    el('insert-file').accept=kind==='gif'?'image/gif':'image/png,image/jpeg,image/gif,image/webp,image/avif';
    el('insert-url').placeholder=kind==='video'?'YouTube, Vimeo, HTTPS .mp4/.webm or assets/clip.mp4':kind==='link'?'https://example.com':'https://example.com/image.gif or assets/image.png';
    el('insert-url-label').textContent=kind==='link'?'LINK URL':kind==='video'?'VIDEO URL OR ASSETS PATH':'IMAGE URL OR ASSETS PATH';
    el('insert-help').textContent=kind==='video'?'Supports YouTube, Vimeo, direct MP4/WebM links, and local assets/clip.mp4 paths. Large video files should be uploaded separately to your host.':kind==='link'?'Select words in the editor first to turn them into a link.':'Paste an image/GIF URL, an assets/filename, or choose a file of any size from your computer. Uploaded files are included in the Website Update ZIP.';
    el('insert-error').hidden=true;
    el('insert-url').value='';el('insert-file').value='';el('insert-caption').value='';el('insert-link-text').value='';
    dialog.showModal();el('insert-url').focus();
  }
  el('insert-close').addEventListener('click',()=>dialog.close());
  el('insert-cancel').addEventListener('click',()=>dialog.close());
  mediaForm.addEventListener('submit',async event=>{
    event.preventDefault();
    const error=el('insert-error');error.hidden=true;
    const fail=msg=>{error.textContent=msg;error.hidden=false;};
    const url=el('insert-url').value.trim();
    const targetEditor=activeEditor,targetRange=savedRange?.cloneRange();
    let html='';
    if(modalKind==='link'){
      const href=rich.linkUrl(url);
      if(!href){fail('Enter a valid HTTPS or mailto link.');return;}
      if(selectedText){dialog.close();activeEditor=targetEditor;savedRange=targetRange;restoreSelection();document.execCommand('createLink',false,href);rememberSelection(activeEditor);return;}
      html=`<a href="${escape(href)}">${escape(el('insert-link-text').value.trim()||href)}</a>`;
    } else if(modalKind==='image'||modalKind==='gif'){
      let source=url;
      const file=el('insert-file').files[0];
      if(file){
        if(!['image/jpeg','image/png','image/gif','image/webp','image/avif'].includes(file.type)||(modalKind==='gif'&&file.type!=='image/gif')){fail('Choose a supported image file (PNG, JPEG, WebP, AVIF or GIF).');return;}
        try{
          const path=await media.add(file);
          source=await previewUrl(path);
          if(!source)throw new Error('Could not preview the stored file.');
        }catch(e){fail(`Unable to store this image: ${e.message}`);return;}
      }
      if(!rich.imageUrl(source) && !blobPaths.has(source)){fail('Enter a valid HTTPS image URL, assets/filename, or choose an image file.');return;}
      html=`<figure class="review-media" contenteditable="false"><img src="${escape(source)}" alt="${escape(el('insert-caption').value.trim())}" loading="lazy"></figure><p><br></p>`;
    } else if(modalKind==='video'){
      const source=rich.videoSource(url);
      if(!source){fail('Use a YouTube/Vimeo URL, an HTTPS MP4/WebM video URL or an assets/clip.mp4 path.');return;}
      if(source.kind==='iframe')html=`<figure class="review-media" contenteditable="false"><iframe src="${escape(source.src)}" title="Embedded video" loading="lazy" allowfullscreen></iframe></figure><p><br></p>`;
      else html=`<figure class="review-media" contenteditable="false"><video src="${escape(source.src)}" controls preload="metadata" playsinline></video></figure><p><br></p>`;
    }
    dialog.close();activeEditor=targetEditor;savedRange=targetRange;
    if(['image','gif','video'].includes(modalKind))insertMediaBlock(html);else insert(html);setDirty(true);
  });
  // The gallery builder keeps uploads as File objects until Insert/Save, so
  // cancelling a dialog does not create orphaned files in IndexedDB.
  const galleryDialog=el('gallery-dialog');
  const galleryForm=el('gallery-form');
  const galleryList=el('gallery-items');
  const galleryError=el('gallery-error');
  let galleryItems=[],galleryTarget=null,galleryEditor=null,galleryRange=null;
  const supportedImageTypes=new Set(['image/png','image/jpeg','image/gif','image/webp','image/avif']);
  function galleryFail(message){galleryError.hidden=false;galleryError.textContent=message;}
  function galleryRefresh(){
    galleryList.replaceChildren();
    galleryItems.forEach((item,i)=>{
      const row=document.createElement('div');row.className='gallery-editor-item';row.draggable=true;
      row.dataset.index=i;
      const thumb=document.createElement('img');thumb.src=item.preview||item.src;thumb.alt='';
      const body=document.createElement('div');body.className='gallery-editor-details';
      const name=document.createElement('strong');name.textContent=`${i+1}. ${item.name||'Image / GIF'}`;
      const caption=document.createElement('input');caption.type='text';caption.value=item.caption||'';
      caption.placeholder='Optional caption shown to readers';caption.maxLength=500;
      caption.setAttribute('aria-label',`Caption for image ${i+1}`);
      caption.addEventListener('input',()=>{item.caption=caption.value;});
      body.append(name,caption);
      const controls=document.createElement('div');controls.className='gallery-editor-actions';
      const move=(symbol,title,delta)=>{
        const b=document.createElement('button');b.type='button';b.textContent=symbol;b.title=title;b.setAttribute('aria-label',title);
        b.disabled=(delta<0&&i===0)||(delta>0&&i===galleryItems.length-1);
        b.addEventListener('click',()=>{const [v]=galleryItems.splice(i,1);galleryItems.splice(i+delta,0,v);galleryRefresh();});return b;
      };
      controls.append(move('↑','Move image up',-1),move('↓','Move image down',1));
      const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.title='Remove image';remove.setAttribute('aria-label',`Remove image ${i+1}`);
      remove.addEventListener('click',()=>{galleryItems.splice(i,1);galleryRefresh();});controls.append(remove);
      row.append(thumb,body,controls);
      row.addEventListener('dragstart',event=>{if(event.target.closest('input,button')){event.preventDefault();return;}event.dataTransfer.setData('text/plain',String(i));event.dataTransfer.effectAllowed='move';});
      row.addEventListener('dragover',event=>{event.preventDefault();event.dataTransfer.dropEffect='move';});
      row.addEventListener('drop',event=>{
        event.preventDefault();const from=Number(event.dataTransfer.getData('text/plain'));
        if(!Number.isInteger(from)||from<0||from>=galleryItems.length||from===i)return;
        const [v]=galleryItems.splice(from,1);galleryItems.splice(i,0,v);galleryRefresh();
      });
      galleryList.append(row);
    });
    el('gallery-submit').textContent=galleryTarget?'SAVE GALLERY':'INSERT GALLERY';
  }
  function galleryAddFiles(files){
    let invalid=0;
    [...files].forEach(file=>{
      if(!supportedImageTypes.has(file.type)){invalid++;return;}
      galleryItems.push({file,preview:URL.createObjectURL(file),src:'',name:file.name,caption:''});
    });
    if(invalid)galleryFail(`${invalid} unsupported file(s). Use JPG, PNG, WebP, AVIF or GIF.`);
    galleryRefresh();
  }
  function galleryAddUrls(){
    const input=el('gallery-urls');const urls=input.value.split(/[\r\n]+/).map(s=>s.trim()).filter(Boolean);
    if(!urls.length)return;
    const invalid=urls.filter(url=>!rich.imageUrl(url));
    if(invalid.length){galleryFail('Use HTTPS image URLs or paths such as assets/my-image.png.');return;}
    urls.forEach(src=>galleryItems.push({src,name:src.split('/').pop().slice(0,45),caption:''}));
    input.value='';galleryError.hidden=true;galleryRefresh();
  }
  function openGallery(editor,existing=null){
    if(galleryDialog.open)return;
    galleryEditor=editor;galleryTarget=existing;
    if(activeEditor!==editor)savedRange=null;
    activeEditor=editor;if(!existing)rememberSelection(editor);
    galleryRange=savedRange?.cloneRange()||null;
    galleryItems=[];galleryError.hidden=true;el('gallery-urls').value='';el('gallery-files').value='';
    el('gallery-layout').value=existing?.dataset.layout||'slideshow';
    if(existing){
      [...existing.querySelectorAll(':scope > .gallery-slide')].forEach((slide,i)=>{
        const img=slide.querySelector('img');if(!img)return;
        const src=img.getAttribute('src')||'';
        galleryItems.push({src:blobPaths.get(src)||src,preview:src,name:`Image ${i+1}`,caption:slide.querySelector('figcaption')?.textContent||'',alt:img.alt||''});
      });
    }
    galleryRefresh();galleryDialog.showModal();
  }
  function closeGallery(){galleryDialog.close();}
  galleryDialog.addEventListener('close',()=>{
    // Also clean up if Escape closes the modal.
    galleryItems.forEach(item=>{if(item.file&&item.preview?.startsWith('blob:'))URL.revokeObjectURL(item.preview);});
    galleryItems=[];galleryTarget=null;
  });
  el('gallery-close').addEventListener('click',closeGallery);
  el('gallery-cancel').addEventListener('click',closeGallery);
  el('gallery-files').addEventListener('change',event=>{
    galleryAddFiles(event.target.files||[]);event.target.value='';
  });
  el('gallery-add-urls').addEventListener('click',galleryAddUrls);
  galleryForm.addEventListener('submit',async event=>{
    event.preventDefault();galleryAddUrls();
    if(galleryItems.length<2){galleryFail('Add at least two images or GIFs for a gallery.');return;}
    if(galleryItems.length>60){galleryFail('A slideshow can contain up to 60 images.');return;}
    const button=el('gallery-submit');button.disabled=true;
    const insertItems=[];
    try{
      for(const item of galleryItems){
        let src=item.src;
        if(item.file){
          const path=await media.add(item.file);
          src=await previewUrl(path);
          if(!src)throw new Error(`Unable to preview ${item.file.name}`);
        } else if(item.preview?.startsWith('blob:')&&blobPaths.has(item.preview)){
          src=item.preview;
        }
        if(!rich.imageUrl(src)&&!blobPaths.has(src))throw new Error(`Invalid image: ${item.name}`);
        insertItems.push({src,caption:item.caption||''});
      }
      const layout=el('gallery-layout').value;
      const markup=`<figure class="review-gallery" data-layout="${escape(layout)}" contenteditable="false">`+insertItems.map(item=>
        `<div class="gallery-slide"><img src="${escape(item.src)}" alt="${escape(item.caption)}" loading="lazy"><figcaption>${escape(item.caption)}</figcaption></div>`
      ).join('')+'</figure>';
      if(galleryTarget?.isConnected){
        const template=document.createElement('template');template.innerHTML=markup;
        galleryTarget.replaceWith(template.content.firstChild);
        setDirty(true);status('Gallery updated. Save your review to keep the changes.');
      }else{
        activeEditor=galleryEditor;savedRange=galleryRange;
        if(!insertMediaBlock(markup))throw new Error('Place the cursor inside the review where the slideshow belongs.');
      }
      closeGallery();
    }catch(e){galleryFail(e.message);}
    finally{button.disabled=false;}
  });

  function refreshToolbarState(){
    if(!activeEditor)return;
    const bar=activeEditor.previousElementSibling?.querySelector('.rich-toolbar');
    if(!bar)return;
    const current=boxAtSelection();
    const heading=ancestorTag(savedRange?.startContainer,'h3');
    const quote=ancestorTag(savedRange?.startContainer,'blockquote');
    bar.querySelectorAll('button[data-cmd]').forEach(button=>{
      const command=button.dataset.cmd;
      let active=false;
      if(command==='h3')active=!!heading;
      else if(command==='blockquote')active=!!quote;
      else if(command==='hiddenBox')active=!!current?.matches('details.review-hidden-box');
      else if(command.startsWith('callout-'))active=!!(current?.dataset.callout===command.slice(8));
      else if(['bold','italic','underline','strikeThrough','insertUnorderedList','insertOrderedList'].includes(command)){
        try{active=!!document.queryCommandState(command);}catch(e){}
      }
      else if(command==='inlineSpoiler')active=!!ancestorTag(savedRange?.startContainer,'span[data-spoiler="inline"]');
      button.setAttribute('aria-pressed',String(active));
    });
  }
  el('showcase-edit').addEventListener('click',()=>{
    const editor=el('showcase');
    const existing=editor.querySelector('figure.review-gallery');
    if(existing){openGallery(editor,existing);return;}
    editor.focus();
    const range=document.createRange();range.selectNodeContents(editor);range.collapse(false);
    const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
    activeEditor=editor;rememberSelection(editor);openGallery(editor);
  });
  el('showcase-remove').addEventListener('click',()=>{
    if(!el('showcase').textContent.trim() && !el('showcase').querySelector('figure'))return;
    el('showcase').replaceChildren();setDirty(true);status('The dedicated game gallery was removed.');
  });
  richFields.forEach(id=>{
    const editor=el(id);
    const toolbar=document.createElement('div');toolbar.className='rich-toolbar';toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label',`Formatting for ${id}`);
    const groups=[['text','TEXT'],['media','MEDIA'],['extras','EXTRAS'],['callouts','CALLOUTS']];
    toolbar.innerHTML=groups.map(([key,label])=>`<div class="rich-tools-group" data-group="${key}" aria-label="${label}"><span class="rich-tools-label">${label}</span>${tools.filter(([, , ,group])=>group===key).map(([name,cmd,title])=>`<button type="button" class="rich-tool" data-cmd="${cmd}" title="${escape(title)}" aria-label="${escape(title)}">${escape(name)}</button>`).join('')}</div>`).join('');
    const section=document.createElement('span');section.className='rich-toolbar-section';
    section.textContent=({showcase:'GALLERY',lead:'INTRO',positives:'POSITIVES',negatives:'NEGATIVES',moments:'MOMENTS',overall:'VERDICT'})[id]||id.toUpperCase();
    const shell=document.createElement('div');shell.className='rich-toolbar-shell';
    const tabs=document.createElement('div');tabs.className='rich-toolbar-tabs';tabs.setAttribute('aria-label','Formatting tool categories');
    const names=[['text','Text'],['media','Media'],['extras','Extras'],['callouts','Boxes']];
    const choose=group=>{
      toolbar.dataset.mobileGroup=group;
      tabs.querySelectorAll('button').forEach(b=>{const active=b.dataset.toolTab===group;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
    };
    names.forEach(([key,label])=>{
      const button=document.createElement('button');button.type='button';button.textContent=label;
      button.dataset.toolTab=key;button.addEventListener('click',()=>choose(key));tabs.append(button);
    });
    choose('text');shell.append(section,tabs,toolbar);
    editor.before(shell);
    if(id==='showcase')shell.hidden=true;
    editor.addEventListener('keyup',()=>{rememberSelection(editor);refreshToolbarState();});
    editor.addEventListener('mouseup',()=>{rememberSelection(editor);refreshToolbarState();});
    editor.addEventListener('focus',()=>{activeEditor=editor;rememberSelection(editor);refreshToolbarState();});
    editor.addEventListener('paste',event=>{
      event.preventDefault();
      const html=event.clipboardData?.getData('text/html');
      const text=event.clipboardData?.getData('text/plain')||'';
      let safe=html?rich.sanitize(html):escape(text).replace(/\r?\n/g,'<br>');
      if(editor.closest('.review-callout,.review-hidden-box') || ancestorTag(window.getSelection()?.anchorNode,BOX_SELECTOR)){
        const tmp=document.createElement('div');tmp.innerHTML=safe;
        if(tmp.querySelector('.review-callout,.review-hidden-box'))safe=escape(tmp.textContent).replace(/\r?\n/g,'<br>');
      }
      document.execCommand('insertHTML',false,safe);setDirty(true);
    });
    editor.addEventListener('click',event=>{
      const mediaFigure=event.target.closest?.('figure.review-media,figure.review-gallery');
      if(selectedMedia){selectedMedia.classList.remove('is-editor-selected');selectedMedia=null;}
      if(mediaFigure&&editor.contains(mediaFigure)){
        event.preventDefault();
        selectedMedia=mediaFigure.matches('.review-gallery') && event.target.closest('.gallery-slide') ? event.target.closest('.gallery-slide') : mediaFigure;
        selectedMedia.classList.add('is-editor-selected');
        editor.focus({preventScroll:true});
        status(mediaFigure.matches('.review-gallery')?'Image selected: Delete removes just this image. Double-click the gallery to reorder or edit it.':'Image selected: press Delete or Backspace to remove it.');
      }
    });
    editor.addEventListener('dblclick',event=>{
      const gallery=event.target.closest?.('figure.review-gallery');
      if(gallery&&editor.contains(gallery)){event.preventDefault();openGallery(editor,gallery);}
    });
    editor.addEventListener('drop',event=>{
      if(event.dataTransfer?.files?.length){event.preventDefault();status('To insert an image or GIF, use its button in the toolbar.');}
    });
    toolbar.addEventListener('mousedown',event=>{if(event.target.closest('button'))event.preventDefault();});
    toolbar.addEventListener('click',event=>{
      const button=event.target.closest('button[data-cmd]');if(!button)return;
      const cmd=button.dataset.cmd;
      if(cmd==='gallery'){openGallery(editor);return;}
      if(['link','image','gif','video'].includes(cmd)){openInsert(cmd,editor);return;}
      if(activeEditor!==editor)savedRange=null;
      activeEditor=editor;editorAction(cmd);refreshToolbarState();
    });
  });
  document.addEventListener('keydown',event=>{
    if(!selectedMedia?.isConnected||!['Delete','Backspace'].includes(event.key))return;
    const target=event.target;
    if(target instanceof Element && target.closest('input,textarea,[contenteditable="true"]') && !target.classList.contains('rich-input'))return;
    if(target?.classList?.contains('rich-input')&&!target.contains(selectedMedia))return;
    event.preventDefault();
    const editor=selectedMedia.closest('.rich-input');
    const gallery=selectedMedia.closest('.review-gallery');
    selectedMedia.remove();selectedMedia=null;
    if(gallery?.isConnected){
      const slides=gallery.querySelectorAll(':scope > .gallery-slide');
      if(slides.length===1){
        const fig=document.createElement('figure');fig.className='review-media';fig.setAttribute('contenteditable','false');
        const remaining=slides[0],pic=remaining.querySelector('img'),caption=remaining.querySelector('figcaption');
        if(pic)fig.append(pic.cloneNode(true));if(caption)fig.append(caption.cloneNode(true));
        gallery.replaceWith(fig);
      }else if(!slides.length)gallery.remove();
    }
    if(editor){activeEditor=editor;setDirty(true);status('Selected image removed. Autosave will preserve this change.');}
  });
  document.addEventListener('click',event=>{
    if(!selectedMedia||event.target.closest?.('.rich-input figure.review-media,.rich-input figure.review-gallery'))return;
    selectedMedia.classList.remove('is-editor-selected');selectedMedia=null;
  });
  render();
})();
