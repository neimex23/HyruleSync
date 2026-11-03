using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;

// Read-only save inspection, Autosync cache and the browser's progress state.
public static partial class Program {
    static Catalog catalog;
    static byte[] catalogBytes;
    static readonly Dictionary<string, Cached> cache = new Dictionary<string, Cached>();
    static string warning = "";
    static bool force = true;
    static Snapshot imported;
    static Snapshot lastValid;
    static string sourceNotice = "";
    static string checkedAt = "", changedAt = "", lastRevision = "";
    static int updateCount;
    const bool picking = false;

    static void LoadCatalog() {
        lock (Gate) {
            catalog = Catalog.Load(File.ReadAllText(Path.Combine(MapResources.Root, "map_data.json"), Encoding.UTF8),
                Encoding.UTF8.GetString(MapResources.Embedded("towers.json")),
                Encoding.UTF8.GetString(MapResources.Embedded("shrines.json")));
            catalogBytes = Encoding.UTF8.GetBytes(Serialize(catalog));
        }
    }

    static byte[] ReadOnly(string file) {
        using (var stream = new FileStream(file, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete)) {
            if (stream.Length > 4 * 1024 * 1024)
                throw new InvalidDataException(Locale.T("El archivo supera el tamaño de un guardado de TOTK.", "The file exceeds the size of a TOTK save."));

            byte[] bytes = new byte[(int)stream.Length];
            int read = 0, count;
            while (read < bytes.Length && (count = stream.Read(bytes, read, bytes.Length - read)) > 0) read += count;
            if (read != bytes.Length)
                throw new IOException(Locale.T("El juego está escribiendo el guardado. Se reintentará.", "The game is writing the save. HyruleSync will retry."));
            return bytes;
        }
    }

    static Snapshot Parse(byte[] data, string path) {
        var reader = new SaveReader(data);
        int[] states = new int[catalog.points.Count];
        int[] visited = new int[states.Length];
        var shrineChests = new ChestProgress[states.Length];
        string[] values = new string[states.Length];
        for (int i = 0; i < states.Length; i++) {
            states[i] = reader.State(catalog.points[i], out values[i]);
            visited[i] = reader.BooleanState(catalog.points[i].visitHash);
            shrineChests[i] = reader.ReadChests(catalog.points[i]);
        }

        var position = reader.PlayerPosition();
        return new Snapshot {
            compendium = WorldReader.Read(reader),
            characterProfiles = WorldReader.ReadCharacters(reader),
            quests = QuestReader.Read(reader),
            inventory = InventoryReader.Read(reader),
            collections = CollectionReader.Read(reader),
            revision = Sha(data),
            file = path,
            savedAt = (File.Exists(path) ? File.GetLastWriteTimeUtc(path) : DateTime.UtcNow).ToString("o"),
            format = reader.format,
            playtime = reader.playtime,
            states = states,
            visited = visited,
            shrineChests = shrineChests,
            values = values,
            tableEnd = reader.tableEnd,
            guidStart = reader.guidStart,
            playerPosition = position,
            playerContext = SaveReader.ResolveContext(reader.CurrentMap(), position, catalog.points)
        };
    }

    static Snapshot InspectFile(string path) {
        path = Path.GetFullPath(path);
        var before = new FileInfo(path);
        long ticks = before.LastWriteTimeUtc.Ticks, size = before.Length;
        var data = ReadOnly(path);
        var result = Parse(data, path);
        var after = new FileInfo(path);
        if (after.LastWriteTimeUtc.Ticks != ticks || after.Length != size)
            throw new IOException(Locale.T("El juego está escribiendo el guardado. Se reintentará.", "The game is writing the save. HyruleSync will retry."));

        result.savedAt = new DateTime(ticks, DateTimeKind.Utc).ToString("o");
        return result;
    }

