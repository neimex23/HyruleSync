import pathlib, shutil, subprocess, struct, urllib.request, urllib.error, json, time, os, argparse, threading
parser=argparse.ArgumentParser();parser.add_argument("--save",required=True,type=pathlib.Path);parser.add_argument("--app",type=pathlib.Path);args=parser.parse_args()
ROOT=pathlib.Path(__file__).resolve().parents[1]
APP=args.app or ROOT/'outputs/HyruleSync'; TEST=ROOT/'.local/sync-test'; TEST.mkdir(exist_ok=True)
shutil.copy2(APP/'HyruleSync.exe',TEST/'HyruleSync.exe');shutil.copytree(APP/'.data',TEST/'.data',dirs_exist_ok=True)
original=args.save.read_bytes()
offsets={}
for i in range(40,0x60000,8):
 h=struct.unpack_from('<I',original,i)[0]
 if h==0xa3db7114:break
 offsets[h]=i+4
points=json.loads((APP/'.data/map_data.json').read_text())
target=offsets[points['hidden_koroks'][0]['completion_hash']]
def save(path,playtime,found):
 data=bytearray(original);struct.pack_into('<I',data,offsets[0xe573f564],playtime);struct.pack_into('<I',data,target,found);path.write_bytes(data)
a=TEST/'account/slot_00/progress.sav';b=TEST/'account/slot_01/progress.sav'
a.parent.mkdir(parents=True,exist_ok=True);b.parent.mkdir(parents=True,exist_ok=True)
save(a,1000,0);save(b,900,0)
urlfile=TEST/'url.txt';urlfile.unlink(missing_ok=True)
(TEST/'.state').mkdir(exist_ok=True)
(TEST/'.state/settings.json').write_text(json.dumps({'source':'','mode':'file','auto':True,'followLink':False,'showLink':True,'linkOrder':'above'}),encoding='utf-8')
proc=subprocess.Popen([str(TEST/'HyruleSync.exe'),'--folder',str(TEST/'account'),'--auto','--no-browser','--url-file',str(urlfile)],creationflags=subprocess.CREATE_NO_WINDOW)
results=[]
try:
 for _ in range(100):
  if urlfile.exists():break
  time.sleep(.1)
 url=urlfile.read_text().replace('hyrulesync.localhost','127.0.0.1');origin=url.split('/',3)[0]+'//'+url.split('/')[2]
 def request(path,body=None,headers=None):
  req=urllib.request.Request(url+path,data=body,headers=headers if headers is not None else {'Origin':origin})
  try:
   with urllib.request.urlopen(req,timeout=5) as r:return r.status,json.load(r)
  except urllib.error.HTTPError as e:return e.code,e.read().decode()
 def state():return request('api/state')[1]
 def until(test):
  deadline=time.time()+12
  while time.time()<deadline:
   s=state()
   if test(s):return s
   time.sleep(.2)
  raise AssertionError(s)
 s=until(lambda s:s['status']=='ok');assert s['snapshot']['file']==str(a);
 assert s['showLink'] and s['linkOrder']=='above' and not s['followLink']
 assert s['linkOpacity']==45
 for value in (b'0',b'100',b'35'):assert request('api/link-opacity',value)[0]==200
 assert state()['linkOpacity']==35
 for value in (b'-1',b'101',b'NaN',b'0.5'):assert request('api/link-opacity',value)[0]==400
 assert state()['linkOpacity']==35
 for action in ('follow-on','hide-link','link-below'):assert request('api/'+action,b'')[0]==200
 s=state();assert s['followLink'] and not s['showLink'] and s['linkOrder']=='below'
 assert request('api/show-link',b'')[0]==200 and state()['followLink']
 code,slots=request('api/saves');assert code==200 and len(slots['slots'])==2
 assert all(len(slot['summary']['counts'])==21 for slot in slots['slots'])
 live=state();before_a=a.read_bytes();before_b=b.read_bytes()
 for endpoint,body in [('inspect-file',str(b).encode()),('inspect-upload',original)]:
  code,reply=request('api/'+endpoint,body);assert code==200 and reply['ok'] and len(reply['snapshot']['states'])==2414
  after=state();assert all(after[k]==live[k] for k in ('source','mode','auto','followLink','showLink','linkOrder','linkOpacity','snapshot'))
 assert a.read_bytes()==before_a and b.read_bytes()==before_b
 assert request('api/inspect-upload',b'partial')[0]==400
 assert request('api/inspect-file',str(TEST/'missing.sav').encode())[0]==400
 assert state()['snapshot']==live['snapshot']
 writing=TEST/'writing.sav';writing.write_bytes(original);stop_writing=threading.Event();writer_ready=threading.Event()
 def change_during_read():
  with writing.open('r+b',buffering=0) as output:
   while not stop_writing.is_set():
    output.seek(offsets[0xe573f564]);output.write(struct.pack('<I',int(time.monotonic_ns()) & 0xffffffff));os.utime(writing,None);writer_ready.set()
 writer=threading.Thread(target=change_during_read);writer.start();writer_ready.wait(5)
 try:assert any(request('api/inspect-file',str(writing).encode())[0]==400 for _ in range(8))
 finally:stop_writing.set();writer.join(timeout=5)
 assert state()['snapshot']==live['snapshot']
 results.append('Consulta de slots, ruta y carga binaria sin cambiar Autosync ni escribir saves; preferencias de Link')
 from urllib.parse import quote
 code,folders=request('api/folders?path='+quote(str(TEST/'account')));assert code==200 and {f['name'] for f in folders['folders']}=={'slot_00','slot_01'};assert request('api/folders?path='+quote(str(TEST/'missing')))[0]==400;results.append('Navegación de carpetas y error de ruta inexistente');results.append('Selecciona por Playtime, aunque otro slot tenga fecha posterior')
 save(b,2000,1);s=until(lambda s:s.get('snapshot',{}).get('playtime')==2000);assert s['snapshot']['states'][0]==1;results.append('Autosync cambia de slot y actualiza los puntos al guardar')
 request('api/auto-off',b'');save(b,2001,0);time.sleep(1.7);assert state()['snapshot']['playtime']==2000
 request('api/refresh',b'');s=until(lambda s:s['snapshot']['playtime']==2001);assert s['snapshot']['states'][0]==0;results.append('Pausa Autosync y actualización manual')
 request('api/auto-on',b'');b.write_bytes(b'partial');s=until(lambda s:s['status']=='error');assert s['snapshot']['playtime']==2001
 code,slots=request('api/saves');bad=next(slot for slot in slots['slots'] if slot['file']==str(b));assert bad['status']=='error' and bad['error'] and bad['summary']['playtime']==2001
 assert request('api/inspect-file',str(b).encode())[0]==400
 save(b,2002,1);until(lambda s:s['status']=='ok' and s['snapshot']['playtime']==2002);results.append('Archivo incompleto conserva el estado válido y se recupera')
 assert request('api/set-folder',str(TEST/'account').encode())[0]==200;assert state()['auto'];results.append('Elegir carpeta activa Autosync automáticamente');
 assert request('api/set-file',str(a).encode())[0]==200;until(lambda s:s['status']=='ok' and s['snapshot']['file']==str(a));assert not state()['auto'];results.append('Selección manual mediante ruta válida');
 code,_=request('api/upload',original);assert code==200;s=state();assert s['mode']=='memory' and not s['auto'] and len(s['snapshot']['states'])==2414
 rev=s['snapshot']['revision'];assert request('api/upload',b'bad')[0]==400 and state()['snapshot']['revision']==rev;results.append('Carga manual en memoria y rechazo de archivo inválido')
 assert request('api/auto-on',b'',{})[0]==405
 assert request('api/auto-on',b'',{'Origin':'https://example.invalid'})[0]==403
 assert request('src/Unexplored.cs')[0]==404
 results.append('API local rechaza acciones sin origen y archivos fuera de la lista permitida')
 assert request('api/set-folder',str(TEST/'account').encode())[0]==200
 proc.terminate();proc.wait(timeout=10);urlfile.unlink(missing_ok=True)
 proc=subprocess.Popen([str(TEST/'HyruleSync.exe'),'--no-browser','--url-file',str(urlfile)],creationflags=subprocess.CREATE_NO_WINDOW)
 for _ in range(100):
  if urlfile.exists():break
  time.sleep(.1)
 url=urlfile.read_text().replace('hyrulesync.localhost','127.0.0.1');origin=url.split('/',3)[0]+'//'+url.split('/')[2]
 s=until(lambda s:s['status']=='ok');assert s['auto'] and s['mode']=='folder' and s['snapshot']['playtime']==2002
 assert s['showLink'] and s['followLink'] and s['linkOrder']=='below'
 assert s['linkOpacity']==35
 duplicate=subprocess.run([str(TEST/'HyruleSync.exe'),'--no-browser'],timeout=10,creationflags=subprocess.CREATE_NO_WINDOW);assert duplicate.returncode==0;assert state()['auto'];results.append('Recuerda carpeta y Autosync al reiniciar; evita una segunda instancia')
 print(json.dumps({'passed':True,'checks':results},ensure_ascii=False,indent=2))
 (ROOT/'.local/verification/sync-summary.json').write_text(json.dumps({'passed':True,'checks':results},ensure_ascii=False,indent=2),encoding='utf8')
finally:
 proc.terminate();proc.wait(timeout=10)
