'use strict';
// Opt-in HTTP/image checks in an isolated bridge. No personal cache/config is read.
const fs=require('node:fs'),path=require('node:path'),net=require('node:net'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const root=path.join(__dirname,'..'),wait=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 const folder=fs.mkdtempSync(path.join(root,'dist/live-logos-')),bridge=path.join(folder,'bridge');fs.mkdirSync(bridge);fs.mkdirSync(path.join(folder,'assets'));
 for(const file of ['server.cjs','config.cjs','world.cjs','resolver.cjs','relay.cjs','metadata.cjs','updates.cjs','stations.json'])fs.copyFileSync(path.join(root,'bridge',file),path.join(bridge,file));
 fs.cpSync(path.join(root,'bridge/vendor'),path.join(bridge,'vendor'),{recursive:true});fs.copyFileSync(path.join(root,'manifest.json'),path.join(folder,'manifest.json'));fs.copyFileSync(path.join(root,'assets/cover.png'),path.join(folder,'assets/cover.png'));
 const cover=fs.readFileSync(path.join(folder,'assets/cover.png'));
 const socket=net.createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
 const key=crypto.randomBytes(24).toString('hex');fs.writeFileSync(path.join(bridge,'config.json'),JSON.stringify({port,key}));
 fs.writeFileSync(path.join(folder,'fixture.cjs'),`if(process.env.LOGO_FIXTURE==='1'){let imageRequests=0;global.fetch=async input=>{const url=String(input);if(url.endsWith('/fixture.png')){if(++imageRequests===1)return new Response('temporary failure',{status:503});return new Response(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=','base64'),{headers:{'content-type':'image/png'}})}return new Response('<meta property="og:image" content="https://static.mytuner.mobi/media/fixture.png">',{headers:{'content-type':'text/html'}})}}`);
 let child;const results={};
 async function stop(){if(!child)return;const current=child;child=null;const exited=new Promise(r=>current.once('exit',r));current.kill();await exited}
 async function start(fixture){child=spawn(process.execPath,['-r',path.join(folder,'fixture.cjs'),path.join(bridge,'server.cjs')],{env:{...process.env,LOGO_FIXTURE:fixture?'1':'0'},windowsHide:true,stdio:['ignore','ignore','pipe']});child.stderr.on('data',data=>fs.appendFileSync(path.join(folder,'stderr.log'),data));for(let i=0;i<50;i++){try{const r=await fetch('http://127.0.0.1:'+port+'/health?key='+key);if(r.ok)return}catch{}await wait(100)}throw Error('Test bridge did not start')}
 async function logo(id){const r=await fetch('http://127.0.0.1:'+port+'/logo/'+id+'?key='+key+'&v=8',{signal:AbortSignal.timeout(30000)});const body=Buffer.from(await r.arrayBuffer());return{status:r.status,type:r.headers.get('content-type'),cache:r.headers.get('cache-control'),body}}
 try{
  await start(true);
  const fallback=await logo('radio-cuore');assert.equal(fallback.status,200);assert.equal(fallback.cache,'no-store');assert.ok(fallback.body.equals(cover));
  const recovered=await logo('radio-cuore');assert.equal(recovered.status,200);assert.match(recovered.type,/^image\//);assert.equal(recovered.cache,'public, max-age=86400');assert.ok(!recovered.body.equals(cover));
  results.temporaryFailure={fallbackCache:fallback.cache,recoveredCache:recovered.cache,recoveredBytes:recovered.body.length};console.log(JSON.stringify(results.temporaryFailure));
  await stop();await start(false);results.afterRestart=[];
  for(const id of ['radio-cuore','radio-70-80-90','rai-isoradio','classic-hits-radio-italia']){
   const r=await logo(id);assert.equal(r.status,200,id);assert.match(r.type,/^image\//,id);assert.ok(!r.body.equals(cover),id+' returned generic cover');assert.ok(r.body.length>0);assert.equal(r.cache,'public, max-age=86400');
   const record={id,status:r.status,type:r.type,bytes:r.body.length,differentFromCover:true};results.afterRestart.push(record);console.log(JSON.stringify(record));
  }
 }finally{await stop();fs.writeFileSync(path.join(folder,'results.json'),JSON.stringify(results,null,2))}
 console.log('RESULTS '+path.join(folder,'results.json'));
}
main().catch(e=>{console.error(e);process.exitCode=1});
