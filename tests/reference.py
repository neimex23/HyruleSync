"""Independent implementation of upstream SavefileIO.cpp, checked per object."""
import json,pathlib,struct,subprocess,hashlib,collections,argparse
parser=argparse.ArgumentParser();parser.add_argument("--save",nargs="+",required=True,type=pathlib.Path);parser.add_argument("--upstream-save",type=pathlib.Path);parser.add_argument("--app",type=pathlib.Path);args=parser.parse_args()
ROOT=pathlib.Path(__file__).resolve().parents[1]
APP=args.app or ROOT/'outputs/HyruleSync';DATA=json.loads((APP/'.data/map_data.json').read_text())
ORDER=['hidden_koroks','carry_koroks','shrines','lightroots','caves','bubbuls','wells','chasms','locations','hinoxes','taluses','moldugas','flux_constructs','froxes','gleeoks','sages_wills','old_maps','addison_signposts','schema_stones','yiga_schematics']
TOWERS=json.loads((ROOT/'assets/towers.json').read_text(encoding='utf-8'))
WORK=ROOT/'.local/verification';WORK.mkdir(parents=True,exist_ok=True)
def reference(data):
    hashes={};guid_start=None
    for i in range(40,len(data)-8,8):
        key,val=struct.unpack_from('<II',data,i)
        if key==0xa3db7114:guid_start=val;break
        if key:hashes[key]=val
    assert guid_start is not None
    guids=set()
    for i in range(guid_start,len(data)-7,8):
        g=struct.unpack_from('<Q',data,i)[0]
        if not g:break
        guids.add(g)
    states=[]
    for cat in ORDER:
        for p in DATA[cat]:
            if cat in ('sages_wills','addison_signposts'):states.append(int(int(p['guid_hash']) in guids));continue
            if p['completion_hash'] not in hashes:states.append(-1);continue
            value=hashes[p['completion_hash']]
            states.append(int(value==1654019904 if cat in ('shrines','carry_koroks') else value==404286466 if cat=='lightroots' else value!=0))
    for tower in TOWERS:
        key=int(tower['activationHash']);states.append(int(hashes[key]!=0) if key in hashes else -1)
    return states,hashes,guid_start
def inspect(file,label):
    out=WORK/(label+'.json');run=subprocess.run([str(APP/'HyruleSync.exe'),'--inspect',str(file),str(out)],creationflags=subprocess.CREATE_NO_WINDOW)
    text=out.read_text(encoding='utf-8-sig')
    if run.returncode:raise ValueError(text)
    return json.loads(text)
files=args.save
before={p:hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
summary=[]
for i,p in enumerate(files+([args.upstream_save] if args.upstream_save else [])):
    expected,_,_=reference(p.read_bytes());actual=inspect(p,'save-'+str(i))
    assert expected==actual['snapshot']['states'],p
    summary.append(dict(source=p.parent.name if i<len(files) else 'upstream 100.sav',objects=len(expected),found=expected.count(1),unknown=expected.count(-1),format=actual['snapshot']['format']))
# Explicitly exercise enum comparisons, nonzero booleans, shared cave hashes and GUIDs > 2^53.
source=files[0];synthetic=bytearray(source.read_bytes());_,hashes,start=reference(synthetic);offsets={}
for i in range(40,0x60000,8):
    h=struct.unpack_from('<I',synthetic,i)[0]
    if h==0xa3db7114:break
    offsets[h]=i+4
for c,value in [('shrines',1),('lightroots',1),('carry_koroks',1),('hidden_koroks',2),('bubbuls',2)]:struct.pack_into('<I',synthetic,offsets[DATA[c][0]['completion_hash']],value)
for c in ('sages_wills','addison_signposts'):
    guid=int(DATA[c][0]['guid_hash']);assert guid>2**53
    end=next(i for i in range(start,len(synthetic)-16,8) if struct.unpack_from('<Q',synthetic,i)[0]==0)
    struct.pack_into('<QQ',synthetic,end,guid,0)
shared=next(h for h,n in collections.Counter(e['completion_hash'] for e in DATA['caves']).items() if n>1)
struct.pack_into('<I',synthetic,offsets[shared],2)
fake=WORK/'synthetic.sav';fake.write_bytes(synthetic)
expected,_,_=reference(synthetic);assert inspect(fake,'synthetic')['snapshot']['states']==expected
summary.append(dict(test='Enums, bool != 0, entradas compartidas y GUID UInt64',passed=True))
bad=WORK/'truncated.sav';bad.write_bytes(b'partial')
try:inspect(bad,'truncated');raise AssertionError('Accepted truncated save')
except ValueError:pass
assert all(hashlib.sha256(p.read_bytes()).hexdigest()==h for p,h in before.items())
manifest=json.loads((ROOT/'assets/resources.json').read_text());expected_hash=next(f['sha256'] for f in manifest['files'] if f['path']=='map_data.json');assert hashlib.sha256((APP/'.data/map_data.json').read_bytes()).hexdigest()==expected_hash
summary.append(dict(test='Catálogo verificado y guardados originales intactos',passed=True))
(WORK/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
