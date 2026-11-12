function createRadioCatalog({fetchPage,order,onChange}){
 let code=null,items=new Map(),nextPage=1,hasMore=true,limit=31,query='',error='',busy=false,controller=null,version=0,disposed=false;
 function snapshot(){const all=order([...items.values()],code),search=query.trim().toLocaleLowerCase();return{code,all,rows:search?all.filter(s=>s.name.toLocaleLowerCase().includes(search)):all.slice(0,limit),query,loading:busy,scanning:!!search&&(busy||hasMore)&&!error,error,hasMore:hasMore||all.length>limit,complete:!busy&&!hasMore}}
 function emit(){if(!disposed)onChange(snapshot())}
 function cancel(){version++;controller?.abort();controller=null;busy=false}
 async function pump(force=false){
  if(disposed||busy||!code)return;
  const token=version;busy=true;error='';emit();
  try{
   while(hasMore&&(force||query.trim()||items.size<limit)){
    force=false;controller=new AbortController();const data=await fetchPage(code,nextPage,controller.signal);
    if(disposed||token!==version)return;
    for(const station of data.stations)items.set(station.id,station);
    if(data.error){error=data.error;nextPage=data.retryPage||nextPage;emit();break}
    nextPage++;hasMore=data.hasMore;emit();
   }
  }catch(e){if(token===version&&e.name!=='AbortError')error='Impossibile caricare altre radio. Riprova.'}
  finally{if(token===version&&!disposed){busy=false;controller=null;emit()}}
 }
 return{
  open(value){cancel();disposed=false;code=value;items=new Map();nextPage=1;hasMore=true;limit=31;query='';error='';emit();return pump(true)},
  search(value){const wasSearching=!!query.trim();query=value;if(!query.trim()&&wasSearching){cancel();error='';emit();return}emit();if(query.trim()&&!error)return pump()},
  more(){limit+=31;emit();return pump()},retry(){return pump(true)},
  reorder(){emit()},snapshot,dispose(){cancel();disposed=true}
 };
}
const riReact=Spicetify.React,riEl=riReact.createElement;
function RadioUpdateNotice(){
 const [update,setUpdate]=riReact.useState(null);
 const [copyStatus,setCopyStatus]=riReact.useState('');
 const dialog=riReact.useRef(null);
 riReact.useEffect(()=>{
  let mounted=true,controller=null;
  async function check(){
   controller?.abort();controller=new AbortController();
   try{const response=await fetch(RI_BRIDGE.base+'/updates?key='+encodeURIComponent(RI_BRIDGE.key),{cache:'no-store',signal:controller.signal});if(!response.ok)return;const data=await response.json();if(mounted)setUpdate(data)}catch{}
  }
  check();const timer=setInterval(check,60*60*1000);
  return()=>{mounted=false;clearInterval(timer);controller?.abort()};
 },[]);
 if(!update?.updateAvailable)return null;
 const windows=/Windows/i.test(navigator.userAgent);
 const installer='https://raw.githubusercontent.com/IPokemon54/spicetify-radio-italiane/main/install';
 const command=windows?'iwr -useb '+installer+'.ps1 | iex':'curl -fsSL '+installer+'.sh | bash';
 async function copyCommand(){
  try{await navigator.clipboard.writeText(command);setCopyStatus('Copied to clipboard.')}
  catch{setCopyStatus('Select the command and copy it manually.')}
 }
 return riEl('section',{className:'ri-update-notice'},
  riEl('div',{role:'status'},riEl('strong',null,'Update available: '+update.latestVersion),riEl('p',null,'Installed version: '+update.installedVersion)),
  riEl('button',{type:'button','aria-haspopup':'dialog',onClick:()=>{setCopyStatus('');dialog.current.showModal()}},'Update'),
  riEl('dialog',{className:'ri-update-dialog',ref:dialog,'aria-labelledby':'ri-update-title'},
   riEl('h2',{id:'ri-update-title'},'Update available'),
   riEl('p',null,'Radio on Spotify '+update.latestVersion+' is available. Run this command in '+(windows?'PowerShell':'Bash')+' to update.'),
   riEl('pre',null,riEl('code',null,command)),
   riEl('p',{role:'status'},copyStatus),
   riEl('div',{className:'ri-update-actions'},
    riEl('button',{type:'button',onClick:copyCommand},'Copy command'),
    riEl('button',{type:'button',onClick:()=>dialog.current.close()},'Close'))));
}
function RadioPlaylist(){
 const [countries,setCountries]=riReact.useState([]),[country,setCountry]=riReact.useState(null),[countryQuery,setCountryQuery]=riReact.useState(''),[stations,setStations]=riReact.useState([]),[error,setError]=riReact.useState(''),[query,setQuery]=riReact.useState(''),[ordering,setOrdering]=riReact.useState(false),[dragId,setDragId]=riReact.useState(null);
 const [playerState,setPlayerState]=riReact.useState(()=>window.RadioItalianePlayer?.getState()||{station:null,status:'Scegli una radio',playing:false});
 const [catalogView,setCatalogView]=riReact.useState({rows:[],all:[],loading:false,scanning:false,error:'',hasMore:false,complete:false});
 const favoritesKey='ri-favorite-stations';
 const [favorites,setFavorites]=riReact.useState(()=>{
  try{const saved=JSON.parse(localStorage.getItem(favoritesKey)||'[]');return Array.isArray(saved)?saved.filter(s=>s?.id&&typeof s.name==='string'):[]}catch{return []}
 });
 const showingFavorites=country?.code==='worldwide';
 const catalogRef=riReact.useRef(null);
 const current=playerState.station,status=playerState.status,playing=playerState.playing,api=path=>RI_BRIDGE.base+path+(path.includes('?')?'&':'?')+'key='+encodeURIComponent(RI_BRIDGE.key),orderKey=code=>'ri-station-order:'+code,hasLogo=station=>Boolean(station.logo&&!/placeholder/i.test(station.logo));
 function applyOrder(list,code){const base=list.map((station,index)=>({station,index})).sort((a,b)=>Number(hasLogo(b.station))-Number(hasLogo(a.station))||a.index-b.index).map(item=>item.station);try{const saved=JSON.parse(localStorage.getItem(orderKey(code))||'[]');if(Array.isArray(saved)&&saved.length){const byId=new Map(base.map(station=>[station.id,station]));return[...[...new Set(saved)].map(id=>byId.get(id)).filter(Boolean),...base.filter(station=>!saved.includes(station.id))]}}catch{}return base}
 function publish(next){setStations(next);window.RI_STATIONS=next;window.dispatchEvent(new CustomEvent('ri-stations-changed'))}
 if(!catalogRef.current)catalogRef.current=createRadioCatalog({
  fetchPage:async(code,number,signal)=>{const response=await fetch(api('/catalog/'+code+'?page='+number),{cache:'no-store',signal});if(!response.ok)throw Error('Catalogo HTTP '+response.status);return response.json()},
  order:applyOrder,onChange:view=>{setCatalogView(view);publish(view.all)}
 });
 riReact.useEffect(()=>()=>catalogRef.current.dispose(),[]);
 riReact.useEffect(()=>{const controller=new AbortController();fetch(api('/countries'),{signal:controller.signal}).then(r=>r.json()).then(setCountries).catch(e=>{if(e.name!=='AbortError')setError('Impossibile caricare le nazioni')});const unsubscribe=window.RadioItalianePlayer?.subscribe(setPlayerState);return()=>{controller.abort();unsubscribe?.()}},[]);
 riReact.useEffect(()=>{const sync=entry=>{const location=entry?.location||entry||Spicetify.Platform.History.location,params=new URLSearchParams(location?.search||''),code=params.get('country');if(!code){catalogRef.current.dispose();setCountry(null);publish([]);setOrdering(false);return}const selected=code==='worldwide'?{code,name:'Radio preferite'}:countries.find(c=>c.code===code);if(selected)loadCountry(selected)};sync(Spicetify.Platform.History.location);return Spicetify.Platform.History.listen(sync)},[countries]);
 riReact.useEffect(()=>{if(showingFavorites)publish(favorites)},[showingFavorites,favorites]);
 function loadCountry(selected){
  setCountry(selected);setQuery('');setOrdering(false);
  if(selected.code==='worldwide'){catalogRef.current.dispose();return}
  return catalogRef.current.open(selected.code)
 }
 function favoriteButton(station){
  const saved=favorites.some(item=>item.id===station.id);
  const label=(saved?'Rimuovi dai preferiti: ':'Aggiungi ai preferiti: ')+station.name;
  function toggle(){
   const next=saved?favorites.filter(item=>item.id!==station.id):[...favorites,station];
   localStorage.setItem(favoritesKey,JSON.stringify(next));
   setFavorites(next);
  }
  const icon=Spicetify.SVGIcons?.[saved?'heart-active':'heart'];
  return riEl('button',{type:'button',className:'ri-card-favorite','aria-label':label,title:label,'aria-pressed':saved,onClick:toggle},
   icon?riEl('svg',{viewBox:'0 0 16 16','aria-hidden':true,dangerouslySetInnerHTML:{__html:icon}}):riEl('span',{'aria-hidden':true},saved?'♥':'♡'));
 }
 function chooseCountry(selected){Spicetify.Platform.History.push('/radio-italiane?country='+encodeURIComponent(selected.code))}
 function moveStation(fromId,toId){if(!fromId||fromId===toId)return;const next=[...stations],from=next.findIndex(s=>s.id===fromId),to=next.findIndex(s=>s.id===toId);if(from<0||to<0)return;const[moved]=next.splice(from,1);next.splice(to,0,moved);const ids=next.map(s=>s.id);let previous=[];try{const value=JSON.parse(localStorage.getItem(orderKey(country.code))||'[]');if(Array.isArray(value))previous=value}catch{}localStorage.setItem(orderKey(country.code),JSON.stringify([...ids,...previous.filter(id=>!ids.includes(id))]));catalogRef.current.reorder();setDragId(null)}
 function resetOrder(){localStorage.removeItem(orderKey(country.code));setOrdering(false);setDragId(null);catalogRef.current.reorder()}
 function play(station){if(playing&&current?.id===station?.id){stop();return}window.RadioItalianePlayer?.play(station)}function stop(){window.RadioItalianePlayer?.stop()}function playIcon(on){return riEl('span',{className:'ri-control-icon '+(on?'ri-pause-icon':'ri-play-icon'),'aria-hidden':'true'})}function logo(s){return api('/logo/'+encodeURIComponent(s.id))+'&v=8'}
 const view=showingFavorites?{rows:favorites.filter(s=>s.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),complete:true}:catalogView;
 const rows=view.rows,visibleCountries=[{code:'worldwide',name:'Radio preferite'},...countries.filter(c=>c.code!=='worldwide')].filter(c=>c.name.toLocaleLowerCase().includes(countryQuery.trim().toLocaleLowerCase()));
 if(!country)return riEl('main',{className:'ri-app ri-world'},riEl(RadioUpdateNotice),riEl('header',{className:'ri-hero'},riEl('img',{className:'ri-cover',src:window.RI_COVER,alt:'Radio dal mondo'}),riEl('div',null,riEl('p',{className:'ri-eyebrow'},'RADIO DAL MONDO'),riEl('h1',null,'Che radio vuoi sentire?'),riEl('p',null,'Scegli una nazione per caricare le sue stazioni radio.'))),riEl('div',{className:'ri-country-search'},riEl('input',{type:'search',placeholder:'Cerca una nazione…','aria-label':'Cerca una nazione',value:countryQuery,onChange:e=>setCountryQuery(e.target.value),autoFocus:true}),riEl('span',null,visibleCountries.filter(c=>c.code!=='worldwide').length+' nazioni')),error&&riEl('p',{className:'ri-error'},error),riEl('section',{className:'ri-country-grid','aria-label':'Scegli la nazione'},...visibleCountries.map(c=>riEl('button',{key:c.code,className:'ri-country',onClick:()=>chooseCountry(c)},c.code==='worldwide'?riEl('span',{className:'ri-favorites-symbol','aria-hidden':true},'♥'):c.code==='arab'?riEl('span',{className:'ri-favorites-symbol','aria-hidden':true},c.flag):riEl('img',{className:'ri-flag',src:api('/flag/'+c.code),alt:'Bandiera '+c.name}),riEl('strong',null,c.name)))),!visibleCountries.length&&riEl('p',{className:'ri-empty'},'Nessuna nazione trovata.'));
 return riEl('main',{className:'ri-app'+(ordering?' ri-ordering':'')},riEl(RadioUpdateNotice),riEl('header',{className:'ri-hero'},riEl('img',{className:'ri-cover',src:window.RI_COVER,alt:'Radio dal mondo'}),riEl('div',null,riEl('p',{className:'ri-eyebrow'},showingFavorites?'RADIO DAL MONDO':country.flag+' RADIO DAL MONDO'),riEl('h1',null,showingFavorites?'Radio preferite':'Radio '+country.name),riEl('p',null,showingFavorites?'Le stazioni che hai salvato.':'Le stazioni in diretta del paese selezionato.'),riEl('button',{className:'ri-change-country',onClick:()=>Spicetify.Platform.History.goBack()},'← Cambia nazione'))),riEl('div',{className:'ri-tools'},!showingFavorites&&riEl('div',{className:'ri-order-tools'},riEl('button',{className:'ri-order-toggle','aria-pressed':ordering,onClick:()=>setOrdering(!ordering)},ordering?'Fine':'Riordina radio'),riEl('button',{className:'ri-order-reset',onClick:resetOrder},'Ripristina ordine')),riEl('span',null,showingFavorites?favorites.length+' stazioni salvate':stations.length+' stazioni caricate'),riEl('input',{type:'search',placeholder:'Cerca radio…','aria-label':'Cerca radio',value:query,onChange:e=>{setQuery(e.target.value);if(!showingFavorites)catalogRef.current.search(e.target.value)}})),riEl('div',{className:'ri-player','aria-live':'polite'},riEl('button',{disabled:!current,'aria-label':playing?'Metti in pausa la radio':'Riproduci radio',onClick:()=>playing?stop():current&&play(current)},playIcon(playing)),riEl('div',null,riEl('strong',null,current?current.name:'Pronto ad ascoltare?'),riEl('p',null,status))),error&&riEl('p',{className:'ri-error'},error),riEl('section',{className:'ri-station-grid','aria-label':'Stazioni radio'},...rows.map(s=>riEl('article',{key:s.id,className:'ri-station-card '+(current?.id===s.id?'ri-active ':'')+(dragId===s.id?'ri-dragging':''),draggable:ordering,onDragStart:()=>setDragId(s.id),onDragEnd:()=>setDragId(null),onDragOver:e=>ordering&&e.preventDefault(),onDrop:e=>{e.preventDefault();moveStation(dragId,s.id)}},ordering&&riEl('span',{className:'ri-drag-handle','aria-hidden':'true'},'⋮⋮'),riEl('div',{className:'ri-station-cover'},riEl('button',{className:'ri-logo-button','aria-label':ordering?'Sposta '+s.name:'Ascolta '+s.name,onClick:()=>!ordering&&play(s)},riEl('img',{src:logo(s),alt:'Logo '+s.name,loading:'lazy',onError:e=>{e.currentTarget.onerror=null;e.currentTarget.src=window.RI_COVER}}),riEl('span',{className:'ri-card-play'},playIcon(current?.id===s.id&&playing))),!ordering&&favoriteButton(s)),riEl('div',{className:'ri-card-copy'},riEl('strong',null,s.name),riEl('small',null,current?.id===s.id?status:'Radio · In diretta'))))),!rows.length&&!view.loading&&(!query.trim()||view.complete)&&!view.error&&riEl('p',{className:'ri-empty'},showingFavorites&&!query?'Usa il cuore sulle copertine per salvare le radio qui.':'Nessuna radio trovata.'),!query.trim()&&view.hasMore&&riEl('button',{className:'ri-load-more',disabled:view.loading,onClick:()=>catalogRef.current.more()},view.loading?'Caricamento…':'Carica altre radio'),view.scanning&&riEl('p',{className:'ri-loading',role:'status'},'Ricerca nelle altre pagine…'),view.loading&&!view.scanning&&riEl('p',{className:'ri-loading'},'Caricamento delle radio…'),view.error&&riEl('p',{className:'ri-error'},view.error,riEl('button',{onClick:()=>catalogRef.current.retry(),disabled:view.loading},'Riprova')));
}
function render(){return riEl(RadioPlaylist)}
