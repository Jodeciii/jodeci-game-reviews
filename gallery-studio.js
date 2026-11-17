/* JODECI Gallery Studio — independent of review drafts and review database. */
(() => {
  'use strict';
  const KEY='jodeci-gallery-studio-v18';
  const fileMedia=window.JODECI_MEDIA;
  const disk=Array.isArray(window.JODECI_GALLERIES)?window.JODECI_GALLERIES:[];
  const copy=x=>JSON.parse(JSON.stringify(x));
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeSrc=s=>{const u=String(s||'').trim();return /^(https:\/\/[^\s"'<>]+|assets\/[a-z0-9_./ -]+)$/i.test(u)&&!u.includes('..')?u:'';};
  const slug=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'untitled-album';
  const validAlbum=a=>a&&typeof a.id==='string'&&/^[a-z0-9][a-z0-9-]*$/.test(a.id)&&typeof a.title==='string'&&Array.isArray(a.images);
  let albums=copy(disk.filter(validAlbum));
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(saved))albums=copy(saved.filter(validAlbum));}catch(e){}
  let selected=albums[0]?.id||null;
  let images=[];
  let dirty=false;
  let busy=false;
  let coverPath='';
  const objectUrls=new Map();
  const message=s=>$('album-status').textContent=s;
  const exportMessage=s=>$('album-export-status').textContent=s;
  const setDirty=v=>{dirty=!!v;$('album-dirty').hidden=!dirty;};
  const confirmLeave=()=>!dirty||window.confirm('Unsaved album changes will be lost. Continue?');
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(albums));return true;}catch(e){return false;}};
  const current=()=>albums.find(a=>a.id===selected)||null;
  async function previewSrc(path){
    if(!path?.startsWith('assets/uploads/'))return path;
    if(objectUrls.has(path))return objectUrls.get(path);
    try{const stored=await fileMedia.get(path);if(!stored?.blob)return path;
      const url=URL.createObjectURL(stored.blob);objectUrls.set(path,url);return url;
    }catch(e){return path;}
  }
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}for(const url of objectUrls.values())URL.revokeObjectURL(url);});
  function list(){
    $('album-list').innerHTML=albums.map(a=>`<button type="button" data-album="${esc(a.id)}" class="${selected===a.id?'selected':''}"><strong>${esc(a.title)}</strong><small>${a.images.length} screenshot${a.images.length===1?'':'s'}</small></button>`).join('')||'<p class="form-hint">No albums yet. Create your first collection.</p>';
  }
  function render(){
    const a=current();$('album-editor-heading').textContent=a?'EDIT ALBUM':'NEW ALBUM';
    $('album-title').value=a?.title||'';$('album-year').value=a?.year||'';
    $('album-description').value=a?.description||'';
    images=copy(a?.images||[]);coverPath=a?.cover||images[0]?.src||'';
    $('album-delete').disabled=!a;
    setDirty(false);message('');list();drawItems();
  }
  function itemMarkup(item,i){
    const isCover=item.src===coverPath;
    return `<article class="album-editor-item" data-index="${i}" draggable="true"><div class="album-editor-photo"><img alt="" data-image="${i}" loading="lazy"><span class="album-editor-ordinal">${i+1}</span>${isCover?'<span class="album-editor-cover-label">COVER</span>':''}</div><div class="album-editor-item-actions"><button type="button" data-action="cover" data-index="${i}" aria-label="Set image ${i+1} as album cover" ${isCover?'disabled':''}>${isCover?'★ COVER':'☆ COVER'}</button><button type="button" data-action="up" data-index="${i}" aria-label="Move image up" ${i===0?'disabled':''}>↑</button><button type="button" data-action="down" data-index="${i}" aria-label="Move image down" ${i===images.length-1?'disabled':''}>↓</button><button type="button" class="album-delete-photo" data-action="remove" data-index="${i}" aria-label="Remove image ${i+1}">×</button></div><label class="form-hint" for="album-caption-${i}">CAPTION (OPTIONAL)</label><input id="album-caption-${i}" data-caption="${i}" maxlength="240" placeholder="Optional caption" value="${esc(item.caption||'')}"></article>`;
  }
  function drawItems(){
    const grid=$('album-items');$('album-photo-count').textContent=images.length;
    grid.innerHTML=images.map(itemMarkup).join('')||'<div class="album-editor-empty">No screenshots yet. Upload as many as you like and arrange them here.</div>';
    grid.querySelectorAll('img[data-image]').forEach(async img=>{
      const i=Number(img.dataset.image),path=images[i]?.src;if(!path)return;
      const url=await previewSrc(path);if(img.isConnected&&images[i]?.src===path)img.src=url;
    });
  }
  async function addFiles(files){
    if(busy)return;
    const items=[...files];if(!items.length)return;
    busy=true;message(`Importing ${items.length} screenshot${items.length===1?'':'s'}…`);
    let added=0,failed=[];
    for(const file of items){
      try{const src=await fileMedia.add(file);images.push({src,caption:''});added++;}
      catch(e){failed.push(`${file.name}: ${e.message}`);}
    }
    if(added){if(!coverPath)coverPath=images[0].src;setDirty(true);drawItems();}
    message(`${added} image${added===1?'':'s'} added to this album. Save the album to keep your changes. ${failed.length?`${failed.length} failed: ${failed[0]}`:''}`);
    busy=false;$('album-files').value='';
  }
  function addUrls(){
    const lines=$('album-urls').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const accepted=lines.filter(safeSrc);
    for(const src of accepted)images.push({src,caption:''});
    if(accepted.length){if(!coverPath)coverPath=images[0].src;setDirty(true);drawItems();}
    $('album-urls').value='';
    if(lines.length)message(`${accepted.length} URL/path${accepted.length===1?'':'s'} added${accepted.length!==lines.length?`; ${lines.length-accepted.length} ignored (use HTTPS URLs or assets/ paths)`:''}.`);
  }
  function reorder(from,to){
    if(from===to||from<0||to<0||from>=images.length||to>=images.length)return;
    const [item]=images.splice(from,1);images.splice(to,0,item);setDirty(true);drawItems();
  }
  $('album-list').addEventListener('click',e=>{
    const btn=e.target.closest('[data-album]');if(!btn||btn.dataset.album===selected||!confirmLeave())return;
    selected=btn.dataset.album;render();
  });
  $('album-new').addEventListener('click',()=>{if(!confirmLeave())return;selected=null;render();$('album-title').focus();});
  $('album-files').addEventListener('change',e=>addFiles(e.target.files||[]));
  const zone=document.querySelector('.album-upload-zone');
  ['dragenter','dragover'].forEach(name=>zone.addEventListener(name,e=>{e.preventDefault();zone.classList.add('is-over');}));
  ['dragleave','drop'].forEach(name=>zone.addEventListener(name,e=>{e.preventDefault();zone.classList.remove('is-over');}));
  zone.addEventListener('drop',e=>{if(e.dataTransfer?.files?.length)addFiles(e.dataTransfer.files);});
  $('album-add-urls').addEventListener('click',addUrls);
  ['album-title','album-year','album-description'].forEach(id=>$(id).addEventListener('input',()=>setDirty(true)));
  $('album-clear').addEventListener('click',()=>{
    if(!images.length||!confirm('Remove all screenshots from this album? You can restore the last saved album by reopening it before you save.'))return;
    images=[];coverPath='';setDirty(true);drawItems();
  });
  const itemGrid=$('album-items');
  itemGrid.addEventListener('input',e=>{
    const field=e.target.closest('[data-caption]');if(!field)return;
    const i=Number(field.dataset.caption);if(images[i]){images[i].caption=field.value;setDirty(true);}
  });
  itemGrid.addEventListener('click',async e=>{
    const button=e.target.closest('button[data-action]');
    if(button){const i=Number(button.dataset.index),action=button.dataset.action;
      if(action==='up')reorder(i,i-1);
      if(action==='down')reorder(i,i+1);
      if(action==='cover'){coverPath=images[i].src;setDirty(true);drawItems();}
      if(action==='remove'){const removed=images.splice(i,1)[0];if(removed?.src===coverPath)coverPath=images[0]?.src||'';setDirty(true);drawItems();}
      return;
    }
    const photo=e.target.closest('img[data-image]');if(!photo)return;
    const item=images[Number(photo.dataset.image)];if(!item)return;
    const dialog=$('album-preview');dialog.querySelector('img').src=await previewSrc(item.src);
    dialog.querySelector('p').textContent=item.caption||'';dialog.showModal();
  });
  $('album-preview').querySelector('.album-preview-close').addEventListener('click',()=>$('album-preview').close());
  $('album-preview').addEventListener('click',e=>{if(e.target===$('album-preview'))$('album-preview').close();});
  let dragFrom=-1;
  itemGrid.addEventListener('dragstart',e=>{
    const card=e.target.closest('.album-editor-item');if(!card)return;
    dragFrom=Number(card.dataset.index);e.dataTransfer.effectAllowed='move';
    e.dataTransfer.setData('text/plain',String(dragFrom));card.classList.add('is-dragging');
  });
  itemGrid.addEventListener('dragover',e=>{if(e.target.closest('.album-editor-item'))e.preventDefault();});
  itemGrid.addEventListener('drop',e=>{
    const target=e.target.closest('.album-editor-item');if(!target)return;e.preventDefault();reorder(dragFrom,Number(target.dataset.index));dragFrom=-1;
  });
  itemGrid.addEventListener('dragend',()=>{dragFrom=-1;itemGrid.querySelectorAll('.is-dragging').forEach(n=>n.classList.remove('is-dragging'));});
  $('album-form').addEventListener('submit',e=>{
    e.preventDefault();if(busy){message('Finish importing your images first.');return;}
    const title=$('album-title').value.trim();if(!title){message('Enter a game title.');$('album-title').focus();return;}
    if(!images.length){message('Add at least one screenshot first.');return;}
    const existing=current();let id=existing?.id;
    if(!id){let base=slug(title);id=base;for(let n=2;albums.some(a=>a.id===id);n++)id=`${base}-${n}`;}
    const year=$('album-year').value;
    const a={id,title,year:year?Number(year):null,description:$('album-description').value.trim(),cover:images.some(i=>i.src===coverPath)?coverPath:images[0].src,updatedAt:new Date().toISOString(),images:copy(images)};
    const index=albums.findIndex(a=>a.id===selected);
    if(index<0)albums.unshift(a);else albums[index]=a;
    selected=id;
    const success=persist();setDirty(!success);list();
    message(success?`Saved ${a.images.length} screenshots locally. Download Gallery Update ZIP to publish.`:'Browser storage is full or blocked. Your unsaved album may be lost; reduce its text or use another browser.');
  });
  $('album-delete').addEventListener('click',()=>{
    const a=current();if(!a||!confirm(`Delete the album "${a.title}" from the gallery? You will still need to export and upload galleries.js to publish the removal.`))return;
    albums=albums.filter(item=>item.id!==a.id);selected=albums[0]?.id||null;persist();render();message('Album removed locally. Export to publish this removal.');
  });
  const galleriesContent=()=>`/* Generated by JODECI Gallery Studio. */\nwindow.JODECI_GALLERIES = ${JSON.stringify(albums,null,2)};\n`;
  function download(blob,name){const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  $('album-export').addEventListener('click',async()=>{
    if(dirty){exportMessage('Save your current album first, then export.');return;}
    const btn=$('album-export');btn.disabled=true;exportMessage('Preparing gallery ZIP and media…');
    try{const result=await fileMedia.packageGalleries(albums,galleriesContent());download(result.zip,'jodeci-gallery-update.zip');
      exportMessage(`Downloaded galleries.js and ${result.count} uploaded media file${result.count===1?'':'s'}. Existing assets are never removed.${result.reused?.length?` ${result.reused.length} reused path(s) were not stored in this browser: make sure these files already exist in your GitHub assets folder.`:''}`);
    }catch(e){exportMessage(`Export failed: ${e.message}`);}finally{btn.disabled=false;}
  });
  render();
})();
