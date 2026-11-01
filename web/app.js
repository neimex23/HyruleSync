'use strict';
const t=(key,values)=>I18N.t(key,values), $=id=>document.getElementById(id), fmt=n=>new Intl.NumberFormat(I18N.language).format(n), norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const descriptions={'shrines':'Clear · 1654019904','carry_koroks':'Clear · 1654019904','lightroots':'Open · 404286466'};
let catalog,categories,map,background,objects,routes,snapshot=null,revision='',selected=null,layer='surface',active=new Set(['hidden_koroks','carry_koroks','shrines']),points=[],polling=false,source='',sourceMode='file',toastTimer;
const prefKey='hyrulesync.preferences';let prefs={};try{prefs=JSON.parse(localStorage.getItem(prefKey)||'{}');}catch{}
const pointState=p=>snapshot?snapshot.states[p.index]:-1;
// The same layer thresholds and coordinate conversion as MapObject.cpp and ObjectInfo.cpp.
const inLayer=p=>layer==='depths'?p.position.y<=-50:layer==='sky'?p.position.y>=750:p.position.y>=-50&&p.position.y<=750;
const ll=p=>[-p.z,p.x];
const coordinateString=p=>[p.x,-p.z,p.y-105].map(v=>{const n=Math.trunc(v);return(n<0?'-':'')+Math.abs(n).toString().padStart(4,'0');}).join('  ');
function toast(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function savePrefs(){localStorage.setItem(prefKey,JSON.stringify({active:[...active],mode:$('showMode').value,layer,paths:$('showPaths').checked}));}
function showState(s){return s===1?t('Completado'):s===0?t('Pendiente'):t('Sin verificar · no hay datos suficientes');}
function updateCounts(){
 const found=snapshot?snapshot.states.filter(s=>s===1).length:0,unknown=snapshot?snapshot.states.filter(s=>s===-1).length:catalog.points.length;
 $('foundCount').textContent=snapshot?fmt(found):'—';$('totalCount').textContent=fmt(catalog.points.length);$('progress').style.width=(snapshot?found/catalog.points.length*100:0)+'%';
 $('missingCount').textContent=snapshot?t('{n} pendientes',{n:fmt(catalog.points.length-found-unknown)})+(unknown?t(' · {n} sin verificar',{n:fmt(unknown)}):''):t('Carga una partida para calcular los pendientes.');
 for(const c of catalog.categories){const list=catalog.points.filter(p=>p.category===c.id),done=list.filter(p=>pointState(p)===1).length,unverified=list.filter(p=>pointState(p)===-1).length,node=$('count-'+c.id);node.textContent=snapshot?`${list.length-done-unverified} / ${list.length}`:`— / ${list.length}`;node.title=t('{found} completados; {missing} pendientes; {unknown} sin verificar. Todas las capas.',{found:fmt(done),missing:fmt(list.length-done-unverified),unknown:fmt(unverified)});}
 if(selected)detail(selected,false);
}
function buildCategories(){for(const c of catalog.categories){
 const row=document.createElement('label');row.className='category';const check=document.createElement('input');check.type='checkbox';check.checked=active.has(c.id);check.dataset.category=c.id;check.onchange=()=>{check.checked?active.add(c.id):active.delete(c.id);savePrefs();render();};
 const icon=document.createElement('img');icon.src=`assets/icons/${c.icon}.png`;icon.alt='';const label=document.createElement('span');label.className='name';label.textContent=c.name;const count=document.createElement('span');count.className='count';count.id='count-'+c.id;row.append(check,icon,label,count);$('categories').append(row);
}}
function switchLayer(next){
 if(!['surface','sky','depths'].includes(next))return;layer=next;
 document.querySelectorAll('[data-layer]').forEach(b=>{b.classList.toggle('active',b.dataset.layer===layer);b.setAttribute('aria-pressed',b.dataset.layer===layer);});
 if(background)map.removeLayer(background);
 // Upstream: a centred 4500x4500 image and MapScale=0.375 => 12000x12000 world units.
 background=L.imageOverlay(`assets/map/${layer}-medium.png`,[[-6000,-6000],[6000,6000]],{interactive:false}).addTo(map);background.bringToBack();savePrefs();render();
}
function render(){
 if(!map||!catalog)return;const query=norm($('search').value.trim()),numeric=/^-?\d+[\s,;]+-?\d+(?:[\s,;]+-?\d+)?$/.test(query),mode=$('showMode').value;
 points=catalog.points.filter(p=>inLayer(p)&&active.has(p.category)&&(!query||numeric||norm(p.name+' '+p.korokType+' '+p.internalName+' '+categories[p.category].name).includes(query))&&(mode==='all'||pointState(p)===(mode==='missing'?0:mode==='found'?1:-1)));
 $('visibleCount').textContent=t('{n} puntos filtrados',{n:fmt(points.length)});objects.clearLayers();routes.clearLayers();
 const bounds=map.getBounds().pad(.15),visible=points.filter(p=>bounds.contains(ll(p.position)));
 if($('showPaths').checked){
  for(const p of points){if(!p.path)continue;let route=p.path.flowers?.map(f=>f.position)||(p.path.start&&p.path.end?[p.path.start,p.path.end]:[]);if(route.length>1)L.polyline(route.map(ll),{color:'#e6d9a0',weight:1.5,opacity:.85,interactive:false}).addTo(routes);}
  const caves=new Map();for(const p of points){if(p.category!=='caves'||pointState(p)===1)continue;if(!caves.has(p.name))caves.set(p.name,[]);caves.get(p.name).push(p);}
  for(const group of caves.values())if(group.length===2)L.polyline(group.map(p=>ll(p.position)),{color:'#bfa574',weight:1.5,dashArray:'4 4',opacity:.8,interactive:false}).addTo(routes);
 }
 for(const p of visible){
  const c=categories[p.category],s=pointState(p),textLabel=p.category==='locations'&&map.getZoom()>=-2.5,size=map.getZoom()<-3?15:map.getZoom()<-1.5?20:27;
  const css=(textLabel?'location-label':'point-icon')+(s===1?' found':s===-1?' unknown':'')+(selected?.id===p.id?' selected':'');
  const icon=L.divIcon({className:css,html:textLabel?esc(p.name):`<img alt="" src="assets/icons/${c.icon}.png">`,iconSize:textLabel?[150,24]:[size,size],iconAnchor:textLabel?[75,12]:[size/2,size/2]});
  const marker=L.marker(ll(p.position),{icon,title:p.name,alt:p.name,zIndexOffset:selected?.id===p.id?1000:p.category==='locations'?-100:0});
  marker.bindTooltip(esc(p.name)+'<br><small>'+esc(showState(s))+'</small>',{direction:'top'});marker.on('click',()=>detail(p,false));objects.addLayer(marker);
 }
}
function detail(p,pan){
 selected=p;$('detailIcon').src=`assets/icons/${categories[p.category].icon}.png`;$('detailCategory').textContent=categories[p.category].name.toUpperCase();$('detailName').textContent=p.name;$('detailState').textContent=showState(pointState(p));$('detailCoords').textContent=coordinateString(p.position);$('korokInfo').textContent=p.korokType?t('Tipo original: {type}',{type:p.korokType})+(p.path?t(' · La ruta está dibujada en el mapa.'):''):'';
 const rule=p.guid?t('Presencia de GUID UInt64'):descriptions[p.category]||t('Valor distinto de cero');
 const rows=[['ID',p.id],['Hash / GUID',p.guid||'0x'+Number(p.hash).toString(16).padStart(8,'0')],[t('Valor leído'),snapshot?snapshot.values[p.index]:t('Sin partida')],[t('Criterio original'),rule],[t('Origen'),t('map_data.json · sin registros añadidos')]];
 $('diagnostics').replaceChildren();for(const [key,value]of rows){const line=document.createElement('div');line.textContent=key+': '+value;$('diagnostics').append(line);}
 $('detail').hidden=false;
 if(pan){map.setView(ll(p.position),Math.max(map.getZoom(),-1));render();}
}
async function command(action,body){const res=await fetch('api/'+action,{method:'POST',body:body??''}),reply=await res.json();if(!res.ok||!reply.ok)throw Error(reply.error||t('No se pudo completar la acción.'));await poll();}
async function uploadSave(file){try{if(!file)return;await command('upload',await file.arrayBuffer());$('fileDialog').close();toast('Guardado cargado en memoria · no se ha modificado el archivo');}catch(e){toast(e.message);}finally{$('saveFile').value='';}}
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
async function poll(){
 if(polling)return;polling=true;try{
  const response=await fetch('api/state',{cache:'no-store'});if(!response.ok)throw Error(response.status);const state=await response.json();source=state.source;sourceMode=state.mode;
  $('statusDot').className=state.status==='ok'?'ok':state.status==='error'?'error':'';
  $('statusTitle').textContent=state.picking?t('Selecciona en la ventana de Windows'):state.status==='error'?t('Revisa el guardado'):state.status==='reading'?t('Leyendo guardado…'):state.snapshot?t('Partida cargada'):t('Sin partida cargada');
  $('sourceName').textContent=source?(sourceMode==='folder'?t('Carpeta: '):t('Archivo: '))+source.split(/[\\/]/).filter(Boolean).slice(-2).join(' / '):state.snapshot?t('progress.sav · carga manual'):t('Selecciona tu progress.sav de TOTK Recomp.');
  $('watchedPath').textContent=source?t('Origen: ')+source:'';$('error').hidden=!state.message;$('error').textContent=state.message||'';$('autosync').checked=state.auto;
  $('liveStatus').textContent=state.auto&&source?t('● Observando cambios')+(state.changedAt?t(' · mapa actualizado {time}',{time:new Date(state.changedAt).toLocaleTimeString(I18N.language)}):''):source?t('Autosync en pausa · puedes actualizar manualmente'):t('Elige una carpeta para seguir tu partida automáticamente.');
  $('liveStatus').classList.toggle('live',state.auto&&!!source);
  $('openSave').disabled=state.picking;$('openFolder').disabled=state.picking;$('refresh').disabled=!source;
  const next=state.snapshot;$('welcome').hidden=!!next;
  if(next){
   const seconds=next.playtime;$('saveInfo').textContent=t('{file} · {h} h {m} min · formato {format}',{file:next.file.split(/[\\/]/).slice(-2).join(' / '),h:Math.floor(seconds/3600),m:Math.floor(seconds%3600/60),format:next.format});
   if(next.revision!==revision||next.file!==snapshot?.file){const previous=!!snapshot;snapshot=next;revision=next.revision;updateCounts();render();if(previous)toast('Mapa actualizado con el guardado');}
  }else{$('saveInfo').textContent='';if(snapshot){snapshot=null;revision='';updateCounts();render();}}
 }catch(e){$('statusDot').className='error';$('statusTitle').textContent=t('Ejecutable desconectado');$('error').hidden=false;$('error').textContent=t('Abre HyruleSync.exe para reanudar. Se conserva la última vista.');}finally{polling=false;}
}
async function init(){
 const res=await fetch('catalog.json');if(!res.ok)throw Error(t('No se puede cargar map_data.json.'));catalog=await res.json();categories=Object.fromEntries(catalog.categories.map(c=>[c.id,c]));catalog.points.forEach((p,i)=>p.index=i);
 if(Array.isArray(prefs.active))active=new Set(prefs.active.filter(c=>categories[c]));$('showMode').value=['missing','found','all','unknown'].includes(prefs.mode)?prefs.mode:'missing';$('showPaths').checked=prefs.paths!==false;buildCategories();updateCounts();
 map=L.map('map',{crs:L.CRS.Simple,minZoom:-5,maxZoom:2,zoomSnap:.25,zoomDelta:.5,zoomControl:false,attributionControl:false,maxBounds:[[-7500,-7500],[7500,7500]],maxBoundsViscosity:.8}).fitBounds([[-6000,-6000],[6000,6000]]);
 routes=L.layerGroup().addTo(map);objects=L.layerGroup().addTo(map);switchLayer(prefs.layer||'surface');map.on('moveend zoomend',render);map.on('mousemove',e=>$('mouseCoords').textContent=`${Math.trunc(e.latlng.lng)}, ${Math.trunc(e.latlng.lat)}`);
 document.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>switchLayer(b.dataset.layer));$('openSave').onclick=chooseSave;$('welcomeLoad').onclick=chooseSave;$('saveFile').onchange=()=>uploadSave($('saveFile').files[0]);$('openFolder').onclick=chooseFolder;$('refresh').onclick=()=>command('refresh').catch(e=>toast(e.message));$('autosync').onchange=()=>{if($('autosync').checked&&!source)chooseFolder();else command($('autosync').checked?'auto-on':'auto-off').catch(e=>toast(e.message));};
 $('browseFolder').onclick=()=>browseFolders($('folderPath').value);
 $('folderUp').onclick=()=>browseFolders($('folderUp').dataset.parent||'');$('folderDrives').onclick=()=>browseFolders('');
 $('knownSaves').onchange=()=>{if($('knownSaves').value)$('filePath').value=$('knownSaves').value;};$('fileDialog').querySelector('form').onsubmit=async e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();try{await command('set-file',$('filePath').value);$('fileDialog').close();}catch(error){$('fileError').textContent=error.message;}};
 $('knownFolders').onchange=()=>{if($('knownFolders').value)$('folderPath').value=$('knownFolders').value;};
 $('folderDialog').querySelector('form').onsubmit=async e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();try{await command('set-folder',$('folderPath').value);await command('auto-on');$('folderDialog').close();}catch(error){$('folderError').textContent=error.message;}};
 $('all').onclick=()=>{active=new Set(catalog.categories.map(c=>c.id));document.querySelectorAll('[data-category]').forEach(c=>c.checked=true);savePrefs();render();};$('none').onclick=()=>{active.clear();document.querySelectorAll('[data-category]').forEach(c=>c.checked=false);savePrefs();render();};$('showMode').onchange=()=>{savePrefs();render();};$('search').oninput=render;$('showPaths').onchange=()=>{savePrefs();render();};
 $('search').onkeydown=e=>{if(e.key!=='Enter')return;const coords=$('search').value.trim().split(/[\s,;]+/).map(Number);if(coords.length>=2&&coords.every(Number.isFinite)&&Math.abs(coords[0])<=6000&&Math.abs(coords[1])<=6000)map.setView([coords[1],coords[0]],-1);else if(points.length){const p=points[0];if(!inLayer(p))switchLayer(p.position.y>=750?'sky':p.position.y<=-50?'depths':'surface');detail(p,true);}};
 $('closeDetail').onclick=()=>{$('detail').hidden=true;selected=null;render();};$('zoomSelected').onclick=()=>{if(selected)detail(selected,true);};$('copyCoords').onclick=async()=>{try{await navigator.clipboard.writeText(coordinateString(selected.position));toast('Coordenadas copiadas');}catch{toast(coordinateString(selected.position));}};
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
async function start(){
 try{const config=await(await fetch('api/config')).json();I18N.setLanguage(config.language);}catch{I18N.setLanguage('en');}
 I18N.apply();
 const openAbout=async()=>{$('aboutDialog').showModal();try{const credits=await(await fetch('api/credits')).json();$('aboutVersion').textContent='HyruleSync '+credits.version;}catch{}};
 $('aboutOpen').onclick=openAbout;$('setupAboutOpen').onclick=openAbout;
 document.querySelectorAll('[data-license]').forEach(button=>button.onclick=()=>showLicense(button.dataset.license,button.textContent));
 $('thirdPartyNotice').onclick=()=>showLicense('third-party.'+I18N.language+'.md',t('Avisos y procedencia de terceros'));
 boot();
}
start();
