'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../bridge/world.cjs'),'utf8');
test('le radio dinamiche restano registrate dopo il riavvio del bridge',async()=>{
 let disk='[]',temporary;
 const fakeFs={readFileSync:()=>disk,writeFileSync:(_file,data)=>temporary=data,renameSync:()=>disk=temporary};
 const boot=()=>{const ctx={require:name=>name==='node:fs'?fakeFs:require(name),__dirname:__dirname,module:{exports:{}},URL,AbortSignal,
  fetch:async()=>({ok:true,text:async()=>'<section id="radio-grid-container"><a href="/radio-cecchetto" class="radio-card__link" title="Radio Cecchetto"><article data-radio-id="495787"><img src="https://example.com/logo.png"></article></a></section>'})};vm.createContext(ctx);vm.runInContext(source,ctx);return ctx.module.exports};
 const first=boot();const data=await first.catalog('it');assert.equal(data.stations.length,1);
 const id=data.stations[0].id;assert.equal(boot().dynamic.get(id).name,'Radio Cecchetto');
 const saved=JSON.parse(disk);saved[0].page='https://unrelated.example/station';disk=JSON.stringify(saved);
 assert.equal(boot().dynamic.size,0);
});
