import pathlib, shutil, subprocess, struct, urllib.request, urllib.error, json, time, os, argparse
parser=argparse.ArgumentParser();parser.add_argument("--save",required=True,type=pathlib.Path);args=parser.parse_args()
ROOT=pathlib.Path(__file__).resolve().parents[1]
APP=ROOT/'outputs/HyruleSync'; TEST=ROOT/'.local/sync-test'; TEST.mkdir(exist_ok=True)
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
proc=subprocess.Popen([str(TEST/'HyruleSync.exe'),'--folder',str(TEST/'account'),'--auto','--no-browser','--url-file',str(urlfile)],creationflags=subprocess.CREATE_NO_WINDOW)
results=[]
try:
 for _ in range(100):
  if urlfile.exists():break
  time.sleep(.1)
 url=urlfile.read_text();origin=url.split('/',3)[0]+'//'+url.split('/')[2]
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
 from urllib.parse import quote
 code,folders=request('api/folders?path='+quote(str(TEST/'account')));assert code==200 and {f['name'] for f in folders['folders']}=={'slot_00','slot_01'};assert request('api/folders?path='+quote(str(TEST/'missing')))[0]==400;results.append('Navegación de carpetas y error de ruta inexistente');results.append('Selecciona por Playtime, aunque otro slot tenga fecha posterior')
 save(b,2000,1);s=until(lambda s:s.get('snapshot',{}).get('playtime')==2000);assert s['snapshot']['states'][0]==1;results.append('Autosync cambia de slot y actualiza los puntos al guardar')
 request('api/auto-off',b'');save(b,2001,0);time.sleep(1.7);assert state()['snapshot']['playtime']==2000
 request('api/refresh',b'');s=until(lambda s:s['snapshot']['playtime']==2001);assert s['snapshot']['states'][0]==0;results.append('Pausa Autosync y actualización manual')
 request('api/auto-on',b'');b.write_bytes(b'partial');s=until(lambda s:s['status']=='error');assert s['snapshot']['playtime']==2001
 save(b,2002,1);until(lambda s:s['status']=='ok' and s['snapshot']['playtime']==2002);results.append('Archivo incompleto conserva el estado válido y se recupera')
 assert request('api/set-folder',str(TEST/'account').encode())[0]==200;assert state()['auto'];results.append('Elegir carpeta activa Autosync automáticamente');
 assert request('api/set-file',str(a).encode())[0]==200;until(lambda s:s['status']=='ok' and s['snapshot']['file']==str(a));assert not state()['auto'];results.append('Selección manual mediante ruta válida');
 code,_=request('api/upload',original);assert code==200;s=state();assert s['mode']=='memory' and not s['auto'] and len(s['snapshot']['states'])==2399
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
 url=urlfile.read_text();origin=url.split('/',3)[0]+'//'+url.split('/')[2]
 s=until(lambda s:s['status']=='ok');assert s['auto'] and s['mode']=='folder' and s['snapshot']['playtime']==2002
 duplicate=subprocess.run([str(TEST/'HyruleSync.exe'),'--no-browser'],timeout=10,creationflags=subprocess.CREATE_NO_WINDOW);assert duplicate.returncode==0;assert state()['auto'];results.append('Recuerda carpeta y Autosync al reiniciar; evita una segunda instancia')
 print(json.dumps({'passed':True,'checks':results},ensure_ascii=False,indent=2))
 (ROOT/'.local/verification/sync-summary.json').write_text(json.dumps({'passed':True,'checks':results},ensure_ascii=False,indent=2),encoding='utf8')
finally:
 proc.terminate();proc.wait(timeout=10)
