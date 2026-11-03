// Import names and factual reference areas only; exclude captions and dialogue.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const textCommit = '2bc9ea5e0c2eb2e24fcaaff3f7162660559eb082';
const hashCommit = 'b4db8cd11157c6d5ae54a0a5edc88dba82aebe9d';
const imageCommit = '7d5c566dd1563ef6087335cc4ca0ec47e79bb392';
const inventory = require('../web/public/inventory-data.json');
const profiles = require('../assets/character-profiles.json');
async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw Error(`${response.status}: ${url}`);
  return response.text();
}
function parseCSV(text) {
  const rows = []; let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) { row.push(value); value = ''; }
    else if (c === '\n' && !quoted) {
      row.push(value.replace(/\r$/, '')); rows.push(row); row = []; value = '';
    } else value += c;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return Object.fromEntries(rows.slice(1));
}
const clean = (s) => (s || '').split('\u000e')[0].trim();
const norm = (s) => clean(s).toLowerCase().replace(/[^a-z0-9]/g, '');
function characterMetadata(hashes) {
  const fields = new Map(hashes.split(/\r?\n/).map(row => row.split(';')).filter(row => row[1] === 'Bool').map(row => [row[2], parseInt(row[0], 16)]));
  const characters = profiles.characters.map(({ id, actor, art, images = [] }) => {
    const notificationHash = fields.get('CharaDirectory_IsInstantTipsDisplayed.' + actor);
    const newHash = fields.get('CharaDirectory_IsNew.' + actor);
    assert.ok(notificationHash && newHash, id);
    return { id, actor, notificationHash, newHash, images: [...art.map(name => {
      const file = name.replace(/ /g, '_') + '_-_TotK_Character_Profile_art.png';
      const digest = crypto.createHash('md5').update(file).digest('hex');
      return {
        url: `https://www.zeldadungeon.net/wiki/images/${digest[0]}/${digest.slice(0, 2)}/${file}`,
        page: 'https://www.zeldadungeon.net/wiki/File:' + encodeURIComponent(file),
      };
    }), ...images] };
  });
  assert.equal(characters.length, 22);
  assert.equal(new Set(characters.map(character => character.actor)).size, 22);
  return characters;
}
(async () => {
  if (process.argv.includes('--characters-only')) {
    const hashes = await fetchText(`https://raw.githubusercontent.com/marcrobledo/savegame-editors/${hashCommit}/zelda-totk/zelda-totk.hashes.csv`);
    const output = path.resolve(__dirname, '../web/public/world-data.json');
    const data = JSON.parse(fs.readFileSync(output, 'utf8'));
    data.characters = characterMetadata(hashes);
    fs.writeFileSync(output, JSON.stringify(data, null, 2) + '\n');
    console.log(`Updated ${data.characters.length} character profiles with save hashes and reference portraits.`);
    return;
  }
  const [hashes, apiText, en, es, locationEn, locationEs] = await Promise.all([
    fetchText(`https://raw.githubusercontent.com/marcrobledo/savegame-editors/${hashCommit}/zelda-totk/zelda-totk.hashes.csv`),
    fetchText('https://api.hyrule-compendium.com/v3/compendium/all?game=totk'),
    Promise.all(['PictureBook', 'PouchContent'].map(f => fetchText(`https://raw.githubusercontent.com/zoalasaurusrawr/totk-resources/${textCommit}/text/EUen/ActorMsg/${f}.csv`).then(parseCSV))),
    Promise.all(['PictureBook', 'PouchContent'].map(f => fetchText(`https://raw.githubusercontent.com/zoalasaurusrawr/totk-resources/${textCommit}/text/EUes/ActorMsg/${f}.csv`).then(parseCSV))),
    fetchText(`https://raw.githubusercontent.com/zoalasaurusrawr/totk-resources/${textCommit}/text/EUen/LocationMsg/Location.csv`).then(parseCSV),
    fetchText(`https://raw.githubusercontent.com/zoalasaurusrawr/totk-resources/${textCommit}/text/EUes/LocationMsg/Location.csv`).then(parseCSV),
  ]);
  const locations = Object.fromEntries(Object.entries(locationEn).map(([key, value]) => [clean(value), clean(locationEs[key])]));
  Object.assign(locations, {
    'Greater Hyrule': 'Todo Hyrule', 'The Depths': 'Subsuelo', 'Hyrule Sky Islands': 'Islas celestes de Hyrule',
    'Hyrule Caves': 'Cuevas de Hyrule', 'Central Hyrule Sky': 'Cielo de Hyrule central',
    'Gerudo Desert Sky': 'Cielo del desierto de Gerudo', 'Necluda Sea Sky': 'Cielo del mar de Necluda',
    'Lanayru Great Spring Sky': 'Cielo del gran manantial de Lanayru',
    'Faron Necluda': 'Farone y Necluda', 'Eldin Great Spring': 'Gran manantial de Eldin',
    'Lanayru Wetland Depths': 'Subsuelo de los humedales de Lanayru',
  });
  const api = JSON.parse(apiText).data;
  const name = (tables, id) => tables.map(table => clean(table[id + '_Name'])).find(Boolean);
  const entries = hashes.split(/\r?\n/).map(row => row.match(/^([0-9a-f]+);Enum;PictureBookData\.(.+)\.State$/)).filter(Boolean).map(row => ({
    id: row[2], hash: parseInt(row[1], 16), name: name(en, row[2]) || inventory.names.en[row[2]], nameEs: name(es, row[2]) || inventory.names.es[row[2]],
  }));
  for (const entry of entries) {
    assert.ok(entry.name && entry.nameEs, entry.id);
    const pristine = entries.some(other => other.id !== entry.id && other.name === entry.name) && Number(entry.id.split('_').at(-1)) < 100;
    const source = api.find(item => norm(item.name) === norm(entry.name + (pristine ? ' (new)' : '')));
    assert.ok(source, entry.id);
    const areas = source.common_locations || [];
    const translateArea = area => locations[area] || (area.endsWith(' Depths') ? `Subsuelo de ${locations[area.slice(0, -7)] || area.slice(0, -7)}` : area);
    Object.assign(entry, { number: source.id, category: source.category, pristine, locations: areas, locationsEs: areas.map(translateArea) });
  }
  entries.sort((a, b) => a.number - b.number);
  assert.equal(entries.length, 509);
  assert.equal(new Set(entries.map(entry => entry.number)).size, 509);
  assert.equal(new Set(entries.map(entry => entry.hash)).size, 509);
  const data = {
    sources: { text: `zoalasaurusrawr/totk-resources@${textCommit}`, hashes: `marcrobledo/savegame-editors@${hashCommit}`, referenceAreas: 'https://api.hyrule-compendium.com/v3/compendium/all?game=totk', referenceSHA256: crypto.createHash('sha256').update(apiText).digest('hex'), images: `gadhagod/Hyrule-Compendium-API@${imageCommit}` },
    entries,
    characters: characterMetadata(hashes),
  };
  fs.writeFileSync(path.resolve(__dirname, '../web/public/world-data.json'), JSON.stringify(data, null, 2) + '\n');
  console.log(`Imported ${entries.length} localized entries with unique compendium numbers and save hashes.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
