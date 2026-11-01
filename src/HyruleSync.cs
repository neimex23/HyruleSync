// HyruleSync: independent Windows save reader and local map application.
// Format/data provenance: docs/save-format.md and THIRD_PARTY.md. Saves are read-only.
using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using System.Drawing;

public class Position {public double x,y,z;}
public class Flower {public Position position;}
public class Route {public Position start,end;public Flower[] flowers;}
public class Entry {public uint completion_hash;public string guid_hash,display_name,internal_name,type;public Position position;public Route path;}
public class Category {public string id,name,icon;public int count;}
public class MapPoint {public string id,category,name,internalName,korokType,hash,guid;public Position position;public Route path;}
public class Catalog {public string upstreamCommit;public List<Category> categories=new List<Category>();public List<MapPoint> points=new List<MapPoint>();}
public class SaveReader {
 public readonly byte[] bytes;public string format;public int tableEnd,guidStart;public uint playtime;
 public Dictionary<uint,int> offsets=new Dictionary<uint,int>();public HashSet<ulong> guids=new HashSet<ulong>();
 public uint U32(int p){Check(p,4);return BitConverter.ToUInt32(bytes,p);}
 void Check(int p,int n){if(p<0||p>bytes.Length-n)throw new InvalidDataException(Locale.T("El archivo está incompleto o contiene una dirección inválida.","The file is incomplete or contains an invalid offset."));}
 public SaveReader(byte[] data){
  bytes=data;if(bytes.Length<40||U32(0)!=0x01020304)throw new InvalidDataException(Locale.T("Selecciona un progress.sav válido, no caption.sav ni un archivo .nro.","Select a valid progress.sav file, not caption.sav or an .nro file."));
  var versions=new Dictionary<int,Tuple<uint,uint,string>>{{2307552,Tuple.Create(0x0046c3c8u,0x0003c050u,"1.0")},{2307656,Tuple.Create(0x0047e0f4u,0x0003c088u,"1.1 / 1.2")},{2307856,Tuple.Create(0x0049e946u,0x0003c138u,"1.4 / Recomp 1.4.3")}};
  Tuple<uint,uint,string> v;if(!versions.TryGetValue(bytes.Length,out v)||U32(4)!=v.Item1||U32(8)!=v.Item2)throw new InvalidDataException(Locale.T("Formato no reconocido. Se admiten guardados originales 1.0, 1.1/1.2 y 1.4.","Unrecognized format. Save formats 1.0, 1.1/1.2 and 1.4 are supported."));format=v.Item3;
  // Upstream GetHashTableEnd: find MetaData.SaveTypeHash, never hard-code 0x3c800.
  for(int p=40;p<Math.Min(bytes.Length-8,0x60000);p+=8){uint key=U32(p);if(key==0xa3db7114){tableEnd=p;guidStart=checked((int)U32(p+4));break;}if(key==0)continue;if(offsets.ContainsKey(key))throw new InvalidDataException(Locale.T("Tabla de hashes duplicada.","Duplicate hash table entry."));offsets.Add(key,p+4);}
  if(tableEnd==0||guidStart<tableEnd||guidStart>bytes.Length-8)throw new InvalidDataException(Locale.T("No se encuentra una tabla de progreso válida.","No valid progress table was found."));
  for(int p=guidStart;p<bytes.Length-7;p+=8){ulong g=BitConverter.ToUInt64(bytes,p);if(g==0)break;guids.Add(g);}
  int t;if(offsets.TryGetValue(0xe573f564,out t))playtime=U32(t);
 }
 public Position PlayerPosition(){
  // PlayerStatus.SavePos is a pointer to three little-endian float32 values.
  int entry;if(!offsets.TryGetValue(0xc884818du,out entry))return null;
  uint address=U32(entry);if(address<(uint)(tableEnd+8)||address>(uint)(bytes.Length-12))return null;
  int p=(int)address;double x=BitConverter.ToSingle(bytes,p),y=BitConverter.ToSingle(bytes,p+4),z=BitConverter.ToSingle(bytes,p+8);
  if(Double.IsNaN(x)||Double.IsInfinity(x)||Double.IsNaN(y)||Double.IsInfinity(y)||Double.IsNaN(z)||Double.IsInfinity(z))return null;
  return new Position{x=x,y=y,z=z};
 }
 public int State(MapPoint p,out string raw){
  if(!String.IsNullOrEmpty(p.guid)){ulong guid=UInt64.Parse(p.guid);bool found=guids.Contains(guid);raw=found?Locale.T("GUID presente","GUID present"):Locale.T("GUID ausente","GUID absent");return found?1:0;}
  int offset;if(!offsets.TryGetValue(UInt32.Parse(p.hash),out offset)){raw=Locale.T("Hash ausente del guardado","Hash missing from the save");return -1;}
  uint status=U32(offset);raw="0x"+status.ToString("X8")+" ("+status+")";
  // Exactly the comparisons in upstream SavefileIO::ParseFile.
  if(p.category=="shrines"||p.category=="carry_koroks")return status==1654019904u?1:0; // Clear
  if(p.category=="lightroots")return status==404286466u?1:0; // Open
  return status!=0?1:0;
 }
}
public class Snapshot {public string revision,file,savedAt,format;public uint playtime;public int[] states;public string[] values;public int tableEnd,guidStart;public Position playerPosition;}
public class Cached {public long ticks,size;public DateTime observed;public Snapshot snapshot;public string error="";}
public class Settings {public string source="",mode="file";public bool auto=true,followLink=false;}
public static class Program {
 static readonly string Home=AppDomain.CurrentDomain.BaseDirectory;
 static readonly object Gate=new object(),JsonGate=new object();
 static readonly JavaScriptSerializer Json=new JavaScriptSerializer{MaxJsonLength=12*1024*1024};
 static Catalog catalog;static byte[] catalogBytes;static Settings settings=new Settings();
 static Dictionary<string,Cached> cache=new Dictionary<string,Cached>();static string warning="",token,url;static bool force=true;static Snapshot imported;static string checkedAt="",changedAt="",lastRevision="";static int updateCount;static Mutex instance;const bool picking=false;
 static volatile bool running=true;static TcpListener listener;static System.Threading.Timer timer;static NotifyIcon tray;static ApplicationContext context;static EventWaitHandle stopSignal;static RegisteredWaitHandle stopWait;
 static string Serialize(object value){lock(JsonGate)return Json.Serialize(value);}
 static string Sha(byte[] data){using(var h=SHA256.Create())return BitConverter.ToString(h.ComputeHash(data)).Replace("-","").ToLowerInvariant();}
 static void LoadCatalog(){
  var data=Json.Deserialize<Dictionary<string,Entry[]>>(File.ReadAllText(Path.Combine(MapResources.Root,"map_data.json"),Encoding.UTF8));
  string[] ids={"hidden_koroks","carry_koroks","shrines","lightroots","caves","bubbuls","wells","chasms","locations","hinoxes","taluses","moldugas","flux_constructs","froxes","gleeoks","sages_wills","old_maps","addison_signposts","schema_stones","yiga_schematics"};
  string[] names={Locale.T("Kologs ocultos","Hidden Koroks"),Locale.T("Kologs viajeros","Carry Koroks"),Locale.T("Santuarios","Shrines"),Locale.T("Raíces","Lightroots"),Locale.T("Cuevas · entradas","Caves · entrances"),Locale.T("Fantasmos","Bubbulfrogs"),Locale.T("Pozos","Wells"),Locale.T("Abismos","Chasms"),Locale.T("Lugares","Locations"),Locale.T("Hinox","Hinoxes"),Locale.T("Petraroks","Taluses"),Locale.T("Moldoras","Moldugas"),Locale.T("Gólems cúbicos","Flux Constructs"),Locale.T("Obsidianos","Froxes"),Locale.T("Griocks","Gleeoks"),Locale.T("Voluntades de sabios","Sage's Wills"),Locale.T("Mapas antiguos","Old Maps"),Locale.T("Carteles de Kabalit","Addison Signs"),Locale.T("Piedras esquemáticas","Schema Stones"),Locale.T("Esquemas Yiga","Yiga Schematics")};
  string[] icons={"korok_hidden","korok_carry","shrine","lightroot","cave","bubbul","well","chasm","location","eye","talus","molduga","flux_construct","frox","gleeok","sages_will","old_map","addison_sign","schema_stone","yiga_schematic"};
  catalog=new Catalog{upstreamCommit="a68ffbb083ac220c77f2e4ec3ce60d29924c1213"};
  for(int c=0;c<ids.Length;c++){
   var entries=data[ids[c]];catalog.categories.Add(new Category{id=ids[c],name=names[c],icon=icons[c],count=entries.Length});
   for(int i=0;i<entries.Length;i++){var e=entries[i];catalog.points.Add(new MapPoint{id=ids[c]+":"+i,category=ids[c],name=String.IsNullOrEmpty(e.display_name)?names[c]+" "+(i+1):e.display_name,internalName=e.internal_name,korokType=e.type,position=e.position,path=e.path,hash=e.completion_hash.ToString(),guid=e.guid_hash});}
  }
  catalogBytes=Encoding.UTF8.GetBytes(Serialize(catalog));
 }
 static byte[] ReadOnly(string file){using(var s=new FileStream(file,FileMode.Open,FileAccess.Read,FileShare.ReadWrite|FileShare.Delete)){if(s.Length>4*1024*1024)throw new InvalidDataException(Locale.T("El archivo supera el tamaño de un guardado de TOTK.","The file exceeds the size of a TOTK save."));byte[] bytes=new byte[(int)s.Length];int n=0,r;while(n<bytes.Length&&(r=s.Read(bytes,n,bytes.Length-n))>0)n+=r;if(n!=bytes.Length)throw new IOException(Locale.T("El juego está escribiendo el guardado. Se reintentará.","The game is writing the save. HyruleSync will retry."));return bytes;}}
 static Snapshot Parse(byte[] data,string path){
  var reader=new SaveReader(data);int[] states=new int[catalog.points.Count];string[] values=new string[states.Length];
  for(int i=0;i<states.Length;i++)states[i]=reader.State(catalog.points[i],out values[i]);
  return new Snapshot{revision=Sha(data),file=path,savedAt=(File.Exists(path)?File.GetLastWriteTimeUtc(path):DateTime.UtcNow).ToString("o"),format=reader.format,playtime=reader.playtime,states=states,values=values,tableEnd=reader.tableEnd,guidStart=reader.guidStart,playerPosition=reader.PlayerPosition()};
 }
 static void SaveSettings(){try{Directory.CreateDirectory(Path.Combine(Home,".state"));File.WriteAllText(Path.Combine(Home,".state","settings.json"),Serialize(settings),Encoding.UTF8);}catch{}}
 static void SetSource(string source,string mode){lock(Gate){settings.source=source;settings.mode=mode;if(mode=="folder")settings.auto=true;force=true;cache.Clear();imported=null;warning="";SaveSettings();}}
 static void Scan(object unused){
  if(!Monitor.TryEnter(Gate))return;
  try{
   if(!MapResources.Ready||String.IsNullOrEmpty(settings.source)||(!settings.auto&&!force))return;
   checkedAt=DateTime.UtcNow.ToString("o");
   string[] paths;
   if(settings.mode=="folder"){
    if(!Directory.Exists(settings.source))throw new IOException(Locale.T("La carpeta seleccionada ya no existe.","The selected folder no longer exists."));
    paths=Directory.GetFiles(settings.source,"progress.sav",SearchOption.AllDirectories).Take(48).ToArray();
   }else paths=File.Exists(settings.source)?new[]{settings.source}:new string[0];
   if(paths.Length==0){warning=Locale.T("No se encuentra ningún progress.sav en la selección.","No progress.sav file was found in the selected location.");return;}
   foreach(string dead in cache.Keys.Except(paths).ToArray())cache.Remove(dead);
   bool pending=false;warning="";
   foreach(string path in paths){
    FileInfo f=new FileInfo(path);Cached item;if(!cache.TryGetValue(path,out item)){item=new Cached();cache[path]=item;}
    if(item.ticks!=f.LastWriteTimeUtc.Ticks||item.size!=f.Length){item.ticks=f.LastWriteTimeUtc.Ticks;item.size=f.Length;item.observed=DateTime.UtcNow;item.error="";pending=true;continue;}
    if(item.observed==DateTime.MaxValue)continue;
    if((DateTime.UtcNow-item.observed).TotalMilliseconds<800){pending=true;continue;}
    try{
     byte[] data=ReadOnly(path);var after=new FileInfo(path);if(after.LastWriteTimeUtc.Ticks!=item.ticks||after.Length!=item.size){pending=true;continue;}
     item.snapshot=Parse(data,path);item.observed=DateTime.MaxValue;item.error="";
    }catch(Exception ex){item.error=ex.Message;pending=true;}
   }
   if(!pending)force=false;
  }catch(Exception ex){warning=ex.Message;}
  finally{Monitor.Exit(Gate);}
 }
 static object State(){lock(Gate){
  var candidates=cache.Values.Where(c=>c.snapshot!=null).OrderByDescending(c=>c.snapshot.playtime).ThenByDescending(c=>DateTime.Parse(c.snapshot.savedAt)).ToArray();
  Snapshot selected=imported??(candidates.Length==0?null:candidates[0].snapshot);
  if(selected!=null&&selected.revision!=lastRevision){lastRevision=selected.revision;changedAt=DateTime.UtcNow.ToString("o");updateCount++;}
  var errors=cache.Where(c=>c.Value.error!="").ToArray();string message=warning;
  if(errors.Length>0)message=Locale.T("No se pudo leer ","Could not read ")+Path.GetFileName(Path.GetDirectoryName(errors[0].Key))+": "+errors[0].Value.error+Locale.T(" Se conserva el último estado válido."," The last valid state is preserved.");
  return new{checkedAt=checkedAt,changedAt=changedAt,updateCount=updateCount,picking=picking,status=message!=""?"error":selected==null?"empty":force?"reading":"ok",message=message,source=settings.source,mode=settings.mode,auto=settings.auto,followLink=settings.followLink,snapshot=selected,
   slots=candidates.Select(c=>new{file=c.snapshot.file,playtime=c.snapshot.playtime,savedAt=c.snapshot.savedAt}).ToArray()};
 }}
 static object BrowseDirectories(string query){
  string path=query.StartsWith("?path=")?Uri.UnescapeDataString(query.Substring(6)):"";
  if(String.IsNullOrWhiteSpace(path))return new{path="",parent="",folders=DriveInfo.GetDrives().Where(d=>d.IsReady).Select(d=>new{name=d.Name,path=d.RootDirectory.FullName}).ToArray()};
  path=Path.GetFullPath(path);if(!Directory.Exists(path))throw new DirectoryNotFoundException(Locale.T("La carpeta no existe.","The folder does not exist."));
  var folder=new DirectoryInfo(path);
  return new{path=folder.FullName,parent=folder.Parent==null?"":folder.Parent.FullName,folders=folder.GetDirectories().Where(d=>(d.Attributes&(FileAttributes.Hidden|FileAttributes.System|FileAttributes.ReparsePoint))==0).OrderBy(d=>d.Name).Take(200).Select(d=>new{name=d.Name,path=d.FullName}).ToArray()};
 }
 static object SourceOptions(){
  var choices=new List<object>();var saves=new List<object>();string known=@"C:\Games\Zelda TOTK\profile\save";
  var roots=new[]{known,Path.Combine(Home,"profile","save"),settings.mode=="folder"?settings.source:""}.Where(Directory.Exists).Distinct().ToArray();
  var accounts=new HashSet<string>();foreach(var root in roots){if(Directory.GetDirectories(root,"slot_*").Length>0)accounts.Add(root);foreach(string dir in Directory.GetDirectories(root))if(Directory.GetDirectories(dir,"slot_*").Length>0)accounts.Add(dir);}
  foreach(string dir in accounts){
   if(Directory.GetDirectories(dir,"slot_*").Length>0){choices.Add(new{name="Recomp · "+Path.GetFileName(dir),path=dir});foreach(string save in Directory.GetFiles(dir,"progress.sav",SearchOption.AllDirectories))saves.Add(new{name=Path.GetFileName(dir)+" / "+Path.GetFileName(Path.GetDirectoryName(save)),path=save});}
  }
  return new{choices=choices,saves=saves,defaultPath=Directory.Exists(known)?known:""};
 }
 static byte[] Asset(string path,out string mime){
  mime="text/plain; charset=utf-8";
  if(new[]{"app.txt","leaflet.txt","third-party.en.md","third-party.es.md"}.Any(n=>path=="legal/"+n)){mime="text/plain; charset=utf-8";return MapResources.Embedded(path);}
  var files=new Dictionary<string,string>{{"","index.html"},{"index.html","index.html"},{"app.js","app.js"},{"i18n.js","i18n.js"},{"style.css","style.css"},{"vendor/leaflet.js","vendor/leaflet.js"},{"vendor/leaflet.css","vendor/leaflet.css"},{"app-icon.png","app-icon.png"}};
  string relative;
  if(files.TryGetValue(path,out relative)){
   mime=relative.EndsWith(".png")?"image/png":relative.EndsWith(".js")?"application/javascript; charset=utf-8":relative.EndsWith(".css")?"text/css; charset=utf-8":"text/html; charset=utf-8";
   return MapResources.Embedded("web/"+relative);
  }
  var maps=new[]{"surface-medium.png","sky-medium.png","depths-medium.png"};
  if(MapResources.Ready&&MapResources.Manifest.files.Any(f=>f.path==path)&&path.EndsWith(".png")){
   mime="image/png";return File.ReadAllBytes(Path.Combine(MapResources.Root,path));
  }
  return null;
 }
 static void Serve(object arg){using(var client=(TcpClient)arg){try{
  client.ReceiveTimeout=5000;client.SendTimeout=10000;using(var stream=client.GetStream()){
   var head=new List<byte>();int value;while(head.Count<16384&&(value=stream.ReadByte())>=0){head.Add((byte)value);int n=head.Count;if(n>=4&&head[n-4]==13&&head[n-3]==10&&head[n-2]==13&&head[n-1]==10)break;}
   string[] lines=Encoding.ASCII.GetString(head.ToArray()).Split(new[]{"\r\n"},StringSplitOptions.None);string[] first=lines[0].Split(' ');if(first.Length<2)return;
   Uri request=new Uri("http://127.0.0.1"+first[1]);string prefix="/"+token+"/",mime="text/plain; charset=utf-8";int code=200;byte[] bytes;
   string host=lines.FirstOrDefault(l=>l.StartsWith("Host:",StringComparison.OrdinalIgnoreCase)),origin=lines.FirstOrDefault(l=>l.StartsWith("Origin:",StringComparison.OrdinalIgnoreCase));
   bool hostOk=host!=null&&host.Trim().Equals("Host: 127.0.0.1:"+((IPEndPoint)listener.LocalEndpoint).Port,StringComparison.OrdinalIgnoreCase);
   bool originOk=origin==null||origin.Substring(7).Trim()==new Uri(url).GetLeftPart(UriPartial.Authority);
   if(!hostOk||!originOk||!request.AbsolutePath.StartsWith(prefix,StringComparison.Ordinal)) {code=403;bytes=Encoding.UTF8.GetBytes(Locale.T("Acceso no autorizado.","Unauthorized access."));}
   else{
    string path=request.AbsolutePath.Substring(prefix.Length);
    byte[] body=new byte[0];
    if(first[0]=="POST"){
     string lenHeader=lines.FirstOrDefault(l=>l.StartsWith("Content-Length:",StringComparison.OrdinalIgnoreCase));int length;
     if(lenHeader==null||!Int32.TryParse(lenHeader.Substring(15).Trim(),out length)||length<0||length>4*1024*1024)throw new InvalidDataException(Locale.T("Tamaño de solicitud inválido.","Invalid request size."));
     body=new byte[length];int read=0,count;while(read<length&&(count=stream.Read(body,read,length-read))>0)read+=count;if(read!=length)throw new IOException(Locale.T("Carga incompleta.","Incomplete upload."));
    }
    if(first[0]=="GET"&&path=="api/config"){mime="application/json; charset=utf-8";bytes=Encoding.UTF8.GetBytes(Serialize(new{language=Locale.Language,windowsCulture=Locale.WindowsCulture}));}
    else if(first[0]=="GET"&&path=="api/credits"){mime="application/json; charset=utf-8";bytes=MapResources.Embedded("credits.json");}
    else if(first[0]=="GET"&&path=="api/updates"){Updates.Check(false);mime="application/json; charset=utf-8";bytes=Encoding.UTF8.GetBytes(Serialize(Updates.State()));}
    else if(first[0]=="GET"&&path=="api/setup"){mime="application/json; charset=utf-8";bytes=Encoding.UTF8.GetBytes(Serialize(MapResources.State()));}
    else if(first[0]=="GET"&&path=="api/folders"){
     mime="application/json; charset=utf-8";
     try{bytes=Encoding.UTF8.GetBytes(Serialize(BrowseDirectories(request.Query)));}catch(Exception ex){code=400;bytes=Encoding.UTF8.GetBytes(Serialize(new{error=ex.Message}));}
    }
    else if(first[0]=="GET"&&path=="api/state"){mime="application/json; charset=utf-8";bytes=Encoding.UTF8.GetBytes(Serialize(State()));}
    else if(first[0]=="GET"&&path=="catalog.json"){mime="application/json; charset=utf-8";bytes=catalogBytes??Encoding.UTF8.GetBytes("{}");}
    else if(first[0]=="GET"&&path=="api/source-options"){mime="application/json; charset=utf-8";bytes=Encoding.UTF8.GetBytes(Serialize(SourceOptions()));}
    else if(first[0]=="POST"&&origin!=null&&path.StartsWith("api/")){
     string actionError=null;
     try{
     if(path=="api/prepare-map")MapResources.StartDownload();
     else if(path=="api/check-updates")Updates.Check(true);
     else if(path=="api/follow-on"||path=="api/follow-off"){lock(Gate){settings.followLink=path=="api/follow-on";SaveSettings();}}
     else if(!MapResources.Ready)throw new InvalidDataException(Locale.T("Primero prepara los recursos del mapa.","Prepare the map resources first."));
     else if(path=="api/upload"){
      var next=Parse(body,"progress.sav");
      lock(Gate){imported=next;cache.Clear();settings.source="";settings.mode="memory";settings.auto=false;warning="";force=false;SaveSettings();}
     }
     else if(path=="api/set-file"){
      string file=Path.GetFullPath(Encoding.UTF8.GetString(body).Trim());Parse(ReadOnly(file),file);
      SetSource(file,"file");lock(Gate){settings.auto=false;SaveSettings();}
     }
     else if(path=="api/set-folder"){
      string dir=Path.GetFullPath(Encoding.UTF8.GetString(body).Trim());
      if(Directory.GetParent(dir)==null)throw new InvalidDataException(Locale.T("Elige una carpeta de guardados, no una unidad completa.","Select a save folder, not an entire drive."));
      if(!Directory.Exists(dir)||Directory.GetFiles(dir,"progress.sav",SearchOption.AllDirectories).Length==0)throw new InvalidDataException(Locale.T("La carpeta no contiene ningún progress.sav.","The folder does not contain any progress.sav files."));
      SetSource(dir,"folder");
     }
     else if(path=="api/refresh"){lock(Gate){force=true;foreach(var c in cache.Values)c.observed=DateTime.UtcNow;}}
     else if(path=="api/auto-on"||path=="api/auto-off"){lock(Gate){settings.auto=path=="api/auto-on";if(settings.auto)force=true;SaveSettings();}}
     else code=404;
     }catch(Exception ex){code=400;actionError=ex.Message;}
     mime="application/json; charset=utf-8";bytes=Encoding.UTF8.GetBytes(Serialize(new{ok=code==200,error=actionError}));
    }else if(first[0]=="GET"){bytes=Asset(path,out mime);if(bytes==null){code=404;bytes=Encoding.UTF8.GetBytes(Locale.T("No encontrado.","Not found."));}}
    else{code=405;bytes=Encoding.UTF8.GetBytes(Locale.T("Método no permitido.","Method not allowed."));}
   }
   string h="HTTP/1.1 "+code+" "+(code==200?"OK":code==403?"Forbidden":"Not Found")+"\r\nContent-Type: "+mime+"\r\nContent-Length: "+bytes.Length+"\r\nCache-Control: "+(mime=="image/png"?"private, max-age=3600":"no-store")+"\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer\r\nContent-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'\r\nConnection: close\r\n\r\n";
   byte[] header=Encoding.ASCII.GetBytes(h);stream.Write(header,0,header.Length);stream.Write(bytes,0,bytes.Length);
  }
 }catch{}}}
 static void Loop(){while(running)try{ThreadPool.QueueUserWorkItem(Serve,listener.AcceptTcpClient());}catch{if(!running)return;}}
 static void OpenMap(){Process.Start(new ProcessStartInfo(url){UseShellExecute=true});}
 [STAThread]public static void Main(string[] args){
  try{
   Locale.Configure(args);MapResources.Initialize();if(MapResources.Ready)LoadCatalog();MapResources.OnReady=LoadCatalog;
   if(args.Length>=3&&args[0]=="--inspect"){
    if(!MapResources.Ready)throw new InvalidDataException(Locale.T("Faltan los recursos del mapa.","Map resources are missing."));
    Snapshot s=Parse(ReadOnly(args[1]),Path.GetFullPath(args[1]));
    File.WriteAllText(args[2],Serialize(new{snapshot=s,counts=catalog.categories.Select(c=>new{id=c.id,total=c.count,found=catalog.points.Select((p,i)=>new{p,i}).Count(x=>x.p.category==c.id&&s.states[x.i]==1),unknown=catalog.points.Select((p,i)=>new{p,i}).Count(x=>x.p.category==c.id&&s.states[x.i]==-1)})}),Encoding.UTF8);return;
   }
   string stateDir=Path.Combine(Home,".state");Directory.CreateDirectory(stateDir);
   string config=Path.Combine(stateDir,"settings.json");if(File.Exists(config))try{settings=Json.Deserialize<Settings>(File.ReadAllText(config))??new Settings();}catch{}
   string urlFile=null;for(int i=0;i<args.Length;i++){
    if(args[i]=="--auto")settings.auto=true;
    if(i<args.Length-1){if(args[i]=="--source"){settings.source=Path.GetFullPath(args[++i]);settings.mode="file";}else if(args[i]=="--folder"){settings.source=Path.GetFullPath(args[++i]);settings.mode="folder";}else if(args[i]=="--url-file")urlFile=Path.GetFullPath(args[++i]);}
   }
   bool created;instance=new Mutex(true,"Local\\HyruleSync-"+Sha(Encoding.UTF8.GetBytes(Home)).Substring(0,20),out created);
   if(!created){string prior=Path.Combine(stateDir,"url.txt");if(File.Exists(prior)&&!args.Contains("--no-browser"))Process.Start(new ProcessStartInfo(File.ReadAllText(prior)){UseShellExecute=true});return;}
   token=Guid.NewGuid().ToString("N");listener=new TcpListener(IPAddress.Loopback,0);listener.Start();url="http://127.0.0.1:"+((IPEndPoint)listener.LocalEndpoint).Port+"/"+token+"/";
   File.WriteAllText(Path.Combine(stateDir,"url.txt"),url);if(urlFile!=null)File.WriteAllText(urlFile,url);
   Application.EnableVisualStyles();context=new ApplicationContext();
   stopSignal=new EventWaitHandle(false,EventResetMode.ManualReset,"Local\\HyruleSync.Stop."+Process.GetCurrentProcess().Id);
   stopWait=ThreadPool.RegisterWaitForSingleObject(stopSignal,(state,timedOut)=>Application.Exit(),null,Timeout.Infinite,true);
   var menu=new ContextMenuStrip();menu.Items.Add(Locale.T("Abrir HyruleSync","Open HyruleSync"),null,(s,e)=>OpenMap());menu.Items.Add(Locale.T("Elegir carpeta de guardados…","Choose save folder…"),null,(s,e)=>Process.Start(new ProcessStartInfo(url+"#folder"){UseShellExecute=true}));menu.Items.Add(Locale.T("Pausar / reanudar Autosync","Pause / resume Autosync"),null,(s,e)=>{lock(Gate){settings.auto=!settings.auto;force=settings.auto;SaveSettings();}});menu.Items.Add(new ToolStripSeparator());menu.Items.Add(Locale.T("Salir","Exit"),null,(s,e)=>context.ExitThread());
   tray=new NotifyIcon{Icon=Icon.ExtractAssociatedIcon(Application.ExecutablePath),Text=Locale.T("HyruleSync · guardados en solo lectura","HyruleSync · read-only saves"),ContextMenuStrip=menu,Visible=true};tray.DoubleClick+=(s,e)=>OpenMap();
   timer=new System.Threading.Timer(Scan,null,0,500);new Thread(Loop){IsBackground=true}.Start();
   if(!args.Contains("--no-browser"))OpenMap();Application.Run(context);
  }catch(Exception ex){if(args.Length>=3&&args[0]=="--inspect"){File.WriteAllText(args[2],"ERROR: "+ex.Message);Environment.ExitCode=1;}else MessageBox.Show(ex.Message,"HyruleSync",MessageBoxButtons.OK,MessageBoxIcon.Error);}
  finally{running=false;if(timer!=null)timer.Dispose();if(listener!=null)listener.Stop();if(tray!=null)tray.Dispose();if(instance!=null)instance.Dispose();if(stopWait!=null)stopWait.Unregister(null);if(stopSignal!=null)stopSignal.Dispose();}
 }
}
