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
