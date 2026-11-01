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

public static partial class Program {
 static readonly string Home=AppDomain.CurrentDomain.BaseDirectory;
 static readonly object Gate=new object(),JsonGate=new object();
 static readonly JavaScriptSerializer Json=new JavaScriptSerializer{MaxJsonLength=12*1024*1024};
 static Catalog catalog;static byte[] catalogBytes;static Settings settings=new Settings();
 static Dictionary<string,Cached> cache=new Dictionary<string,Cached>();static string warning="",token,url;static bool force=true;static Snapshot imported;static string checkedAt="",changedAt="",lastRevision="";static int updateCount;static Mutex instance;const bool picking=false;
 static volatile bool running=true;static TcpListener listener;static System.Threading.Timer timer;static NotifyIcon tray;static ApplicationContext context;static EventWaitHandle stopSignal;static RegisteredWaitHandle stopWait;
 static readonly PageLifetime pages=new PageLifetime();static System.Windows.Forms.Timer pageTimer;
 static string Serialize(object value){lock(JsonGate)return Json.Serialize(value);}
 static string Sha(byte[] data){using(var h=SHA256.Create())return BitConverter.ToString(h.ComputeHash(data)).Replace("-","").ToLowerInvariant();}
 static void LoadCatalog() {
  lock(Gate) {
   catalog = Catalog.Load(File.ReadAllText(Path.Combine(MapResources.Root, "map_data.json"), Encoding.UTF8),
                          Encoding.UTF8.GetString(MapResources.Embedded("towers.json")));
   catalogBytes = Encoding.UTF8.GetBytes(Serialize(catalog));
  }
 }
 static byte[] ReadOnly(string file){using(var s=new FileStream(file,FileMode.Open,FileAccess.Read,FileShare.ReadWrite|FileShare.Delete)){if(s.Length>4*1024*1024)throw new InvalidDataException(Locale.T("El archivo supera el tamaño de un guardado de TOTK.","The file exceeds the size of a TOTK save."));byte[] bytes=new byte[(int)s.Length];int n=0,r;while(n<bytes.Length&&(r=s.Read(bytes,n,bytes.Length-n))>0)n+=r;if(n!=bytes.Length)throw new IOException(Locale.T("El juego está escribiendo el guardado. Se reintentará.","The game is writing the save. HyruleSync will retry."));return bytes;}}
 static Snapshot Parse(byte[] data,string path){
  var reader=new SaveReader(data);int[] states=new int[catalog.points.Count],visited=new int[states.Length];string[] values=new string[states.Length];
  for(int i=0;i<states.Length;i++){
   states[i]=reader.State(catalog.points[i],out values[i]);
   visited[i]=reader.BooleanState(catalog.points[i].visitHash);
  }
  var position=reader.PlayerPosition();
  return new Snapshot{revision=Sha(data),file=path,savedAt=(File.Exists(path)?File.GetLastWriteTimeUtc(path):DateTime.UtcNow).ToString("o"),format=reader.format,playtime=reader.playtime,states=states,visited=visited,values=values,tableEnd=reader.tableEnd,guidStart=reader.guidStart,playerPosition=position,playerContext=SaveReader.ResolveContext(reader.CurrentMap(),position,catalog.points)};
 }
 static Snapshot InspectFile(string path){
  path=Path.GetFullPath(path);var before=new FileInfo(path);long ticks=before.LastWriteTimeUtc.Ticks,size=before.Length;
  var data=ReadOnly(path);var result=Parse(data,path);var after=new FileInfo(path);
  if(after.LastWriteTimeUtc.Ticks!=ticks||after.Length!=size)throw new IOException(Locale.T("El juego está escribiendo el guardado. Se reintentará.","The game is writing the save. HyruleSync will retry."));
  result.savedAt=new DateTime(ticks,DateTimeKind.Utc).ToString("o");return result;
 }
 static SnapshotSummary SaveSummary(Snapshot snapshot) {
  return new SnapshotSummary {
   file = snapshot.file, savedAt = snapshot.savedAt, playtime = snapshot.playtime,
   format = snapshot.format, playerContext = snapshot.playerContext,
   counts = catalog.CountProgress(snapshot.states)
  };
 }
 static object SaveSlots(){lock(Gate)return new{slots=cache.OrderByDescending(c=>c.Value.snapshot==null?0:c.Value.snapshot.playtime).ThenBy(c=>c.Key).Select(c=>new{file=c.Key,status=c.Value.error!=""?"error":c.Value.observed!=DateTime.MaxValue?"reading":"ok",error=c.Value.error,summary=c.Value.snapshot==null?null:SaveSummary(c.Value.snapshot)}).ToArray()};}
 static void SaveSettings(){try{Directory.CreateDirectory(Path.Combine(Home,".state"));File.WriteAllText(Path.Combine(Home,".state","settings.json"),Serialize(settings),Encoding.UTF8);}catch{}}
 static void SetLanguage(string preference){
  if(preference!="en"&&preference!="es"&&preference!="auto")throw new ArgumentException(Locale.T("Elige español, inglés o automático.","Choose Spanish, English or automatic."));
  lock(Gate){
   Locale.Configure(new string[0],preference);settings.language=preference;
   if(catalog!=null){LoadCatalog();foreach(var item in cache.Values)LocalizeSnapshot(item.snapshot);LocalizeSnapshot(imported);}
   SaveSettings();
  }
 }
 static void LocalizeSnapshot(Snapshot snapshot){
  if(snapshot==null)return;
  string[,] labels={{"GUID presente","GUID present"},{"GUID ausente","GUID absent"},{"Hash ausente del guardado","Hash missing from the save"}};
  for(int i=0;i<snapshot.values.Length;i++)for(int j=0;j<labels.GetLength(0);j++)
   if(snapshot.values[i]==labels[j,0]||snapshot.values[i]==labels[j,1]){snapshot.values[i]=Locale.T(labels[j,0],labels[j,1]);break;}
  if(snapshot.playerContext!=null)snapshot.playerContext=SaveReader.ResolveContext(snapshot.playerContext.mapId,snapshot.playerPosition,catalog.points);
 }
 static void SetSource(string source,string mode){lock(Gate){settings.source=source;settings.mode=mode;if(mode=="folder")settings.auto=true;force=true;cache.Clear();imported=null;warning="";SaveSettings();}}
 static void Scan(object unused){
  if(!Monitor.TryEnter(Gate))return;
  try{
   if(!MapResources.Ready||String.IsNullOrEmpty(settings.source)||(!settings.auto&&!force))return;
   checkedAt=DateTime.UtcNow.ToString("o");
   string[] paths;
   if(settings.mode=="folder"){
    if(!Directory.Exists(settings.source))throw new IOException(Locale.T("La carpeta seleccionada ya no existe.","The selected folder no longer exists."));
    paths=Directory.EnumerateFiles(settings.source,"progress.sav",SearchOption.AllDirectories).Take(48).ToArray();
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
  // UTC round-trip timestamps sort chronologically without reparsing every poll.
  var candidates=cache.Values.Where(c=>c.snapshot!=null).OrderByDescending(c=>c.snapshot.playtime).ThenByDescending(c=>c.snapshot.savedAt,StringComparer.Ordinal).ToArray();
  Snapshot selected=imported??(candidates.Length==0?null:candidates[0].snapshot);
  if(selected!=null&&selected.revision!=lastRevision){lastRevision=selected.revision;changedAt=DateTime.UtcNow.ToString("o");updateCount++;}
  var error=cache.FirstOrDefault(c=>c.Value.error!="");string message=warning;
  if(error.Value!=null)message=Locale.T("No se pudo leer ","Could not read ")+Path.GetFileName(Path.GetDirectoryName(error.Key))+": "+error.Value.error+Locale.T(" Se conserva el último estado válido."," The last valid state is preserved.");
  return new{language=Locale.Language,checkedAt=checkedAt,changedAt=changedAt,updateCount=updateCount,picking=picking,status=message!=""?"error":selected==null?"empty":force?"reading":"ok",message=message,source=settings.source,mode=settings.mode,auto=settings.auto,followLink=settings.followLink,showLink=settings.showLink,linkOrder=settings.linkOrder,linkOpacity=settings.linkOpacity,runInBackground=settings.runInBackground,snapshot=selected,
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
  var accounts=new HashSet<string>();foreach(var root in roots){if(Directory.EnumerateDirectories(root,"slot_*").Any())accounts.Add(root);foreach(string dir in Directory.EnumerateDirectories(root))if(Directory.EnumerateDirectories(dir,"slot_*").Any())accounts.Add(dir);}
  foreach(string dir in accounts){
   if(Directory.EnumerateDirectories(dir,"slot_*").Any()){choices.Add(new{name="Recomp · "+Path.GetFileName(dir),path=dir});foreach(string save in Directory.EnumerateFiles(dir,"progress.sav",SearchOption.AllDirectories))saves.Add(new{name=Path.GetFileName(dir)+" / "+Path.GetFileName(Path.GetDirectoryName(save)),path=save});}
  }
  return new{choices=choices,saves=saves,defaultPath=Directory.Exists(known)?known:""};
 }
 static void OpenMap(){Process.Start(new ProcessStartInfo(url){UseShellExecute=true});}
 [STAThread]public static void Main(string[] args){
  try{
   string stateDir=Path.Combine(Home,".state"),config=Path.Combine(stateDir,"settings.json");
   if(File.Exists(config))try{settings=Json.Deserialize<Settings>(File.ReadAllText(config))??new Settings();}catch{}
   settings.language=Locale.Preference(settings.language);
   Locale.Configure(args,settings.language);MapResources.Initialize();if(MapResources.Ready)LoadCatalog();MapResources.OnReady=LoadCatalog;
   if(args.Length>=3&&args[0]=="--inspect"){
    if(!MapResources.Ready)throw new InvalidDataException(Locale.T("Faltan los recursos del mapa.","Map resources are missing."));
    Snapshot s=Parse(ReadOnly(args[1]),Path.GetFullPath(args[1]));
    File.WriteAllText(args[2],Serialize(new{snapshot=s,counts=catalog.CountProgress(s.states)}),Encoding.UTF8);return;
   }
   Directory.CreateDirectory(stateDir);
   settings.linkOpacity=Math.Max(0,Math.Min(100,settings.linkOpacity));
   string urlFile=null;for(int i=0;i<args.Length;i++){
    if(args[i]=="--auto")settings.auto=true;
    if(i<args.Length-1){if(args[i]=="--source"){settings.source=Path.GetFullPath(args[++i]);settings.mode="file";}else if(args[i]=="--folder"){settings.source=Path.GetFullPath(args[++i]);settings.mode="folder";}else if(args[i]=="--url-file")urlFile=Path.GetFullPath(args[++i]);}
   }
   bool created;instance=new Mutex(true,"Local\\HyruleSync-"+Sha(Encoding.UTF8.GetBytes(Home)).Substring(0,20),out created);
   if(!created){string prior=Path.Combine(stateDir,"url.txt");if(File.Exists(prior)&&!args.Contains("--no-browser"))Process.Start(new ProcessStartInfo(File.ReadAllText(prior)){UseShellExecute=true});return;}
   token=Guid.NewGuid().ToString("N");listener=new TcpListener(IPAddress.Loopback,0);listener.Start();url="http://127.0.0.1:"+((IPEndPoint)listener.LocalEndpoint).Port+"/"+token+"/";
   File.WriteAllText(Path.Combine(stateDir,"url.txt"),url);if(urlFile!=null)File.WriteAllText(urlFile,url);
   Application.EnableVisualStyles();context=new ApplicationContext();
   pageTimer=new System.Windows.Forms.Timer{Interval=500};pageTimer.Tick+=(s,e)=>{bool background;lock(Gate)background=settings.runInBackground;if(pages.ShouldExit(DateTime.UtcNow,background))context.ExitThread();};pageTimer.Start();
   stopSignal=new EventWaitHandle(false,EventResetMode.ManualReset,"Local\\HyruleSync.Stop."+Process.GetCurrentProcess().Id);
   stopWait=ThreadPool.RegisterWaitForSingleObject(stopSignal,(state,timedOut)=>Application.Exit(),null,Timeout.Infinite,true);
   var menu=new ContextMenuStrip();menu.Items.Add(Locale.T("Abrir HyruleSync","Open HyruleSync"),null,(s,e)=>OpenMap());menu.Items.Add(Locale.T("Elegir carpeta de guardados…","Choose save folder…"),null,(s,e)=>Process.Start(new ProcessStartInfo(url+"#folder"){UseShellExecute=true}));menu.Items.Add(Locale.T("Pausar / reanudar Autosync","Pause / resume Autosync"),null,(s,e)=>{lock(Gate){settings.auto=!settings.auto;force=settings.auto;SaveSettings();}});menu.Items.Add(new ToolStripSeparator());menu.Items.Add(Locale.T("Salir","Exit"),null,(s,e)=>context.ExitThread());
   menu.Opening+=(s,e)=>{menu.Items[0].Text=Locale.T("Abrir HyruleSync","Open HyruleSync");menu.Items[1].Text=Locale.T("Elegir carpeta de guardados…","Choose save folder…");menu.Items[2].Text=Locale.T("Pausar / reanudar Autosync","Pause / resume Autosync");menu.Items[4].Text=Locale.T("Salir","Exit");};
   tray=new NotifyIcon{Icon=Icon.ExtractAssociatedIcon(Application.ExecutablePath),Text="HyruleSync",ContextMenuStrip=menu,Visible=true};tray.DoubleClick+=(s,e)=>OpenMap();
   timer=new System.Threading.Timer(Scan,null,0,500);new Thread(Loop){IsBackground=true}.Start();
   if(!args.Contains("--no-browser"))OpenMap();Application.Run(context);
  }catch(Exception ex){if(args.Length>=3&&args[0]=="--inspect"){File.WriteAllText(args[2],"ERROR: "+ex.Message);Environment.ExitCode=1;}else MessageBox.Show(ex.Message,"HyruleSync",MessageBoxButtons.OK,MessageBoxIcon.Error);}
  finally{running=false;if(pageTimer!=null)pageTimer.Dispose();if(timer!=null)timer.Dispose();if(listener!=null)listener.Stop();if(tray!=null)tray.Dispose();if(instance!=null)instance.Dispose();if(stopWait!=null)stopWait.Unregister(null);if(stopSignal!=null)stopSignal.Dispose();}
 }
}
