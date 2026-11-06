'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
test('la griglia interroga il bridge anche senza logo o con un placeholder',()=>{
 const source=fs.readFileSync(path.join(root,'index.js'),'utf8');
 const ctx={api:value=>'http://bridge'+value+'?key=test',encodeURIComponent};vm.createContext(ctx);
 const definition=source.match(/function logo\(s\)\{[^}]+\}/)[0];vm.runInContext(definition,ctx);
 for(const station of [{id:'radio-cuore'},{id:'empty',logo:''},{id:'placeholder',logo:'https://example.com/placeholder.png'},{id:'id with spaces',logo:'https://example.com/image.png'}]){
  assert.equal(ctx.logo(station),'http://bridge/logo/'+encodeURIComponent(station.id)+'?key=test&v=7');
 }
 assert.match(source,/onError:e=>\{e\.currentTarget\.onerror=null;e\.currentTarget\.src=window\.RI_COVER\}/);
});
test('pannello laterale e immagine del player usano la stessa versione della griglia',()=>{
 const source=fs.readFileSync(path.join(root,'sidebar.js'),'utf8');
 const lines=source.split('\n').filter(line=>line.includes("+'/logo/'"));
 assert.equal(lines.length,2);for(const line of lines)assert.ok(line.includes("+'&v=7'"));
});
