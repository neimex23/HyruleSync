using System;
using System.IO;
using System.Net;
using System.Linq;
using System.Text;
using System.Reflection;
using System.Threading;
using System.Security.Cryptography;
using System.Web.Script.Serialization;

// Resource locations and checksums are pinned. No map content is embedded in public builds.
public class ResourceFile { public string path, source, sha256; public long size; }
public class ResourceManifest { public string repository, commit; public ResourceFile[] files; }
public static class MapResources {
    public static readonly string Root = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ".data");
    public static ResourceManifest Manifest;
    static readonly object Gate = new object();
    static bool ready, busy;
    static long received, total;
    static string current = "", error = "";
    public static Action OnReady;

    public static byte[] Embedded(string name) {
        using (var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("hyrulesync/" + name)) {
            if (stream == null) throw new FileNotFoundException(Locale.T("Recurso de la aplicación ausente: ","Missing application resource: ") + name);
            using (var output = new MemoryStream()) { stream.CopyTo(output); return output.ToArray(); }
        }
    }
    static string Hash(string path) {
        using (var sha = SHA256.Create())
        using (var file = File.OpenRead(path))
            return BitConverter.ToString(sha.ComputeHash(file)).Replace("-", "").ToLowerInvariant();
    }
    static bool Valid(ResourceFile item) {
        string path = Path.Combine(Root, item.path);
        return File.Exists(path) && new FileInfo(path).Length == item.size && Hash(path) == item.sha256;
    }
    public static void Initialize() {
        var json = new JavaScriptSerializer();
        Manifest = json.Deserialize<ResourceManifest>(Encoding.UTF8.GetString(Embedded("resources.json")));
        total = Manifest.files.Sum(f => f.size);
        ready = Manifest.files.All(Valid);
    }
    public static bool Ready { get { lock (Gate) return ready; } }
    public static object State() {
        lock (Gate) return new { ready, busy, received, total, current, error };
    }
    public static void StartDownload() {
        lock (Gate) {
            if (busy || ready) return;
            busy = true; error = ""; received = 0;
        }
        ThreadPool.QueueUserWorkItem(unused => {
            try {
                ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;
                foreach (var item in Manifest.files) {
                    lock (Gate) current = item.path;
                    if (Valid(item)) { lock (Gate) received += item.size; continue; }
                    string target = Path.Combine(Root, item.path), partial = target + ".part";
                    Directory.CreateDirectory(Path.GetDirectoryName(target));
                    var request = (HttpWebRequest)WebRequest.Create(
                        "https://raw.githubusercontent.com/" + Manifest.repository + "/" + Manifest.commit + "/" + item.source);
                    request.UserAgent = "HyruleSync/0.3.0";
                    request.Timeout = 30000; request.ReadWriteTimeout = 30000;
                    long length = 0;
                    using (var response = request.GetResponse())
                    using (var input = response.GetResponseStream())
                    using (var output = new FileStream(partial, FileMode.Create, FileAccess.Write)) {
                        byte[] buffer = new byte[65536]; int read;
                        while ((read = input.Read(buffer, 0, buffer.Length)) > 0) {
                            length += read;
                            if (length > item.size) throw new InvalidDataException(Locale.T("El recurso supera el tamaño esperado.","The resource exceeds the expected size."));
                            output.Write(buffer, 0, read);
                            lock (Gate) received += read;
                        }
                    }
                    if (length != item.size || Hash(partial) != item.sha256)
                        throw new InvalidDataException(Locale.T("El recurso no coincide con la versión esperada: ","The resource does not match the expected version: ") + item.path);
                    if (File.Exists(target)) File.Delete(target);
                    File.Move(partial, target);
                }
                if (OnReady != null) OnReady();
                lock (Gate) { ready = true; current = ""; }
            } catch (Exception ex) {
                lock (Gate) error = Locale.T("No se pudo preparar el mapa: ","Could not prepare the map: ") + ex.Message + Locale.T(" Puedes reintentar; se conservan los recursos verificados."," You can retry; verified resources are preserved.");
            } finally { lock (Gate) busy = false; }
        });
    }
}
