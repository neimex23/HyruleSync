'use strict';
// Windows integration check using an isolated app copy and settings directory.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),app=path.resolve(process.argv[2]||path.join(root,'outputs/HyruleSync'));
fs.mkdirSync(path.join(root,'.local'),{recursive:true});
const work=fs.mkdtempSync(path.join(root,'.local/language-test-')),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
fs.copyFileSync(path.join(app,'HyruleSync.exe'),path.join(work,'HyruleSync.exe'));
fs.mkdirSync(path.join(work,'.state'));
fs.writeFileSync(path.join(work,'.state/settings.json'),JSON.stringify({runInBackground:true}));
let child,url,exited;
async function start(args=[]){
 const urlFile=path.join(work,'url.txt');fs.rmSync(urlFile,{force:true});
 child=cp.spawn(path.join(work,'HyruleSync.exe'),['--no-browser','--url-file',urlFile,...args],{windowsHide:true});
 exited=new Promise(resolve=>child.once('exit',resolve));
 for(let i=0;i<100&&!fs.existsSync(urlFile);i++)await pause(100);
 assert.ok(fs.existsSync(urlFile),'App starts');url=fs.readFileSync(urlFile,'utf8').replace('hyrulesync.localhost','127.0.0.1');
}
async function stop(){if(child&&child.exitCode===null){child.kill();await exited;}}
async function config(){return(await fetch(url+'api/config')).json();}
async function choose(language,ok=true){
 const response=await fetch(url+'api/language',{method:'POST',body:language,headers:{Origin:new URL(url).origin}});
 assert.equal(response.status,ok?200:400);assert.equal((await response.json()).ok,ok);
 return config();
}
(async()=>{
 try{
  await start();const automatic=await config();assert.equal(automatic.languagePreference,'auto');
  assert.equal((await(await fetch(url+'api/setup')).json()).ready,false,'Language can change before map setup');
  for(const language of ['es','en','es']){
   const selected=await choose(language);assert.equal(selected.language,language);assert.equal(selected.languagePreference,language);
   assert.equal(JSON.parse(fs.readFileSync(path.join(work,'.state/settings.json'),'utf8').replace(/^\uFEFF/,'')).language,language,'Preference persisted');
   assert.equal((await(await fetch(url+'api/state')).json()).language,language,'Other pages can detect the new locale');
  }
  assert.equal((await choose('fr',false)).language,'es','Invalid choice preserves current language');
  await stop();await start();assert.equal((await config()).language,'es','Preference survives restart');
  await stop();await start(['--language','en']);assert.equal((await config()).language,'en','CLI overrides saved preference');
  assert.equal(JSON.parse(fs.readFileSync(path.join(work,'.state/settings.json'),'utf8').replace(/^\uFEFF/,'')).language,'es','CLI override is temporary');
  const restored=await choose('auto');assert.equal(restored.language,automatic.language);assert.equal(restored.languagePreference,'auto');
  await stop();await start();assert.equal((await config()).languagePreference,'auto','Automatic mode survives restart');
  assert.equal((await config()).runInBackground,true,'Other settings preserved');
  console.log('English/Spanish switching, first-run setup, validation, persistence, CLI override and automatic mode passed.');
 }finally{await stop();}
})().catch(error=>{console.error(error);process.exitCode=1;});
