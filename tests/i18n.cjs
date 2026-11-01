'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname,'..');
const sandbox = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'web/i18n.js'),'utf8'),sandbox);
const i18n = sandbox.window.I18N;
i18n.setLanguage('en');
assert.equal(i18n.t('Partida cargada'),'Save loaded');
assert.equal(i18n.t('{n} pendientes',{n:123}),'123 missing');
i18n.setLanguage('es');
assert.equal(i18n.t('Partida cargada'),'Partida cargada');
assert.equal(i18n.t('{n} pendientes',{n:123}),'123 pendientes');
for(const [source,translated] of Object.entries(i18n.translations)) {
  const fields=text=>[...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
  assert.deepEqual(fields(source),fields(translated),'Placeholder mismatch: '+source);
}
const app = fs.readFileSync(path.join(root,'web/app.js'),'utf8');
for(const match of app.matchAll(/\bt\('((?:[^'\\]|\\.)*)'/g))
  assert.ok(Object.hasOwn(i18n.translations,match[1]),'Missing dynamic translation: '+match[1]);
const html = fs.readFileSync(path.join(root,'web/index.html'),'utf8');
const unchanged = new Set(['HyruleSync','Hyrule','Sync','progress.sav','TotK Unexplored','—','+','−','⛶','×',
  'Neimex23','Jhon Deved','MIT · Copyright © 2026 Neimex23 and HyruleSync contributors','TotK Unexplored · lud99 (BigBear)',
  'Leaflet','Savegame Editors · Marc Robledo','ZeldaMods · objmap-totk','ZeldaMods · radar-totk','Zelda Dungeon']);
for(const match of html.matchAll(/>([^<>]+)</g)) {
  const text=match[1].trim();
  if(text)assert.ok(unchanged.has(text)||Object.hasOwn(i18n.translations,text),'Missing static translation: '+text);
}
for(const match of html.matchAll(/(?:title|aria-label)="([^"]+)"/g))
  assert.ok(Object.hasOwn(i18n.translations,match[1]),'Missing accessible translation: '+match[1]);
assert.match(i18n.translations['Desarrollado por Neimex23 con amplia asistencia de Codex · GPT-6.1 · razonamiento Alto.'],/High reasoning/);
console.log('English/Spanish coverage, interpolation, accessible labels and author/AI credit checks passed.');
