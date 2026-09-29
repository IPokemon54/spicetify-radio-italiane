'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {stations, findStation, resolveStation, resolveLogo} = require('./resolver.cjs');
const {countries, catalog} = require('./world.cjs');
const {createRelay} = require('./relay.cjs');
const {getMetadata,splitTrack} = require('./metadata.cjs');
const {readConfig} = require('./config.cjs');
const metadata = new Map();
const relayReady=createRelay((id,value)=>{if(id)metadata.set(id,{value,updated:Date.now()})});
const config = readConfig(path.join(__dirname, 'config.json'));
const ffmpeg = path.join(__dirname, 'bin', 'ffmpeg.exe');
const active = new Set();
const origins = new Set(['https://xpui.app.spotify.com', 'https://zlink.app.spotify.com']);

function command(url, page, normalize = true) {
 const args=['-hide_banner', '-loglevel', 'error', '-nostdin', '-protocol_whitelist', 'http,https,tcp,tls,crypto',
  '-rw_timeout', '12000000', '-user_agent', 'Mozilla/5.0 RadioItaliane/2.0', '-referer', page,
  '-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_delay_max', '2',
  '-i', url, '-map', '0:a:0', '-vn'];
 if(normalize)args.push('-af','loudnorm=I=-14:LRA=11:TP=-1.0');
 return args.concat(['-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame','-b:a', '160k', '-f', 'mp3', '-write_xing', '0', '-flush_packets', '1', 'pipe:1']);
}
async function transcode(res, url, page, normalize, stationId) {
 const source=(await relayReady).open(url,page,stationId);
 return new Promise(resolve => {
  let started = false, settled = false;
  let diagnostic = '';
  const child = spawn(ffmpeg, command(source.url, page, normalize), {windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
  active.add(child);
  let watchdog = setTimeout(() => finish(false), 25000);
  const onClose = () => finish(false);
  res.once('close', onClose);
  function finish(ok) {
   if (settled) return;
   settled = true; clearTimeout(watchdog); child.kill(); active.delete(child);source.close();
   res.off('close', onClose);
   if (started && !res.destroyed) res.end();
   if(!started&&diagnostic)console.error(diagnostic.slice(-1200));
   resolve(ok || started);
  }
  child.stdout.on('data', chunk => {
   if (settled || res.destroyed) return finish(false);
   clearTimeout(watchdog); watchdog = setTimeout(() => finish(false), 20000);
   if (!started) {started = true; res.writeHead(200, {'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});}
   if (!res.write(chunk)) child.stdout.pause();
  });
  res.on('drain', () => child.stdout.resume());
  child.stderr.on('data', chunk => diagnostic=(diagnostic+chunk).slice(-2400));
  child.on('error', () => finish(false));
  child.on('exit', () => finish(started));
 });
}
const server = http.createServer(async (req, res) => {
 try {
  if (req.headers.host !== '127.0.0.1:' + config.port) {res.writeHead(403);res.end();return;}
  const origin = req.headers.origin;
  if (origin && !origins.has(origin)) {res.writeHead(403);res.end();return;}
  if (origin) {res.setHeader('Access-Control-Allow-Origin', origin);res.setHeader('Vary', 'Origin');}
  if (req.method === 'OPTIONS') {
   res.writeHead(204, {'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type', 'Access-Control-Allow-Private-Network':'true'});res.end();return;
  }
  const url = new URL(req.url, 'http://127.0.0.1:' + config.port);
  if (req.method !== 'GET' || url.searchParams.get('key') !== config.key) {res.writeHead(403);res.end();return;}
  if (url.pathname === '/health') {res.writeHead(200, {'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,version:2,active:active.size}));return;}
  if(url.pathname==='/countries'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'public, max-age=86400'});res.end(JSON.stringify(countries));return}
  const catalogCode=/^\/catalog\/([a-z]+)$/.exec(url.pathname)?.[1];if(catalogCode){const result=await catalog(catalogCode,url.searchParams.get('page'),stations);res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(result));return}
  const flagCode=/^\/flag\/([a-z]+)$/.exec(url.pathname)?.[1];if(flagCode){const country=countries.find(item=>item.code===flagCode);if(!country){res.writeHead(404);res.end();return}if(flagCode==='arab'||flagCode==='worldwide'){const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60"><rect width="80" height="60" rx="8" fill="#173b32"/><circle cx="40" cy="30" r="20" fill="none" stroke="#25d8df" stroke-width="3"/><path d="M20 30h40M40 10c8 8 8 32 0 40M40 10c-8 8-8 32 0 40M24 20h32M24 40h32" fill="none" stroke="#d9f7f8" stroke-width="2"/></svg>';res.writeHead(200,{'Content-Type':'image/svg+xml','Cache-Control':'public, max-age=86400'});res.end(svg);return}const response=await fetch('https://flagcdn.com/w80/'+flagCode+'.png',{signal:AbortSignal.timeout(8000)});if(!response.ok){res.writeHead(404);res.end();return}const body=Buffer.from(await response.arrayBuffer());res.writeHead(200,{'Content-Type':'image/png','Content-Length':body.length,'Cache-Control':'public, max-age=86400'});res.end(body);return}
  const metadataId=/^\/metadata\/([a-z0-9-]+)$/.exec(url.pathname)?.[1];
  if(metadataId){const station=findStation(metadataId);if(!station){res.writeHead(404);res.end();return}let result=await getMetadata(station);if(!result){const item=metadata.get(metadataId),raw=item&&Date.now()-item.updated<30*60*1000?item.value:'';result=splitTrack(raw)}res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(result));return}
  const logoId = /^\/logo\/([a-z0-9-]+)$/.exec(url.pathname)?.[1];
  if (logoId) {
   const station = findStation(logoId);if (!station) {res.writeHead(404);res.end();return;}
   try{const response = await fetch(await resolveLogo(logoId), {signal:AbortSignal.timeout(12000),headers:{'User-Agent':'Mozilla/5.0 RadioItaliane/3.0','Referer':station.page}});if(!response.ok)throw Error();const body=Buffer.from(await response.arrayBuffer());if(!body.length||body.length>2*1024*1024)throw Error();let type=response.headers.get('content-type')||'';if(!type.startsWith('image/')){if(body.subarray(0,3).equals(Buffer.from([0xff,0xd8,0xff])))type='image/jpeg';else if(body.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))type='image/png';else if(body.subarray(0,4).toString()==='RIFF'&&body.subarray(8,12).toString()==='WEBP')type='image/webp';else throw Error()}res.writeHead(200,{'Content-Type':type,'Content-Length':body.length,'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'});res.end(body)}catch{const body=fs.readFileSync(path.join(__dirname,'..','assets','cover.png'));res.writeHead(200,{'Content-Type':'image/png','Content-Length':body.length,'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'});res.end(body)}return;
  }
  const id = /^\/stream\/([a-z0-9-]+)\.mp3$/.exec(url.pathname)?.[1];
  const station = findStation(id);
  if (!station) {res.writeHead(404);res.end();return;}
  if (active.size >= 4) {res.writeHead(429);res.end();return;}
  const urls = await resolveStation(id);
  const normalize=url.searchParams.get('normalize')!=='0';
  for (const stream of urls) {
   if (res.destroyed) return;
   if (await transcode(res, stream, station.page, normalize, id)) return;
  }
  if (!res.destroyed) {res.writeHead(503);res.end('Emittente temporaneamente non raggiungibile');}
 } catch {
  if (!res.destroyed && !res.headersSent) {res.writeHead(503);res.end('Impossibile collegarsi alla radio');}
 }
});
server.on('error', error => {if (error.code === 'EADDRINUSE') process.exit(0);console.error(error.message);process.exit(1);});
server.listen(config.port, '127.0.0.1', () => {fs.writeFileSync(path.join(__dirname,'service.pid'),String(process.pid));console.log('Radio Italiane bridge pronto')});
function shutdown() {for (const child of active) child.kill();try{fs.unlinkSync(path.join(__dirname,'service.pid'))}catch{}server.close();process.exit(0);}
process.on('SIGTERM', shutdown);process.on('SIGINT', shutdown);
module.exports = {command};
