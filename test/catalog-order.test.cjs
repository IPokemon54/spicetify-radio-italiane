'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../index.js'),'utf8');
const context={AbortController};vm.createContext(context);vm.runInContext(source.slice(0,source.indexOf('const riReact=')),context);
const list=Array.from({length:60},(_,i)=>({id:String(i),name:'Radio '+i}));
const result=(stations,hasMore=false)=>({stations,hasMore});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function make(fetchPage,order=items=>items){const views=[],calls=[];const catalog=context.createRadioCatalog({fetchPage:(code,page,signal)=>{calls.push({code,page,signal});return fetchPage(code,page,signal)},order,onChange:view=>views.push(view)});return{catalog,views,calls}}
test('le note sono tutte ricercabili ma la griglia iniziale resta a 31, con ordine salvato',async()=>{
 const {catalog,calls}=make(async()=>result(list),items=>[items.find(s=>s.id==='50'),...items.filter(s=>s.id!=='50')].filter(Boolean));
 await catalog.open('it');assert.equal(catalog.snapshot().all.length,60);assert.equal(catalog.snapshot().rows.length,31);assert.equal(catalog.snapshot().rows[0].id,'50');
 await catalog.search('59');assert.equal(catalog.snapshot().rows[0].id,'59');assert.equal(calls.length,1);
 catalog.search('');assert.equal(catalog.snapshot().rows.length,31);await catalog.more();assert.equal(catalog.snapshot().rows.length,60);assert.equal(calls.length,1);
});
test('la ricerca trova pagine successive e aggiorna i risultati prima che la scansione finisca',async()=>{
 const last=deferred();const {catalog,calls}=make(async(_code,page)=>page===1?result(list,true):page===2?result([{id:'new',name:'Target'}],true):last.promise);
 await catalog.open('it');const search=catalog.search('Target');await tick();
 assert.equal(catalog.snapshot().rows[0].id,'new');assert.equal(catalog.snapshot().scanning,true);
 catalog.search('Targe');catalog.search('Target');assert.deepEqual(calls.map(c=>c.page),[1,2,3]);
 last.resolve(result([{id:'new',name:'Target'}]));await search;
 assert.equal(catalog.snapshot().rows.length,1);assert.equal(catalog.snapshot().complete,true);
});
test('cancellare la ricerca annulla la richiesta e ignora la sua risposta tardiva',async()=>{
 const pending=deferred();const {catalog,calls}=make(async(_c,p)=>p===1?result(list,true):pending.promise);
 await catalog.open('it');const search=catalog.search('Target');catalog.search('');assert.equal(calls[1].signal.aborted,true);
 pending.resolve(result([{id:'late',name:'Target'}]));await search;
 assert.equal(catalog.snapshot().all.some(s=>s.id==='late'),false);assert.equal(catalog.snapshot().rows.length,31);
});
test('cambio paese e uscita annullano richieste e impediscono contaminazione',async()=>{
 const pending=deferred();const {catalog,calls}=make(async(c,p)=>c==='it'&&p===2?pending.promise:result(list,c==='it'));
 await catalog.open('it');const search=catalog.search('Target');await catalog.open('fr');assert.equal(calls[1].signal.aborted,true);
 pending.resolve(result([{id:'late',name:'Italian late'}]));await search;
 assert.equal(catalog.snapshot().code,'fr');assert.equal(catalog.snapshot().all.some(s=>s.id==='late'),false);
 catalog.dispose();const n=calls.length;await catalog.search('x');assert.equal(calls.length,n);
});
test('errori mantengono risultati e riprovano solo la pagina fallita',async()=>{
 let fail=true;const {catalog,calls}=make(async(_c,p)=>{if(p===1)return result(list,true);if(fail)throw Error('offline');return result([{id:'target',name:'Target'}])});
 await catalog.open('it');await catalog.search('Target');assert.equal(catalog.snapshot().all.length,60);assert.ok(catalog.snapshot().error);assert.equal(catalog.snapshot().complete,false);
 fail=false;await catalog.retry();assert.equal(catalog.snapshot().rows[0].id,'target');assert.deepEqual(calls.map(c=>c.page),[1,2,2]);
});
test('fallback della prima pagina conserva le note e permette di riprovare',async()=>{
 let fail=true;const {catalog,calls}=make(async()=>fail?{...result(list,true),error:'offline',retryPage:1}:result(list));
 await catalog.open('it');assert.equal(catalog.snapshot().all.length,60);assert.ok(catalog.snapshot().error);
 fail=false;await catalog.retry();assert.equal(catalog.snapshot().error,'');assert.deepEqual(calls.map(c=>c.page),[1,1]);
});
test('l’ordine reale salvato rimane stabile tra ricerca, nuove pagine e ripristino',async()=>{
 const storage=new Map([['order:it','["50","0","50"]'],['order:es','["other"]']]);
 const ctx={localStorage:{getItem:key=>storage.get(key)},orderKey:code=>'order:'+code,hasLogo:s=>!!s.logo};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf(' function applyOrder('),source.indexOf(' function publish(')),ctx);
 const {catalog}=make(async(_code,page)=>page===1?result(list,true):result([{id:'later',name:'Later'}]),(items,code)=>ctx.applyOrder(items,code));
 await catalog.open('it');assert.equal(catalog.snapshot().rows[0].id,'50');
 await catalog.search('Later');assert.equal(catalog.snapshot().rows[0].id,'later');catalog.search('');
 assert.equal(catalog.snapshot().rows[0].id,'50');assert.equal(new Set(catalog.snapshot().all.map(s=>s.id)).size,catalog.snapshot().all.length);
 storage.delete('order:it');catalog.reorder();assert.equal(catalog.snapshot().rows[0].id,'0');assert.equal(storage.has('order:es'),true);
});
