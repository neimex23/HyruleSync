// Import only shrine discovery and chest save hashes; no game text or placements.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const hashCommit = 'b4db8cd11157c6d5ae54a0a5edc88dba82aebe9d';
const hashURL = `https://raw.githubusercontent.com/marcrobledo/savegame-editors/${hashCommit}/zelda-totk/zelda-totk.hashes.csv`;
const chestURL = 'https://radar-totk.zeldamods.org/objs/SmallDungeon/?q=actor%3A%5E%22TBox_%22&withMapNames=true&limit=-1';
async function read(url, filename) {
  if (process.argv[2]) return fs.readFileSync(path.join(process.argv[2], filename), 'utf8');
  const response = await fetch(url);
  if (!response.ok) throw Error(`${response.status}: ${url}`);
  return response.text();
}
(async () => {
  const [csv, chestText] = await Promise.all([read(hashURL, 'hashes.csv'), read(chestURL, 'chests-empty.json')]);
  const hashes = new Map(csv.split(/\r?\n/).filter(row => /^[0-9a-f]+;Bool;/.test(row)).map(row => {
    const [hash, , name] = row.split(';');
    return [name, String(parseInt(hash, 16))];
  }));
  const chests = JSON.parse(chestText);
  const used = new Set();
  const shrines = Array.from({ length: 152 }, (_, index) => {
    const id = 'Dungeon' + String(index).padStart(3, '0');
    const visitHash = hashes.get('IsVisitLocation.' + id);
    const chestHashes = chests.filter(chest => chest.map_name === id).map(chest => {
      assert.equal(chest.map_type, 'SmallDungeon');
      assert.match(chest.name, /^TBox_/);
      const key = 'IsTreasureBoxOpen.' + BigInt(chest.hash_id).toString();
      const hash = hashes.get(key) || hashes.get(key + '|' + chest.name);
      assert.ok(hash, key);
      assert.ok(!used.has(hash), `Duplicate chest ${hash}`);
      used.add(hash);
      return hash;
    }).sort((a, b) => Number(a) - Number(b));
    assert.ok(visitHash && chestHashes.length, id);
    return { id, visitHash, chestHashes };
  });
  assert.equal(used.size, chests.length);
  assert.equal(used.size, 166);
  const digest = text => crypto.createHash('sha256').update(text).digest('hex');
  const data = { sources: { hashes: hashURL, hashesSHA256: digest(csv), chests: chestURL, chestsSHA256: digest(chestText) }, shrines };
  fs.writeFileSync(path.resolve(__dirname, '../assets/shrines.json'), JSON.stringify(data, null, 2) + '\n');
  console.log(`Imported ${shrines.length} shrines and ${used.size} chest hashes.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
