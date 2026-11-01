'use strict';
let inventoryData=null,inventoryLoading=false,inventoryFailed=false,inventoryView=false;
const inventoryLabels={weapons:'Armas',bows:'Arcos',shields:'Escudos',armors:'Armaduras',arrows:'Flechas',materials:'Materiales',food:'Comida y elixires',devices:'Dispositivos zonnan',key:'Objetos importantes'};
const inventoryCategoryIcons={weapons:'sword',bows:'bow',shields:'shield',armors:'armor',arrows:'arrow',materials:'leaf',food:'meal',devices:'device',key:'key'};
function inventoryItemIcon(item,group){
 const id=item.id;
 if(group.id==='weapons'&&id.startsWith('Weapon_Spear_'))return 'spear';
 if(group.id==='armors')return id.endsWith('_Head')?'helmet':id.endsWith('_Lower')?'boots':'armor';
 if(group.id==='materials'){
  for(const [prefix,icon] of [['Item_Fruit_','fruit'],['Item_Mushroom','mushroom'],['Item_Fish','fish'],['Animal_Fish','fish'],['Animal_Insect','bug'],['Item_Ore','gem'],['Item_Enemy','horn']])if(id.startsWith(prefix))return icon;
 }
 if(group.id==='food'&&id==='Item_Cook_C_17')return 'potion';
 if(group.id==='devices'){if(id.includes('WindGenerator'))return 'fan';if(/Wheel|Tire/.test(id))return 'wheel';}
 return inventoryCategoryIcons[group.id]||'key';
}
function inventoryIcon(icon){
 return `<svg class="inventory-glyph" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="inventory-icons.svg#${icon}"></use></svg>`;
}
const inventoryFields={durability:'Durabilidad',modifier:'Modificador',modifierValue:'Valor del modificador',fuseId:'Combinado con',fuseDurability:'Durabilidad de la fusión',extraDurability:'Durabilidad adicional',recordExtraDurability:'Durabilidad adicional registrada',dyeColor:'Tinte',getOrder:'Orden de obtención',useOrder:'Orden de uso',heartsHeal:'Corazones que recupera',effectMultiplier:'Potencia del efecto',effectTime:'Duración (segundos)',price:'Precio de venta',recipe:'Ingredientes'};
function inventoryName(id){return inventoryData?.names[I18N.language]?.[id]||inventoryData?.names.en?.[id]||id;}
function inventoryHash(text){
 let h=0,k,i=0;for(;i+4<=text.length;i+=4){k=text.charCodeAt(i)|text.charCodeAt(i+1)<<8|text.charCodeAt(i+2)<<16|text.charCodeAt(i+3)<<24;k=Math.imul(k,0xcc9e2d51);k=k<<15|k>>>17;k=Math.imul(k,0x1b873593);h^=k;h=h<<13|h>>>19;h=(Math.imul(h,5)+0xe6546b64)|0;}
 k=0;for(let j=0;i+j<text.length;j++)k|=text.charCodeAt(i+j)<<(8*j);k=Math.imul(k,0xcc9e2d51);k=k<<15|k>>>17;k=Math.imul(k,0x1b873593);h^=k;h^=text.length;h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);return(h^h>>>16)>>>0;
}
function inventoryEnum(value){const name=inventoryData?.enums.find(name=>inventoryHash(name)===(value>>>0));return name?inventoryName(inventoryData.enumNames?.[name]||name):'0x'+(value>>>0).toString(16).padStart(8,'0');}
async function loadInventoryNames(){
 if(inventoryData||inventoryLoading)return;inventoryLoading=true;inventoryFailed=false;
 try{const response=await fetch('inventory-data.json');if(!response.ok)throw Error();inventoryData=await response.json();}
 catch{inventoryFailed=true;}finally{inventoryLoading=false;if(inventoryView)renderInventory();}
}
function setInventoryView(enabled){
 inventoryView=enabled;$('inventoryPanel').hidden=!enabled;$('mapPanel').hidden=enabled;
 document.body.classList.toggle('inventory-view',enabled);
 for(const [id,selected] of [['inventoryTab',enabled],['mapTab',!enabled]]){$(id).setAttribute('aria-selected',String(selected));$(id).tabIndex=selected?0:-1;}
 if(enabled){renderInventory();loadInventoryNames();}else if(map)map.invalidateSize();
}
function inventoryValue(key,value){
 if(key==='recipe')return value.filter(Boolean).map(inventoryName).join(', ')||t('Sin ingredientes registrados');
 if(key==='fuseId')return value?inventoryName(value):t('Sin fusión');
 if(key==='modifier'||key==='dyeColor')return inventoryEnum(value);
 if(key==='heartsHeal')return value<0?t('Sin verificar'):fmt(value/4);
 return fmt(value);
}
function inventoryCard(item,group){
 const armor=inventoryData?.armor[item.id],name=inventoryName(item.id),details=item.details||{};
 const stars=group.id==='armors'&&armor?.level>0&&!/[★☆]/.test(name)?' '+ '★'.repeat(armor.level):'';
 const quantity=details.quantity==null?'':group.id==='key'&&details.quantity===-1?t('Único'):details.quantity<0?t('Sin verificar'):'× '+fmt(details.quantity);
 const rows=Object.entries(details).filter(([key,value])=>key!=='quantity'&&value!=null).map(([key,value])=>`<div><dt>${esc(t(group.id==='food'&&key==='modifier'?'Efecto':inventoryFields[key]||key))}</dt><dd>${esc(inventoryValue(key,value))}</dd></div>`).join('');
 return `<article class="inventory-item"><div class="inventory-item-heading"><span class="inventory-item-icon">${inventoryIcon(inventoryItemIcon(item,group))}</span><div class="inventory-item-title"><h3>${esc(name+stars)}</h3><strong>${esc(quantity)}</strong></div></div>${item.equipped?`<span class="inventory-equipped">${esc(t('Equipado'))}</span>`:''}<p class="inventory-id">${esc(item.id)}</p>${rows?`<details><summary>${esc(t('Detalles del objeto'))}</summary><dl>${rows}</dl><p>${esc(t('Casilla {n}',{n:item.slot+1}))}</p></details>`:''}</article>`;
}
function renderInventory(){
 if(!inventoryView)return;
 const inv=snapshot?.inventory,missing=t('No disponible');
 $('inventorySource').textContent=snapshot?t('Inventario de {file} · {time}',{file:snapshot.file.split(/[\\/]/).slice(-2).join(' / '),time:new Date(snapshot.savedAt).toLocaleString(I18N.language)}):t('Carga una partida para consultar el inventario.');
 $('inventoryEmpty').hidden=!!inv;$('inventoryControls').hidden=!inv;$('inventoryStats').hidden=!inv;
 $('inventoryNameStatus').textContent=inventoryFailed?t('No se pudieron cargar los nombres. Vuelve a abrir Inventario para reintentar.'):inventoryLoading?t('Cargando nombres de objetos…'):'';
 if(!inv){$('inventoryGroups').innerHTML='';$('inventoryStats').innerHTML='';return;}
 const value=(number,scale=1)=>number==null?missing:fmt(number/scale);
 const unit=(number,scale,key)=>number==null?missing:t(key,{n:value(number,scale)});
 const stats=[['Vida',unit(inv.life,4,'{n} corazones')],['Vida máxima',unit(inv.maxLife,4,'{n} corazones')],['Stamina máxima',unit(inv.stamina,1000,'{n} ruedas')],['Batería máxima',unit(inv.energy,1,'{n} unidades de energía')],['Rupias',value(inv.rupees)],['Puntos del establo',value(inv.ponyPoints)]];
 const statIcons=['heart','heart','stamina','battery','rupee','stable'];
 $('inventoryStats').innerHTML=stats.map(([label,number],index)=>`<div class="inventory-stat"><span class="inventory-stat-label">${inventoryIcon(statIcons[index])}${esc(t(label))}</span><strong>${esc(number)}</strong></div>`).join('');
 const search=norm($('inventorySearch').value),category=$('inventoryCategory').value;
 let matched=0;
 $('inventoryGroups').innerHTML=inv.groups.filter(group=>!category||category===group.id).map(group=>{
  const items=group.items.filter(item=>norm([inventoryName(item.id),item.id,inventoryName(item.details?.fuseId||''),...(item.details?.recipe||[]).map(inventoryName)].join(' ')).includes(search));matched+=items.length;
  if(search&&!items.length&&group.available)return '';
  const count=group.available?fmt(group.items.length)+(group.capacity==null?'':' / '+fmt(group.capacity)):missing;
  return `<section class="inventory-group"><h2><span class="inventory-group-label">${inventoryIcon(inventoryCategoryIcons[group.id]||'key')}${esc(t(inventoryLabels[group.id]))}</span><span>${esc(count)}</span></h2>${!group.available?`<p>${esc(t('Esta bolsa no está disponible en el guardado.'))}</p>`:items.length?`<div class="inventory-grid">${items.map(item=>inventoryCard(item,group)).join('')}</div>`:`<p>${esc(t('Bolsa vacía'))}</p>`}</section>`;
 }).join('');
 $('inventoryResults').textContent=t('{n} objetos mostrados',{n:fmt(matched)});
 if(search&&!matched)$('inventoryGroups').innerHTML=`<p class="inventory-no-results">${esc(t('No se encontraron objetos.'))}</p>`;
}
function initInventory(){
 $('mapTab').onclick=()=>setInventoryView(false);$('inventoryTab').onclick=()=>setInventoryView(true);
 for(const id of ['mapTab','inventoryTab'])$(id).onkeydown=event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();setInventoryView(event.key==='Home'?false:event.key==='End'?true:!inventoryView);$(inventoryView?'inventoryTab':'mapTab').focus();}};
 $('inventorySearch').oninput=renderInventory;$('inventoryCategory').onchange=renderInventory;
 $('inventorySidebar').onclick=()=>$('sidebar').classList.toggle('open');
 for(const [id,label] of Object.entries(inventoryLabels)){const option=document.createElement('option');option.value=id;option.textContent=t(label);$('inventoryCategory').append(option);}
}
