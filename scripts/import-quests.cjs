'use strict';
// Rebuild the selected factual catalog, without descriptions or game dialogue.
// Requires Node with fetch support. Both source revisions are fixed.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source='Ignacio9172/spreadsheet_totk_json',commit='f20920ea28c0fa9aa9357ebf640c222c7de64a31';
const hashSource='marcrobledo/savegame-editors',hashCommit='b4db8cd11157c6d5ae54a0a5edc88dba82aebe9d';
async function fetchText(url){const response=await fetch(url);if(!response.ok)throw Error(`${response.status}: ${url}`);return response.text();}
(async()=>{
 const [spreadsheet,csv]=await Promise.all([
  fetchText(`https://raw.githubusercontent.com/${source}/${commit}/spreadsheet_totk.json`),
  fetchText(`https://raw.githubusercontent.com/${hashSource}/${hashCommit}/zelda-totk/zelda-totk.hashes.csv`)
 ]);
 const data=JSON.parse(spreadsheet),lines=csv.split(/\r?\n/);
 const aliases={'Emergency Shelter':'Lookout Landing','Gerudo Shelter':'Gerudo Town'};
 const types={'Main Quest':'main','Side Adventure':'adventure','Shrine Quest':'shrine','Side Quest':'side'};
 const quests=data['Adventure Log'].map(q=>{
  const names=q.Location.split(',').map(name=>aliases[name.trim()]||name.trim());
  const shrine=data.Shrines.find(s=>s['Shrine Name']===q.Shrine);
  const location=shrine||data.Locations.find(l=>names.includes(l.Name));
  const position=location?{x:location.X,y:location.Height+105,z:-location.Y}:null;
  const hashLine=lines.find(line=>line.endsWith(';Enum;Step_'+q.ID));
  const enumLine=lines.find(line=>line.startsWith('EnumValues;Step_'+q.ID+';'));
  assert.ok(hashLine&&enumLine&&types[q.Type],q.ID);
  const steps=enumLine.split(';')[2].split(',');assert.ok(steps.includes('NotReady')&&steps.includes('Complete'),q.ID);
  if(position)assert.ok(Object.values(position).every(Number.isFinite),q.ID);
  return {id:q.ID,name:q.Name,type:types[q.Type],giver:q.Giver,location:q.Location,position,
   locationKind:shrine?'shrine':'area',hash:parseInt(hashLine.split(';')[0],16),steps,order:q['Menu Order']};
 });
 assert.equal(quests.length,253);assert.equal(new Set(quests.map(q=>q.id)).size,253);
 fs.writeFileSync(path.resolve(__dirname,'../web/public/quest-data.json'),JSON.stringify({source,commit,hashSource,hashCommit,quests},null,2)+'\n');
 console.log(`${quests.length} quests; ${quests.filter(q=>q.position).length} reference locations.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
