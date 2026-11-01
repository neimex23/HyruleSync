'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),nodes=new Map();
const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',hidden:false,setAttribute(){},classList:{toggle(){}}});return nodes.get(id);};
const context={window:{},document:{getElementById:node,body:{classList:{toggle(){}}}},localStorage:{getItem:()=>null},setTimeout,clearTimeout};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'web/i18n.js'),'utf8'),context);context.I18N=context.window.I18N;context.I18N.setLanguage('es');
vm.runInContext(fs.readFileSync(path.join(root,'web/app.js'),'utf8').replace(/start\(\);\s*$/,''),context);
vm.runInContext(fs.readFileSync(path.join(root,'web/inventory.js'),'utf8'),context);
const run=s=>vm.runInContext(s,context);context.data=JSON.parse(fs.readFileSync(path.join(root,'web/inventory-data.json'),'utf8'));
run('inventoryData=data;inventoryView=true;');
assert.equal(run('inventoryHash("PlayerStatus.MaxStamina")'),0xf9212c74);
assert.equal(run('inventoryEnum(inventoryHash("AttackUpPlus")|0)'),context.data.names.es['Attack ↑↑']);
assert.equal(run('inventoryEnum(-1)'),'0xffffffff');
context.sample={file:'test.sav',savedAt:'2026-11-01T12:00:00Z',inventory:{life:7,maxLife:12,stamina:1200,energy:null,rupees:0,ponyPoints:null,groups:[
 {id:'materials',available:true,items:[{id:'Item_Fruit_A',slot:2,details:{quantity:0}},{id:'<img src=x onerror=alert(1)>',slot:3,details:{quantity:1}}]},
 {id:'weapons',available:false,items:[]},{id:'arrows',available:true,items:[]}
]}};
run('snapshot=sample;renderInventory();');
assert.match(node('inventoryStats').innerHTML,/1,75 corazones/);assert.match(node('inventoryStats').innerHTML,/1,2 ruedas/);assert.match(node('inventoryStats').innerHTML,/No disponible/);
assert.doesNotMatch(node('inventoryGroups').innerHTML,/<img/);assert.match(node('inventoryGroups').innerHTML,/&lt;img/);assert.match(node('inventoryGroups').innerHTML,/× 0/);
assert.match(node('inventoryGroups').innerHTML,/Esta bolsa no está disponible/);assert.match(node('inventoryGroups').innerHTML,/Bolsa vacía/);
node('inventorySearch').value='manzana';run('renderInventory()');assert.match(node('inventoryResults').textContent,/1 objetos/);assert.doesNotMatch(node('inventoryGroups').innerHTML,/&lt;img/);
node('inventorySearch').value='no existe';run('renderInventory()');assert.match(node('inventoryGroups').innerHTML,/No se encontraron objetos/);
node('inventorySearch').value='';node('inventoryCategory').value='arrows';run('renderInventory()');assert.match(node('inventoryGroups').innerHTML,/Flechas/);assert.doesNotMatch(node('inventoryGroups').innerHTML,/Materiales/);
assert.match(run('inventoryCard({id:"Parasail",slot:4,equipped:true,details:{quantity:-1}}, {id:"key"})'),/Único/);
assert.equal((run('inventoryCard({id:"Armor_002_Head",slot:0,details:{}}, {id:"armors"})').match(/★/g)||[]).length,1,'Localized armor stars are not duplicated');
assert.equal(run('inventoryValue("recipe",["Item_Fruit_A","Item_Fruit_A","","",""])'),'Manzana, Manzana');
run('snapshot=null;renderInventory();');assert.equal(node('inventoryGroups').innerHTML,'');assert.equal(node('inventoryEmpty').hidden,false);
for(const label of [...Object.values(run('inventoryLabels')),...Object.values(run('inventoryFields'))])assert.ok(context.I18N.translations[label],label);
console.log('Inventory stats, signed enums, translations, search, categories, unique items, recipes, missing data, empty state and HTML escaping passed.');
