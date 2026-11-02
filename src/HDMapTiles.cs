using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

// Optional ZeldaMods imagery. Only fixed, bounded tile URLs can be requested.
// A failed/missing tile stays transparent above the standard offline background.
public static class HDMapTiles {
    public static readonly string Root = Path.Combine(MapResources.Root, "hd-map", "zeldamods-v1");
    const string Origin = "https://objmap-totk.zeldamods.org/game_files/map/";
    const int MaxTileBytes = 256 * 1024;
    const long MaxCacheBytes = 512L * 1024 * 1024;
    const long MaxMemoryBytes = 48L * 1024 * 1024;
    const int MaxMissingTiles = 4096;
    static readonly Regex TilePath = new Regex(@"\Amap-tiles/(surface|sky|depths)/([0-7])/([0-9]{1,3})/([0-9]{1,3})\.webp\z", RegexOptions.CultureInvariant);
    // Browsers keep six connections per host; matching that avoids requests
    // timing out on the semaphore while downloads are still in flight.
    static readonly SemaphoreSlim Downloads = new SemaphoreSlim(6);
    static readonly object[] Stripes = new object[64];
    static readonly object Gate = new object();
    static readonly object MemoryGate = new object();
    static readonly Dictionary<string, MemoryTile> Memory = new Dictionary<string, MemoryTile>(StringComparer.Ordinal);
    static readonly LinkedList<string> MemoryOrder = new LinkedList<string>();
    static readonly Dictionary<string, long> MissingUntil = new Dictionary<string, long>(StringComparer.Ordinal);
    static long cacheBytes, memoryBytes;
    static int cacheTiles, downloading;
    static DateTime retryAfter;
    static bool unavailable, cacheFull;
    // Full-map download (offline).
    static int hdDownloadTotal, hdDownloadDone;
    static string hdDownloadCurrent = "";
    static bool hdDownloadBusy;
    static string hdDownloadError = "";

    sealed class MemoryTile {
        public byte[] Data;
        public long Length;
        public long WriteTimeUtcTicks;
        public LinkedListNode<string> Node;
    }

    static HDMapTiles() {
        for (int i = 0; i < Stripes.Length; i++) Stripes[i] = new object();
        // This upstream currently requires TLS 1.3. Retain TLS 1.2 for other
        // app endpoints and allow older Frameworks to fall back.
        try { ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12 | (SecurityProtocolType)12288; }
        catch (NotSupportedException) { ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12; }
    }

    public static void Initialize() {
        lock (MemoryGate) { Memory.Clear(); MemoryOrder.Clear(); MissingUntil.Clear(); memoryBytes = 0; }
        long bytes = 0;
        int tiles = 0;
        bool failed = false;
        try {
            if (Directory.Exists(Root)) {
                foreach (string path in Directory.EnumerateFiles(Root, "*.webp", SearchOption.AllDirectories)) {
                    tiles++; bytes += new FileInfo(path).Length;
                }
            }
        } catch (IOException) { failed = true; }
          catch (UnauthorizedAccessException) { failed = true; }
        lock (Gate) {
            cacheTiles = tiles; cacheBytes = bytes;
            cacheFull = bytes + MaxTileBytes > MaxCacheBytes;
            unavailable = failed;
        }
    }

    public static object State() {
        lock (Gate) return new { cachedTiles = cacheTiles, cachedBytes = cacheBytes, downloading, unavailable, cacheFull };
    }

    public static bool DownloadingAll { get { lock (Gate) return hdDownloadBusy; } }

    public static object DownloadState() {
        lock (Gate) return new { busy = hdDownloadBusy, total = hdDownloadTotal, done = hdDownloadDone, current = hdDownloadCurrent, error = hdDownloadError };
    }

    public static void StartDownloadAll() {
        lock (Gate) {
            if (hdDownloadBusy) return;
            hdDownloadBusy = true; hdDownloadError = ""; hdDownloadDone = 0; hdDownloadTotal = 0; hdDownloadCurrent = "";
        }
        lock (MemoryGate) MissingUntil.Clear();
        ThreadPool.QueueUserWorkItem(unused => {
            try {
                var layers = new[] { "surface", "sky", "depths" };
                var tiles = new List<string>();
                foreach (var layer in layers) {
                    for (int z = 1; z <= 7; z++) {
                        double scale = Math.Pow(2, z - 7);
                        int w = (int)Math.Ceiling(24000 * scale / 256);
                        int h = (int)Math.Ceiling(20000 * scale / 256);
                        for (int x = 0; x < w; x++)
                            for (int y = 0; y < h; y++)
                                tiles.Add("map-tiles/" + layer + "/" + z + "/" + x + "/" + y + ".webp");
                    }
                }
                lock (Gate) hdDownloadTotal = tiles.Count;
                int done = 0;
                Parallel.ForEach(tiles, new ParallelOptions { MaxDegreeOfParallelism = 6 }, path => {
                    lock (Gate) hdDownloadCurrent = path;
                    try { Read(path, true); } catch { }
                    Interlocked.Increment(ref done);
                    lock (Gate) hdDownloadDone = done;
                });
                lock (Gate) { hdDownloadBusy = false; hdDownloadCurrent = ""; }
            } catch (Exception ex) {
                lock (Gate) { hdDownloadBusy = false; hdDownloadError = ex.Message; }
            }
        });
    }

