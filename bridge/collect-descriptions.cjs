'use strict';
const fs=require('node:fs');
const path=require('node:path');
const stationsPath=path.join(__dirname,'stations.json');
const catalogPath=path.join(__dirname,'..','catalog.js');
const stations=JSON.parse(fs.readFileSync(stationsPath,'utf8'));
const catalogSource=fs.readFileSync(catalogPath,'utf8');
const catalog=JSON.parse(catalogSource.slice(catalogSource.indexOf('['),catalogSource.lastIndexOf(']')+1));
const decode=value=>value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const meta=(html,key)=>decode(html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']+)["']`,'i'))?.[1]||html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${key}["']`,'i'))?.[1]||'');
const shorten=text=>{let value=decode(text).replace(/\s*[|–-]\s*(Home|Official Site|Sito ufficiale).*$/i,'').trim();if(value.length<=280)return value;value=value.slice(0,277);const cut=Math.max(value.lastIndexOf('. '),value.lastIndexOf('! '),value.lastIndexOf('? '));return (cut>120?value.slice(0,cut+1):value.replace(/\s+\S*$/,'')+'…').trim()};
async function get(url){const response=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 RadioItaliane/2.0'},signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('HTTP '+response.status);return {html:await response.text(),url:response.url}}
function officialFromCatalog(html){
 for(const raw of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi))try{const value=JSON.parse(raw[1]);const nodes=value['@graph']||[value];const radio=nodes.find(node=>node['@type']==='RadioStation');const first=radio?.sameAs?.find(link=>/^https?:\/\//.test(link)&&!/(facebook|instagram|twitter|x\.com|youtube|tiktok)\.com/i.test(link));if(first)return first}catch{}
 return '';
}
async function enrich(station){
 let official=station.official||(!station.page.includes('radio-italiane.it')?station.page:'');let fallback='';
 try{if(!official){const page=await get(station.page);official=officialFromCatalog(page.html);fallback=meta(page.html,'description')||meta(page.html,'og:description')}}catch{}
 let description='';
 if(official)try{const page=await get(official);official=page.url;description=meta(page.html,'description')||meta(page.html,'og:description')||meta(page.html,'twitter:description')}catch{}
 description=shorten(description||fallback);
 if(!description||/cookie|javascript|browser non supportato|access denied/i.test(description))description=`Ascolta ${station.name} in diretta: musica, programmi e contenuti della stazione disponibili nella raccolta Radio Italiane.`;
 return {...station,official,description};
}
async function main(){
 const result=[];let cursor=0;
 async function worker(){while(cursor<stations.length){const index=cursor++;const station=stations[index];const enriched=await enrich(station);result[index]=enriched;console.log(`${index+1}/${stations.length} ${station.name} -> ${enriched.official||'sito non rilevato'}`)}}
 await Promise.all(Array.from({length:6},worker));
 fs.writeFileSync(stationsPath,JSON.stringify(result,null,2)+'\n');
 const byId=new Map(result.map(item=>[item.id,item]));
 const enrichedCatalog=catalog.map(item=>{const value=byId.get(item.id);return {...item,official:value?.official||'',description:value?.description||''}});
 fs.writeFileSync(catalogPath,'const RI_CATALOG = '+JSON.stringify(enrichedCatalog,null,2)+';\nwindow.RI_STATIONS = RI_CATALOG;\n');
}
main().catch(error=>{console.error(error);process.exitCode=1});
