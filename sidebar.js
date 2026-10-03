(function radioItalianeExtension(){
 if(!window.Spicetify?.Platform?.History||!globalThis.RI_BRIDGE?.base||!globalThis.RI_BRIDGE?.key){setTimeout(radioItalianeExtension,500);return}
 const BRIDGE=globalThis.RI_BRIDGE;
 const style=document.createElement('style');
 style.textContent=`#ri-library-entry{display:flex;align-items:center;gap:12px;width:calc(100% - 16px);max-height:64px;min-height:64px;overflow:hidden;flex:0 0 64px;margin:4px 8px;padding:8px;border:0;border-radius:5px;background:transparent;color:var(--spice-text,#fff);text-align:left;cursor:pointer}#ri-library-entry:hover{background:#ffffff12}#ri-library-entry .ri-mini-cover{display:block;object-fit:cover;width:48px;height:48px;flex-shrink:0;border-radius:4px}#ri-library-entry small{display:block;color:#aaa;margin-top:4px;font-size:12px}#ri-library-entry>span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}[data-ri-native-nav="true"]{display:none!important}body.ri-radio-live [data-testid="playback-progressbar"],body.ri-radio-live .playback-progressbar,body.ri-radio-live [aria-label="Modifica stato"]{pointer-events:none!important;cursor:default!important;opacity:.55}[data-ri-radio-volume-host="true"]{position:relative!important}#ri-radio-volume{display:block;position:absolute!important;z-index:3;margin:0!important;padding:0!important;cursor:pointer;pointer-events:auto!important;appearance:none;-webkit-appearance:none;background:transparent!important}[data-ri-volume-native="true"]{opacity:0!important;pointer-events:none!important}#ri-radio-volume::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:linear-gradient(90deg,var(--spice-button,#1ed760) 0 var(--ri-volume,100%),var(--spice-subtext,#777) var(--ri-volume,100%) 100%)}#ri-radio-volume::-webkit-slider-thumb{width:12px;height:12px;margin-top:-4px;border:0;border-radius:50%;appearance:none;-webkit-appearance:none;background:var(--spice-text,#fff);box-shadow:0 1px 4px #0008}[data-ri-radio-volume="true"],[data-ri-radio-volume="true"] .volume-bar__slider-container,[data-ri-radio-volume="true"] [role="slider"],[data-ri-radio-volume="true"] input[type="range"],[data-ri-radio-volume="true"] [data-testid="progress-bar"],[data-ri-radio-volume="true"] .progress-bar,[data-ri-radio-volume="true"] .x-progressBar-progressBar{pointer-events:auto!important}[data-ri-radio-volume="true"] .volume-bar__slider-container{opacity:1!important}#ri-now-playing{display:none;position:fixed;left:0;bottom:0;z-index:2147483646;align-items:center;gap:12px;width:330px;height:72px;padding:8px 14px 8px 8px;box-sizing:border-box;background:var(--spice-player,#181818);color:var(--spice-text,#fff);box-shadow:12px 0 18px var(--spice-player,#181818)}body.ri-radio-live #ri-now-playing{display:flex}#ri-now-playing img{width:56px;height:56px;flex:none;object-fit:contain;border-radius:4px;background:#fff}#ri-now-playing .ri-now-copy{min-width:0;flex:1;cursor:pointer}#ri-now-playing strong,#ri-now-playing small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#ri-now-playing strong{font-size:14px}#ri-now-playing small{margin-top:5px;color:var(--spice-subtext,#b3b3b3);font-size:11px}#ri-now-playing .ri-live-dot{display:inline-block;width:7px;height:7px;margin-right:5px;border-radius:50%;background:#1ed760;box-shadow:0 0 8px #1ed760}body.ri-radio-live button[data-ri-radio-play="true"] svg{visibility:hidden}body.ri-radio-live button[data-ri-radio-play="true"]:after{content:'Ⅱ';position:absolute;font-size:18px;font-weight:800}`;
 style.textContent+=`body.ri-radio-live button[data-ri-radio-play="true"]{position:relative}body.ri-radio-live button[data-ri-radio-play="true"]:after{content:'';inset:auto;left:calc(50% - 5px);top:50%;display:block;width:4px;height:16px;border-radius:1px;background:currentColor;box-shadow:7px 0 0 currentColor;transform:translateY(-50%);font-size:0}`;
 style.textContent+=`#ri-now-playing{display:none!important}`;
 style.textContent+=`.main-trackInfo-container[data-ri-radio-info]{position:relative;min-width:0}.main-trackInfo-container[data-ri-radio-info]>*{visibility:hidden!important}.main-trackInfo-container[data-ri-radio-info]:before,.main-trackInfo-container[data-ri-radio-info]:after{position:absolute;left:0;right:0;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;visibility:visible}.main-trackInfo-container[data-ri-radio-info]:before{content:attr(data-ri-radio-title);top:4px;color:var(--spice-text,#fff);font-size:14px;font-weight:500}.main-trackInfo-container[data-ri-radio-info]:after{content:attr(data-ri-radio-status);top:27px;color:var(--spice-subtext,#b3b3b3);font-size:11px}`;
 style.textContent+=`[data-ri-native-radio="true"] button[aria-label*="playlist" i],[data-ri-native-radio="true"] button[aria-label*="libreria" i],[data-ri-native-radio="true"] button[aria-label*="library" i]{display:none!important}`;
 style.textContent+=`#ri-library-entry .ri-mini-cover-wrap{display:block;width:48px;height:48px;flex:0 0 48px;overflow:hidden;border-radius:4px;background:#29324f;transform:translateX(-4px)}#ri-library-entry .ri-mini-cover-wrap .ri-mini-cover{width:100%;height:100%;margin:0;transform:none;pointer-events:none}`;
 style.textContent+=`#Desktop_PanelContainer_Id[data-ri-radio-side="true"]>*:not(#ri-radio-side-panel){display:none!important}#ri-radio-side-panel{box-sizing:border-box;height:100%;overflow:auto;padding:16px;color:var(--spice-text,#fff);background:var(--spice-main,#121212)}#ri-radio-side-panel h2{margin:4px 0 18px;font-size:16px}#ri-radio-side-panel .ri-side-cover{display:block;width:100%;aspect-ratio:1;object-fit:contain;border-radius:8px;background:#fff}#ri-radio-side-panel h3{margin:18px 0 5px;font-size:24px;line-height:1.15}#ri-radio-side-panel p{margin:0;color:var(--spice-subtext,#b3b3b3);font-size:14px}#ri-radio-side-panel .ri-side-live{display:inline-block;width:8px;height:8px;margin-right:7px;border-radius:50%;background:#1ed760;box-shadow:0 0 8px #1ed760}#ri-radio-side-panel .ri-side-card{margin-top:22px;padding:16px;border-radius:8px;background:var(--spice-card,#242424)}#ri-radio-side-panel .ri-side-card h4{margin:0 0 9px;font-size:16px}#ri-radio-side-panel .ri-side-card p{font-size:13px;line-height:1.45}#ri-radio-side-panel .ri-side-description{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:4}#ri-radio-side-panel .ri-side-next,#ri-radio-side-panel .ri-side-track{display:flex;align-items:center;gap:12px;width:100%;margin-top:10px;padding:8px;border:0;border-radius:6px;background:transparent;color:inherit;text-align:left;cursor:pointer}#ri-radio-side-panel .ri-side-next:hover,#ri-radio-side-panel .ri-side-track:hover{background:#ffffff12}#ri-radio-side-panel .ri-side-next img,#ri-radio-side-panel .ri-side-track-art{width:48px;height:48px;flex:none;object-fit:cover;border-radius:4px;background:#181818}#ri-radio-side-panel .ri-side-next span,#ri-radio-side-panel .ri-side-track span:last-child{min-width:0}#ri-radio-side-panel .ri-side-next strong,#ri-radio-side-panel .ri-side-next small,#ri-radio-side-panel .ri-side-track strong,#ri-radio-side-panel .ri-side-track small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#ri-radio-side-panel .ri-side-next small,#ri-radio-side-panel .ri-side-track small{margin-top:4px;color:var(--spice-subtext,#b3b3b3)}#ri-radio-side-panel .ri-side-track-card[hidden]{display:none}`;
 document.head.append(style);

 if(!window.RadioItalianePlayer){
  const audio=document.getElementById('ri-radio-audio')||new Audio();audio.id='ri-radio-audio';audio.preload='none';audio.style.display='none';audio.setAttribute('aria-hidden','true');if(!audio.isConnected)document.body.append(audio);let state={station:null,status:'Scegli una radio',playing:false};let request=0,timer=null,reconnectTimer=null,reconnectAttempts=0,resumeWanted=false,ignoreSpotifyPause=false,fadingRadio=false,radioFadeTask=null,currentRadioTrack=null,metadataStationId=null,lastMetadataFetch=0;const listeners=new Set();
  function emit(){document.body.classList.toggle('ri-radio-live',state.playing||state.status==='Connessione…');updateNowPlaying();syncNativeControls();protectLiveControls();for(const listener of listeners)listener({...state});window.dispatchEvent(new CustomEvent('ri:state',{detail:{...state}}))}
  function set(next){state={...state,...next};emit()}
  let commandedVolume=null,lastAudibleVolume=.8,radioVolumeSlider=null,radioMuted=false,radioVolumePointer=null,radioVolumeHoldUntil=0,activeVolumeTheme=null,mirroringNativeVolume=false;
  const volumeSnapshots=new Map();
  function normalizationEnabled(){return localStorage.getItem('ri-normalize-volume')!=='false'}
  function syncSpotifyNormalizationSetting(){
   for(const element of document.querySelectorAll('label,[role="switch"],input[type="checkbox"]')){
    const scope=element.closest('label')||element.parentElement;if(!/normalizza(?:re)?(?: il)? volume|normalize volume/i.test(scope?.textContent||''))continue;
    const control=element.matches('input,[role="switch"]')?element:scope.querySelector('input[type="checkbox"],[role="switch"]');if(!control)continue;
    const value=control.checked??(control.getAttribute('aria-checked')==='true');localStorage.setItem('ri-normalize-volume',String(Boolean(value)));return Boolean(value)
   }
   return normalizationEnabled()
  }
  function visible(element){const rect=element?.getBoundingClientRect();return Boolean(rect&&rect.width>0&&rect.height>0&&getComputedStyle(element).display!=='none')}
  function wmpotifyActive(){const root=document.documentElement,computed=getComputedStyle(root);return [...root.attributes].some(attribute=>attribute.name.startsWith('data-wmpotify'))||Boolean(computed.getPropertyValue('--wmp11-window').trim())}
  function volumeBar(){const bars=[...document.querySelectorAll('[data-testid="volume-bar"],.volume-bar')];return bars.find(visible)||bars[0]||null}
  function volumeControl(bar=volumeBar()){
   if(!bar)return null;const controls=bar.querySelectorAll('input[type="range"],[role="slider"],.volume-bar__slider');
   return [...controls].find(control=>control.id!=='ri-radio-volume'&&visible(control))||[...controls].find(control=>control.id!=='ri-radio-volume')||null;
  }
  function volumeTrack(bar=volumeBar()){
   if(!bar)return null;const candidates=bar.querySelectorAll('[data-testid="progress-bar"],.x-progressBar-progressBar,.progress-bar,input[type="range"],[role="slider"],.volume-bar__slider-container');
   return [...candidates].find(element=>element.id!=='ri-radio-volume'&&visible(element))||null;
  }
  function controlValue(control){
   if(!control)return null;
   const raw=Number(control.value??control.getAttribute('aria-valuenow'));
   if(!Number.isFinite(raw))return null;
   const maximum=Number(control.max??control.getAttribute('aria-valuemax'));
   return Math.max(0,Math.min(1,Number.isFinite(maximum)&&maximum>1?raw/maximum:raw));
  }
  function initialRadioVolume(){
   const stored=Number(localStorage.getItem('ri-radio-volume'));if(Number.isFinite(stored)&&stored>=0&&stored<=1)return stored;
   const native=controlValue(volumeControl());if(native!==null)return native;
   try{const api=Spicetify.Player.getVolume();if(Number.isFinite(api))return Math.max(0,Math.min(1,api))}catch{}
   return .8
  }
  function paintRadioVolume(){
   const shown=radioMuted?0:(commandedVolume??audio.volume);
   if(radioVolumeSlider){radioVolumeSlider.value=String(shown);radioVolumeSlider.style.setProperty('--ri-volume',`${shown*100}%`)}
   if(activeVolumeTheme==='base')return;
   const bar=volumeBar();if(!bar||!bar.dataset.riRadioVolume)return;
   for(const progress of bar.querySelectorAll('[data-testid="progress-bar"],.x-progressBar-progressBar,.progress-bar')){
    if(!volumeSnapshots.has(progress))volumeSnapshots.set(progress,{progress:progress.style.getPropertyValue('--progress-bar-transform'),priority:progress.style.getPropertyPriority('--progress-bar-transform')});
    progress.style.setProperty('--progress-bar-transform',activeVolumeTheme==='wmpotify'?`${shown*100}%`:`calc(-100% + ${shown*100}%)`,'important')
   }
   const control=volumeControl(bar);if(control){rememberAttributes(control);control.setAttribute('aria-valuenow',String(shown));if('value'in control)control.value=String(shown)}
  }
  function syncVolume(){
   if(fadingRadio||Date.now()<radioVolumeHoldUntil)return;
   const initialized=commandedVolume===null;if(initialized){commandedVolume=initialRadioVolume();if(commandedVolume>0)lastAudibleVolume=commandedVolume}
   audio.volume=commandedVolume;audio.muted=radioMuted||commandedVolume<=.001;paintRadioVolume()
   if(initialized)mirrorNativeVolume(commandedVolume)
  }
  function mirrorNativeVolume(value){if(activeVolumeTheme!=='base'||mirroringNativeVolume)return;mirroringNativeVolume=true;try{Spicetify.Player.setVolume(value)}catch{}finally{mirroringNativeVolume=false}}
  function applyVolumeCommand(value){
   const numeric=Number(typeof value==='object'?(value?.volume??value?.value):value);
   if(!Number.isFinite(numeric))return;
   commandedVolume=Math.max(0,Math.min(1,numeric>1?numeric/100:numeric));
   if(commandedVolume>0){lastAudibleVolume=commandedVolume;radioMuted=false}else radioMuted=true;
   audio.volume=commandedVolume;audio.muted=radioMuted;localStorage.setItem('ri-radio-volume',String(commandedVolume));
   mirrorNativeVolume(commandedVolume);
   if(!radioMuted&&commandedVolume>.001)try{Spicetify.Player.setMute?.(false)}catch{}
   paintRadioVolume()
  }
  function rememberAttributes(element){if(!volumeSnapshots.has(element))volumeSnapshots.set(element,{disabled:element.getAttribute('disabled'),'aria-disabled':element.getAttribute('aria-disabled'),inert:element.getAttribute('inert'),'aria-valuenow':element.getAttribute('aria-valuenow'),value:'value'in element?element.value:undefined})}
  function restoreRadioVolumeControls(){
   radioVolumePointer=null;radioVolumeSlider?.remove();radioVolumeSlider=null;
   for(const [element,snapshot]of volumeSnapshots){
    if('progress'in snapshot){snapshot.progress?element.style.setProperty('--progress-bar-transform',snapshot.progress,snapshot.priority):element.style.removeProperty('--progress-bar-transform');continue}
    for(const name of ['disabled','aria-disabled','inert','aria-valuenow']){const value=snapshot[name];if(value===null)element.removeAttribute(name);else element.setAttribute(name,value)}if(snapshot.value!==undefined&&'value'in element)element.value=snapshot.value
   }
   volumeSnapshots.clear();for(const element of document.querySelectorAll('[data-ri-radio-volume],[data-ri-radio-volume-host],[data-ri-volume-native]')){delete element.dataset.riRadioVolume;delete element.dataset.riRadioVolumeHost;delete element.dataset.riVolumeNative}
  }
  function installWmpotifyVolume(bar){
   bar.dataset.riRadioVolume='true';for(const element of bar.querySelectorAll('[disabled],[aria-disabled],[inert]')){rememberAttributes(element);element.removeAttribute('disabled');element.removeAttribute('aria-disabled');element.removeAttribute('inert')}
  }
  function ensureRadioVolumeSlider(){
   const theme=wmpotifyActive()?'wmpotify':'base';if(theme!==activeVolumeTheme){restoreRadioVolumeControls();activeVolumeTheme=theme}
   if(!radioMode()){restoreRadioVolumeControls();return}
   const bar=volumeBar();if(!bar)return;installWmpotifyVolume(bar);syncVolume()
  }
  function pointerValue(event,track){const rect=track.getBoundingClientRect();if(rect.width<=0)return null;return Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width))}
  function directRadioVolume(event,track){const value=pointerValue(event,track);if(value===null)return;radioVolumeHoldUntil=Date.now()+700;event.preventDefault();event.stopImmediatePropagation();applyVolumeCommand(value)}
  function toggleRadioMute(){
   if(audio.muted||radioMuted||commandedVolume<=.001){radioMuted=false;if(commandedVolume<=.001)commandedVolume=lastAudibleVolume||.8;audio.volume=commandedVolume;audio.muted=false}
   else{if(commandedVolume>0)lastAudibleVolume=commandedVolume;radioMuted=true;audio.muted=true}
   try{Spicetify.Player.setMute?.(radioMuted)}catch{}
   paintRadioVolume()
  }
  function isVolumeMuteButton(button){
   const bar=volumeBar();if(!button||!bar)return false;if(button.matches('[data-testid="volume-bar-toggle-mute-button"],.volume-bar__icon-button')||button.closest('[data-testid="volume-bar"],.volume-bar'))return true;
   const control=volumeControl(bar),buttonRect=button.getBoundingClientRect(),controlRect=control?.getBoundingClientRect();if(!controlRect)return false;
   const vertical=buttonRect.bottom>=controlRect.top&&buttonRect.top<=controlRect.bottom;return vertical&&buttonRect.right<=controlRect.left+6&&controlRect.left-buttonRect.right<48
  }
  function isVolumeMuteClick(event){
   if(isVolumeMuteButton(event.target.closest?.('button')))return true;const control=volumeControl(),rect=control?.getBoundingClientRect();
   return Boolean(rect&&event.clientX>=rect.left-48&&event.clientX<rect.left&&event.clientY>=rect.top-16&&event.clientY<=rect.bottom+16)
  }
  let nativeNowPlayingSnapshot=null;
  function nativeNowPlaying(){
   const root=document.querySelector('[data-testid="now-playing-widget"],.main-nowPlayingWidget-nowPlaying');if(!root)return null;
   const links=[...root.querySelectorAll('a')];
   return {root,image:root.querySelector('img'),info:root.querySelector('.main-trackInfo-container'),title:root.querySelector('[data-testid="context-item-link"],.main-trackInfo-name a')||links[0],artist:root.querySelector('[data-testid="context-item-info-artist"],.main-trackInfo-artists a')||links[1]};
  }
  function ensureNowPlaying(){document.getElementById('ri-now-playing')?.remove();return nativeNowPlaying()}
  async function refreshRadioMetadata(force=false){
   if(!state.station||!radioMode())return;const id=state.station.id;
   if(!force&&metadataStationId===id&&Date.now()-lastMetadataFetch<2000)return;
   if(metadataStationId!==id){currentRadioTrack=null;metadataStationId=id}
   lastMetadataFetch=Date.now();
   try{const response=await fetch(BRIDGE.base+'/metadata/'+encodeURIComponent(id)+'?key='+encodeURIComponent(BRIDGE.key),{cache:'no-store'});if(!response.ok)return;const track=await response.json();if(state.station?.id!==id)return;const nextTrack=track?.title?track:null;const fields=['raw','artist','title','artwork','kind','searchable'];if(currentRadioTrack===nextTrack||currentRadioTrack&&nextTrack&&fields.every(field=>currentRadioTrack[field]===nextTrack[field]))return;currentRadioTrack=nextTrack;updateRadioSidePanel(false)}catch{}
  }
  function updateRadioSidePanel(fetchMetadata=true){
   const host=document.getElementById('Desktop_PanelContainer_Id');if(!host)return;
   if(!radioMode()||!state.station){delete host.dataset.riRadioSide;host.querySelector('#ri-radio-side-panel')?.remove();return}
   host.dataset.riRadioSide='true';let panel=host.querySelector('#ri-radio-side-panel');
   if(!panel){panel=document.createElement('section');panel.id='ri-radio-side-panel';panel.innerHTML='<h2>Stai ascoltando</h2><img class="ri-side-cover" alt=""><h3></h3><p class="ri-side-status"></p><section class="ri-side-card"><h4>Informazioni sulla radio</h4><p class="ri-side-description"></p></section><section class="ri-side-card"><h4>Prossima in coda</h4><button class="ri-side-next"><img alt=""><span><strong></strong><small>Radio · In diretta</small></span></button></section><section class="ri-side-card ri-side-track-card" hidden><h4>Brano in onda</h4><button class="ri-side-track"><img class="ri-side-track-art" alt=""><span><strong></strong><small></small></span></button></section>';host.append(panel)}
   const logo=url=>BRIDGE.base+'/logo/'+encodeURIComponent(url.id)+'?key='+encodeURIComponent(BRIDGE.key);const cover=panel.querySelector('.ri-side-cover');cover.src=logo(state.station);cover.alt='Logo '+state.station.name;
   panel.querySelector('h3').textContent=state.station.name;panel.querySelector('.ri-side-status').innerHTML='<span class="ri-side-live"></span>Radio Italiane · '+(state.playing?'In diretta':state.status);panel.querySelector('.ri-side-description').textContent=state.station.description||'Stazione radio italiana in streaming, disponibile in diretta nella tua raccolta.';
   const stations=window.RI_STATIONS||[];
   const index=stations.findIndex(station=>station.id===state.station.id);const next=stations.length?stations[(index<0?0:index+1)%stations.length]:null;const nextButton=panel.querySelector('.ri-side-next');
   if(next){nextButton.hidden=false;nextButton.querySelector('img').src=logo(next);nextButton.querySelector('img').alt='Logo '+next.name;nextButton.querySelector('strong').textContent=next.name;nextButton.onclick=()=>play(next)}else nextButton.hidden=true;
   const trackCard=panel.querySelector('.ri-side-track-card'),trackButton=panel.querySelector('.ri-side-track');
   if(currentRadioTrack&&metadataStationId===state.station.id){trackCard.hidden=false;const artwork=trackButton.querySelector('.ri-side-track-art');artwork.src=currentRadioTrack.artwork||logo(state.station);artwork.alt=(currentRadioTrack.kind==='show'?'Immagine del programma ':'Copertina di ')+currentRadioTrack.title;trackButton.querySelector('strong').textContent=currentRadioTrack.title;trackButton.querySelector('small').textContent=currentRadioTrack.kind==='show'?'Programma in diretta · '+(currentRadioTrack.artist||state.station.name):(currentRadioTrack.artist||state.station.name);if(currentRadioTrack.searchable===false){trackButton.title='Programma in diretta su '+state.station.name;trackButton.style.cursor='default';trackButton.onclick=null}else{trackButton.title='Apri '+[currentRadioTrack.artist,currentRadioTrack.title].filter(Boolean).join(' — ')+' in Spotify';trackButton.style.cursor='pointer';trackButton.onclick=()=>{const query=[currentRadioTrack.artist,currentRadioTrack.title].filter(Boolean).join(' ');if(query)Spicetify.Platform.History.push('/search/'+encodeURIComponent(query))}}}else trackCard.hidden=true;
   if(fetchMetadata)refreshRadioMetadata();
  }
  function restoreNowPlaying(){
   const saved=nativeNowPlayingSnapshot;if(!saved)return;const current=nativeNowPlaying();
   if(current?.root===saved.root){delete current.root.dataset.riNativeRadio;if(current.image){current.image.src=saved.image;current.image.srcset=saved.srcset}if(current.info){delete current.info.dataset.riRadioInfo;delete current.info.dataset.riRadioTitle;delete current.info.dataset.riRadioStatus}}
   nativeNowPlayingSnapshot=null;
  }
  function updateNowPlaying(){
   updateRadioSidePanel();
   const current=ensureNowPlaying();if(!current)return;
   if(!radioMode()||!state.station){restoreNowPlaying();return}
   if(!nativeNowPlayingSnapshot||nativeNowPlayingSnapshot.root!==current.root)nativeNowPlayingSnapshot={root:current.root,image:current.image?.src||'',srcset:current.image?.srcset||''};
   current.root.dataset.riNativeRadio='true';
   if(current.image){current.image.src=BRIDGE.base+'/logo/'+encodeURIComponent(state.station.id)+'?key='+encodeURIComponent(BRIDGE.key);current.image.srcset='';current.image.alt='Logo '+state.station.name}
   if(current.info){current.info.dataset.riRadioInfo='true';current.info.dataset.riRadioTitle=state.station.name;current.info.dataset.riRadioStatus='Radio Italiane · '+(state.playing?'In diretta':state.status)}
  }
  function radioMode(){return Boolean(state.station&&state.status!=='Interrotta da Spotify')}
  function nativeButton(kind){
   const labels=kind==='play'?['Play','Riproduci','Pausa','Pause','Metti in pausa']:kind==='next'?['Avanti','Successivo','Next']:['Indietro','Precedente','Previous'];
   return [...document.querySelectorAll('button')].find(button=>labels.includes(button.getAttribute('aria-label')))||null;
  }
  function syncNativeControls(){
   for(const button of document.querySelectorAll('button[data-ri-radio-play="true"]')){if(!radioMode()){delete button.dataset.riRadioPlay;button.removeAttribute('data-ri-radio-play')}}
   if(!radioMode())return;
   const button=document.querySelector('button[data-ri-radio-play="true"]')||nativeButton('play');if(button){button.dataset.riRadioPlay='true';button.setAttribute('aria-label',state.playing?'Metti in pausa la radio':'Riproduci la radio')}
  }
  function changeStation(delta){
   const stations=window.RI_STATIONS||[];if(!stations.length||!state.station)return;
   const current=Math.max(0,stations.findIndex(station=>station.id===state.station.id));play(stations[(current+delta+stations.length)%stations.length]);
  }
  function isBottomPlayerButton(button){
   if(button.dataset.riRadioPlay==='true')return true;
   if(button.closest('[data-testid="now-playing-bar"],.main-nowPlayingBar-nowPlayingBar,footer'))return true;
   const rect=button.getBoundingClientRect();return rect.bottom>=window.innerHeight-4&&rect.top>window.innerHeight-120;
  }
  document.addEventListener('click',event=>{
   if(!radioMode())return;const button=event.target.closest('button');if(!button)return;
   if(!isBottomPlayerButton(button))return;
   if(button.dataset.riRadioPlay==='true'||['Play','Riproduci','Pausa','Pause','Metti in pausa','Metti in pausa la radio','Riproduci la radio'].includes(button.getAttribute('aria-label'))){event.preventDefault();event.stopImmediatePropagation();state.playing?stop():play(state.station);return}
   const label=button.getAttribute('aria-label');if(['Avanti','Successivo','Next'].includes(label)){event.preventDefault();event.stopImmediatePropagation();changeStation(1)}else if(['Indietro','Precedente','Previous'].includes(label)){event.preventDefault();event.stopImmediatePropagation();changeStation(-1)}
  },true);
  document.addEventListener('pointerdown',event=>{
   if(!radioMode()||event.target.closest?.('button'))return;
   const bar=event.target.closest?.('[data-ri-radio-volume="true"]');if(!bar)return;const track=volumeTrack(bar);if(!track)return;
   radioVolumePointer={id:event.pointerId,track};directRadioVolume(event,track)
  },true);
  document.addEventListener('pointermove',event=>{if(radioVolumePointer?.id===event.pointerId&&radioVolumePointer.track.isConnected)directRadioVolume(event,radioVolumePointer.track)},true);
  const finishRadioVolumePointer=event=>{if(radioVolumePointer?.id!==event.pointerId)return;if(event.type==='pointerup'&&radioVolumePointer.track.isConnected)directRadioVolume(event,radioVolumePointer.track);radioVolumePointer=null};
  document.addEventListener('pointerup',finishRadioVolumePointer,true);document.addEventListener('pointercancel',finishRadioVolumePointer,true);window.addEventListener('blur',()=>radioVolumePointer=null);
  document.addEventListener('keydown',event=>{
   if(!radioMode()||!event.target.closest?.('[data-ri-radio-volume="true"]'))return;
   const keys={ArrowLeft:-.05,ArrowDown:-.05,ArrowRight:.05,ArrowUp:.05,PageDown:-.1,PageUp:.1};let value=null;
   if(event.key in keys)value=(radioMuted?lastAudibleVolume:commandedVolume)+keys[event.key];else if(event.key==='Home')value=0;else if(event.key==='End')value=1;else return;
   event.preventDefault();event.stopImmediatePropagation();applyVolumeCommand(value)
  },true);
  function installVolumeHooks(){
   const api=Spicetify.Platform?.PlaybackAPI;if(!api)return;
   if(typeof api.setVolume==='function'&&!api.setVolume.riRadioWrapped){
    const original=api.setVolume;
    const wrapped=function(value,...rest){if(radioMode()&&!ignoreSpotifyPause&&!mirroringNativeVolume)applyVolumeCommand(value);return original.call(this,value,...rest)};
    wrapped.riRadioWrapped=true;api.setVolume=wrapped;
   }
   for(const [name,delta] of [['raiseVolume',.1],['lowerVolume',-.1]]){
    if(typeof api[name]!=='function'||api[name].riRadioWrapped)continue;
    const original=api[name];const wrapped=function(...args){if(radioMode()&&!ignoreSpotifyPause&&!mirroringNativeVolume)applyVolumeCommand((commandedVolume??audio.volume)+delta);return original.apply(this,args)};
    wrapped.riRadioWrapped=true;api[name]=wrapped;
   }
  }
  function clearStream(message){request++;clearTimeout(timer);clearTimeout(reconnectTimer);audio.onerror=null;const wanted=resumeWanted;resumeWanted=false;audio.pause();audio.removeAttribute('src');audio.load();resumeWanted=wanted;set({playing:false,status:message})}
  function stop(message='In pausa'){resumeWanted=false;reconnectAttempts=0;clearStream(message)}
  function reconnect(ticket){
   if(ticket!==request||!resumeWanted||!state.station)return;
   clearTimeout(timer);clearTimeout(reconnectTimer);audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();
   const station=state.station,delay=Math.min(15000,1000*Math.pow(2,Math.min(reconnectAttempts++,4)));set({playing:false,status:'Riconnessione…'});
   reconnectTimer=setTimeout(()=>{if(resumeWanted&&state.station?.id===station.id)play(station,true)},delay);
  }
  const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
  async function fadeSpotifyOut(){
   let playing=false,saved=.8;try{playing=Spicetify.Player.isPlaying();saved=Spicetify.Player.getVolume()}catch{}
   if(!playing)return;
   ignoreSpotifyPause=true;
   try{
    for(let step=9;step>=0;step--){const value=saved*step/10;try{await Spicetify.Platform?.PlaybackAPI?.setVolume?.(value)}catch{}await wait(70)}
    try{await Spicetify.Player.pause()}catch{}
    try{await Spicetify.Platform?.PlaybackAPI?.setVolume?.(saved)}catch{}
   }finally{setTimeout(()=>ignoreSpotifyPause=false,300)}
  }
  async function fadeRadioOut(message='Interrotta da Spotify'){
   if(radioFadeTask)return radioFadeTask;
   radioFadeTask=(async()=>{fadingRadio=true;const saved=audio.volume;
    try{for(let step=9;step>=0;step--){audio.volume=saved*step/10;await wait(70)}stop(message)}
    finally{fadingRadio=false;audio.volume=saved;radioFadeTask=null;syncVolume()}
   })();return radioFadeTask;
  }
  async function play(station,reconnecting=false){
   clearStream(reconnecting?'Riconnessione…':'Connessione…');resumeWanted=true;state.station=station;state.status=reconnecting?'Riconnessione…':'Connessione…';if(!reconnecting){reconnectAttempts=0;currentRadioTrack=null;metadataStationId=station.id;lastMetadataFetch=0}emit();const ticket=request;
   if(!reconnecting)await fadeSpotifyOut();
   try{const health=await fetch(BRIDGE.base+'/health?key='+BRIDGE.key,{signal:AbortSignal.timeout(4000)});if(!health.ok||(await health.json()).version!==2)throw Error('bridge')}
   catch{if(ticket===request)reconnect(ticket);return}
   if(ticket!==request)return;
   const fail=()=>{if(ticket===request)reconnect(ticket)};
   timer=setTimeout(fail,90000);audio.onerror=fail;audio.src=BRIDGE.base+'/stream/'+encodeURIComponent(station.id)+'.mp3?key='+BRIDGE.key+'&request='+ticket+'&normalize='+(syncSpotifyNormalizationSetting()?'1':'0');syncVolume();audio.play().then(()=>syncVolume()).catch(fail);
  }
  audio.onplaying=()=>{clearTimeout(timer);reconnectAttempts=0;syncVolume();set({playing:true,status:'In diretta'})};audio.oncanplay=()=>syncVolume();audio.onpause=()=>{if(resumeWanted&&state.playing)reconnect(request)};audio.onended=()=>{if(resumeWanted&&state.playing)reconnect(request)};
  document.addEventListener('change',()=>setTimeout(syncSpotifyNormalizationSetting,0),true);
  document.addEventListener('click',event=>{if(!radioMode()||!isVolumeMuteClick(event))return;event.preventDefault();event.stopImmediatePropagation();toggleRadioMute()},true);
  function handleSpotifyPlayback(){
   if(ignoreSpotifyPause||!state.playing)return;
   const check=()=>{if(!ignoreSpotifyPause&&state.playing&&Spicetify.Player.isPlaying())fadeRadioOut('Interrotta da Spotify')};
   check();setTimeout(check,80);setTimeout(check,250);
  }
  installVolumeHooks();ensureRadioVolumeSlider();ensureNowPlaying();syncSpotifyNormalizationSetting();setInterval(()=>{installVolumeHooks();ensureRadioVolumeSlider();ensureNowPlaying();syncSpotifyNormalizationSetting();syncNativeControls();syncVolume()},250);syncVolume();window.addEventListener('ri-stations-changed',()=>updateRadioSidePanel(false));Spicetify.Player.addEventListener('onplaypause',handleSpotifyPlayback);Spicetify.Player.addEventListener('songchange',handleSpotifyPlayback);
  window.RadioItalianePlayer={play,stop,setVolume:applyVolumeCommand,getState:()=>({...state}),getAudioLevel:()=>({volume:audio.volume,muted:audio.muted,theme:activeVolumeTheme}),subscribe(listener){listeners.add(listener);listener({...state});return()=>listeners.delete(listener)}};
 }

 function libraryList(){return document.querySelector('.main-yourLibraryX-libraryRootlist,.main-yourLibraryX-library')||[...document.querySelectorAll('nav [role="grid"][aria-label]')].find(element=>element.querySelector('[role="row"]'))||null}
 function attachLibraryEntry(){if(document.getElementById('ri-library-entry'))return;const library=libraryList();if(!library)return;const button=document.createElement('button');button.id='ri-library-entry';button.title='Radio Italiane';button.setAttribute('aria-label','Apri la playlist Radio Italiane');const coverWrap=document.createElement('span');coverWrap.className='ri-mini-cover-wrap';const cover=document.createElement('img');cover.className='ri-mini-cover';cover.src=window.RI_COVER;cover.alt='';coverWrap.append(cover);const text=document.createElement('span');text.textContent='Radio Italiane';const subtitle=document.createElement('small');subtitle.textContent='Raccolta · Radio in diretta';text.append(subtitle);button.append(coverWrap,text);button.onclick=()=>Spicetify.Platform.History.push('/radio-italiane');library.prepend(button)}
 function hideNativeNav(){
  const candidates=new Set(document.querySelectorAll('button[aria-label="Radio Italiane"],button[title="Radio Italiane"],a[href$="/radio-italiane"]'));
  for(const element of document.querySelectorAll('[aria-label="Radio Italiane"],[title="Radio Italiane"]'))candidates.add(element.closest('button,a')||element);
  for(const element of candidates){if(!element.closest('#ri-library-entry')){element.dataset.riNativeNav='true';element.hidden=true}}
 }
 function protectLiveControls(){const live=document.body.classList.contains('ri-radio-live');for(const slider of document.querySelectorAll('[aria-label="Modifica stato"],[data-testid="playback-progressbar"]')){if(live){slider.dataset.riLiveLocked='true';slider.setAttribute('aria-disabled','true');slider.tabIndex=-1}else if(slider.dataset.riLiveLocked){delete slider.dataset.riLiveLocked;slider.removeAttribute('aria-disabled');slider.removeAttribute('tabindex')}}}
 let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;attachLibraryEntry();hideNativeNav();protectLiveControls()})}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-label','title','href']});setInterval(hideNativeNav,1000);attachLibraryEntry();hideNativeNav();protectLiveControls();
})();
