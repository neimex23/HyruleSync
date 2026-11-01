'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(__dirname,'../web/app.js'),'utf8').replace(/start\(\);\s*$/,'');

function sandbox(stored='{}'){
 const nodes=new Map(),frames=[],lines=[],markers=[];
 const node=id=>{
  if(!nodes.has(id))nodes.set(id,{value:'',checked:false,textContent:'',style:{}});
  return nodes.get(id);
 };
 const context={
  I18N:{language:'en',t:(key,values={})=>key.replace(/\{(\w+)\}/g,(match,key)=>values[key]??match)},
  document:{getElementById:node},
  localStorage:{getItem:()=>stored,setItem(){throw Error('Storage unavailable');}},
  requestAnimationFrame:callback=>{frames.push(callback);return frames.length;},
  L:{
   divIcon:options=>options,
   marker:(position,options)=>({position,options,bindTooltip(){return this;},on(){return this;}}),
   polyline:(coordinates,options)=>({addTo(){lines.push({coordinates,options});}})
  },
  testMap:{getZoom:()=>-2,getBounds:()=>({pad(){return this;},contains:p=>Math.abs(p[1])<500})},
  testObjects:{clearLayers(){markers.length=0;},addLayer:marker=>markers.push(marker)},
  testRoutes:{clearLayers(){lines.length=0;}}
 };
 vm.createContext(context);vm.runInContext(code,context);
 return {context,node,frames,lines,markers,run:source=>vm.runInContext(source,context)};
}

for(const stored of ['null','42','true','[]','{invalid']){
 const {run}=sandbox(stored);
 assert.equal(run('Object.keys(prefs).length'),0,'Invalid preferences use defaults: '+stored);
 assert.doesNotThrow(()=>run('savePrefs()'),'Storage errors do not interrupt map controls');
}

const {context,node,frames,lines,markers,run}=sandbox();
context.fixture={
 categories:[{id:'shrines',name:'Santuarios',icon:'shrine'},{id:'caves',name:'Cuevas',icon:'cave'},{id:'wells',name:'Pozos',icon:'well'}],
 points:[
  {id:'s0',category:'shrines',name:'Árbol',internalName:'Dungeon048',position:{x:10,y:900,z:20}},
  {id:'c0',category:'caves',name:'Cueva común',korokType:'RouteType',position:{x:20,y:100,z:30},path:{start:{x:20,z:30},end:{x:40,z:50}}},
  {id:'s1',category:'shrines',name:'Raíz',position:{x:30,y:-500,z:40}},
  {id:'c1',category:'caves',name:'Cueva común',position:{x:40,y:100,z:50},path:{flowers:[{position:{x:40,z:50}},{position:{x:45,z:55}}]}},
  {id:'c2',category:'caves',name:'Lejana',position:{x:1000,y:100,z:50}}
 ]
};
run('prepareCatalog(fixture);map=testMap;objects=testObjects;routes=testRoutes;active=new Set(Object.keys(categories));');
run('updateCounts()');
assert.equal(node('foundCount').textContent,'—');
assert.equal(node('count-shrines').textContent,'— / 2');
assert.match(node('count-shrines').title,/2 sin verificar/);

run('snapshot={states:[1,0,-1,0,-1]};updateCounts();');
assert.equal(node('foundCount').textContent,'1');
assert.equal(node('missingCount').textContent,'2 pendientes · 2 sin verificar');
assert.equal(node('count-shrines').textContent,'0 / 2');
assert.equal(node('count-caves').textContent,'2 / 3');
assert.equal(node('count-wells').textContent,'0 / 0');
assert.equal(node('progress').style.width,'20%');

node('showMode').value='all';node('showPaths').checked=true;
run("layer='surface';render();");
assert.deepEqual(markers.map(marker=>marker.options.title),['Cueva común','Cueva común'],'Viewport excludes distant points');
assert.equal(run('points.length'),3,'Filtered counter includes offscreen points');
assert.equal(lines.length,3,'Draw both route formats and the cave connection');
assert.deepEqual(Array.from(lines[0].coordinates[0]),[-30,20]);
node('showPaths').checked=false;run('render()');assert.equal(lines.length,0);

for(const [query,expected] of [['arbol','s0'],['DUNGEON048','s0'],['santuarios','s0']]){
 node('search').value=query;run("layer='sky';render();");
 assert.equal(run('points[0]?.id'),expected,'Search ignores accents and case and includes category/internal names');
}
node('search').value='routetype';run("layer='surface';render();");assert.equal(run('points[0]?.id'),'c0');
node('search').value='';node('showMode').value='unknown';run('render()');assert.equal(run('points[0]?.id'),'c2');
assert.equal(markers.length,0,'Unknown point outside viewport has no marker');
node('showMode').value='found';run("layer='sky';render();");assert.equal(run('points[0]?.id'),'s0');
node('showMode').value='missing';run("layer='surface';render();");assert.equal(run('points.length'),2);
run('active.clear();render();');assert.equal(run('points.length'),0);

// Multiple move/search events use the latest input in one scheduled draw.
run("active.add('shrines');layer='sky';scheduleRender();scheduleRender();scheduleRender();");
assert.equal(frames.length,1);
node('showMode').value='all';node('search').value='no match';frames.shift()();assert.equal(run('points.length'),0);
node('search').value='arbol';run('scheduleRender()');assert.equal(frames.length,1);
frames.shift()();assert.equal(run('points[0]?.id'),'s0');

console.log('Map counts, accent-insensitive search, state/layer/viewport filters, routes, render scheduling and invalid preferences passed.');