    static void InspectToFile(string source, string destination) {
        if (!MapResources.Ready)
            throw new InvalidDataException(Locale.T("Faltan los recursos del mapa.", "Map resources are missing."));

        Snapshot snapshot = Parse(ReadOnly(source), Path.GetFullPath(source));
        File.WriteAllText(destination, Serialize(new {
            snapshot = snapshot,
            counts = catalog.CountProgress(snapshot.states)
        }), Encoding.UTF8);
    }

    static SnapshotSummary SaveSummary(Snapshot snapshot) {
        return new SnapshotSummary {
            file = snapshot.file,
            savedAt = snapshot.savedAt,
            playtime = snapshot.playtime,
            format = snapshot.format,
            playerContext = snapshot.playerContext,
            counts = catalog.CountProgress(snapshot.states)
        };
    }

    static object SaveSlots() {
        lock (Gate) return new {
            slots = cache
                .OrderByDescending(item => item.Value.snapshot == null ? "" : item.Value.snapshot.savedAt, StringComparer.Ordinal)
                .ThenByDescending(item => item.Value.snapshot == null ? 0 : item.Value.snapshot.playtime)
                .ThenBy(item => item.Key, StringComparer.OrdinalIgnoreCase)
                .Select(item => new {
                    file = item.Key,
                    status = item.Value.error != "" ? "error" : item.Value.observed != DateTime.MaxValue ? "reading" : "ok",
                    error = item.Value.error,
                    summary = item.Value.snapshot == null ? null : SaveSummary(item.Value.snapshot)
                }).ToArray()
        };
    }

    static void LocalizeSnapshot(Snapshot snapshot) {
        if (snapshot == null) return;
        string[,] labels = {
            { "GUID presente", "GUID present" },
            { "GUID ausente", "GUID absent" },
            { "Hash ausente del guardado", "Hash missing from the save" }
        };
        for (int i = 0; i < snapshot.values.Length; i++) {
            for (int j = 0; j < labels.GetLength(0); j++) {
                if (snapshot.values[i] == labels[j, 0] || snapshot.values[i] == labels[j, 1]) {
                    snapshot.values[i] = Locale.T(labels[j, 0], labels[j, 1]);
                    break;
                }
            }
        }
        if (snapshot.playerContext != null)
            snapshot.playerContext = SaveReader.ResolveContext(snapshot.playerContext.mapId, snapshot.playerPosition, catalog.points);
    }

    static void SetSource(string source, string mode) {
        lock (Gate) {
            settings.source = source;
            settings.mode = mode;
            if (mode == "folder") settings.auto = true;
            force = true;
            cache.Clear();
            imported = null;
            lastValid = null;
            sourceNotice = "";
            warning = "";
            SaveSettings();
        }
    }

    static void Scan(object unused) {
        if (!Monitor.TryEnter(Gate)) return;
        try {
            if (!MapResources.Ready || String.IsNullOrEmpty(settings.source) || (!settings.auto && !force)) return;
            checkedAt = DateTime.UtcNow.ToString("o");
            string[] paths = FindSavePaths();
            if (paths.Length == 0) {
                warning = Locale.T("No se encuentra ningún progress.sav en la selección.", "No progress.sav file was found in the selected location.");
                return;
            }

            foreach (string dead in cache.Keys.Except(paths).ToArray()) cache.Remove(dead);
            bool pending = false;
            warning = "";
            foreach (string path in paths) {
                if (ScanSave(path)) pending = true;
            }
            if (!pending) force = false;
        } catch (Exception ex) {
            warning = ex.Message;
        } finally {
            Monitor.Exit(Gate);
        }
    }

