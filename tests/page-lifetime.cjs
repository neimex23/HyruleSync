'use strict';
// Windows integration check. Only starts and stops its own isolated HyruleSync copy.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),app=path.resolve(process.argv[2]||path.join(root,'outputs/HyruleSync'));
const work=path.join(root,'.local/lifetime-test'),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let child,url,origin,exited;
async function start(){
 fs.mkdirSync(path.join(work,'.state'),{recursive:true});fs.copyFileSync(path.join(app,'HyruleSync.exe'),path.join(work,'HyruleSync.exe'));
 fs.writeFileSync(path.join(work,'.state/settings.json'),JSON.stringify({runInBackground:false}));
 const urlfile=path.join(work,'url.txt');fs.rmSync(urlfile,{force:true});
 child=cp.spawn(path.join(work,'HyruleSync.exe'),['--no-browser','--url-file',urlfile],{windowsHide:true});exited=new Promise(resolve=>child.once('exit',resolve));
 for(let i=0;i<100&&!fs.existsSync(urlfile);i++)await pause(100);
 assert.ok(fs.existsSync(urlfile),'App starts');url=fs.readFileSync(urlfile,'utf8');origin=new URL(url).origin;
}
async function command(action,body=''){const response=await fetch(url+'api/'+action,{method:'POST',headers:{Origin:origin},body});assert.equal(response.status,200);return response.json();}
function connect(id){return new Promise((resolve,reject)=>{
 const request=http.get(url+'api/page-session?id='+id,response=>{response.once('data',()=>resolve({request,response}));response.resume();});request.once('error',reject);
});}
async function expectExit(){const result=await Promise.race([exited,pause(9000).then(()=>{throw Error('App did not exit after closing the last page');})]);assert.equal(result,0,'Clean exit without forced termination');}
async function stopOwnChild(){if(child?.exitCode===null){child.kill();await exited;}}
(async()=>{try{
 await start();await pause(1000);assert.equal(child.exitCode,null,'Headless mode stays alive before any UI connects');
 const a=await connect('a'.repeat(32)),b=await connect('b'.repeat(32));
 a.request.destroy();await pause(6500);assert.equal(child.exitCode,null,'Second tab keeps the process alive');
 b.request.destroy();await expectExit();
 await start();const reload=await connect('c'.repeat(32));await command('page-close','c'.repeat(32));reload.request.destroy();
 await pause(1000);const reopened=await connect('d'.repeat(32));await pause(6000);assert.equal(child.exitCode,null,'Reload cancels pending exit');
 await command('background-on');await command('page-close','d'.repeat(32));reopened.request.destroy();await pause(6500);assert.equal(child.exitCode,null,'Background mode keeps monitoring alive');
 const last=await connect('e'.repeat(32));await command('background-off');await command('page-close','e'.repeat(32));last.request.destroy();await expectExit();
 console.log('Last-tab close, disconnected browser, multiple tabs, reload grace, tray preference and clean process exit passed.');
}finally{await stopOwnChild();}})().catch(error=>{console.error(error);process.exitCode=1;});
