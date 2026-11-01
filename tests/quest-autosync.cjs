'use strict';
// Optional integration test: read the supplied save; only mutate private fixture copies.
// node tests/quest-autosync.cjs <save.sav> [application-directory]
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),savePath=process.argv[2],app=path.resolve(process.argv[3]||path.join(root,'outputs/HyruleSync'));
if(!savePath)throw Error('Provide a read-only save input.');
const original=fs.readFileSync(savePath),digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const definitions=JSON.parse(fs.readFileSync(path.join(root,'web/quest-data.json'),'utf8')).quests;
const quest=definitions.find(q=>q.id==='DefeatGanondorf'),offsets=new Map();
for(let at=40;at<Math.min(original.length-8,0x60000);at+=8){const hash=original.readUInt32LE(at);if(hash===0xa3db7114)break;offsets.set(hash,at+4);}
assert.ok(offsets.has(quest.hash),'Input contains the reference quest field');
const work=fs.mkdtempSync(path.join(root,'.local/quest-sync-')),folder=path.join(work,'account'),slot=path.join(folder,'slot_00/progress.sav'),urlFile=path.join(work,'url.txt');
fs.mkdirSync(path.dirname(slot),{recursive:true});fs.copyFileSync(path.join(app,'HyruleSync.exe'),path.join(work,'HyruleSync.exe'));fs.cpSync(path.join(app,'.data'),path.join(work,'.data'),{recursive:true});
fs.mkdirSync(path.join(work,'.state'));fs.writeFileSync(path.join(work,'.state/settings.json'),JSON.stringify({runInBackground:true,language:'en'}));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));let child,url;
async function state(){return (await fetch(url+'api/state')).json();}
async function until(predicate){const deadline=Date.now()+15000;while(Date.now()<deadline){const value=await state();if(predicate(value))return value;await pause(200);}throw Error('Save update timed out.');}
async function post(action,body){const response=await fetch(url+'api/'+action,{method:'POST',headers:{Origin:new URL(url).origin},body});assert.ok(response.ok);return response.json();}
function write(value){const bytes=Buffer.from(original);bytes.writeUInt32LE(value,offsets.get(quest.hash));fs.writeFileSync(slot,bytes);return bytes;}
(async()=>{
 // Values observed in a real save: Complete=1275749364, GoToDeepHole=1066970150.
 // Other reference enum values are MurmurHash3 of the known stage names.
 write(0);
 child=cp.spawn(path.join(work,'HyruleSync.exe'),['--no-browser','--folder',folder,'--auto','--url-file',urlFile],{windowsHide:true});
 const exited=new Promise(resolve=>child.once('exit',resolve));
 try{
  for(let count=0;count<100&&!fs.existsSync(urlFile);count++)await pause(100);
  assert.ok(fs.existsSync(urlFile),'Application starts');url=fs.readFileSync(urlFile,'utf8');
  const progress=s=>s.snapshot?.quests?.find(q=>q.id===quest.id);
  await until(s=>progress(s)?.state==='unknown');
  for(const [raw,expected,step] of [[1471695344,'todo','NotReady'],[398436934,'active','Ready'],[1066970150,'active','GoToDeepHole'],[1275749364,'done','Complete'],[0,'unknown',null]]){
   const fixture=write(raw);const current=await until(s=>s.snapshot?.revision===digest(fixture));
   assert.equal(progress(current).state,expected);assert.equal(progress(current).step,step);assert.equal(progress(current).raw,raw);
  }
  const live=await state(),before=fs.readFileSync(slot),inspected=await post('inspect-file',slot),after=await state();
  assert.ok(inspected.snapshot.quests);assert.equal(after.snapshot.revision,live.snapshot.revision);assert.equal(after.source,live.source);assert.equal(after.auto,true);assert.deepEqual(fs.readFileSync(slot),before);
  fs.writeFileSync(slot,Buffer.from('partial'));await until(s=>s.status==='error');assert.equal((await state()).snapshot.revision,live.snapshot.revision,'Invalid writes preserve the last valid quest state');
  const restored=write(1275749364);await until(s=>s.snapshot?.revision===digest(restored)&&s.status==='ok');
  assert.equal(digest(fs.readFileSync(savePath)),digest(original),'Original input remains unchanged');
  console.log('Quest Autosync: live enum changes, exact save revision, inspection isolation, corrupt-write recovery and unchanged original input passed.');
 }finally{if(child.exitCode===null)child.kill();await exited;}
})().catch(error=>{console.error(error);process.exitCode=1;});
