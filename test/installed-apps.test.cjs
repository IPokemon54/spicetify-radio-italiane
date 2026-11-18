'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

test('il manifest carica il gruppo applicazioni e due esecuzioni inizializzano un solo observer',()=>{
 const root=path.join(__dirname,'..');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 assert.equal(manifest.subfiles_extension.filter(file=>file==='radio-italiane-installed.js').length,1);
 let observers=0,listeners=0;
 const storage=new Map();
 const context={
  Spicetify:{Config:{custom_apps:['radio-italiane']},LocalStorage:{get:key=>storage.get(key),set:(key,value)=>storage.set(key,value)}},
  document:{body:{},querySelectorAll:()=>[],getElementById:()=>null,addEventListener(){listeners++}},
  MutationObserver:class{constructor(){observers++}observe(){}},
 };
 context.window=context;
 vm.createContext(context);
 const source=fs.readFileSync(path.join(root,'radio-italiane-installed.js'),'utf8');
 vm.runInContext(source,context);
 vm.runInContext(source,context);
 assert.equal(observers,1);
 assert.equal(listeners,1);
});
