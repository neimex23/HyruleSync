'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map();
const node=id=>{if(!nodes.has(id))nodes.set(id,{checked:false,disabled:false,textContent:'',hidden:true,href:'',classList:{toggle(){}},removeAttribute(key){delete this[key];}});return nodes.get(id);};
let view=null,marker=null,removed=0;
const context={I18N:{language:'en',t:(key,values={})=>key.replace(/\{(\w+)\}/g,(_,k)=>values[k]??_)},
 document:{getElementById:node},localStorage:{getItem:()=>null},
 L:{divIcon:options=>options,marker:(position,options)=>{marker={position,options,addTo(){return this;},bindTooltip(){return this;}};return marker;}},
 setTimeout:()=>1,clearTimeout(){}
};
vm.createContext(context);
const code=fs.readFileSync(require('node:path').join(__dirname,'../web/app.js'),'utf8').replace(/start\(\);\s*$/,'');
vm.runInContext(code,context);
const run=s=>vm.runInContext(s,context);
context.testMap={getZoom:()=>-.75,setView:(p,z)=>{view={position:p,zoom:z};},removeLayer:()=>removed++};
run('map=testMap;');
// Test coordinates and layer selection at boundaries, without category filters.
assert.equal(run('playerLayer({y:-50})'),'depths');assert.equal(run('playerLayer({y:750})'),'sky');assert.equal(run('playerLayer({y:0})'),'surface');
run("snapshot={savedAt:'2026-11-01T12:00:00Z',playerPosition:{x:123,y:110,z:-456}};layer='surface';renderLink();");
assert.deepEqual(Array.from(marker.position),[456,123]);assert.equal(node('centerLink').disabled,false);
run('centerLink()');assert.equal(view.zoom,-.75);assert.deepEqual(Array.from(view.position),[456,123]);
// A manually selected other layer hides the marker; centering selects Link's layer.
run("switchLayer=next=>{layer=next;};layer='sky';renderLink();");assert.equal(removed,1);
run('centerLink()');assert.equal(run('layer'),'surface');
run('snapshot.playerPosition=null;renderLink();');assert.equal(node('centerLink').disabled,true);
view=null;run('centerLink()');assert.equal(view,null);
// Exercise the actual polling transition: enabled follows new saves, disabled stays put.
context.fetch=async()=>({ok:true,json:async()=>({source:'test.sav',mode:'file',auto:true,followLink:context.follow,status:'ok',snapshot:context.next})});
run('updateCounts=()=>{};render=()=>{};toast=()=>{};');
context.follow=false;context.next={file:'test.sav',revision:'1',playtime:10,format:'1.4',playerPosition:{x:10,y:100,z:20}};
(async()=>{
 await run('poll()');assert.equal(view,null);
 context.follow=true;await run('poll()');assert.deepEqual(Array.from(view.position),[-20,10]);
 context.next={...context.next,revision:'2',playerPosition:{x:30,y:900,z:40}};
 await run('poll()');assert.equal(run('layer'),'sky');assert.deepEqual(Array.from(view.position),[-40,30]);
 context.follow=false;context.next={...context.next,revision:'3',playerPosition:{x:50,y:-500,z:60}};
 view=null;await run('poll()');assert.equal(view,null);assert.equal(run('layer'),'sky');
 context.follow=true;await run('poll()');assert.equal(run('layer'),'depths');
 context.next={...context.next,revision:'4',playerPosition:null};view=null;await run('poll()');assert.equal(view,null);
 // The update UI offers a direct ZIP link and clears it when no update is available.
 let update={currentVersion:'0.4.0',latestVersion:'0.5.0',available:true,downloadUrl:'https://github.com/neimex23/HyruleSync/releases/download/v0.5.0/HyruleSync-v0.5.0-windows.zip'};
 context.fetch=async()=>({ok:true,json:async()=>update});await run('checkUpdates()');
 assert.equal(node('updateNotice').hidden,false);assert.equal(node('downloadUpdate').href,update.downloadUrl);
 update={currentVersion:'0.4.0',latestVersion:'0.4.0',available:false};await run('checkUpdates()');
 assert.equal(node('updateNotice').hidden,true);assert.equal(node('downloadUpdate').href,undefined);
 assert.equal(node('updateStatus').textContent,'Tienes la última versión.');
 update={currentVersion:'0.4.0',available:false,error:'Offline'};await run('checkUpdates()');assert.equal(node('updateStatus').textContent,'Offline');
 context.fetch=async()=>{throw Error('Disconnected');};await run('checkUpdates()');assert.equal(node('checkUpdates').disabled,false);
 console.log('Link marker, coordinates, layers, optional follow, successive saves and update UI checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
