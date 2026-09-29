'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const cache=new Map();
const stationIds=new Map();
let DG;

function decode(value=''){
 return value.replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\s+/g,' ').trim();
}
function splitTrack(raw=''){
 const parts=raw.split(/\s+-\s+/,2);
 return {raw,artist:parts.length>1?parts[0]:'',title:parts.length>1?raw.slice(parts[0].length+3):raw,artwork:''};
}
function signer(){
 if(DG)return DG;
 const context={};vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'vendor','cryptoJS.min.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'vendor','metadata-helper-it.js'),'utf8'),context);
 if(typeof context.DG!=='function')throw Error('Firma metadati non disponibile');
 return DG=context.DG;
}
async function radioAnimati(){
 const response=await fetch('https://radioanimati.it/player_info1a.php',{signal:AbortSignal.timeout(8000),headers:{'User-Agent':'Mozilla/5.0 RadioItaliane/2.0'}});
 if(!response.ok)throw Error('RadioAnimati metadata '+response.status);
 const html=await response.text();
 const title=decode(/class=["']brano-titolo["'][^>]*>([\s\S]*?)<\/div>/i.exec(html)?.[1]||'');
 const artist=decode(/class=["']brano-interp["'][^>]*>([\s\S]*?)<\/div>/i.exec(html)?.[1]||'');
 const src=/<img[^>]+id=["']imm1["'][^>]+src=["']([^"']+)/i.exec(html)?.[1]||'';
 const artwork=src?new URL(src,'https://radioanimati.it/').href:'';
 return title?{raw:[artist,title].filter(Boolean).join(' - '),artist,title,artwork}:null;
}
async function radioZeta(){
 const response=await fetch('https://api-core.rtl.it/v1/radiozeta/on-air',{signal:AbortSignal.timeout(8000),headers:{'User-Agent':'Mozilla/5.0 RadioItaliane/2.0'},cache:'no-store'});
 if(!response.ok)throw Error('Radio Zeta metadata '+response.status);
 const show=(await response.json())?.show;if(!show?.name)return null;
 const speakers=Array.isArray(show.speakers)?show.speakers.map(item=>item?.name).filter(Boolean).join(', '):'';
 const artwork=show.image_square?.[600]||show.image_square?.[400]||show.image?.[600]||show.image?.[400]||'';
 return {raw:show.name,artist:speakers||'Radio Zeta',title:show.name,artwork,kind:'show',searchable:false};
}
async function rtlEmbeddedTrack(master,label){
 const headers={'User-Agent':'Mozilla/5.0 RadioItaliane/2.0'};
 const load=async url=>{const response=await fetch(url,{signal:AbortSignal.timeout(8000),headers,cache:'no-store'});if(!response.ok)throw Error(label+' HLS '+response.status);return response};
 const masterText=await (await load(master)).text();
 const masterLines=masterText.split(/\r?\n/),streamIndex=masterLines.findIndex(line=>line.startsWith('#EXT-X-STREAM-INF'));
 const variant=streamIndex>=0&&masterLines[streamIndex+1]?new URL(masterLines[streamIndex+1].trim(),master).href:master;
 const playlist=variant===master?masterText:await (await load(variant)).text();
 const segments=playlist.split(/\r?\n/).filter(line=>line.trim()&&!line.startsWith('#'));if(!segments.length)throw Error('Segmento '+label+' assente');
 const body=Buffer.from(await (await load(new URL(segments.at(-1).trim(),variant).href)).arrayBuffer()).toString('utf8');
 const start=body.indexOf('{"songInfo":');if(start<0)return null;const end=body.indexOf('\0',start);if(end<0)return null;
 const info=JSON.parse(body.slice(start,end)).songInfo,present=info?.present;if(!present||present.class!=='Music'||!present.mus_sng_title)return null;
 return {raw:[present.mus_art_name,present.mus_sng_title].filter(Boolean).join(' - '),artist:present.mus_art_name||'',title:present.mus_sng_title,artwork:present.mus_sng_itunescoverbig||'',kind:'song',searchable:true};
}
async function radioZetaTrack(){
 return rtlEmbeddedTrack('https://dd782ed59e2a4e86aabf6fc508674b59.msvdn.net/live/S9346184/clhI2IJWRnn7/playlist_audio.m3u8','Radio Zeta');
}
async function rtl1025Track(){
 const endpoint='https://cloud.rtl.it/api-play.rtl.it/media/1.0/live/1/radiovisione/-1/0/';
 const response=await fetch(endpoint,{signal:AbortSignal.timeout(8000),headers:{'User-Agent':'Mozilla/5.0 RadioItaliane/2.0'},cache:'no-store'});
 if(!response.ok)throw Error('RTL 102.5 player '+response.status);
 const media=(await response.json())?.data?.mediaInfo;
 const master=media?.descriptor?.find(item=>item?.type==='HLS')?.uri||media?.uri;if(!master)throw Error('Flusso Radio RTL 102.5 assente');
 return rtlEmbeddedTrack(master,'RTL 102.5');
}
async function radioItaliaAnni60Roma(){
 const response=await fetch('https://titoli.fluidstream.it/anni60/titolo_rm.txt',{signal:AbortSignal.timeout(8000),headers:{'User-Agent':'Mozilla/5.0 RadioItaliane/2.0'},cache:'no-store'});
 if(!response.ok)throw Error('Radio Italia Anni 60 metadata '+response.status);
 const raw=decode(await response.text());if(!raw)return null;
 const track=splitTrack(raw);track.kind=track.artist?'song':'show';track.searchable=Boolean(track.artist);return track;
}
async function loveFm(){
 const response=await fetch('https://titoli01.fluidstream.it:443/titolo_love.txt',{signal:AbortSignal.timeout(8000),headers:{'User-Agent':'Mozilla/5.0 RadioItaliane/2.0'},cache:'no-store'});
 if(!response.ok)throw Error('Love FM metadata '+response.status);
 const raw=decode(await response.text());if(!raw)return null;
 const track=splitTrack(raw);track.kind=track.artist?'song':'show';track.searchable=Boolean(track.artist);return track;
}
async function stationRadioId(station){
 if(stationIds.has(station.id))return stationIds.get(station.id);
 const response=await fetch(station.page,{signal:AbortSignal.timeout(10000),headers:{'User-Agent':'Mozilla/5.0 RadioItaliane/2.0'}});
 if(!response.ok)throw Error('Pagina radio '+response.status);
 const html=await response.text();
 const id=Number(/id=["']radio-metadata-bootstrap["'][^>]*data-radio-id=["'](\d+)/i.exec(html)?.[1]||/data-radio-id=["'](\d+)["'][^>]*id=["']radio-metadata-bootstrap/i.exec(html)?.[1]);
 if(!id)throw Error('ID metadati non trovato');
 stationIds.set(station.id,id);return id;
}
async function myTuner(station){
 const radioId=await stationRadioId(station),time=Date.now(),endpoint='metadata';
 const auth=new (signer())(radioId).execute(time,endpoint);
 const app=auth.startsWith('HMAC ')?auth.slice(5,auth.indexOf(':')):'';
 if(!app)throw Error('Firma metadati non valida');
 const url=`https://metadata-api.mytuner.mobi/api/v1/metadata-api/web/${endpoint}?app_codename=${encodeURIComponent(app)}&radio_id=${radioId}&time=${time}`;
 const response=await fetch(url,{signal:AbortSignal.timeout(8000),headers:{Authorization:auth,'User-Agent':'Mozilla/5.0 RadioItaliane/2.0'},cache:'no-store'});
 if(!response.ok)throw Error('API metadati '+response.status);
 const item=(await response.json())?.radio_metadata;if(!item?.metadata)return null;
 const track=splitTrack(decode(item.metadata));track.artwork=item.artwork_url_large||item.artwork_url_small||'';return track;
}
async function getMetadata(station){
 const saved=cache.get(station.id);if(saved&&Date.now()-saved.updated<10000)return saved.value;
 let value=null;
 if(station.id==='radio-animati'){
  try{value=await radioAnimati()}catch{}
  if(!value)try{value=await myTuner({...station,page:'https://www.radio-italiane.it/radio-animati'})}catch{}
 }else if(station.id==='radio-zeta'){
  try{value=await radioZetaTrack()}catch{}
  if(!value)try{value=await myTuner(station)}catch{}
  if(!value)try{value=await radioZeta()}catch{}
 }else if(station.id==='radio-rtl-1025'){
  try{value=await rtl1025Track()}catch{}
 }else if(station.id==='radio-italia-anni-60-roma'){
  try{value=await radioItaliaAnni60Roma()}catch{}
  if(!value)try{value=await myTuner(station)}catch{}
 }else if(station.id==='love-fm'){
  try{value=await loveFm()}catch{}
  if(!value)try{value=await myTuner(station)}catch{}
 }else try{value=await myTuner(station)}catch{}
 cache.set(station.id,{updated:Date.now(),value});return value;
}
module.exports={getMetadata,splitTrack,rtl1025Track};