    public static void Retry() {
        lock (Gate) {
            retryAfter = DateTime.MinValue; unavailable = false;
            cacheFull = cacheBytes + MaxTileBytes > MaxCacheBytes;
        }
        lock (MemoryGate) MissingUntil.Clear();
    }

    public static bool TryTile(string path, out string relative, out string remote) {
        relative = remote = null;
        var match = TilePath.Match(path);
        if (!match.Success) return false;
        int zoom = Int32.Parse(match.Groups[2].Value), x = Int32.Parse(match.Groups[3].Value), y = Int32.Parse(match.Groups[4].Value);
        // Native zoom 7 has two pixels per world unit, over 12000 x 10000 units.
        double scale = Math.Pow(2, zoom - 7);
        if (x >= Math.Ceiling(24000 * scale / 256) || y >= Math.Ceiling(20000 * scale / 256)) return false;
        string layer = match.Groups[1].Value;
        relative = layer + "/" + zoom + "/" + x + "/" + y + ".webp";
        remote = Origin + (layer == "surface" ? "Ground" : layer == "sky" ? "Sky" : "Depths") + "/maptex/" + zoom + "/" + x + "/" + y + ".webp";
        return true;
    }

    public static bool ValidImage(byte[] data) {
        if (data == null || data.Length < 30 || data.Length > MaxTileBytes) return false;
        if (data[0] != 'R' || data[1] != 'I' || data[2] != 'F' || data[3] != 'F'
            || data[8] != 'W' || data[9] != 'E' || data[10] != 'B' || data[11] != 'P'
            || (long)BitConverter.ToUInt32(data, 4) + 8 != data.Length) return false;
        // Current upstream uses lossy VP8 tiles, each exactly 256 x 256.
        return data[12] == 'V' && data[13] == 'P' && data[14] == '8' && data[15] == ' '
            && data[23] == 0x9d && data[24] == 1 && data[25] == 0x2a
            && (BitConverter.ToUInt16(data, 26) & 0x3fff) == 256
            && (BitConverter.ToUInt16(data, 28) & 0x3fff) == 256;
    }

    public static byte[] Read(string path, bool allowDownload) {
        string relative, remote;
        if (!TryTile(path, out relative, out remote)) return null;
        string target = Path.Combine(Root, relative);
        byte[] memory;
        if (TryMemory(relative, target, out memory)) return memory;
        // Serialize identical requests without holding the app/save-reader lock.
        lock (Stripes[(relative.GetHashCode() & Int32.MaxValue) % Stripes.Length]) {
            if (TryMemory(relative, target, out memory)) return memory;
            if (File.Exists(target)) {
                try {
                    var info = new FileInfo(target);
                    long length = info.Length;
                    byte[] cached = length <= MaxTileBytes ? File.ReadAllBytes(target) : null;
                    if (ValidImage(cached)) { AddMemory(relative, target, cached); return cached; }
                    File.Delete(target);
                    RemoveMemory(relative);
                    lock (Gate) {
                        cacheBytes -= length; cacheTiles--;
                        cacheFull = cacheBytes + MaxTileBytes > MaxCacheBytes;
                    }
                } catch (IOException) { return null; }
                  catch (UnauthorizedAccessException) { return null; }
            }
            lock (Gate) {
                if (!allowDownload || DateTime.UtcNow < retryAfter) return null;
                cacheFull = cacheBytes + MaxTileBytes > MaxCacheBytes;
                if (cacheFull) return null;
            }
            if (IsMissing(relative)) return null;
            if (!Downloads.Wait(10000)) return null;
            try {
                lock (Gate) { if (DateTime.UtcNow < retryAfter) return null; downloading++; }
                try {
                    var request = (HttpWebRequest)WebRequest.Create(remote);
                    request.UserAgent = "HyruleSync/" + Updates.CurrentVersion;
                    request.ServicePoint.ConnectionLimit = 6;
                    request.AllowAutoRedirect = false;
                    request.Timeout = 8000; request.ReadWriteTimeout = 8000;
                    using (var response = (HttpWebResponse)request.GetResponse()) {
                        if (response.StatusCode != HttpStatusCode.OK || response.ContentLength > MaxTileBytes
                            || response.ContentType == null || !response.ContentType.StartsWith("image/webp", StringComparison.OrdinalIgnoreCase))
                            throw new InvalidDataException("Unexpected map tile response.");
                        using (var input = response.GetResponseStream())
                        using (var output = new MemoryStream()) {
                            byte[] buffer = new byte[8192]; int count;
                            while ((count = input.Read(buffer, 0, buffer.Length)) > 0) {
                                if (output.Length + count > MaxTileBytes) throw new InvalidDataException("Oversized map tile.");
                                output.Write(buffer, 0, count);
                            }
                            byte[] data = output.ToArray();
                            if (!ValidImage(data)) throw new InvalidDataException("Invalid map tile.");
                            Directory.CreateDirectory(Path.GetDirectoryName(target));
                            string partial = target + ".part";
                            lock (Gate) {
                                // Enforce the total across concurrent downloads as well.
                                if (cacheBytes + data.Length > MaxCacheBytes) { cacheFull = true; return null; }
                                File.WriteAllBytes(partial, data);
                                File.Move(partial, target);
                                cacheBytes += data.Length; cacheTiles++; unavailable = false;
                            }
                            AddMemory(relative, target, data);
                            return data;
                        }
                    }
                } finally { lock (Gate) downloading--; }
            } catch (WebException ex) {
                var response = ex.Response as HttpWebResponse;
                bool missing = response != null && response.StatusCode == HttpStatusCode.NotFound;
                if (response != null) response.Dispose();
                // Missing edge tiles must not disable otherwise available imagery,
                // but remember them briefly so panning does not retry them forever.
                if (missing) MarkMissing(relative);
                else BackOff();
            } catch (IOException) { BackOff(); }
              catch (UnauthorizedAccessException) { BackOff(); }
            finally { Downloads.Release(); }
            return null;
        }
    }

