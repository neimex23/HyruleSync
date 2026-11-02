using System;
using System.Collections.Generic;

// Track open browser documents by connection, so a delayed disconnect cannot remove
// a newer EventSource reconnection. Closing the last document allows reloads a grace period.
public class PageLifetime {
 readonly object gate=new object();
 readonly Dictionary<string,object> pages=new Dictionary<string,object>();
 DateTime? emptySince;
 public void Open(string id,object connection){lock(gate){pages[id]=connection;emptySince=null;}}
 public bool Connected(string id,object connection){lock(gate){object current;return pages.TryGetValue(id,out current)&&Object.ReferenceEquals(current,connection);}}
 public void Close(string id,object connection,DateTime now){lock(gate){object current;if(pages.TryGetValue(id,out current)&&(connection==null||Object.ReferenceEquals(current,connection))){pages.Remove(id);if(pages.Count==0)emptySince=now;}}}
 public bool ShouldExit(DateTime now,bool background){lock(gate)return !background&&!HDMapTiles.DownloadingAll&&pages.Count==0&&emptySince.HasValue&&(now-emptySince.Value).TotalSeconds>=5;}
}
