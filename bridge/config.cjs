'use strict';
const fs = require('node:fs');

function parseConfig(text) {
 return JSON.parse(String(text).replace(/^\uFEFF/, ''));
}

function readConfig(file) {
 return parseConfig(fs.readFileSync(file, 'utf8'));
}

module.exports = {parseConfig, readConfig};
