/* Local media library for Review Studio. Media is kept as files in IndexedDB,
   never as base64 inside the review database. A portable ZIP bundles files for GitHub. */
(() => {
  'use strict';
  const DB='jodeci-review-media-v1';
  const STORE='files';
  let dbPromise=null;
  function database(){
    if(!('indexedDB' in window))return Promise.reject(new Error('This browser does not support local media storage. Use an image URL instead.'));
    if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB,1);
      request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'path'});};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(new Error('Could not open browser media storage. Check browser permissions or private browsing settings.'));
    }).catch(e=>{dbPromise=null;throw e;});
    return dbPromise;
  }
  async function transaction(mode,callback){
    const db=await database();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,mode),request=callback(tx.objectStore(STORE));
      tx.oncomplete=()=>resolve(request.result);
      tx.onerror=()=>reject(new Error('Could not save or read media from this browser. Check available storage space.'));
      tx.onabort=()=>reject(new Error('Media storage was interrupted.'));
    });
  }
  const get=path=>transaction('readonly',store=>store.get(path));
  const allowedTypes={'image/png':'png','image/jpeg':'jpg','image/gif':'gif','image/webp':'webp','image/avif':'avif'};
  async function add(file){
    if(!file || !Object.hasOwn(allowedTypes,file.type))throw new Error('Use a PNG, JPEG, WebP, AVIF, or GIF image.');
    const root=(file.name||'image').replace(/\.[^.]+$/,'').normalize('NFKD').replace(/[^a-z0-9-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,48).toLowerCase()||'image';
    const rand=Math.random().toString(36).slice(2,9);
    const path=`assets/uploads/${Date.now().toString(36)}-${rand}-${root}.${allowedTypes[file.type]}`;
    await transaction('readwrite',store=>store.put({path,blob:file,name:file.name,createdAt:Date.now()}));
    return path;
  }
  function referencedPaths(reviews){
    const paths=new Set();
    for(const review of reviews){
      for(const field of ['image','lead','showcase','positives','negatives','moments','overall']){
        const content=String(review[field]||'');
        for(const match of content.matchAll(/assets\/uploads\/[a-z0-9_./ -]+\.(?:png|jpe?g|gif|webp|avif)/gi)){
          if(!match[0].includes('..'))paths.add(match[0]);
        }
      }
    }
    return [...paths].sort();
  }
  const encoder=new TextEncoder();
  const write16=(dv,offset,value)=>dv.setUint16(offset,value,true);
  const write32=(dv,offset,value)=>dv.setUint32(offset,value>>>0,true);
  const table=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?(0xedb88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})();
  function crc32(bytes){let crc=0xffffffff;for(let i=0;i<bytes.length;i++)crc=table[(crc^bytes[i])&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
  // Valid ZIP 2.0, 'stored' (no double-compressing images/GIFs). No network dependencies.
  async function makeZip(entries){
    const parts=[],central=[];let offset=0;
    for(const [name,blob] of entries){
      if(blob.size>0xffffffff)throw new Error(`File is too large for ZIP format: ${name}`);
      const data=new Uint8Array(await blob.arrayBuffer());
      const filename=encoder.encode(name),crc=crc32(data),size=data.byteLength;
      const local=new Uint8Array(30+filename.length),l=new DataView(local.buffer);
      write32(l,0,0x04034b50);write16(l,4,20);write16(l,6,0x0800);write16(l,8,0);write32(l,14,crc);write32(l,18,size);write32(l,22,size);write16(l,26,filename.length);local.set(filename,30);
      parts.push(local,blob);
      const dir=new Uint8Array(46+filename.length),d=new DataView(dir.buffer);
      write32(d,0,0x02014b50);write16(d,4,20);write16(d,6,20);write16(d,8,0x0800);write16(d,10,0);write32(d,16,crc);write32(d,20,size);write32(d,24,size);write16(d,28,filename.length);write32(d,42,offset);dir.set(filename,46);
      central.push(dir);offset+=local.length+size;
    }
    if(entries.length>65535)throw new Error('Too many files in one ZIP.');
    const directorySize=central.reduce((sum,a)=>sum+a.length,0);
    const footer=new Uint8Array(22),f=new DataView(footer.buffer);
    write32(f,0,0x06054b50);write16(f,8,entries.length);write16(f,10,entries.length);write32(f,12,directorySize);write32(f,16,offset);
    return new Blob([...parts,...central,footer],{type:'application/zip'});
  }
  async function packageReviews(reviews,content,extra=[]){
    const paths=referencedPaths(reviews),entries=[['reviews.js',new Blob([content],{type:'text/javascript'})]];
    const missing=[];
    for(const path of paths){
      const record=await get(path);
      if(!record?.blob)missing.push(path);else entries.push([path,record.blob]);
    }
    if(missing.length)throw new Error(`Missing ${missing.length} uploaded file(s) in this browser. Open Studio in the browser where you uploaded them, or reinsert the images. First missing file: ${missing[0]}`);
    return {zip:await makeZip([...entries,...extra]),count:paths.length};
  }
  // Gallery albums have their own content file, but use the same IndexedDB media library.
  // A path already uploaded to GitHub can be reused without duplicating that file.
  async function packageGalleries(albums,content){
    const paths=new Set();
    for(const album of albums){
      for(const image of album.images||[]){
        const path=String(image.src||'');
        if(/^assets\/uploads\/[a-z0-9_./ -]+\.(?:png|jpe?g|gif|webp|avif)$/i.test(path) && !path.includes('..'))paths.add(path);
      }
    }
    const entries=[['galleries.js',new Blob([content],{type:'text/javascript;charset=utf-8'})]];
    const reused=[];
    for(const path of paths){
      const record=await get(path);
      if(record?.blob)entries.push([path,record.blob]);
      else reused.push(path); // existing GitHub asset may be referenced by its path
    }
    return {zip:await makeZip(entries),count:entries.length-1,reused};
  }
  window.JODECI_MEDIA={add,get,referencedPaths,packageReviews,packageGalleries};
})();
