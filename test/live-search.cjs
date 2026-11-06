'use strict';
// Opt-in network/audio integration check. Only writes under dist/live-search-*.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),net=require('node:net'),crypto=require('node:crypto'),vm=require('node:vm'),{spawn}=require('node:child_process');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.js'),'utf8');
const context={AbortController};vm.createContext(context);vm.runInContext(source.slice(0,source.indexOf('const riReact=')),context);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const port=s.address().port;await new Promise(r=>s.close(r));return port}
async function main(){
 const folder=fs.mkdtempSync(path.join(root,'dist/live-search-')),bridge=path.join(folder,'bridge');fs.mkdirSync(bridge);
 for(const file of ['server.cjs','config.cjs','world.cjs','resolver.cjs','relay.cjs','metadata.cjs','updates.cjs','stations.json'])fs.copyFileSync(path.join(root,'bridge',file),path.join(bridge,file));
 fs.cpSync(path.join(root,'bridge/vendor'),path.join(bridge,'vendor'),{recursive:true});fs.copyFileSync(path.join(root,'manifest.json'),path.join(folder,'manifest.json'));fs.mkdirSync(path.join(bridge,'bin'));fs.copyFileSync(path.join(root,'bridge/bin/ffmpeg.exe'),path.join(bridge,'bin/ffmpeg.exe'));
 const port=await freePort(),key=crypto.randomBytes(24).toString('hex'),base='http://127.0.0.1:'+port;
 fs.writeFileSync(path.join(bridge,'config.json'),JSON.stringify({port,key}));
 fs.writeFileSync(path.join(folder,'preload.cjs'),`const fs=require('fs');const original=fetch;global.fetch=async(input,options)=>{const u=new URL(String(input));if(u.hostname!=='127.0.0.1')fs.appendFileSync(${JSON.stringify(path.join(folder,'requests.log'))},u.href+'\\n');if(process.env.BLOCK_CATALOG==='1'&&u.pathname==='/'&&!u.hostname.endsWith('rtl.it'))throw Error('Catalog intentionally blocked after restart');return original(input,options)};`);
 let child;
 async function stop(){if(!child)return;const old=child;child=null;old.kill();await Promise.race([new Promise(r=>old.once('exit',r)),wait(4000)])}
 async function start(block=false){child=spawn(process.execPath,['-r',path.join(folder,'preload.cjs'),path.join(bridge,'server.cjs')],{env:{...process.env,BLOCK_CATALOG:block?'1':'0'},windowsHide:true,stdio:['ignore','ignore','pipe']});child.stderr.on('data',x=>fs.appendFileSync(path.join(folder,'stderr.log'),x));for(let i=0;i<40;i++){try{const r=await fetch(base+'/health?key='+key);if(r.ok)return}catch{}await wait(100)}throw Error('Bridge did not start')}
 const getPage=async(code,page,signal)=>{const r=await fetch(base+'/catalog/'+code+'?page='+page+'&key='+key,{signal});if(!r.ok)throw Error('catalog HTTP '+r.status);return r.json()};
 async function decode(station){return new Promise(resolve=>{let bytes=0,error='';const audio=spawn(path.join(bridge,'bin/ffmpeg.exe'),['-hide_banner','-loglevel','error','-i',base+'/stream/'+station.id+'.mp3?key='+key,'-t','1','-f','s16le','pipe:1'],{windowsHide:true,stdio:['ignore','pipe','pipe']});const timer=setTimeout(()=>audio.kill(),20000);audio.stdout.on('data',x=>bytes+=x.length);audio.stderr.on('data',x=>error+=x);audio.on('exit',code=>{clearTimeout(timer);resolve({ok:code===0&&bytes>0,decodedBytes:bytes,error:error.slice(-300)})})})}
 // Discover test candidates in a separate in-memory catalog, never the test bridge cache.
 const plannerContext={require:name=>name==='node:fs'?{readFileSync:()=> '[]',writeFileSync(){},renameSync(){}}:require(name),__dirname:folder,module:{exports:{}},URL,AbortSignal,fetch};vm.createContext(plannerContext);vm.runInContext(fs.readFileSync(path.join(root,'bridge/world.cjs'),'utf8'),plannerContext);
 const records=[];
 try{
  await start();
  for(const code of ['it','es']){
   const first=await getPage(code,1);const firstPages=new Set(first.stations.map(s=>s.page.replace(/\/$/,'')));
   const second=await plannerContext.module.exports.catalog(code,2,[]);
   const candidates=second.stations.filter(s=>!firstPages.has(s.page.replace(/\/$/,''))).slice(0,8);let passed;
   for(const candidate of candidates){
    let found;const hit=new Promise(r=>found=r);
    const model=context.createRadioCatalog({fetchPage:getPage,order:list=>list,onChange:view=>{if(view.rows.some(s=>s.id===candidate.id))found(view)}});
    await model.open(code);const running=model.search(candidate.name);
    const view=await Promise.race([hit,wait(30000).then(()=>null)]);
    if(!view){model.dispose();await running;continue}
    const wasScanning=view.scanning;
    const audio=await decode(candidate);model.search('');await running;model.dispose();
    if(audio.ok){passed={code,id:candidate.id,name:candidate.name,originPage:2,foundWhileScanning:wasScanning,...audio};break}
   }
   if(!passed)throw Error('No decodable off-first-page candidate for '+code);
   records.push(passed);console.log(JSON.stringify({phase:'search and decode',...passed}));
  }
  await stop();await start(true);
  for(const station of records){const data=await getPage(station.code,1);if(!data.stations.some(s=>s.id===station.id))throw Error('Station lost on restart');const audio=await decode(station);if(!audio.ok)throw Error('Playback after restart failed: '+station.name+' '+audio.error);station.afterRestart=audio;console.log(JSON.stringify({phase:'restart, remote catalog blocked',name:station.name,...audio}))}
 }finally{await stop();fs.writeFileSync(path.join(folder,'results.json'),JSON.stringify(records,null,2))}
 console.log('RESULTS '+path.join(folder,'results.json'));
}
main().catch(e=>{console.error(e);process.exitCode=1});
