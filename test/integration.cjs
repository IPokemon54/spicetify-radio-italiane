'use strict';
const fs=require('node:fs');
const path=require('node:path');
const net=require('node:net');
const {spawn}=require('node:child_process');
const root=path.join(__dirname,'..');
const runtime=path.join(__dirname,'.bridge-runtime');
const bridge=path.join(runtime,'bridge');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const port=()=>new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))})});
async function get(url,attempts=1){let error;for(let i=0;i<attempts;i++){try{const response=await fetch(url);if(!response.ok)throw Error('HTTP '+response.status);return response}catch(e){error=e;await delay(250)}}throw error}
(async()=>{
 fs.rmSync(runtime,{recursive:true,force:true});fs.mkdirSync(bridge,{recursive:true});
 for(const name of fs.readdirSync(path.join(root,'bridge')))if(/\.(?:cjs|json)$/.test(name))fs.copyFileSync(path.join(root,'bridge',name),path.join(bridge,name));
 const listenPort=await port(),key='integration-test-key';
 fs.writeFileSync(path.join(bridge,'config.json'),'\uFEFF'+JSON.stringify({port:listenPort,key}),'utf8');
 const child=spawn(process.execPath,['server.cjs'],{cwd:bridge,stdio:['ignore','pipe','pipe']});let diagnostic='';child.stderr.on('data',x=>diagnostic+=x);
 try{
  const base=`http://127.0.0.1:${listenPort}`;
  const health=await (await get(`${base}/health?key=${key}`,40)).json();
  const countries=await (await get(`${base}/countries?key=${key}`)).json();
  const catalog=await (await get(`${base}/catalog/it?key=${key}`)).json();
  const flag=await get(`${base}/flag/worldwide?key=${key}`);
  if(!health.ok||countries.length!==68||catalog.stations.length!==61||!flag.headers.get('content-type').startsWith('image/svg+xml'))throw Error(`Risultato inatteso: health=${health.ok}, countries=${countries.length}, stations=${catalog.stations.length}, flag=${flag.headers.get('content-type')}`);
  console.log(`Bridge BOM: health=${health.ok}, nazioni=${countries.length}, stazioni IT=${catalog.stations.length}, worldwide=${flag.headers.get('content-type')}`);
 }finally{child.kill();await delay(200);fs.rmSync(runtime,{recursive:true,force:true})}
})().catch(error=>{console.error(error.message);process.exitCode=1});
