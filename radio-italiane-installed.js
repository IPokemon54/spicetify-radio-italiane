(function radioOnSpotifyInstalledApp(){
 if(window.__radioOnSpotifyInstalledApp)return;
 if(!window.Spicetify?.LocalStorage||!Array.isArray(Spicetify.Config?.custom_apps)){setTimeout(radioOnSpotifyInstalledApp,500);return}
 window.__radioOnSpotifyInstalledApp=true;
 const listKey='marketplace:installed-extensions';
 const oldKey='marketplace:installed:local/radio-italiane/radio-italiane-installed.js';
 function withoutMarker(raw){
  try{const keys=JSON.parse(raw||'[]');return JSON.stringify(Array.isArray(keys)?keys.filter(key=>key!==oldKey):[])}
  catch{return '[]'}
 }
 const storage=Spicetify.LocalStorage;
 const get=key=>storage.getItem?storage.getItem(key):storage.get(key);
 const set=(key,value)=>storage.setItem?storage.setItem(key,value):storage.set(key,value);
 set(listKey,withoutMarker(get(listKey)));
 if(window.indexedDB){
  const request=indexedDB.open('spicetify-marketplace');
  request.onupgradeneeded=()=>request.transaction.abort();
  request.onerror=()=>console.warn('Radio on Spotify: Marketplace cleanup unavailable.');
  request.onsuccess=()=>{
   const database=request.result;
   if(!database.objectStoreNames.contains('settings')){database.close();return}
   const transaction=database.transaction('settings','readwrite');
   const settings=transaction.objectStore('settings');
   const saved=settings.get(listKey);
   saved.onsuccess=()=>{
    settings.put({key:listKey,value:withoutMarker(saved.result?.value)});
    settings.delete(oldKey);
   };
   transaction.oncomplete=transaction.onabort=()=>database.close();
  };
 }

 const manifests=new Map();
 const loading=new Set();
 function appDetails(id){
  if(!manifests.has(id)&&!loading.has(id)){
   loading.add(id);
   fetch('/spicetify-routes-'+encodeURIComponent(id)+'.json')
    .then(response=>{if(!response.ok)throw Error('Manifest unavailable');return response.json()})
    .then(manifest=>manifests.set(id,manifest))
    .catch(()=>manifests.set(id,{}))
    .finally(()=>{loading.delete(id);renderKey='';showInstalledApps()});
  }
  return manifests.get(id)||{};
 }
 let renderKey='';
 function showRemoval(id,title){
  document.getElementById('ri-app-removal')?.remove();
  const dialog=document.createElement('dialog');
  dialog.id='ri-app-removal';
  dialog.style.cssText='width:min(620px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;box-sizing:border-box;padding:24px;border:1px solid var(--ri-wmp-border,var(--spice-subtext));border-radius:8px;background:var(--ri-wmp-tile,var(--spice-card));color:var(--ri-wmp-text,var(--spice-text));box-shadow:0 24px 80px #0008';
  const style=document.createElement('style');
  style.textContent='#ri-app-removal::backdrop{background:#0009}#ri-app-removal .ri-removal-steps{list-style:none;counter-reset:removal;margin:24px 0 0;padding:0}#ri-app-removal .ri-removal-steps>li{counter-increment:removal;position:relative;padding:0 0 22px 44px}#ri-app-removal .ri-removal-steps>li:before{content:counter(removal);position:absolute;left:0;top:0;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--ri-wmp-hover-tile,var(--spice-main));font-size:12px;font-weight:700}#ri-app-removal strong{display:block;line-height:28px;font-size:14px}#ri-app-removal p{font-size:13px;line-height:1.5;margin:6px 0}#ri-app-removal button{padding:8px 14px;cursor:pointer;background:var(--ri-wmp-hover-tile,var(--spice-button));color:var(--ri-wmp-text,var(--spice-main));border:1px solid var(--ri-wmp-border,transparent);border-radius:4px}#ri-app-removal button:focus-visible{outline:2px solid currentColor;outline-offset:2px}#ri-app-removal pre{margin:0;font:12px/1.6 Consolas,monospace}';
  const heading=document.createElement('h2');
  heading.textContent='Remove '+title;
  heading.id='ri-app-removal-title';
  dialog.setAttribute('aria-labelledby',heading.id);
  const instructions=document.createElement('p');
  const windows=/Windows/i.test(navigator.userAgent);
  const command=id==='radio-italiane'&&windows
   ?'iwr -useb https://raw.githubusercontent.com/IPokemon54/spicetify-radio-italiane/main/uninstall.ps1 | iex'
   :'spicetify config custom_apps '+(windows?"'"+id.replace(/'/g,"''")+"-'":"'"+id.replace(/'/g,"'\\''")+"-'")+'\nspicetify apply';
  instructions.textContent='Follow these steps to remove '+title+'.';
  const details=document.createElement('p');
  details.textContent=id==='radio-italiane'&&windows
   ?'Removes Radio on Spotify, its local bridge and installed files.'
   :'Removes the app from the Spicetify configuration. App files and any external services may require the developer’s uninstaller.';
  const code=document.createElement('pre');
  code.style.cssText='padding:12px;background:#0002;white-space:pre-wrap;overflow-wrap:anywhere;user-select:text';
  code.textContent=command;
  const status=document.createElement('p');
  status.setAttribute('role','status');
  const actions=document.createElement('div');
  actions.style.cssText='display:flex;justify-content:flex-end;gap:12px';
  const copy=document.createElement('button');
  copy.textContent='Copy command';
  copy.onclick=async()=>{
   try{await navigator.clipboard.writeText(command);status.textContent='Copied to clipboard.'}
   catch{status.textContent='Select the command and copy it manually.'}
  };
  const close=document.createElement('button');
  close.textContent='Close';
  close.onclick=()=>dialog.close();
  dialog.onclose=()=>dialog.remove();
  const steps=document.createElement('ol');
  steps.className='ri-removal-steps';
  function step(title,text){
   const row=document.createElement('li');
   const label=document.createElement('strong');
   label.textContent=title;
   row.append(label);
   if(text){const description=document.createElement('p');description.textContent=text;row.append(description)}
   steps.append(row);
   return row;
  }
  const first=step('Copy the removal command');
  const panel=document.createElement('div');
  panel.style.cssText='margin-top:10px;border:1px solid var(--ri-wmp-border,var(--spice-subtext));border-radius:6px;overflow:hidden';
  const panelHeader=document.createElement('div');
  panelHeader.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;background:var(--ri-wmp-hover-tile,var(--spice-main));font-size:12px';
  const shell=document.createElement('span');
  shell.textContent=windows?'PowerShell':'Bash';
  panelHeader.append(shell,copy);
  panel.append(panelHeader,code);
  first.append(panel,status);
  step(windows?'Open PowerShell':'Open Terminal',windows?'Open Start, search for PowerShell and launch it.':'Open Terminal and use a Bash shell.');
  step('Run the removal command','Paste the command, press Enter and wait for it to finish.');
  step('Reopen Spotify','Close Spotify completely, then open it again.');
  actions.append(close);
  dialog.append(style,heading,instructions,details,steps,actions);
  document.body.append(dialog);
  dialog.showModal();
 }
 function showInstalledApps(){
  const grids=[...document.querySelectorAll('.marketplace-grid[data-tab="Installed"]')];
  const grid=grids.find(element=>!element.closest('#ri-installed-app'));
  const existing=document.getElementById('ri-installed-app');
  if(!grid){existing?.remove();renderKey='';return}
  const query=document.querySelector('.marketplace-header input')?.value?.trim().toLowerCase()||'';
  const ids=[...new Set(Spicetify.Config.custom_apps)].filter(id=>typeof id==='string'&&id!=='marketplace');
  const apps=ids.map(id=>({id,manifest:appDetails(id)})).filter(({id,manifest})=>
   [id,manifest.title,manifest.name,manifest.description].filter(value=>typeof value==='string').join(' ').toLowerCase().includes(query));
  const key=JSON.stringify([query,apps]);
  if(existing&&renderKey===key)return;
  existing?.remove();
  renderKey=key;
  if(!apps.length)return;
  const section=document.createElement('section');
  section.id='ri-installed-app';
  section.className='marketplace-content';
  const italian=(document.documentElement.lang||navigator.language).startsWith('it');
  const heading=document.createElement('h2');
  heading.className='marketplace-card-type-heading';
  heading.textContent=italian?'Applicazioni':'Applications';
  const cards=document.createElement('div');
  cards.className=grid.className;
  for(const {id,manifest} of apps){
   const card=document.createElement('article');
   card.className='marketplace-card';
   const preview=document.createElement('div');
   preview.style.cssText='width:100%;aspect-ratio:1;display:grid;place-items:center;background:var(--spice-main);border-radius:6px;font-size:40px';
   const title=document.createElement('h3');
   title.textContent=manifest.title||manifest.name||id;
   preview.textContent=title.textContent.slice(0,2).toUpperCase();
   const imageURL=id==='radio-italiane'?'https://raw.githubusercontent.com/IPokemon54/spicetify-radio-italiane/main/assets/cover.png':manifest.preview;
   if(typeof imageURL==='string'&&/^https?:\/\//i.test(imageURL)){
    const image=document.createElement('img');
    image.src=imageURL;
    image.alt='';
    image.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:6px';
    image.onerror=()=>preview.replaceChildren(document.createTextNode(title.textContent.slice(0,2).toUpperCase()));
    preview.replaceChildren(image);
   }
   const description=document.createElement('p');
   description.textContent=manifest.description||'';
   const status=document.createElement('p');
   status.textContent=(italian?'✓ Installata':'✓ Installed')+(manifest.version?' · '+manifest.version:'');
   const open=document.createElement('button');
   open.className='marketplace-header-icon-button';
   open.textContent=italian?'Apri app':'Open app';
   open.onclick=()=>Spicetify.Platform.History.push('/'+id);
   const remove=document.createElement('button');
   remove.className='marketplace-header-icon-button';
   remove.textContent=italian?'Rimuovi app':'Remove app';
   remove.setAttribute('aria-haspopup','dialog');
   remove.onclick=()=>showRemoval(id,title.textContent);
   const actions=document.createElement('div');
   actions.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
   actions.append(open,remove);
   card.append(preview,title,description,status,actions);
   cards.append(card);
  }
  section.append(heading,cards);
  grid.closest('.contentSpacing')?.append(section);
 }
 let scheduled=false;
 new MutationObserver(()=>{
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;showInstalledApps()});
 }).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('input',showInstalledApps);
 showInstalledApps();
})();
