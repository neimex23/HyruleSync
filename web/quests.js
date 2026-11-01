'use strict';
let questData=null,questLoading=false,questFailed=false,questView=false,selectedQuest=null;
let questMarkers=null,questLoadPromise=null,openQuestPopup=false;
let lastQuestRenderKey=null,lastQuestSnapshot=null;
const hiddenQuests=new Set();
function setQuestMapVisible(enabled){
 for(const id of ['showQuests','showQuestsSidebar','showQuestsList'])$(id).checked=enabled;
 saveQuestMapPreference();
 if(enabled)loadQuests();
 renderQuestMarkers();
}
function setQuestVisible(id,enabled){
 enabled?hiddenQuests.delete(id):hiddenQuests.add(id);
 if(!enabled&&selectedQuest===id){selectedQuest=null;openQuestPopup=false;}
 lastQuestRenderKey=null;
 try{localStorage.setItem('hyrulesync.hiddenQuests',JSON.stringify([...hiddenQuests]));}catch{}
 renderQuestMarkers();
}
function questRenderKey(){return JSON.stringify([layer,map.getZoom(),$('showQuests').checked,$('questSearch').value,$('questType').value,$('questState').value,selectedQuest]);}
const questTypes={main:'Principales',adventure:'Aventuras secundarias',shrine:'Pruebas heroicas',side:'Misiones secundarias'};
const questStates={done:'Hechas',active:'En curso',todo:'Por hacer',unknown:'Sin verificar'};
function questGuideLink(quest){
 // Zelda Dungeon's four TotK quest indexes list these article titles.
 const title=quest.id==='GerudoCanyon_GleeokLiver'?'Gleeok Guts (Side Quest)':quest.name;
 return 'https://www.zeldadungeon.net/wiki/'+encodeURIComponent(title.replace(/ /g,'_'));
}
function questGuideButton(quest){
 return `<a class="guide-button quest-guide" href="${esc(questGuideLink(quest))}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t('Ver guía en Zelda Dungeon (otra pestaña)'))}">${esc(t('Ver guía'))} · Zelda Dungeon</a>`;
}
function questSaveDetails(quest,progress){
 const missing=t('Sin verificar');
 const rows=[['ID',quest.id],[t('Campo del guardado'),'Step_'+quest.id],['Hash','0x'+quest.hash.toString(16).padStart(8,'0')],[t('Etapa registrada'),progress?.step||missing],[t('Valor leído'),progress?.raw==null?missing:'0x'+progress.raw.toString(16).padStart(8,'0')],[t('Revisión del guardado'),snapshot?.revision||missing]];
 return `<details class="quest-save-details"><summary>${esc(t('Verificar contra el guardado'))}</summary><dl>${rows.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl></details>`;
}
function setSaveView(view){
 inventoryView=view==='inventory';questView=view==='quests';
 for(const name of ['map','inventory','quests']){const enabled=name===view;$(name+'Panel').hidden=!enabled;$(name+'Tab').setAttribute('aria-selected',String(enabled));$(name+'Tab').tabIndex=enabled?0:-1;}
 document.body.classList.toggle('inventory-view',view!=='map');
 if(inventoryView){renderInventory();loadInventoryNames();}
 if(questView){renderQuests();loadQuests();}
 if(view==='map'&&map){map.invalidateSize();render();}
}
async function loadQuests(){
 if(questData)return;
 if(questLoadPromise)return questLoadPromise;
 questLoading=true;questFailed=false;
 questLoadPromise=(async()=>{try{
  const response=await fetch('quest-data.json');if(!response.ok)throw Error();
  questData=(await response.json()).quests;
  for(const quest of questData)quest.searchText=norm([quest.name,quest.id,quest.giver,quest.location,t(questTypes[quest.type])].join(' '));
 }catch{questFailed=true;}finally{questLoading=false;questLoadPromise=null;renderQuests();renderQuestMarkers();}})();
 return questLoadPromise;
}
function questProgress(){return new Map((snapshot?.quests||[]).map(q=>[q.id,q]));}
function filteredQuests(){
 const progress=questProgress(),query=norm($('questSearch').value.trim()),type=$('questType').value,state=$('questState').value;
 return (questData||[]).filter(q=>(!query||q.searchText.includes(query))&&(!type||q.type===type)&&(!state||(progress.get(q.id)?.state||'unknown')===state));
}
function renderQuests(){
 if(!questView)return;
 $('questSource').textContent=snapshot?t('Misiones de {file} · {time}',{file:snapshot.file.split(/[\\/]/).slice(-2).join(' / '),time:new Date(snapshot.savedAt).toLocaleString(I18N.language)}):t('Carga una partida para ver el estado de las misiones.');
 $('questLoadStatus').textContent=questFailed?t('No se pudieron cargar las misiones. Reintentar.'):questLoading?t('Cargando misiones…'):'';
 $('questRetry').hidden=!questFailed;
 if(!questData)return;
 const progress=questProgress(),counts={done:0,active:0,todo:0,unknown:0};
 for(const q of questData)counts[progress.get(q.id)?.state||'unknown']++;
 $('questStats').innerHTML=Object.entries(questStates).map(([state,label])=>`<div class="inventory-stat quest-${state}"><span>${esc(t(label))}</span><strong>${fmt(counts[state])}</strong></div>`).join('');
 const quests=filteredQuests();
 $('questResults').textContent=t('{shown} de {total} misiones',{shown:fmt(quests.length),total:fmt(questData.length)});
 $('questList').innerHTML=quests.length?quests.map(q=>{
  const state=progress.get(q.id)?.state||'unknown';
  return `<article class="quest-card${selectedQuest===q.id?' selected':''}" id="quest-${esc(q.id)}"><div class="quest-card-heading"><span>${esc(t(questTypes[q.type]))}</span><span class="quest-badge quest-${state}">${esc(t(questStates[state]))}</span></div><h2>${esc(q.name)}</h2><p>${esc(q.location==='-'?t('Ubicación variable'):q.location)}${q.giver&&q.giver!=='-'?' · '+esc(q.giver):''}</p><div class="quest-card-actions"><button class="secondary" data-quest-map="${esc(q.id)}"${q.position?'':' disabled'}>${esc(t(q.position?'Ver en el mapa':'Sin ubicación fija'))}</button>${questGuideButton(q)}${q.position?`<label class="quest-visibility"><input type="checkbox" data-quest-visible="${esc(q.id)}"${hiddenQuests.has(q.id)?'':' checked'}> ${esc(t('Mostrar en el mapa'))}</label>`:''}</div>${questSaveDetails(q,progress.get(q.id))}</article>`;
 }).join(''):`<p>${esc(t('No hay misiones con estos filtros.'))}</p>`;
}
function showQuestOnMap(id){
 const quest=questData?.find(q=>q.id===id);if(!quest?.position||!map)return;
 setQuestVisible(id,true);selectedQuest=id;setQuestMapVisible(true);setSaveView('map');
 if(layer!==playerLayer(quest.position))switchLayer(playerLayer(quest.position));
 $('detail').hidden=true;map.setView(ll(quest.position),Math.max(map.getZoom(),-1),{animate:false});openQuestPopup=true;render();
 document.querySelectorAll('.quest-map-marker.selected').forEach(node=>node.focus());
}
function renderQuestMarkers(){
 if(!map||!questData)return;
 const key=questRenderKey();
 if(key===lastQuestRenderKey&&snapshot===lastQuestSnapshot&&!openQuestPopup)return;
 lastQuestRenderKey=key;lastQuestSnapshot=snapshot;
 if(!questMarkers)questMarkers=L.layerGroup().addTo(map);
 questMarkers.clearLayers();if(!$('showQuests').checked)return;
 const progress=questProgress(),quests=filteredQuests();
 const selected=questData.find(q=>q.id===selectedQuest);if(selected&&!quests.includes(selected))quests.push(selected);
 // Offset co-located markers in screen pixels so every quest at a shared area remains clickable.
 const groups=new Map();
 for(const q of quests){if(!q.position||hiddenQuests.has(q.id)||!inLayer(q))continue;const key=ll(q.position).join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(q);}
 for(const group of groups.values())for(let index=0;index<group.length;index++){
  const q=group[index],state=progress.get(q.id)?.state||'unknown',chosen=q.id===selectedQuest;
  let location=ll(q.position);
  if(group.length>1){const point=map.project(location,map.getZoom()),angle=index/group.length*Math.PI*2,radius=Math.max(22,group.length*5);location=map.unproject([point.x+Math.cos(angle)*radius,point.y+Math.sin(angle)*radius],map.getZoom());}
  const marker=L.marker(location,{icon:L.divIcon({className:`quest-map-marker quest-${state}${chosen?' selected':''}`,html:state==='done'?'✓':state==='unknown'?'?':'!',iconSize:[24,24],iconAnchor:[12,12]}),title:q.name,alt:q.name,zIndexOffset:chosen?1600:600});
  const content=`<strong>${esc(q.name)}</strong><br>${esc(t(questStates[state]))} · ${esc(t(questTypes[q.type]))}<br>${esc(q.location)}<br><small>${esc(t(q.locationKind==='shrine'?'Santuario asociado':'Zona de referencia; el personaje puede estar en otro punto.'))}</small><br>${esc(coordinateString(q.position))}<br>${questGuideButton(q)}`;
  marker.bindTooltip(esc(q.name)+' · '+esc(t(questStates[state])),{direction:'top'});marker.bindPopup(content);
  marker.on('click',()=>{selectedQuest=q.id;lastQuestRenderKey=questRenderKey();});questMarkers.addLayer(marker);if(chosen&&openQuestPopup){openQuestPopup=false;marker.openPopup();}
 }
}
function saveQuestMapPreference(){try{localStorage.setItem('hyrulesync.showQuests',JSON.stringify($('showQuests').checked));}catch{}}
function initQuests(){
 for(const view of ['map','inventory','quests']){
  $(view+'Tab').onclick=()=>setSaveView(view);
  $(view+'Tab').onkeydown=event=>{const views=['map','inventory','quests'],index=views.indexOf(view);let next;
   if(event.key==='Home')next=0;else if(event.key==='End')next=2;else if(event.key==='ArrowRight')next=(index+1)%3;else if(event.key==='ArrowLeft')next=(index+2)%3;else return;
   event.preventDefault();setSaveView(views[next]);$(views[next]+'Tab').focus();};
 }
 for(const id of ['questSearch','questType','questState'])$(id).addEventListener(id==='questSearch'?'input':'change',()=>{selectedQuest=null;renderQuests();renderQuestMarkers();});
 $('questList').onclick=event=>{const button=event.target.closest('[data-quest-map]');if(button)showQuestOnMap(button.dataset.questMap);};
 $('questList').onchange=event=>{const input=event.target.closest('[data-quest-visible]');if(input)setQuestVisible(input.dataset.questVisible,input.checked);};
 $('questRetry').onclick=()=>{loadQuests();renderQuests();};$('questsSidebar').onclick=()=>$('sidebar').classList.toggle('open');
 try{$('showQuests').checked=JSON.parse(localStorage.getItem('hyrulesync.showQuests')||'true')===true;}catch{$('showQuests').checked=true;}
 try{const ids=JSON.parse(localStorage.getItem('hyrulesync.hiddenQuests')||'[]');if(Array.isArray(ids))for(const id of ids)if(typeof id==='string')hiddenQuests.add(id);}catch{}
 for(const id of ['showQuestsSidebar','showQuestsList'])$(id).checked=$('showQuests').checked;
 for(const id of ['showQuests','showQuestsSidebar','showQuestsList'])$(id).onchange=event=>setQuestMapVisible(event.target.checked);
 loadQuests();
}