    static string[] FindSavePaths() {
        sourceNotice = "";
        if (settings.mode != "folder")
            return File.Exists(settings.source) ? new[] { settings.source } : new string[0];

        string folder = ResolveSaveFolder(settings.source);
        if (!String.Equals(folder, settings.source, StringComparison.OrdinalIgnoreCase))
            sourceNotice = Locale.T(
                "Siguiendo el último guardado terminado en el buffer. Se volverá a la carpeta habitual automáticamente cuando el juego pueda actualizarla.",
                "Following the latest completed save in the buffer. Tracking will return to the usual folder automatically when the game can update it.");
        if (!Directory.Exists(folder))
            throw new IOException(Locale.T("La carpeta seleccionada ya no existe.", "The selected folder no longer exists."));
        return Directory.EnumerateFiles(folder, "progress.sav", SearchOption.AllDirectories).ToArray();
    }

    // Called under Gate. A pending save is retried once its metadata has settled.
    static bool ScanSave(string path) {
        var file = new FileInfo(path);
        Cached item;
        if (!cache.TryGetValue(path, out item)) {
            item = new Cached();
            cache[path] = item;
        }
        if (item.ticks != file.LastWriteTimeUtc.Ticks || item.size != file.Length) {
            item.ticks = file.LastWriteTimeUtc.Ticks;
            item.size = file.Length;
            item.observed = DateTime.UtcNow;
            item.error = "";
            return true;
        }
        if (item.observed == DateTime.MaxValue) return false;
        if ((DateTime.UtcNow - item.observed).TotalMilliseconds < 800) return true;

        try {
            byte[] data = ReadOnly(path);
            var after = new FileInfo(path);
            if (after.LastWriteTimeUtc.Ticks != item.ticks || after.Length != item.size) return true;
            item.snapshot = Parse(data, path);
            item.snapshot.savedAt = new DateTime(item.ticks, DateTimeKind.Utc).ToString("o");
            item.observed = DateTime.MaxValue;
            item.error = "";
            return false;
        } catch (Exception ex) {
            item.error = ex.Message;
            return true;
        }
    }

    static object State() {
        lock (Gate) {
            // UTC round-trip timestamps sort chronologically without reparsing every poll.
            var candidates = cache.Values.Where(item => item.snapshot != null)
                .OrderByDescending(item => item.snapshot.savedAt, StringComparer.Ordinal)
                .ThenByDescending(item => item.snapshot.playtime)
                .ThenBy(item => item.snapshot.file, StringComparer.OrdinalIgnoreCase)
                .ToArray();
            Snapshot selected = imported ?? (candidates.Length == 0 ? lastValid : candidates[0].snapshot);
            if (imported == null && selected != null) lastValid = selected;
            if (selected != null && selected.revision != lastRevision) {
                lastRevision = selected.revision;
                changedAt = DateTime.UtcNow.ToString("o");
                updateCount++;
            }

            var error = cache.FirstOrDefault(item => item.Value.error != "");
            string message = warning;
            if (error.Value != null)
                message = Locale.T("No se pudo leer ", "Could not read ")
                    + Path.GetFileName(Path.GetDirectoryName(error.Key)) + ": " + error.Value.error
                    + Locale.T(" Se conserva el último estado válido.", " The last valid state is preserved.");

            return new {
                language = Locale.Language,
                checkedAt = checkedAt,
                changedAt = changedAt,
                updateCount = updateCount,
                picking = picking,
                status = message != "" ? "error" : selected == null ? "empty" : force ? "reading" : "ok",
                message = message,
                sourceNotice = sourceNotice,
                source = settings.source,
                mode = settings.mode,
                auto = settings.auto,
                followLink = settings.followLink,
                showLink = settings.showLink,
                linkOrder = settings.linkOrder,
                linkOpacity = settings.linkOpacity,
                runInBackground = settings.runInBackground,
                snapshot = selected,
                mapQuality = settings.mapQuality,
                hdMap = HDMapTiles.State(),
                hdMapDownload = HDMapTiles.DownloadState(),
                slots = candidates.Select(item => new {
                    file = item.snapshot.file,
                    playtime = item.snapshot.playtime,
                    savedAt = item.snapshot.savedAt
                }).ToArray()
            };
        }
    }
}
