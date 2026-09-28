'use strict';
const http=require('node:http');
const crypto=require('node:crypto');
const {Readable}=require('node:stream');
const {pipeline}=require('node:stream/promises');
const {once}=require('node:events');
const {validStream}=require('./resolver.cjs');

async function createRelay(onMetadata=()=>{}){
 const sessions=new Map();let port;
 function register(session,url){
  if(!validStream(url))throw Error('URL sorgente non consentito');
  for(const [id,item] of session.urls)if(item===url)return address(session,id,url);
  const id=crypto.randomBytes(12).toString('hex');session.urls.set(id,url);
  // Bounded live-playlist mapping: it never grows with listening duration.
  if(session.urls.size>128)session.urls.delete(session.urls.keys().next().value);
  return address(session,id,url);
 }
 function address(session,id,url){
  const ext=/\.(m3u8|aac|ts|m4s|mp4|mp3|key)(?:\?|$)/i.exec(url)?.[1]||'bin';
  return 'http://127.0.0.1:'+port+'/'+session.key+'/'+id+'.'+ext;
 }
 const server=http.createServer(async(req,res)=>{
  const match=/^\/([a-f0-9]+)\/([a-f0-9]+)\.[a-z0-9]+$/.exec(req.url);
  const session=match&&sessions.get(match[1]),url=session?.urls.get(match?.[2]);
  if(req.method!=='GET'||!url||req.headers.host!=='127.0.0.1:'+port){res.writeHead(404);res.end();return}
  const controller=new AbortController();session.controllers.add(controller);
  const timer=setTimeout(()=>controller.abort(),15000);
  res.on('close',()=>controller.abort());
  try{
   const headers={'User-Agent':'Mozilla/5.0 RadioItaliane/2.0','Referer':session.page,'Icy-MetaData':'1'};
   if(req.headers.range)headers.Range=req.headers.range;
   const response=await fetch(url,{headers,signal:controller.signal});
   clearTimeout(timer);
   if(!response.ok){res.writeHead(response.status);res.end();return}
   const type=response.headers.get('content-type')||'application/octet-stream';
   if(/mpegurl/i.test(type)||/\.m3u8(?:\?|$)/i.test(response.url)){
    const reader=response.body.getReader();let chunks=[],size=0;
    for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>1024*1024)throw Error('Playlist troppo grande');chunks.push(value)}
    const playlist=Buffer.concat(chunks).toString('utf8').split(/\r?\n/).map(line=>{
     if(!line.trim())return line;
     if(line.startsWith('#'))return line.replace(/URI="([^"]+)"/g,(_,uri)=>'URI="'+register(session,new URL(uri,response.url).href)+'"');
     return register(session,new URL(line.trim(),response.url).href);
    }).join('\n');
    res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl'});res.end(playlist);
   }else{
    const outgoing={'Content-Type':type};
    const metaint=Number(response.headers.get('icy-metaint'));
    if(!Number.isFinite(metaint)||metaint<=0){for(const name of ['content-length','content-range'])if(response.headers.has(name))outgoing[name]=response.headers.get(name);res.writeHead(response.status,outgoing);await pipeline(Readable.fromWeb(response.body),res)}
    else{res.writeHead(response.status,outgoing);let audioLeft=metaint,metaLeft=-1,meta=[];for await(const raw of Readable.fromWeb(response.body)){let chunk=Buffer.from(raw),offset=0;while(offset<chunk.length){if(audioLeft>0){const size=Math.min(audioLeft,chunk.length-offset),part=chunk.subarray(offset,offset+size);offset+=size;audioLeft-=size;if(!res.write(part))await once(res,'drain');continue}if(metaLeft<0){metaLeft=chunk[offset++]*16;meta=[];if(metaLeft===0){audioLeft=metaint;metaLeft=-1}continue}const size=Math.min(metaLeft,chunk.length-offset);meta.push(chunk.subarray(offset,offset+size));offset+=size;metaLeft-=size;if(metaLeft===0){const value=Buffer.concat(meta).toString('utf8').replace(/\0+$/,'');const title=/StreamTitle='([^']*)'/i.exec(value)?.[1]?.trim();if(title)onMetadata(session.stationId,title);audioLeft=metaint;metaLeft=-1}}}res.end()}
   }
  }catch{if(!res.headersSent)res.writeHead(502);res.end()}
  finally{clearTimeout(timer);session.controllers.delete(controller)}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});port=server.address().port;
 return {
  open(url,page,stationId){const session={key:crypto.randomBytes(20).toString('hex'),page,stationId,urls:new Map(),controllers:new Set()};sessions.set(session.key,session);return {url:register(session,url),close(){for(const c of session.controllers)c.abort();sessions.delete(session.key)}}},
  close(){for(const s of sessions.values())for(const c of s.controllers)c.abort();sessions.clear();server.close();server.closeAllConnections()}
 };
}
module.exports={createRelay};
