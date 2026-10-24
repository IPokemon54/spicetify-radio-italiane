'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','index.js'),'utf8');
const loader=source.slice(source.indexOf(' async function loadCountry('),source.indexOf(' function chooseCountry('));
const stations=Array.from({length:93},(_,i)=>({id:String(i),name:'Radio '+i}));
const pages=[0,1,2].map(i=>({stations:stations.slice(i*31,(i+1)*31),hasMore:i<2}));
async function load(saved,cached,batch=1){
 const calls=[],state={},storage=new Map([['order',JSON.stringify(saved)],['ri-catalog-cache:it',JSON.stringify(cached)]]);
 const context={stations:[],localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},orderKey:()=> 'order',api:value=>value,
  fetch:async url=>{const page=Number(new URL(url,'http://local').searchParams.get('page'));calls.push(page);return{ok:true,json:async()=>pages[page-1]}},
  applyOrder:list=>[...saved.map(id=>list.find(s=>s.id===id)).filter(Boolean),...list.filter(s=>!saved.includes(s.id))],
 };
 for(const key of ['Loading','Error','Country','Page','HasMore','Query'])context['set'+key]=value=>state[key]=value;
 context.publish=value=>state.stations=value;vm.createContext(context);vm.runInContext(loader,context);
 await context.loadCountry({code:'it'},batch,batch>1);assert.equal(state.Error,'');return{calls,state,cached:JSON.parse(storage.get('ri-catalog-cache:it'))};
}
const cache={stations,pages:Object.fromEntries(stations.map((s,i)=>[s.id,Math.floor(i/31)+1])),lastPage:3,hasMore:false};
test('mostra 31 radio nell’ordine salvato e recupera solo le pagine necessarie',async()=>{
 const {calls,state}=await load(['80',...stations.filter(s=>s.id!=='80').map(s=>s.id)],cache);
 assert.deepEqual(calls,[1,3]);assert.equal(state.stations.length,31);assert.equal(state.stations[0].id,'80');assert.equal(state.HasMore,true);
});
test('prima apertura scarica soltanto la prima pagina',async()=>{
 const {calls,state}=await load([],null);assert.deepEqual(calls,[1]);assert.equal(state.stations.length,31);
});
test('recupera un vecchio ordine senza cache e alla riapertura non scorre tutte le pagine',async()=>{
 const order=['80',...stations.filter(s=>s.id!=='80').map(s=>s.id)];
 const first=await load(order,null);
 assert.deepEqual(first.calls,[1,2,3]);assert.equal(first.state.stations.length,31);assert.equal(first.state.stations[0].id,'80');
 const reopened=await load(order,first.cached);
 assert.deepEqual(reopened.calls,[1,3]);assert.equal(reopened.state.stations.length,31);assert.equal(reopened.state.stations[0].id,'80');
});
test('un ID rimosso dal catalogo termina il recupero all’ultima pagina',async()=>{
 const {calls,state}=await load(['removed'],null);assert.deepEqual(calls,[1,2,3]);assert.equal(state.stations.length,31);
});
test('Carica altre radio mostra il gruppo seguente senza duplicati',async()=>{
 const {calls,state}=await load(stations.map(s=>s.id),cache,2);
 assert.deepEqual(calls,[1,2]);assert.equal(state.stations.length,62);assert.equal(new Set(state.stations.map(s=>s.id)).size,62);
});
test('Ripristina ordine scarta ordine e cache personalizzati e ricarica il catalogo iniziale',async()=>{
 const storage=new Map([['order:it','["80","0"]'],['ri-catalog-cache:it',JSON.stringify(cache)],['order:fr','["other"]']]);
 const calls=[],state={};
 const context={country:{code:'it'},orderKey:code=>'order:'+code,
  localStorage:{removeItem:key=>storage.delete(key)},
  setOrdering:value=>state.ordering=value,setDragId:value=>state.dragId=value,
  loadCountry:async(...args)=>{assert.equal(storage.has('order:it'),false);assert.equal(storage.has('ri-catalog-cache:it'),false);calls.push(args)},
 };
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf(' async function resetOrder('),source.indexOf(' function play(station)')),context);
 await context.resetOrder();
 assert.equal(calls.length,1);assert.equal(calls[0].length,1);assert.equal(calls[0][0].code,'it');
 assert.equal(state.ordering,false);assert.equal(state.dragId,null);assert.equal(storage.has('order:fr'),true);
});
