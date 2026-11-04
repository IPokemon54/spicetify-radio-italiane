'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const stations = JSON.parse(fs.readFileSync(path.join(__dirname, 'stations.json'), 'utf8'));
const {dynamic} = require('./world.cjs');
const cache = new Map();
const logoCache = new Map();

function decodeStreams(html) {
 const timestamp = html.match(/id="last-update"[^>]*data-timestamp="([^"]+)"/)?.[1];
 const json = html.match(/id="radio-streams-json"[^>]*>([\s\S]*?)<\/script>/)?.[1];
 if (!timestamp || !json) throw new Error('Formato del catalogo radio cambiato');
 const key = Buffer.from(timestamp.repeat(32).slice(0, 32));
 return JSON.parse(json).filter(s => s.type !== 'mms').map(s => {
  // Same URL decoding performed by the public radio-italiane.it player.
  const decipher = crypto.createDecipheriv('aes-256-cfb', key, Buffer.from(s.iv, 'hex'));
  const padded = Buffer.concat([decipher.update(Buffer.from(s.cipher, 'base64url')), decipher.final()]);
  const padding = padded.at(-1);
  if (padding < 1 || padding > 16 || !padded.subarray(-padding).every(b => b === padding)) throw new Error('Indirizzo radio non valido');
  return padded.subarray(0, -padding).toString('utf8');
 }).filter(validStream);
}
function validStream(value) {
 try {
  const u = new URL(value);
  return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password &&
   !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.|\[)/i.test(u.hostname);
 } catch { return false; }
}
async function resolveStation(id, refresh = false) {
 const station = findStation(id);
 if (!station) throw new Error('Radio sconosciuta');
 const cached = cache.get(id);
 if (!refresh && cached && Date.now() - cached.time < 15 * 60 * 1000) return cached.urls;
 let urls = [];
 // Prefer the endpoint advertised by Cecchetto's own player over the directory.
 if (new URL(station.page).hostname === 'www.radio-italiane.it' && new URL(station.page).pathname.replace(/\/$/, '') === '/radio-cecchetto') {
  try {
   const response = await fetch('https://radiocecchetto.it/', {signal: AbortSignal.timeout(12000)});
   if (!response.ok) throw new Error('Player ufficiale HTTP ' + response.status);
   const html = await response.text();
   const stream = html.match(/\bdata-stream=["']([^"']+)["']/i)?.[1]?.replaceAll('&amp;', '&');
   if (stream && validStream(stream)) urls.push(stream);
  } catch {}
  urls.push('https://nr15.newradio.it/stream/9142');
 }
 if (new URL(station.page).hostname === 'www.radio-italiane.it' && new URL(station.page).pathname.replace(/\/$/, '') === '/radio-stella') {
  try {
   const response = await fetch('https://play.xdevel.com/13158', {signal: AbortSignal.timeout(12000)});
   if (!response.ok) throw new Error('Player ufficiale HTTP ' + response.status);
   const html = await response.text();
   const raw = html.match(/window\.PLAYER_CONFIG\s*=\s*(\{[^\r\n]+\})\s*;/)?.[1];
   const config = raw && JSON.parse(raw);
   const sources = config?.stations?.[config.defaultStation]?.channel?.sources || [];
   urls.push(...sources.map(item=>item.source).filter(validStream));
  } catch {}
  urls.push('https://stream6.xdevel.com/audio0s976787-1558/stream/icecast.audio');
 }
 try {
  const response = await fetch(station.page, {signal: AbortSignal.timeout(12000)});
  if (!response.ok) throw new Error('Catalogo HTTP ' + response.status);
  urls.push(...decodeStreams(await response.text()));
 } catch (error) {
  if (!urls.length && !station.streams.length && !cached) throw error;
 }
 urls = [...new Set([...urls, ...(cached?.urls || []), ...station.streams])].filter(validStream);
 if (!urls.length) throw new Error('Nessun flusso disponibile');
 cache.set(id, {time: Date.now(), urls});
 return urls;
}
async function resolveLogo(id) {
 const station = findStation(id);
 if (!station) throw new Error('Radio sconosciuta');
 if (station.logo) {
  const direct = new URL(station.logo);
  if (direct.protocol !== 'https:') throw new Error('Logo non valido');
  return direct.href;
 }
 const cached = logoCache.get(id);
 if (cached && Date.now() - cached.time < 24 * 60 * 60 * 1000) return cached.url;
 const response = await fetch(station.page, {signal: AbortSignal.timeout(12000)});
 if (!response.ok) throw new Error('Catalogo HTTP ' + response.status);
 const html = await response.text();
 const direct = html.match(/https:\/\/static\.mytuner\.mobi\/media\/tvos_radios\/[^"'<> ]+\.(?:png|jpe?g|webp)/i)?.[0];
 const meta = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i)?.[1]
  || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i)?.[1];
 const value = (direct || meta || '').replaceAll('&amp;', '&');
 const logo = new URL(value, station.page);
 if (logo.protocol !== 'https:' || !logo.hostname.endsWith('mytuner.mobi')) throw new Error('Logo non valido');
 logoCache.set(id, {time:Date.now(), url:logo.href});
 return logo.href;
}
function findStation(id){return stations.find(s=>s.id===id)||dynamic.get(id)}
module.exports = {stations, findStation, decodeStreams, validStream, resolveStation, resolveLogo};
