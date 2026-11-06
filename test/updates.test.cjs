'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createUpdateChecker,isNewer}=require('../bridge/updates.cjs');
const response=tag=>({ok:true,json:async()=>({tag_name:tag,draft:false,prerelease:false})});
test('confronta numericamente le versioni senza confondere 3.0.9 e 3.0.16',()=>{
 assert.equal(isNewer('v3.0.16','3.0.9'),true);assert.equal(isNewer('3.1.0','3.0.16'),true);
 for(const version of ['3.0.16','3.0.15','v3.0.16-beta','invalid'])assert.equal(isNewer(version,'3.0.16'),false);
});
test('segnala una versione vecchia e costruisce il link della release ufficiale',async()=>{
 const check=createUpdateChecker({version:'3.0.14',fetchLatest:async()=>response('v3.0.16')});
 const result=await check();assert.equal(result.updateAvailable,true);assert.equal(result.installedVersion,'3.0.14');
 assert.equal(result.releaseUrl,'https://github.com/IPokemon54/spicetify-radio-italiane/releases/tag/v3.0.16');
});
test('non segnala aggiornamenti se la versione installata e uguale o piu nuova',async()=>{
 for(const version of ['3.0.16','3.0.17']){const result=await createUpdateChecker({version,fetchLatest:async()=>response('v3.0.16')})();assert.equal(result.updateAvailable,false)}
});
test('cache di un’ora e richieste simultanee condivise',async()=>{
 let time=0,calls=0;
 const check=createUpdateChecker({version:'3.0.14',now:()=>time,fetchLatest:async()=>{calls++;return response('v3.0.16')}});
 await Promise.all([check(),check(),check()]);assert.equal(calls,1);time=3599999;await check();assert.equal(calls,1);time=3600000;await check();assert.equal(calls,2);
});
test('rete assente e limiti GitHub sono silenziosi e consentono un nuovo tentativo',async()=>{
 let time=0,offline=true,calls=0;
 const check=createUpdateChecker({version:'3.0.14',now:()=>time,fetchLatest:async()=>{calls++;if(offline)throw Error('offline');return response('v3.0.16')}});
 assert.equal((await check()).checkFailed,true);assert.equal((await check()).updateAvailable,false);assert.equal(calls,1);
 offline=false;time=300000;assert.equal((await check()).updateAvailable,true);assert.equal(calls,2);
 const limited=await createUpdateChecker({version:'3.0.14',fetchLatest:async()=>({ok:false,status:403})})();assert.equal(limited.checkFailed,true);
});
test('il banner compare solo se esiste un aggiornamento e mostra entrambe le versioni',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../index.js'),'utf8');
 const render=update=>{const ctx={riReact:{useState:()=>[update,()=>{}],useEffect(){}},riEl:(type,props,...children)=>({type,props,children})};vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function RadioUpdateNotice('),source.indexOf('function RadioPlaylist(')),ctx);return ctx.RadioUpdateNotice()};
 assert.equal(render(null),null);assert.equal(render({updateAvailable:false}),null);
 const tree=render({updateAvailable:true,installedVersion:'3.0.14',latestVersion:'3.0.16',releaseUrl:'https://github.com/IPokemon54/spicetify-radio-italiane/releases/tag/v3.0.16'});
 assert.equal(tree.props.role,'status');assert.ok(JSON.stringify(tree).includes('3.0.14'));assert.ok(JSON.stringify(tree).includes('3.0.16'));assert.equal(tree.children[1].children[0],'Aggiorna');
});
