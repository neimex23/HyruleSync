'use strict';
// Selected factual data only: no item descriptions, dialogue or guide text.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = 'Ignacio9172/spreadsheet_totk_json';
const commit = 'f20920ea28c0fa9aa9357ebf640c222c7de64a31';
const hashCommit = '450752f98876755944ea22eb457f4dc1468d79ea';
const textCommit = '2bc9ea5e0c2eb2e24fcaaff3f7162660559eb082';
const imageCommit = 'e0467418215e76bd93c3ec8b55bbf321e4cc43ae';
const imageBase = `https://raw.githubusercontent.com/TOTKSheet/TOTKImages/${imageCommit}/`;
const inventory = require('../web/public/inventory-data.json');
const quests = require('../web/public/quest-data.json').quests;
async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw Error(`${response.status}: ${url}`);
  return response.text();
}
function csv(text) {
  const rows = []; let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) { row.push(value); value = ''; }
    else if (c === '\n' && !quoted) { row.push(value.replace(/\r$/, '')); rows.push(row); row = []; value = ''; }
    else value += c;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return Object.fromEntries(rows.slice(1));
}
const present = value => value && value !== '-';
const clean = value => value.replace(/\u000e[^\u0001]*\u0001/g, '').replace(/[\u0000-\u001f]/g, '');
(async () => {
  const [sheetText, hashes, memoryEn, memoryEs, locationEn, locationEs] = await Promise.all([
    fetchText(`https://raw.githubusercontent.com/${source}/${commit}/spreadsheet_totk.json`),
    fetchText(`https://raw.githubusercontent.com/marcrobledo/savegame-editors/${hashCommit}/zelda-totk/zelda-totk.hashes.csv`),
    ...['EUen', 'EUes'].map(locale => fetchText(`https://raw.githubusercontent.com/zoalasaurusrawr/totk-resources/${textCommit}/text/${locale}/StaticMsg/DragonMemory.csv`).then(csv)),
    ...['EUen', 'EUes'].map(locale => fetchText(`https://raw.githubusercontent.com/zoalasaurusrawr/totk-resources/${textCommit}/text/${locale}/LocationMsg/Location.csv`).then(csv)),
  ]);
  const sheet = JSON.parse(sheetText);
  const fields = new Map(hashes.split(/\r?\n/).map(row => row.split(';')).filter(row => row[1] === 'Bool').map(row => [row[2], parseInt(row[0], 16)]));
  const replacements = Object.fromEntries(Object.entries(locationEn).map(([key, value]) => [value, locationEs[key]]));
  for (const quest of quests) replacements[quest.name] = quest.nameEs;
  Object.assign(replacements, {
    'Treasure Chest': 'Cofre', 'Armor Shop': 'Tienda de armaduras', 'Jewelry Shop': 'Joyería',
    'Repurchase': 'Recompra', 'Shop': 'Tienda', 'Bargainer Statue': 'Estatua de brujo',
    'Great Sky Island': 'Gran isla de los albores', 'Lookout Landing': 'Fuerte vigía',
    'Ventest Clothing Boutique': 'Boutique de Sogene', 'Brazen Beak': 'El pavo real',
    'Enchanted': 'Moda al cuadrado', 'Starlight Memories': 'La joya de la corona',
    'Koltin': 'Koltin', 'Bubbul Gems': 'emblemas de fantasmo', 'Bubbul Gem': 'emblema de fantasmo',
    'Find 7': 'encuentra 7', 'Find 5': 'encuentra 5', 'Find 3': 'encuentra 3',
    'Complete All 152 Shrines': 'completa los 152 santuarios',
    'Default': 'Tela inicial de la paravela',
    '5 Pony Points Reward': 'Recompensa de 5 puntos del establo',
    'Complete all 81 Addison signs': 'Ayuda a Kabalit con sus 81 carteles',
    'Complete the Compendium': 'Completa la enciclopedia hyliana',
    'Give Koltin all 147 Bubbulfrog Gems': 'Entrega a Koltin los 147 emblemas de fantasmo',
    'Complete all monster control quests': 'Completa las misiones de las brigadas de combate',
    'Purchase armor at Enchanted': 'Compra armaduras en Moda al cuadrado',
    'Sayge': 'Teñior', 'Picture': 'foto', 'Cece': 'Sogene',
  });
  const translations = Object.entries(replacements).filter(([en, es]) => en && es).sort((a, b) => b[0].length - a[0].length);
  function translate(text) {
    // Replace once against the original string, so translated names are never translated again.
    const pattern = new RegExp(translations.map(([key]) => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
    return text.replace(pattern, match => replacements[match]);
  }
  const materialIds = new Map(sheet.Materials.map(row => [row.Name, row.ActorName]));
  const armor = sheet.Armor.map(row => {
    const id = row['ActorName (Base)'];
    assert.ok(inventory.armor[id], id);
    const variant = row['ActorName (Base) [Altered]'];
    const bases = [id, ...(present(variant) ? [variant] : [])];
    const variants = Object.entries(inventory.armor).filter(([, info]) => bases.includes(info.base)).map(([id, info]) => ({ id, level: info.level || 0 }));
    const upgrades = [1, 2, 3, 4].flatMap(level => {
      const stars = '★'.repeat(level);
      if (!present(row['ActorName ' + stars])) return [];
      const materials = [1, 2, 3].flatMap(index => {
        const name = row[`Upgrade Material ${stars} (${index})`];
        if (!present(name)) return [];
        const materialId = materialIds.get(name);
        const quantity = row[`Upgrade Material Quantity ${stars} (${index})`];
        assert.ok(materialId && Number.isInteger(quantity) && quantity > 0, `${id}: ${name}`);
        return [{ id: materialId, quantity }];
      });
      assert.ok(materials.length, id);
      return [{ level, rupees: [10, 50, 200, 500][level - 1] * (id === 'Armor_1036_Head' ? 3 : 1), materials }];
    });
    const sources = [row['Source 1'], row['Source 2']].filter(present);
    return { id, name: row.Name, nameEs: inventory.names.es[id] || row.Name, image: row['Inventory Icon'].replace('/main/', `/${imageCommit}/`), slot: row['Equip Slot'], set: row['Set (Internal)'], variants, sources, sourcesEs: sources.map(translate), upgrades };
  });
  const entries = [];
  function entry(id, category, name, sourceText, key = 'IsGet.' + id) {
    const hash = fields.get(key);
    assert.ok(hash, key);
    const result = { id, category, name, nameEs: inventory.names.es[id] || name, source: sourceText, sourceEs: translate(sourceText), key, hash, image: imageBase + 'Items/' + id + '.png' };
    entries.push(result);
    return result;
  }
  // Game order, independent of hash-table ordering.
  const memoryOrder = ['Dm_OT_0015_PreRender', 'DmT_OP_GanonWakeUp_PreRender_Memory', 'DmT_ZE_Meet_PreRender', 'Dm_ZE_0004_PreRender', 'Dm_ZE_0006_PreRender', 'DmT_ZE_Molduga_PreRender', 'DmT_ZE_LieServant_PreRender', 'Dm_ZE_0005_PreRender', 'DmT_ZE_QueenDead_PreRender', 'DmT_ZE_Birth_PreRender', 'Dm_ZE_0007_PreRender', 'Dm_ZN_0033_PreRender', 'Dm_ZE_0008_PreRender', 'Dm_ZN_0039_PreRender', 'Dm_ZE_0010_PreRender', 'Dm_BZ_0005_PreRender', 'Dm_ZE_0011_PreRender', 'Dm_SK_0003_PreRender'];
  for (const [index, id] of memoryOrder.entries()) {
    assert.ok(memoryEn[id + '_Title'] && memoryEs[id + '_Title'], id);
    const item = entry(id, 'memories', clean(memoryEn[id + '_Title']), clean(memoryEn[id + '_SubTitle'] || 'Main story'), 'IsGetAdventureMemory.' + id);
    item.nameEs = clean(memoryEs[id + '_Title']);
    item.sourceEs = clean(memoryEs[id + '_SubTitle'] || 'Historia principal');
    item.number = index + 1;
    item.image = imageBase + 'Other/PreRenders/' + id + '.png';
  }
  for (const row of sheet['Paraglider Fabrics']) {
    const id = row['Fabric ActorName'];
    const item = entry(id, 'fabrics', row.Name, row.Source, 'IsGet.' + (id.endsWith('_Default') ? 'Parasail' : id));
    item.amiibo = /amiibo/i.test(row.Source);
  }
  // Additional 1.4 fabrics; acquisition hashes and images exist in the pinned sources.
  for (const [suffix, name, nameEs, amiibo] of [
    ['57', 'Sage of Wind Fabric', 'Tela del sabio del viento', 'Tulin'],
    ['58', 'Sage of Fire Fabric', 'Tela del sabio del fuego', 'Yunobo'],
    ['59', 'Sage of Water Fabric', 'Tela del sabio del agua', 'Sidon'],
    ['60', 'Sage of Lightning Fabric', 'Tela de la sabia del trueno', 'Riju'],
    ['61', 'Sage of Spirit Fabric', 'Tela de la sabia del espíritu', 'Mineru’s Construct'],
  ]) {
    const item = entry('Obj_SubstituteCloth_' + suffix, 'fabrics', name, amiibo + ' amiibo');
    item.nameEs = nameEs; item.amiibo = true;
  }
  for (const row of sheet['Key Items'].filter(row => /^GameRomHorse/.test(row.ActorName)))
    entry(row.ActorName, 'horses', row.Name, 'Pony Points rewards or special horse quests');
  const rewards = [
    ['Obj_ProofKorok', "Hestu's Gift", 'Collect all 1,000 Korok Seeds and speak to Hestu', 'Consigue las 1000 semillas de kolog y habla con Obab'],
    ['Obj_CaveWellHonor_00', "All’s Well", 'Discover all 58 wells and speak to Fera', 'Descubre los 58 pozos y habla con Fera'],
    ['Obj_CheckPointHonor_00', 'Dispelling Darkness Medal', 'Activate all 120 lightroots', 'Activa las 120 raíces'],
    ['Obj_SubstituteCloth_16', "Robbie’s Fabric", 'Complete the Hyrule Compendium and speak to Robbie', 'Completa la enciclopedia hyliana y habla con Rotver'],
    ['Armor_1036_Head', "Ancient Hero’s Aspect", 'Complete all 152 shrines and visit the Temple of Time', 'Completa los 152 santuarios y visita el Templo del Tiempo'],
    ['Obj_SubstituteCloth_56', "Addison’s Fabric", 'Complete all 81 Addison signs', 'Ayuda a Kabalit con sus 81 carteles'],
    ['Obj_SubstituteCloth_13', "Koltin’s Fabric", 'Give Koltin all 147 Bubbulfrog Gems', 'Entrega a Koltin los 147 emblemas de fantasmo'],
  ];
  for (const [id, name, en, es] of rewards) {
    const item = entry('reward:' + id, 'rewards', name, en, 'IsGet.' + id);
    item.nameEs = inventory.names.es[id] || name; item.sourceEs = es; item.itemId = id;
    item.image = armor.find(row => row.id === id)?.image || imageBase + 'Items/' + id + '.png';
    if (id === 'Armor_1036_Head') item.aliases = armor.find(row => row.id === id).variants.map(row => row.id);
  }
  const medals = [['taluses', '00', 87], ['hinoxes', '01', 69], ['moldugas', '02', 4], ['froxes', '03', 40], ['flux_constructs', '04', 35], ['gleeoks', '05', 14]].map(([category, suffix, total]) => {
    const id = 'Obj_DefeatHonor_' + suffix;
    const item = entry(id, 'medals', inventory.names.en[id], 'Defeat every boss of this type, then speak to Gralens in Lookout Landing');
    item.sourceEs = 'Derrota a todos los jefes de este tipo y habla con Glaren en el Fuerte vigía';
    return { id, category, total };
  });
  for (const item of entries.filter(item => item.category === 'horses')) item.sourceEs = 'Recompensas de puntos del establo o misiones de caballos especiales';
  assert.equal(armor.length, 135);
  assert.equal(entries.filter(item => item.category === 'memories').length, 18);
  assert.equal(new Set(entries.map(item => item.id)).size, entries.length);
  fs.writeFileSync(path.resolve(__dirname, '../web/public/collection-data.json'), JSON.stringify({ source, commit, hashCommit, textCommit, imageCommit, armor, entries, medals }, null, 2) + '\n');
  console.log(`${armor.length} armor pieces; ${entries.length} collection entries; ${medals.length} medals.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