    static bool TryMemory(string relative, string target, out byte[] data) {
        data = null;
        lock (MemoryGate) {
            MemoryTile tile;
            if (!Memory.TryGetValue(relative, out tile)) return false;
            try {
                var info = new FileInfo(target);
                // If the cached file changed outside the app, drop the memory copy.
                if (!info.Exists || info.Length != tile.Length || info.LastWriteTimeUtc.Ticks != tile.WriteTimeUtcTicks) {
                    RemoveMemoryLocked(relative);
                    return false;
                }
            } catch (IOException) { RemoveMemoryLocked(relative); return false; }
              catch (UnauthorizedAccessException) { RemoveMemoryLocked(relative); return false; }
            data = tile.Data;
            if (tile.Node != null && tile.Node.List != null) {
                MemoryOrder.Remove(tile.Node);
                MemoryOrder.AddLast(tile.Node);
            }
            return true;
        }
    }

    static void AddMemory(string relative, string target, byte[] data) {
        long length, ticks;
        try {
            var info = new FileInfo(target);
            if (!info.Exists) return;
            length = info.Length;
            ticks = info.LastWriteTimeUtc.Ticks;
        } catch (IOException) { return; }
          catch (UnauthorizedAccessException) { return; }
        lock (MemoryGate) {
            RemoveMemoryLocked(relative);
            if (data.Length > MaxMemoryBytes) return;
            MemoryOrder.AddLast(relative);
            Memory[relative] = new MemoryTile {
                Data = data, Length = length, WriteTimeUtcTicks = ticks,
                Node = MemoryOrder.Last
            };
            memoryBytes += data.Length;
            while (memoryBytes > MaxMemoryBytes && MemoryOrder.First != null) {
                string oldest = MemoryOrder.First.Value;
                MemoryTile old;
                if (Memory.TryGetValue(oldest, out old)) {
                    Memory.Remove(oldest);
                    memoryBytes -= old.Data.Length;
                }
                MemoryOrder.RemoveFirst();
            }
        }
    }

    static void RemoveMemory(string relative) {
        lock (MemoryGate) RemoveMemoryLocked(relative);
    }

    static void RemoveMemoryLocked(string relative) {
        MemoryTile tile;
        if (!Memory.TryGetValue(relative, out tile)) return;
        Memory.Remove(relative);
        if (tile.Node != null && tile.Node.List != null) MemoryOrder.Remove(tile.Node);
        memoryBytes -= tile.Data.Length;
    }

    static bool IsMissing(string relative) {
        lock (MemoryGate) {
            long until;
            if (!MissingUntil.TryGetValue(relative, out until)) return false;
            if (DateTime.UtcNow.Ticks < until) return true;
            MissingUntil.Remove(relative);
            return false;
        }
    }

    static void MarkMissing(string relative) {
        lock (MemoryGate) {
            if (MissingUntil.Count >= MaxMissingTiles) MissingUntil.Clear();
            MissingUntil[relative] = DateTime.UtcNow.AddMinutes(10).Ticks;
        }
    }

    static void BackOff() { lock (Gate) { unavailable = true; retryAfter = DateTime.UtcNow.AddSeconds(30); } }
}
