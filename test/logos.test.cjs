'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
test('preferisce l’originale MyTuner e lascia intatti gli URL degli altri provider',()=>{
 const {logoSources}=require('../bridge/resolver.cjs');
 const small='https://static.mytuner.mobi/media/radios-150px/838/rds.jpg';
 assert.deepEqual(logoSources(small),['https://static.mytuner.mobi/media/tvos_radios/838/rds.jpg',small]);
 const official='https://example.com/media/radios-150px/logo.png';
 assert.deepEqual(logoSources(official),[official]);
});
test('la griglia interroga il bridge anche senza logo o con un placeholder',()=>{
 const source=fs.readFileSync(path.join(root,'index.js'),'utf8');
 const ctx={api:value=>'http://bridge'+value+'?key=test',encodeURIComponent};vm.createContext(ctx);
 const definition=source.match(/function logo\(s\)\{[^}]+\}/)[0];vm.runInContext(definition,ctx);
 for(const station of [{id:'radio-cuore'},{id:'empty',logo:''},{id:'placeholder',logo:'https://example.com/placeholder.png'},{id:'id with spaces',logo:'https://example.com/image.png'}]){
  assert.equal(ctx.logo(station),'http://bridge/logo/'+encodeURIComponent(station.id)+'?key=test&v=8');
 }
 assert.match(source,/onError:e=>\{e\.currentTarget\.onerror=null;e\.currentTarget\.src=window\.RI_COVER\}/);
});
test('pannello laterale e immagine del player usano la stessa versione della griglia',()=>{
 const source=fs.readFileSync(path.join(root,'sidebar.js'),'utf8');
 const lines=source.split('\n').filter(line=>line.includes("+'/logo/'"));
 assert.equal(lines.length,2);for(const line of lines)assert.ok(line.includes("+'&v=8'"));
});
