using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Threading;
using System.Web.Script.Serialization;

public class ReleaseAsset {public string name,browser_download_url,state;public long size;}
public class ReleaseInfo {public string tag_name;public bool draft,prerelease;public ReleaseAsset[] assets;}
public class UpdateInfo {public string currentVersion,latestVersion="",downloadUrl="",releaseUrl="",checkedAt="",error="";public bool available,busy;}

public static class Updates {
 public const string Repository="neimex23/HyruleSync";
 static readonly object Gate=new object();
 public static readonly string CurrentVersion=Assembly.GetExecutingAssembly().GetName().Version.ToString(3);
 static UpdateInfo info=new UpdateInfo{currentVersion=CurrentVersion};
 static DateTime attempted=DateTime.MinValue;
 public static bool TryVersion(string tag,out Version version){
  version=null;return tag!=null&&Regex.IsMatch(tag,@"^v?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$")&&Version.TryParse(tag.TrimStart('v'),out version);
 }
 // Only offer the named Windows package from this repository's stable release.
 public static UpdateInfo Evaluate(ReleaseInfo release,string current){
  var result=new UpdateInfo{currentVersion=current};Version latest,installed;
  if(release==null||release.draft||release.prerelease||!TryVersion(release.tag_name,out latest)||!TryVersion(current,out installed))return result;
  string version=latest.ToString(3),name="HyruleSync-v"+version+"-windows.zip";
  string expected="https://github.com/"+Repository+"/releases/download/"+release.tag_name+"/"+name;
  var asset=(release.assets??new ReleaseAsset[0]).FirstOrDefault(a=>a!=null&&a.name==name&&a.state=="uploaded"&&a.size>0&&String.Equals(a.browser_download_url,expected,StringComparison.OrdinalIgnoreCase));
  if(asset==null)return result;
  result.latestVersion=version;result.releaseUrl="https://github.com/"+Repository+"/releases/tag/"+release.tag_name;
  result.available=latest>installed;if(result.available)result.downloadUrl=asset.browser_download_url;
  return result;
 }
 public static UpdateInfo State(){lock(Gate)return new UpdateInfo{currentVersion=info.currentVersion,latestVersion=info.latestVersion,downloadUrl=info.downloadUrl,releaseUrl=info.releaseUrl,available=info.available,busy=info.busy,checkedAt=info.checkedAt,error=info.error};}
 public static void Check(bool manual){
  lock(Gate){
   if(info.busy||(DateTime.UtcNow-attempted).TotalSeconds<(manual?60:3600))return;
   attempted=DateTime.UtcNow;info.busy=true;info.error="";
  }
  ThreadPool.QueueUserWorkItem(unused=>{
   try{
    ServicePointManager.SecurityProtocol|=SecurityProtocolType.Tls12;
    var request=(HttpWebRequest)WebRequest.Create("https://api.github.com/repos/"+Repository+"/releases/latest");
    request.UserAgent="HyruleSync/"+CurrentVersion;request.Accept="application/vnd.github+json";
    request.Timeout=15000;request.ReadWriteTimeout=15000;
    UpdateInfo next;
    try{
     using(var response=request.GetResponse())using(var stream=response.GetResponseStream())using(var reader=new StreamReader(stream)){
      var json=new JavaScriptSerializer{MaxJsonLength=2*1024*1024};next=Evaluate(json.Deserialize<ReleaseInfo>(reader.ReadToEnd()),CurrentVersion);
      if(next.latestVersion=="")throw new InvalidDataException("Release package is not ready.");
     }
    }catch(WebException ex){
     var response=ex.Response as HttpWebResponse;
     if(response==null||response.StatusCode!=HttpStatusCode.NotFound){if(response!=null)response.Close();throw;}
     response.Close();next=new UpdateInfo{currentVersion=CurrentVersion};
    }
    next.checkedAt=DateTime.UtcNow.ToString("o");lock(Gate)info=next;
   }catch{
    // Network errors leave the map usable and preserve any known download.
    lock(Gate){info.busy=false;info.error=Locale.T("No se pudieron buscar actualizaciones. Revisa tu conexión e inténtalo de nuevo.","Could not check for updates. Check your connection and try again.");}
   }
  });
 }
}
