'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {dynamic}=require('../bridge/world.cjs');
const {resolveStation}=require('../bridge/resolver.cjs');
test('Cecchetto usa il player ufficiale e conserva un fallback se il catalogo fallisce',async()=>{
 const original=global.fetch;
 dynamic.set('test-cecchetto',{id:'test-cecchetto',page:'https://www.radio-italiane.it/radio-cecchetto',streams:[]});
 try{
  global.fetch=async url=>url==='https://radiocecchetto.it/'?{ok:true,text:async()=>'<div data-stream="https://audio.example/live?x=1&amp;y=2">'}:{ok:false,status:503};
  assert.deepEqual(await resolveStation('test-cecchetto',true),['https://audio.example/live?x=1&y=2','https://nr15.newradio.it/stream/9142']);
  global.fetch=async()=>{throw Error('offline')};
  assert.ok((await resolveStation('test-cecchetto',true)).includes('https://nr15.newradio.it/stream/9142'));
 }finally{global.fetch=original;dynamic.delete('test-cecchetto')}
});
test('Radio Stella legge le sorgenti del canale ufficiale senza eseguire script',async()=>{
 const original=global.fetch;
 dynamic.set('test-stella',{id:'test-stella',page:'https://www.radio-italiane.it/radio-stella',streams:[]});
 try{
  const config={defaultStation:'live',stations:{live:{channel:{sources:[{source:'https://audio.example/stella'},{source:'http://127.0.0.1/private'}]}}}};
  global.fetch=async url=>url==='https://play.xdevel.com/13158'?{ok:true,text:async()=>'<script>window.PLAYER_CONFIG = '+JSON.stringify(config)+';</script>'}:{ok:false,status:503};
  assert.deepEqual(await resolveStation('test-stella',true),['https://audio.example/stella','https://stream6.xdevel.com/audio0s976787-1558/stream/icecast.audio']);
 }finally{global.fetch=original;dynamic.delete('test-stella')}
});
