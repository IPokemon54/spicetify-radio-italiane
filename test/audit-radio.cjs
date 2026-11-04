'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {stations,resolveStation}=require('../bridge/resolver.cjs');
const {countries,catalog}=require('../bridge/world.cjs');
const {createRelay}=require('../bridge/relay.cjs');
async function pool(items,fn){let index=0;await Promise.all(Array.from({length:12},async()=>{while(index<items.length)await fn(items[index++])}))}
async function main(){
 const relay=await createRelay(),results=[],catalogs=[];
 async function probe(url,page,id){const session=relay.open(url,page,id);return new Promise(resolve=>{
  const child=spawn(path.join(__dirname,'../bridge/bin/ffmpeg.exe'),['-hide_banner','-loglevel','error','-nostdin','-rw_timeout','8000000','-i',session.url,'-map','0:a:0','-t','1','-f','null','-'],{windowsHide:true,stdio:['ignore','ignore','pipe']});let error='',settled=false;
  const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);child.kill();session.close();resolve({ok,error:error.slice(-500)})};
  const timer=setTimeout(()=>{error+=' timeout';finish(false)},12000);child.stderr.on('data',x=>error+=x);child.on('error',e=>{error+=e.message;finish(false)});child.on('exit',code=>finish(code===0));
 })}
 try{
  const first=await catalog('it',1,stations);const all=new Map([...stations,...first.stations].map(s=>[s.id,s]));
  if(process.argv.includes('--all-italy')){let data=first,number=1;while(data.hasMore){data=await catalog('it',++number,stations);for(const station of data.stations)all.set(station.id,station)}console.log('Italian stations discovered: '+all.size)}
  let previous=[];try{previous=JSON.parse(fs.readFileSync(path.join(__dirname,'../dist/radio-audit-checkpoint.json'),'utf8'))}catch{}
  const passed=new Map(previous.filter(s=>s.ok).map(s=>[s.id,s]));
  if(process.argv.includes('--resume-log')){for(const line of fs.readFileSync(path.join(__dirname,'../dist/audit-progress.log'),'utf8').split(/\r?\n/)){try{const item=JSON.parse(line);if(item.ok){const station=[...all.values()].find(s=>s.name===item.name);if(station)passed.set(station.id,{id:station.id,name:station.name,ok:true,attempts:[],previousRun:true})}}catch{}}}
  await pool([...all.values()],async station=>{if(passed.has(station.id)){results.push(passed.get(station.id));return}const result={id:station.id,name:station.name,page:station.page,attempts:[]};try{const urls=await resolveStation(station.id);for(const url of urls){const attempt=await probe(url,station.page,station.id);result.attempts.push({url,...attempt});if(attempt.ok){result.ok=true;break}}}catch(e){result.error=e.message}result.ok=!!result.ok;results.push(result);fs.writeFileSync(path.join(__dirname,'../dist/radio-audit-checkpoint.json'),JSON.stringify(results));console.log(JSON.stringify({name:result.name,ok:result.ok,attempts:result.attempts.length,error:result.error}));});
  await pool(countries,async country=>{try{const data=await catalog(country.code,1,stations);catalogs.push({code:country.code,count:data.stations.length,hasMore:data.hasMore,ok:data.stations.length>0})}catch(e){catalogs.push({code:country.code,ok:false,error:e.message})}});
 }finally{relay.close();fs.mkdirSync(path.join(__dirname,'../dist'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../dist/radio-audit.json'),JSON.stringify({date:new Date().toISOString(),results,catalogs},null,2))}
 console.log(JSON.stringify({total:results.length,ok:results.filter(s=>s.ok).length,failed:results.filter(s=>!s.ok).map(s=>s.name),catalogs:catalogs.length,catalogFailures:catalogs.filter(c=>!c.ok)}));
}
main().catch(e=>{console.error(e);process.exitCode=1});
