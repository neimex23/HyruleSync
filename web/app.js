'use strict';
const t=(key,values)=>I18N.t(key,values), $=id=>document.getElementById(id), norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let numberFormat,formatLanguage;
function fmt(value){
 if(formatLanguage!==I18N.language){numberFormat=new Intl.NumberFormat(I18N.language);formatLanguage=I18N.language;}
 return numberFormat.format(value);
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const descriptions={'shrines':'Clear · 1654019904','carry_koroks':'Clear · 1654019904','lightroots':'Open · 404286466'};
let catalog,categories,map,background,objects,routes,linkMarker,renderFrame=null;
let snapshot=null,liveSnapshot=null,previewSnapshot=null,selected=null;
let layer='surface',active=new Set(['hidden_koroks','carry_koroks','shrines']),points=[];
let polling=false,source='',sourceMode='file',toastTimer;
let followLink=false,showLink=true,linkOrder='below',linkOpacity=45,editingOpacity=false;
let checkingUpdates=false,updateTimer,latestUpdate=null,savesLoading=false;
const prefKey='hyrulesync.preferences';
let prefs={};
try{
 const stored=JSON.parse(localStorage.getItem(prefKey)||'{}');
 if(stored&&typeof stored==='object'&&!Array.isArray(stored))prefs=stored;
}catch{}
const pointState=p=>snapshot?snapshot.states[p.index]:-1;
const booleanLabel=s=>s===1?t('Sí'):s===0?t('No'):t('Sin verificar');
const pointIcon=p=>p.category==='towers'?'tower.svg':`assets/icons/${categories[p.category].icon}.png`;
const mapPosition=s=>s?.playerContext?.mapPosition??null;
const locationText=s=>s?.playerContext?.kind==='shrine'?t('Dentro de {name}',{name:s.playerContext.shrineName}):mapPosition(s)?coordinateString(mapPosition(s)):t('La posición de Link no está disponible en este guardado.');
// The same layer thresholds and coordinate conversion as MapObject.cpp and ObjectInfo.cpp.
const inLayer=p=>layer==='depths'?p.position.y<=-50:layer==='sky'?p.position.y>=750:p.position.y>=-50&&p.position.y<=750;
const ll=p=>[-p.z,p.x];
const coordinateString=p=>[p.x,-p.z,p.y-105].map(v=>{const n=Math.trunc(v);return(n<0?'-':'')+Math.abs(n).toString().padStart(4,'0');}).join('  ');
function toast(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function savePrefs(){
 try{localStorage.setItem(prefKey,JSON.stringify({active:[...active],mode:$('showMode').value,layer,paths:$('showPaths').checked}));}catch{}
}
function showState(s){return s===1?t('Completado'):s===0?t('Pendiente'):t('Sin verificar · no hay datos suficientes');}
function prepareCatalog(data){
 catalog=data;
 categories=Object.fromEntries(catalog.categories.map(category=>[category.id,category]));
 catalog.points.forEach((point,index)=>{
  point.index=index;
  point.latLng=ll(point.position);
  point.searchText=norm([point.name,point.korokType,point.internalName,categories[point.category].name].join(' '));
  const route=point.path?.flowers?.map(flower=>flower.position)||(point.path?.start&&point.path?.end?[point.path.start,point.path.end]:[]);
  point.routeCoordinates=route.map(ll);
 });
}
function updateCounts(){
 const counts=Object.fromEntries(catalog.categories.map(category=>[category.id,{total:0,found:0,unknown:0}]));
 let found=0,unknown=0;
 for(const point of catalog.points){
  const count=counts[point.category],state=pointState(point);count.total++;
  if(state===1){count.found++;found++;}
  else if(state===-1){count.unknown++;unknown++;}
 }
 $('foundCount').textContent=snapshot?fmt(found):'—';$('totalCount').textContent=fmt(catalog.points.length);$('progress').style.width=(snapshot?found/catalog.points.length*100:0)+'%';
 $('missingCount').textContent=snapshot?t('{n} pendientes',{n:fmt(catalog.points.length-found-unknown)})+(unknown?t(' · {n} sin verificar',{n:fmt(unknown)}):''):t('Carga una partida para calcular los pendientes.');
 for(const category of catalog.categories){
  const count=counts[category.id],missing=count.total-count.found-count.unknown,node=$('count-'+category.id);
  node.textContent=snapshot?`${missing} / ${count.total}`:`— / ${count.total}`;
  node.title=t('{found} completados; {missing} pendientes; {unknown} sin verificar. Todas las capas.',{found:fmt(count.found),missing:fmt(missing),unknown:fmt(count.unknown)});
 }
 if(selected)detail(selected,false);
}
function buildCategories(){for(const c of catalog.categories){
 const row=document.createElement('label');row.className='category';const check=document.createElement('input');check.type='checkbox';check.checked=active.has(c.id);check.dataset.category=c.id;check.onchange=()=>{check.checked?active.add(c.id):active.delete(c.id);savePrefs();render();};
 const icon=document.createElement('img');icon.src=c.id==='towers'?'tower.svg':`assets/icons/${c.icon}.png`;icon.alt='';const label=document.createElement('span');label.className='name';label.textContent=c.name;const count=document.createElement('span');count.className='count';count.id='count-'+c.id;row.append(check,icon,label,count);$('categories').append(row);
}}
function switchLayer(next){
 if(!['surface','sky','depths'].includes(next))return;layer=next;
 document.querySelectorAll('[data-layer]').forEach(b=>{b.classList.toggle('active',b.dataset.layer===layer);b.setAttribute('aria-pressed',b.dataset.layer===layer);});
 if(background)map.removeLayer(background);
 // Upstream: a centred 4500x4500 image and MapScale=0.375 => 12000x12000 world units.
 background=L.imageOverlay(`assets/map/${layer}-medium.png`,[[-6000,-6000],[6000,6000]],{interactive:false}).addTo(map);background.bringToBack();savePrefs();render();
}
const playerLayer=p=>p.y<=-50?'depths':p.y>=750?'sky':'surface';
function centerLink({zoom=true}={}){
 const p=mapPosition(snapshot);if(!showLink||!p||!map)return;
 if(layer!==playerLayer(p))switchLayer(playerLayer(p));
 map.setView(ll(p),zoom?Math.max(map.getZoom(),-1):map.getZoom(),{animate:false});
}
function renderLink(){
 if(linkMarker){map.removeLayer(linkMarker);linkMarker=null;}
 const p=mapPosition(snapshot),shrine=snapshot?.playerContext?.kind==='shrine';$('centerLink').disabled=!showLink||!p;
 $('linkPosition').textContent=p?t('Última posición de Link: {coords} · guardado {time}',{coords:locationText(snapshot),time:new Date(snapshot.savedAt).toLocaleString(I18N.language)}):t('La posición de Link no está disponible en este guardado.');
 $('linkDiagnostics').textContent=snapshot?t('Mapa guardado: {map} · coordenadas originales: {coords}',{map:snapshot.playerContext?.mapId||t('Sin verificar'),coords:snapshot.playerPosition?coordinateString(snapshot.playerPosition):t('Sin verificar')}):'';
 if(!showLink||!p||playerLayer(p)!==layer)return;
 const icon=L.divIcon({className:'link-marker'+(shrine?' in-shrine':''),html:'&#9650;'+(shrine?'<span class="shrine-badge" aria-hidden="true">⌂</span>':''),iconSize:[28,28],iconAnchor:[14,14]});
 const title=shrine?locationText(snapshot):t('Última posición conocida de Link');
 linkMarker=L.marker(ll(p),{icon,title,alt:title,opacity:linkOpacity/100,interactive:linkOpacity>0,keyboard:linkOpacity>0,pane:linkOrder==='below'?'linkBelow':'linkAbove'}).addTo(map);
 linkMarker.bindTooltip(esc(title)+'<br>'+esc(coordinateString(p)),{direction:'top'});
}
function render(){
 if(!map||!catalog)return;renderLink();if(typeof renderQuestMarkers==='function')renderQuestMarkers();const query=norm($('search').value.trim()),numeric=/^-?\d+[\s,;]+-?\d+(?:[\s,;]+-?\d+)?$/.test(query),mode=$('showMode').value;
 points=catalog.points.filter(p=>inLayer(p)&&active.has(p.category)&&(!query||numeric||p.searchText.includes(query))&&(mode==='all'||pointState(p)===(mode==='missing'?0:mode==='found'?1:-1)));
 $('visibleCount').textContent=t('{n} puntos filtrados',{n:fmt(points.length)});objects.clearLayers();routes.clearLayers();
 const bounds=map.getBounds().pad(.15),visible=points.filter(p=>bounds.contains(p.latLng));
 if($('showPaths').checked){
  for(const p of points)if(p.routeCoordinates.length>1)L.polyline(p.routeCoordinates,{color:'#e6d9a0',weight:1.5,opacity:.85,interactive:false}).addTo(routes);
  const caves=new Map();for(const p of points){if(p.category!=='caves'||pointState(p)===1)continue;if(!caves.has(p.name))caves.set(p.name,[]);caves.get(p.name).push(p);}
  for(const group of caves.values())if(group.length===2)L.polyline(group.map(p=>p.latLng),{color:'#bfa574',weight:1.5,dashArray:'4 4',opacity:.8,interactive:false}).addTo(routes);
 }
 for(const p of visible){
  const s=pointState(p),textLabel=p.category==='locations'&&map.getZoom()>=-2.5,size=map.getZoom()<-3?15:map.getZoom()<-1.5?20:27;
  const css=(textLabel?'location-label':'point-icon')+(s===1?' found':s===-1?' unknown':'')+(selected?.id===p.id?' selected':'');
  const icon=L.divIcon({className:css,html:textLabel?esc(p.name):`<img alt="" src="${pointIcon(p)}">`,iconSize:textLabel?[150,24]:[size,size],iconAnchor:textLabel?[75,12]:[size/2,size/2]});
  const marker=L.marker(p.latLng,{icon,title:p.name,alt:p.name,zIndexOffset:selected?.id===p.id?1000:p.category==='locations'?-100:0});
  marker.bindTooltip(esc(p.name)+'<br><small>'+esc(showState(s))+'</small>',{direction:'top'});marker.on('click',()=>detail(p,false));objects.addLayer(marker);
 }
}
// Leaflet can emit moveend and zoomend together; draw once per browser frame.
function scheduleRender(){
 if(renderFrame!==null)return;
 renderFrame=requestAnimationFrame(()=>{renderFrame=null;render();});
}
function guideLink(p){
 // These categories have named location articles. Unnamed collectibles use the map.
 if(['shrines','lightroots','caves','wells','chasms','locations','bubbuls'].includes(p.category))
  return 'https://www.zeldadungeon.net/wiki/'+encodeURIComponent(p.name.replace(/ /g,'_'));
 // Zelda Dungeon's map uses north/east, whereas our world positions use east/south.
 const region=p.position.y<=-50?'Depths':p.position.y>=750?'Sky':'Surface';
 return `https://www.zeldadungeon.net/tears-of-the-kingdom-interactive-map/?z=6&x=${Math.round(-p.position.z)}&y=${Math.round(p.position.x)}&l=${region}`;
}
function detail(p,pan){
 selected=p;$('detailIcon').src=pointIcon(p);$('detailCategory').textContent=categories[p.category].name.toUpperCase();$('detailName').textContent=p.name;$('detailState').textContent=p.category==='towers'?t('Activada: {state}',{state:booleanLabel(pointState(p))}):showState(pointState(p));$('detailCoords').textContent=coordinateString(p.position);$('korokInfo').textContent=p.category==='towers'?t('Visitada: {state}',{state:booleanLabel(snapshot?.visited?.[p.index]??-1)}):p.korokType?t('Tipo original: {type}',{type:p.korokType})+(p.path?t(' · La ruta está dibujada en el mapa.'):''):'';
 const rule=p.category==='towers'?t('Activación de la atalaya'):p.guid?t('Presencia de GUID UInt64'):descriptions[p.category]||t('Valor distinto de cero');
 const rows=[['ID',p.id],['Hash / GUID',p.guid||'0x'+Number(p.hash).toString(16).padStart(8,'0')],[t('Valor leído'),snapshot?snapshot.values[p.index]:t('Sin partida')],[t('Criterio original'),rule],[t('Origen'),p.origin||t('map_data.json · sin registros añadidos')]];
 if(p.visitHash)rows.push([t('Hash de visita'),'0x'+Number(p.visitHash).toString(16).padStart(8,'0')]);
 $('diagnostics').replaceChildren();for(const [key,value]of rows){const line=document.createElement('div');line.textContent=key+': '+value;$('diagnostics').append(line);}
 $('detail').hidden=false;
 $('viewGuide').href=guideLink(p);
 $('guideHint').textContent=['shrines','lightroots','caves','wells','chasms','locations','bubbuls'].includes(p.category)?t('Abre la ficha en Zelda Dungeon.'):t('Abre la ubicación en Zelda Dungeon. Selecciona su icono para consultar la ayuda.');
 if(pan){map.setView(ll(p.position),Math.max(map.getZoom(),-1));render();}
}
async function command(action,body){const res=await fetch('api/'+action,{method:'POST',body:body??''}),reply=await res.json();if(!res.ok||!reply.ok)throw Error(reply.error||t('No se pudo completar la acción.'));await poll();}
async function uploadSave(file){try{if(!file)return;await command('upload',await file.arrayBuffer());$('fileDialog').close();toast(t('Guardado cargado en memoria · no se ha modificado el archivo'));}catch(e){toast(e.message);}finally{$('saveFile').value='';}}
async function chooseSave(){
 $('fileError').textContent='';$('fileDialog').showModal();
 try{const data=await(await fetch('api/source-options')).json(),select=$('knownSaves');select.replaceChildren();const custom=document.createElement('option');custom.value='';custom.textContent=t('Ruta personalizada');select.append(custom);for(const item of data.saves){const option=document.createElement('option');option.value=item.path;option.textContent=item.name;select.append(option);}select.value=data.saves.at(-1)?.path||'';$('filePath').value=(sourceMode==='file'?source:'')||select.value;}catch{$('fileError').textContent=t('Pega la ruta de progress.sav o usa Explorar archivos.');}
}
async function browseFolders(path){
 try{const res=await fetch('api/folders?path='+encodeURIComponent(path||'')),data=await res.json();if(!res.ok)throw Error(data.error);$('folderBrowser').hidden=false;$('folderCurrent').textContent=data.path||t('Elige una unidad');$('folderUp').dataset.parent=data.parent;$('folderUp').disabled=!data.path;if(data.path)$('folderPath').value=data.path;$('folderEntries').replaceChildren();for(const item of data.folders){const b=document.createElement('button');b.type='button';b.className='folder-entry';b.textContent='▸ '+item.name;b.onclick=()=>browseFolders(item.path);$('folderEntries').append(b);}if(!data.folders.length){const empty=document.createElement('p');empty.textContent=t('Sin subcarpetas visibles. Puedes seleccionar esta carpeta.');$('folderEntries').append(empty);}$('folderError').textContent='';}catch(e){$('folderError').textContent=e.message;}
}
async function chooseFolder(){
 $('folderError').textContent='';$('folderBrowser').hidden=true;$('folderDialog').showModal();
 try{const res=await fetch('api/source-options'),data=await res.json();const select=$('knownFolders');select.replaceChildren();const custom=document.createElement('option');custom.value='';custom.textContent=t('Ruta personalizada');select.append(custom);
  for(const item of data.choices){const option=document.createElement('option');option.value=item.path;option.textContent=item.name;select.append(option);}
  select.value=data.choices[0]?.path||'';$('folderPath').value=(sourceMode==='folder'?source:'')||data.choices[0]?.path||data.defaultPath||'';
 }catch(e){$('folderError').textContent=t('Pega la ruta de tu carpeta de guardados.');}
}
function displaySnapshot(next){
 snapshot=next;$('welcome').hidden=!!next;
 $('saveInfo').textContent=next?t('{file} · {h} h {m} min · formato {format}',{file:next.file.split(/[\\/]/).slice(-2).join(' / '),h:Math.floor(next.playtime/3600),m:Math.floor(next.playtime%3600/60),format:next.format}):'';
 $('previewBanner').hidden=!previewSnapshot;$('previewLabel').textContent=previewSnapshot?t('Consultando {file} · {time}',{file:previewSnapshot.file.split(/[\\/]/).slice(-2).join(' / '),time:new Date(previewSnapshot.savedAt).toLocaleString(I18N.language)}):'';
 updateCounts();render();if(typeof renderInventory==='function')renderInventory();if(typeof renderQuests==='function')renderQuests();
}
function returnToLive(){previewSnapshot=null;displaySnapshot(liveSnapshot);if(showLink&&followLink)centerLink({zoom:false});}
function viewInspected(){
 if(!inspectedSnapshot)return;previewSnapshot=inspectedSnapshot;displaySnapshot(previewSnapshot);$('savesDialog').close();
 // Opening a historical save must not move the view to an unverified position.
 if(showLink)centerLink();
}
let inspectedSnapshot=null,inspectBusy=false;
function showSaveSummary(summary){
 $('inspectedInfo').textContent=t('{file} · {h} h {m} min · formato {format}',{file:summary.file.split(/[\\/]/).slice(-2).join(' / '),h:Math.floor(summary.playtime/3600),m:Math.floor(summary.playtime%3600/60),format:summary.format});
 $('inspectedLocation').textContent=locationText(summary)+' · '+new Date(summary.savedAt).toLocaleString(I18N.language);
 $('saveCounts').replaceChildren();for(const count of summary.counts){const row=document.createElement('tr');for(const value of [categories[count.id].name,fmt(count.found)+' / '+fmt(count.total),fmt(count.unknown)]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}$('saveCounts').append(row);}
 $('inspectedDetails').hidden=false;$('viewInspected').disabled=!inspectedSnapshot;
}
async function inspectSave(path,file){
 if(inspectBusy)return;inspectBusy=true;$('savesError').textContent='';$('inspectPath').disabled=true;$('inspectUpload').disabled=true;$('viewInspected').disabled=true;
 try{
  const res=await fetch('api/'+(file?'inspect-upload':'inspect-file'),{method:'POST',body:file?await file.arrayBuffer():path}),reply=await res.json();
  if(!res.ok||!reply.ok)throw Error(reply.error||t('No se pudo completar la acción.'));
  if(file){reply.snapshot.file=file.name;reply.snapshot.savedAt=new Date(file.lastModified).toISOString();reply.summary.file=file.name;reply.summary.savedAt=reply.snapshot.savedAt;}
  inspectedSnapshot=reply.snapshot;showSaveSummary(reply.summary);
 }catch(e){$('savesError').textContent=e.message;}finally{inspectBusy=false;$('inspectPath').disabled=false;$('inspectUpload').disabled=false;$('viewInspected').disabled=!inspectedSnapshot;$('inspectUpload').value='';}
}
async function loadSaveSlots(){
 if(savesLoading)return;savesLoading=true;$('reloadSlots').disabled=true;$('savesError').textContent='';
 try{
  const res=await fetch('api/saves',{cache:'no-store'});if(!res.ok)throw Error(t('No se pudo completar la acción.'));const data=await res.json();$('saveSlots').replaceChildren();
  for(const slot of data.slots){
   const card=document.createElement('article');card.className='save-slot';const title=document.createElement('strong');title.textContent=slot.file.split(/[\\/]/).slice(-2).join(' / ');const info=document.createElement('p');
   info.textContent=slot.summary?t('{h} h {m} min · {format} · {time}',{h:Math.floor(slot.summary.playtime/3600),m:Math.floor(slot.summary.playtime%3600/60),format:slot.summary.format,time:new Date(slot.summary.savedAt).toLocaleString(I18N.language)}):'';
   const status=document.createElement('p');status.textContent=slot.status==='error'?slot.error:slot.status==='reading'?t('Leyendo guardado…'):locationText(slot.summary);
   const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent=t('Consultar');button.disabled=slot.status!=='ok';button.onclick=()=>{if(!inspectBusy)inspectSave(slot.file);};card.append(title,info,status,button);$('saveSlots').append(card);
  }
  $('noSlots').hidden=!!data.slots.length;
 }catch(e){$('savesError').textContent=e.message;}finally{savesLoading=false;$('reloadSlots').disabled=false;}
}
function openSaves(){$('savesDialog').showModal();loadSaveSlots();}
function syncOpacityControl(){
 $('linkOpacity').value=linkOpacity;$('linkOpacityValue').textContent=linkOpacity+'%';$('linkOpacity').disabled=!showLink;
}
function previewOpacity(){
 editingOpacity=true;linkOpacity=Number($('linkOpacity').value);$('linkOpacityValue').textContent=linkOpacity+'%';renderLink();
}
async function saveLinkOpacity(){
 $('linkOpacity').disabled=true;
 try{await command('link-opacity',String(linkOpacity));}catch(e){toast(e.message);}finally{editingOpacity=false;await poll();syncOpacityControl();renderLink();}
}
async function poll(){
 if(polling)return;polling=true;try{
  const response=await fetch('api/state',{cache:'no-store'});if(!response.ok)throw Error(response.status);const state=await response.json();source=state.source;sourceMode=state.mode;
  if(state.language&&state.language!==I18N.language){location.reload();return;}
  $('statusDot').className=state.status==='ok'?'ok':state.status==='error'?'error':'';
  $('statusTitle').textContent=state.picking?t('Selecciona en la ventana de Windows'):state.status==='error'?t('Revisa el guardado'):state.status==='reading'?t('Leyendo guardado…'):state.snapshot?t('Partida cargada'):t('Sin partida cargada');
  $('sourceName').textContent=source?(sourceMode==='folder'?t('Carpeta: '):t('Archivo: '))+source.split(/[\\/]/).filter(Boolean).slice(-2).join(' / '):state.snapshot?t('progress.sav · carga manual'):t('Elige tu carpeta de guardados de TOTK Recomp.');
  $('watchedPath').textContent=source?t('Origen: ')+source:'';$('error').hidden=!state.message;$('error').textContent=state.message||'';$('autosync').checked=state.auto;
  if(!$('runInBackground').disabled)$('runInBackground').checked=state.runInBackground===true;
  $('liveStatus').textContent=state.auto&&source?t('● Observando cambios')+(state.changedAt?t(' · mapa actualizado {time}',{time:new Date(state.changedAt).toLocaleTimeString(I18N.language)}):''):source?t('Autosync en pausa · puedes actualizar manualmente'):t('Elige una carpeta para seguir tu partida automáticamente.');
  $('liveStatus').classList.toggle('live',state.auto&&!!source);
  $('openSave').disabled=state.picking;$('openFolder').disabled=state.picking;$('refresh').disabled=!source;
  const wasFollowing=showLink&&followLink,previousShow=showLink,previousOrder=linkOrder,previousOpacity=linkOpacity;
  followLink=state.followLink===true;showLink=state.showLink!==false;linkOrder=state.linkOrder==='above'?'above':'below';
  if(!editingOpacity){linkOpacity=Number.isFinite(state.linkOpacity)?Math.max(0,Math.min(100,state.linkOpacity)):45;syncOpacityControl();}
  $('followLink').checked=followLink;$('followLink').disabled=!showLink;$('showLink').checked=showLink;$('linkOrder').value=linkOrder;$('linkOrder').disabled=!showLink;
  const next=state.snapshot;liveSnapshot=next;
  if(!previewSnapshot){
   const changed=next?.revision!==snapshot?.revision||next?.file!==snapshot?.file;
   if(changed){const previous=!!snapshot;displaySnapshot(next);if(showLink&&followLink)centerLink({zoom:false});if(previous&&next)toast(t('Mapa actualizado con el guardado'));}
   else if(showLink&&followLink&&!wasFollowing)centerLink({zoom:false});
  }
  if(showLink!==previousShow||linkOrder!==previousOrder||linkOpacity!==previousOpacity)render();
 }catch(e){$('statusDot').className='error';$('statusTitle').textContent=t('Ejecutable desconectado');$('error').hidden=false;$('error').textContent=t('Abre HyruleSync.exe para reanudar. Se conserva la última vista.');}finally{polling=false;}
}
async function init(){
 const res=await fetch('catalog.json');if(!res.ok)throw Error(t('No se puede cargar map_data.json.'));prepareCatalog(await res.json());
 if(Array.isArray(prefs.active))active=new Set(prefs.active.filter(c=>categories[c]));$('showMode').value=['missing','found','all','unknown'].includes(prefs.mode)?prefs.mode:'missing';$('showPaths').checked=prefs.paths!==false;buildCategories();updateCounts();
 map=L.map('map',{crs:L.CRS.Simple,minZoom:-5,maxZoom:2,zoomSnap:.25,zoomDelta:.5,zoomControl:false,attributionControl:false,maxBounds:[[-7500,-7500],[7500,7500]],maxBoundsViscosity:.8}).fitBounds([[-6000,-6000],[6000,6000]]);
 map.createPane('linkBelow').style.zIndex=550;map.createPane('linkAbove').style.zIndex=625;
 routes=L.layerGroup().addTo(map);objects=L.layerGroup().addTo(map);switchLayer(['surface','sky','depths'].includes(prefs.layer)?prefs.layer:'surface');map.on('moveend zoomend',scheduleRender);map.on('mousemove',e=>$('mouseCoords').textContent=`${Math.trunc(e.latlng.lng)}, ${Math.trunc(e.latlng.lat)}`);
 $('centerLink').onclick=centerLink;$('followLink').onchange=async()=>{const enabled=$('followLink').checked;$('followLink').disabled=true;try{await command(enabled?'follow-on':'follow-off');}catch(e){$('followLink').checked=followLink;toast(e.message);}finally{$('followLink').disabled=!showLink;}};
 $('showLink').onchange=async()=>{const enabled=$('showLink').checked;$('showLink').disabled=true;try{await command(enabled?'show-link':'hide-link');}catch(e){$('showLink').checked=showLink;toast(e.message);}finally{$('showLink').disabled=false;}};
 $('linkOrder').onchange=async()=>{try{await command($('linkOrder').value==='below'?'link-below':'link-above');}catch(e){$('linkOrder').value=linkOrder;toast(e.message);}};
 $('linkOpacity').oninput=previewOpacity;$('linkOpacity').onchange=saveLinkOpacity;
 $('openSaves').onclick=openSaves;$('reloadSlots').onclick=loadSaveSlots;$('returnLive').onclick=returnToLive;$('viewInspected').onclick=viewInspected;
 $('inspectPath').onclick=()=>inspectSave($('inspectFilePath').value);$('inspectUpload').onchange=()=>{const file=$('inspectUpload').files[0];if(file)inspectSave(null,file);};
 document.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>switchLayer(b.dataset.layer));$('openSave').onclick=$('welcomeLoad').onclick=chooseSave;$('saveFile').onchange=()=>uploadSave($('saveFile').files[0]);$('openFolder').onclick=$('welcomeFolder').onclick=chooseFolder;$('refresh').onclick=()=>command('refresh').catch(e=>toast(e.message));$('autosync').onchange=()=>{if($('autosync').checked&&!source)chooseFolder();else command($('autosync').checked?'auto-on':'auto-off').catch(e=>toast(e.message));};
 $('browseFolder').onclick=()=>browseFolders($('folderPath').value);
 $('folderUp').onclick=()=>browseFolders($('folderUp').dataset.parent||'');$('folderDrives').onclick=()=>browseFolders('');
 $('knownSaves').onchange=()=>{if($('knownSaves').value)$('filePath').value=$('knownSaves').value;};$('fileDialog').querySelector('form').onsubmit=async e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();try{await command('set-file',$('filePath').value);$('fileDialog').close();}catch(error){$('fileError').textContent=error.message;}};
 $('knownFolders').onchange=()=>{if($('knownFolders').value)$('folderPath').value=$('knownFolders').value;};
 $('folderDialog').querySelector('form').onsubmit=async e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();try{await command('set-folder',$('folderPath').value);$('folderDialog').close();}catch(error){$('folderError').textContent=error.message;}};
 $('all').onclick=()=>{active=new Set(catalog.categories.map(c=>c.id));document.querySelectorAll('[data-category]').forEach(c=>c.checked=true);savePrefs();render();};$('none').onclick=()=>{active.clear();document.querySelectorAll('[data-category]').forEach(c=>c.checked=false);savePrefs();render();};$('showMode').onchange=()=>{savePrefs();render();};$('search').oninput=scheduleRender;$('showPaths').onchange=()=>{savePrefs();render();};
 $('search').onkeydown=e=>{if(e.key!=='Enter')return;const coords=$('search').value.trim().split(/[\s,;]+/).map(Number);if(coords.length>=2&&coords.every(Number.isFinite)&&Math.abs(coords[0])<=6000&&Math.abs(coords[1])<=6000)map.setView([coords[1],coords[0]],-1);else if(points.length){const p=points[0];if(!inLayer(p))switchLayer(p.position.y>=750?'sky':p.position.y<=-50?'depths':'surface');detail(p,true);}};
 $('closeDetail').onclick=()=>{$('detail').hidden=true;selected=null;render();};$('zoomSelected').onclick=()=>{if(selected)detail(selected,true);};$('copyCoords').onclick=async()=>{try{await navigator.clipboard.writeText(coordinateString(selected.position));toast(t('Coordenadas copiadas'));}catch{toast(coordinateString(selected.position));}};
 $('zoomIn').onclick=()=>map.zoomIn();$('zoomOut').onclick=()=>map.zoomOut();$('fitMap').onclick=()=>map.fitBounds([[-6000,-6000],[6000,6000]]);$('toggleSidebar').onclick=()=>$('sidebar').classList.toggle('open');
 map.on('click',()=>{if(innerWidth<=680)$('sidebar').classList.remove('open');});document.onkeydown=e=>{if(e.key==='Escape'){$('detail').hidden=true;$('sidebar').classList.remove('open');}if(e.key==='/'&&document.activeElement.tagName!=='INPUT'){e.preventDefault();$('sidebar').classList.add('open');$('search').focus();}};
 await poll();if(location.hash==='#folder')chooseFolder();setInterval(poll,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});
}
async function boot(){
 try{
  const state=await(await fetch('api/setup')).json();
  if(state.ready){$('setup').hidden=true;document.body.classList.remove('preparing');await init();return;}
  document.body.classList.add('preparing');$('setup').hidden=false;$('prepareResources').disabled=state.busy;$('prepareResources').textContent=state.busy?t('Preparando mapa…'):state.error?t('Reintentar descarga'):t('Descargar recursos del mapa');
  const percent=state.total?Math.min(100,Math.round(state.received/state.total*100)):0;$('setupProgress').value=percent;$('setupStatus').textContent=state.busy?`${percent}% · ${state.current}`:t('Luego podrás elegir tu carpeta de guardados.');$('setupError').textContent=state.error||'';
 }catch(e){$('setup').hidden=false;$('setupError').textContent=t('No se pudo conectar con HyruleSync. ')+e.message;}
 setTimeout(boot,1000);
}
$('prepareResources').onclick=async()=>{try{const res=await fetch('api/prepare-map',{method:'POST',body:''});if(!res.ok)throw Error(t('No se pudo iniciar la descarga.'));$('prepareResources').disabled=true;}catch(e){$('setupError').textContent=e.message;}};
async function showLicense(name,title){
 $('licenseTitle').textContent=title;$('licenseText').textContent='';$('licenseDialog').showModal();try{const res=await fetch('legal/'+name);if(!res.ok)throw Error(t('No se pudo cargar el texto de licencia.'));$('licenseText').textContent=await res.text();}catch(e){$('licenseText').textContent=e.message;}
}
async function checkUpdates(manual=false){
 if(checkingUpdates)return;checkingUpdates=true;clearTimeout(updateTimer);$('checkUpdates').disabled=true;
 try{
  if(manual){const response=await fetch('api/check-updates',{method:'POST',body:''});if(!response.ok)throw Error();}
  const response=await fetch('api/updates',{cache:'no-store'});if(!response.ok)throw Error();const state=await response.json();
  latestUpdate=state;$('viewChanges').disabled=!state.releaseUrl;$('aboutChanges').disabled=!state.releaseUrl;
  $('aboutVersion').textContent='HyruleSync '+state.currentVersion;
  $('updateNotice').hidden=!state.available;
  $('updateMessage').textContent=state.available?t('Nueva versión disponible: v{version}',{version:state.latestVersion}):'';
  // The server accepts only this repository's exact Windows release asset.
  const canDownload=Boolean(state.available&&state.downloadUrl);
  for(const id of ['downloadUpdate','aboutDownloadUpdate']){
   const download=$(id);download.hidden=!canDownload;download.removeAttribute('href');
   if(canDownload)download.href=state.downloadUrl;
  }
  $('aboutUpdateInstructions').hidden=!canDownload;
  $('updateStatus').textContent=state.busy?t('Buscando actualizaciones…'):state.error|| (state.available?t('Nueva versión disponible: v{version}',{version:state.latestVersion}):state.latestVersion?t('Tienes la última versión.'):t('Todavía no hay versiones publicadas.'));
  updateTimer=setTimeout(()=>checkUpdates(),state.busy?1000:60000);
 }catch{$('updateStatus').textContent=t('No se pudieron buscar actualizaciones. Puedes reintentar.');updateTimer=setTimeout(()=>checkUpdates(),60000);}
 finally{checkingUpdates=false;$('checkUpdates').disabled=false;}
}
function showChanges(){
 if(!latestUpdate?.releaseUrl)return;
 $('changesVersion').textContent='HyruleSync v'+latestUpdate.latestVersion;
 $('changesText').textContent=latestUpdate.releaseNotes?.trim()||t('Esta versión no tiene notas de cambios.');
 $('changesLink').href=latestUpdate.releaseUrl;$('changesDialog').showModal();
}
function trackPageLifetime(){
 const pageId=crypto.randomUUID().replace(/-/g,'');let connection;
 const connect=()=>{if(!connection||connection.readyState===EventSource.CLOSED)connection=new EventSource('api/page-session?id='+pageId);};
 connect();window.addEventListener('pageshow',connect);
 window.addEventListener('pagehide',()=>{
  connection?.close();
  if(!navigator.sendBeacon('api/page-close',pageId))fetch('api/page-close',{method:'POST',body:pageId,keepalive:true}).catch(()=>{});
 });
}
async function changeBackgroundMode(){
 const input=$('runInBackground'),enabled=input.checked;input.disabled=true;
 try{const res=await fetch('api/'+(enabled?'background-on':'background-off'),{method:'POST',body:''});const reply=await res.json();if(!res.ok||!reply.ok)throw Error(reply.error||t('No se pudo completar la acción.'));}
 catch(e){input.checked=!enabled;toast(e.message);}finally{input.disabled=false;}
}
async function changeLanguage(event){
 const controls=[...document.querySelectorAll('[data-language-select]')];controls.forEach(control=>control.disabled=true);
 try{
  const response=await fetch('api/language',{method:'POST',body:event.target.value}),reply=await response.json();
  if(!response.ok||!reply.ok)throw Error(reply.error||t('No se pudo completar la acción.'));
  location.reload();
 }catch(e){controls.forEach(control=>{control.value=control.dataset.preference;control.disabled=false;});if(!$('setup').hidden)$('setupError').textContent=e.message;else toast(e.message);}
}
async function start(){
 trackPageLifetime();
 try{const config=await(await fetch('api/config')).json();I18N.setLanguage(config.language);$('runInBackground').checked=config.runInBackground===true;document.querySelectorAll('[data-language-select]').forEach(control=>control.value=config.languagePreference||'auto');}catch{I18N.setLanguage('en');}
 document.querySelectorAll('[data-language-select]').forEach(control=>{control.dataset.preference=control.value;control.onchange=changeLanguage;});
 I18N.apply();initInventory();initQuests();
 const openAbout=()=>{$('aboutDialog').showModal();checkUpdates();};
 $('aboutOpen').onclick=openAbout;$('setupAboutOpen').onclick=openAbout;
 $('checkUpdates').onclick=()=>checkUpdates(true);checkUpdates();
 $('viewChanges').onclick=showChanges;$('aboutChanges').onclick=showChanges;
 $('runInBackground').onchange=changeBackgroundMode;
 document.querySelectorAll('[data-license]').forEach(button=>button.onclick=()=>showLicense(button.dataset.license,button.textContent));
 $('thirdPartyNotice').onclick=()=>showLicense('third-party.'+I18N.language+'.md',t('Avisos y procedencia de terceros'));
 boot();
}
start();
