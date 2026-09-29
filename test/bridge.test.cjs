'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {parseConfig} = require('../bridge/config.cjs');

test('configurazione UTF-8 senza BOM', () => {
 assert.deepEqual(parseConfig('{"port":17863,"key":"plain"}'), {port:17863,key:'plain'});
});

test('configurazione UTF-8 con BOM', () => {
 assert.deepEqual(parseConfig('\uFEFF{"port":17864,"key":"bom"}'), {port:17864,key:'bom'});
});

test('bridge-config viene caricato prima di sidebar e sidebar usa la configurazione', () => {
 const root=path.join(__dirname,'..');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 assert.ok(manifest.subfiles_extension.indexOf('bridge-config.js') < manifest.subfiles_extension.indexOf('sidebar.js'));
 const sidebar=fs.readFileSync(path.join(root,'sidebar.js'),'utf8');
 assert.match(sidebar,/globalThis\.RI_BRIDGE/);
 assert.doesNotMatch(sidebar,/127\.0\.0\.1:17863|c71b7f619fc150a5/);
});

test('worldwide usa il globo SVG locale', () => {
 const server=fs.readFileSync(path.join(__dirname,'..','bridge','server.cjs'),'utf8');
 assert.match(server,/flagCode==='arab'\|\|flagCode==='worldwide'/);
});

test('il muto conserva il volume radio e non viene annullato dalla sincronizzazione', () => {
 const sidebar=fs.readFileSync(path.join(__dirname,'..','sidebar.js'),'utf8');
 assert.match(sidebar,/radioMuted\|\|next<=0\.001/);
 assert.match(sidebar,/\^Disattiva audio\$\|\^Mute\$/i);
 assert.doesNotMatch(sidebar,/setTimeout\(\(\)=>syncVolume\(volumeControl\(\),true\),0\)/);
});

test('RTL 102.5 usa il flusso Radio ufficiale di RTL Play per il brano in onda', () => {
 const metadata=fs.readFileSync(path.join(__dirname,'..','bridge','metadata.cjs'),'utf8');
 assert.match(metadata,/api-play\.rtl\.it\/media\/1\.0\/live\/1\/radiovisione\/-1\/0\//);
 assert.match(metadata,/station\.id==='radio-rtl-1025'/);
 assert.match(metadata,/present\.class!=='Music'/);
});

test('RDS usa il player ufficiale per il brano in onda', () => {
 const metadata=fs.readFileSync(path.join(__dirname,'..','bridge','metadata.cjs'),'utf8');
 assert.match(metadata,/cdnapi\.rds\.it\/v3\/site\/get_player_info/);
 assert.match(metadata,/station\.id==='radio-rds'/);
 assert.match(metadata,/song_status\?\.current_song/);
});

test('Radio Italia usa il player ufficiale per il brano in onda', () => {
 const metadata=fs.readFileSync(path.join(__dirname,'..','bridge','metadata.cjs'),'utf8');
 const sidebar=fs.readFileSync(path.join(__dirname,'..','sidebar.js'),'utf8');
 assert.match(metadata,/www\.radioitalia\.it\/onAir/);
 assert.match(metadata,/station\.id==='radio-italia'/);
 assert.match(metadata,/item\?\.artist/);
 assert.match(metadata,/if\(!value\)try\{value=await myTuner\(station\)\}/);
 assert.match(metadata,/fastStations\.has\(station\.id\)\?1500:10000/);
 assert.match(sidebar,/Date\.now\(\)-lastMetadataFetch<2000/);
 assert.match(sidebar,/fields\.every\(field=>currentRadioTrack\[field\]===nextTrack\[field\]\)/);
});

test('una diretta interrotta viene riconnessa automaticamente', () => {
 const sidebar=fs.readFileSync(path.join(__dirname,'..','sidebar.js'),'utf8');
 assert.match(sidebar,/resumeWanted/);
 assert.match(sidebar,/status:'Riconnessione…'/);
 assert.match(sidebar,/audio\.onended=.*reconnect/);
 assert.match(sidebar,/Math\.min\(15000,1000\*Math\.pow/);
});
