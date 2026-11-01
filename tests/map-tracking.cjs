'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map();
const node=id=>{if(!nodes.has(id))nodes.set(id,{checked:false,disabled:false,textContent:'',hidden:true,href:'',classList:{toggle(){}},removeAttribute(key){delete this[key];}});return nodes.get(id);};
let view=null,marker=null,removed=0,zoom=-.75;
const context={I18N:{language:'en',t:(key,values={})=>key.replace(/\{(\w+)\}/g,(_,k)=>values[k]??_)},
 document:{getElementById:node},localStorage:{getItem:()=>null},
 L:{divIcon:options=>options,marker:(position,options)=>{marker={position,options,addTo(){return this;},bindTooltip(){return this;}};return marker;}},
 setTimeout:()=>1,clearTimeout(){}
};
vm.createContext(context);
const code=fs.readFileSync(require('node:path').join(__dirname,'../web/app.js'),'utf8').replace(/start\(\);\s*$/,'');
vm.runInContext(code,context);
const run=s=>vm.runInContext(s,context);
context.testMap={getZoom:()=>zoom,setView:(p,z)=>{view={position:p,zoom:z};zoom=z;},removeLayer:()=>removed++};
run('map=testMap;');
// Test coordinates and layer selection at boundaries, without category filters.
assert.equal(run('playerLayer({y:-50})'),'depths');assert.equal(run('playerLayer({y:750})'),'sky');assert.equal(run('playerLayer({y:0})'),'surface');
run("snapshot={savedAt:'2026-11-01T12:00:00Z',playerPosition:{x:123,y:110,z:-456},playerContext:{kind:'world',mapId:'MainField',mapPosition:{x:123,y:110,z:-456}}};layer='surface';renderLink();");
assert.deepEqual(Array.from(marker.position),[456,123]);assert.equal(node('centerLink').disabled,false);
assert.equal(run('showLink'),true);assert.equal(run('followLink'),false);
assert.equal(marker.options.pane,'linkBelow');
assert.equal(marker.options.opacity,.45);
run("$('linkOpacity').value='35';previewOpacity();");assert.equal(marker.options.opacity,.35);assert.equal(node('linkOpacityValue').textContent,'35%');
run("$('linkOpacity').value='0';previewOpacity();");assert.equal(marker.options.opacity,0);assert.equal(marker.options.interactive,false);assert.equal(marker.options.keyboard,false);
run('linkOpacity=100;editingOpacity=false;');
run('centerLink()');assert.equal(view.zoom,-.75);assert.deepEqual(Array.from(view.position),[456,123]);
zoom=-4;run('centerLink()');assert.equal(view.zoom,-1);
zoom=1;run('centerLink()');assert.equal(view.zoom,1);
zoom=-4;run('centerLink({zoom:false})');assert.equal(view.zoom,-4);
// A manually selected other layer hides the marker; centering selects Link's layer.
removed=0;
run("switchLayer=next=>{layer=next;};layer='sky';renderLink();");assert.equal(removed,1);
run('centerLink()');assert.equal(run('layer'),'surface');
run('snapshot.playerPosition=null;snapshot.playerContext.mapPosition=null;renderLink();');assert.equal(node('centerLink').disabled,true);
view=null;run('centerLink()');assert.equal(view,null);
run("snapshot.playerContext={kind:'shrine',mapId:'Dungeon048',shrineName:'Test Shrine',mapPosition:{x:100,y:900,z:200}};layer='sky';linkOrder='below';renderLink();");
assert.equal(marker.options.pane,'linkBelow');assert.match(marker.options.icon.className,/in-shrine/);assert.match(marker.options.title,/Test Shrine/);
run('showLink=false;renderLink();');assert.equal(node('centerLink').disabled,true);view=null;run('centerLink()');assert.equal(view,null);
run('showLink=true;linkOrder="above";snapshot=null;');
// Exercise the actual polling transition: enabled follows new saves, disabled stays put.
context.fetch=async()=>({ok:true,json:async()=>({source:'test.sav',mode:'file',auto:true,followLink:context.follow,showLink:context.shown!==false,linkOrder:context.order,linkOpacity:context.opacity,status:'ok',snapshot:context.next?{...context.next,playerContext:{kind:'world',mapPosition:context.next.playerPosition}}:null})});
run('updateCounts=()=>{};render=()=>{};toast=()=>{};');
context.follow=false;context.next={file:'test.sav',revision:'1',playtime:10,format:'1.4',playerPosition:{x:10,y:100,z:20}};
zoom=-4;
(async()=>{
 await run('poll()');assert.equal(view,null);
 assert.equal(run('linkOrder'),'below');assert.equal(run('linkOpacity'),45);assert.equal(node('linkOpacity').value,45);
 context.opacity=60;context.order='above';await run('poll()');assert.equal(run('linkOrder'),'above');assert.equal(run('linkOpacity'),60);assert.equal(node('linkOpacity').value,60);
 run('editingOpacity=true;linkOpacity=25;');await run('poll()');assert.equal(run('linkOpacity'),25);run('editingOpacity=false;');await run('poll()');assert.equal(run('linkOpacity'),60);
 context.follow=true;await run('poll()');assert.deepEqual(Array.from(view.position),[-20,10]);assert.equal(view.zoom,-4);
 context.next={...context.next,revision:'2',playerPosition:{x:30,y:900,z:40}};
 await run('poll()');assert.equal(run('layer'),'sky');assert.deepEqual(Array.from(view.position),[-40,30]);assert.equal(view.zoom,-4);
 context.follow=false;context.next={...context.next,revision:'3',playerPosition:{x:50,y:-500,z:60}};
 view=null;await run('poll()');assert.equal(view,null);assert.equal(run('layer'),'sky');
 context.follow=true;await run('poll()');assert.equal(run('layer'),'depths');
 context.next={...context.next,revision:'4',playerPosition:null};view=null;await run('poll()');assert.equal(view,null);
 context.next={...context.next,revision:'5',playerPosition:{x:70,y:200,z:80}};context.shown=false;await run('poll()');assert.equal(view,null);assert.equal(node('followLink').disabled,true);
 assert.equal(node('linkOpacity').disabled,true);
 context.shown=true;await run('poll()');assert.deepEqual(Array.from(view.position),[-80,70]);
 // A fixed preview survives incoming autosaves. Return shows the newest live snapshot.
 run("previewSnapshot={file:'old.sav',revision:'old',playtime:5,playerContext:{kind:'shrine',mapPosition:{x:1,y:900,z:2}}};displaySnapshot(previewSnapshot);");
 view=null;context.next={...context.next,revision:'6',playerPosition:{x:90,y:-400,z:100}};await run('poll()');
 assert.equal(run('snapshot.revision'),'old');assert.equal(run('liveSnapshot.revision'),'6');assert.equal(view,null);assert.equal(node('previewBanner').hidden,false);
 run('returnToLive()');assert.equal(run('snapshot.revision'),'6');assert.equal(node('previewBanner').hidden,true);assert.deepEqual(Array.from(view.position),[-100,90]);assert.equal(view.zoom,-4);
 // The update UI offers a direct ZIP link and clears it when no update is available.
 node('changesDialog').showModal=()=>{};
 let update={currentVersion:'0.4.0',latestVersion:'0.5.0',available:true,releaseUrl:'https://github.com/neimex23/HyruleSync/releases/tag/v0.5.0',releaseNotes:'## Changes\n<script>bad()</script>',downloadUrl:'https://github.com/neimex23/HyruleSync/releases/download/v0.5.0/HyruleSync-v0.5.0-windows.zip'};
 context.fetch=async()=>({ok:true,json:async()=>update});await run('checkUpdates()');
 assert.equal(node('updateNotice').hidden,false);assert.equal(node('downloadUpdate').href,update.downloadUrl);
 run('showChanges()');assert.equal(node('changesText').textContent,update.releaseNotes);assert.equal(node('changesLink').href,update.releaseUrl);
 update={...update,releaseNotes:null};await run('checkUpdates()');run('showChanges()');assert.equal(node('changesText').textContent,'Esta versión no tiene notas de cambios.');
 update={currentVersion:'0.4.0',latestVersion:'0.4.0',available:false};await run('checkUpdates()');
 assert.equal(node('updateNotice').hidden,true);assert.equal(node('downloadUpdate').href,undefined);
 assert.equal(node('updateStatus').textContent,'Tienes la última versión.');
 update={currentVersion:'0.4.0',available:false,error:'Offline'};await run('checkUpdates()');assert.equal(node('updateStatus').textContent,'Offline');
 context.fetch=async()=>{throw Error('Disconnected');};await run('checkUpdates()');assert.equal(node('checkUpdates').disabled,false);
 console.log('Link marker, coordinates, layers, optional follow, successive saves and update UI checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
