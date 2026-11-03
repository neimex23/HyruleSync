using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

// Explicit API routes and their application handlers.
public static partial class Program {
    sealed class PostRoute {
        public readonly Func<byte[], object> Handle;
        public readonly bool RequiresMap;

        public PostRoute(Func<byte[], object> handle, bool requiresMap = false) {
            Handle = handle;
            RequiresMap = requiresMap;
        }
    }

    static PostRoute Command(Action<byte[]> action, bool requiresMap = false) {
        return new PostRoute(body => { action(body); return null; }, requiresMap);
    }

    static readonly Dictionary<string, Func<HttpRequest, HttpResponse>> GetRoutes =
        new Dictionary<string, Func<HttpRequest, HttpResponse>> {
            { "api/config", request => GetConfig() },
            { "api/credits", request => new HttpResponse(MapResources.Embedded("credits.json"), "application/json; charset=utf-8") },
            { "api/updates", request => GetUpdates() },
            { "api/setup", request => JsonResponse(MapResources.State()) },
            { "api/folders", GetFolders },
            { "api/state", request => JsonResponse(State()) },
            { "api/saves", request => JsonResponse(SaveSlots()) },
            { "catalog.json", request => GetCatalog() },
            { "api/source-options", request => JsonResponse(SourceOptions()) }
        };

    static readonly Dictionary<string, PostRoute> PostRoutes = new Dictionary<string, PostRoute> {
        { "api/prepare-map", Command(body => MapResources.StartDownload()) },
        { "api/map-quality", Command(SetMapQuality, requiresMap: true) },
        { "api/download-hd-map", Command(body => HDMapTiles.StartDownloadAll()) },
        { "api/language", Command(body => SetLanguage(BodyText(body))) },
        { "api/armor-plan", Command(SetArmorPlan) },
        { "api/check-updates", Command(body => Updates.Check(true)) },
        { "api/follow-on", Command(body => UpdateSettings(s => s.followLink = true)) },
        { "api/follow-off", Command(body => UpdateSettings(s => s.followLink = false)) },
        { "api/show-link", Command(body => UpdateSettings(s => s.showLink = true)) },
        { "api/hide-link", Command(body => UpdateSettings(s => s.showLink = false)) },
        { "api/link-above", Command(body => UpdateSettings(s => s.linkOrder = "above")) },
        { "api/link-below", Command(body => UpdateSettings(s => s.linkOrder = "below")) },
        { "api/background-on", Command(body => UpdateSettings(s => s.runInBackground = true)) },
        { "api/background-off", Command(body => UpdateSettings(s => s.runInBackground = false)) },
        { "api/page-close", Command(ClosePage) },
        { "api/link-opacity", Command(SetLinkOpacity) },
        { "api/inspect-file", new PostRoute(body => InspectionResult(InspectFile(BodyText(body))), requiresMap: true) },
        { "api/inspect-upload", new PostRoute(body => InspectionResult(Parse(body, "progress.sav")), requiresMap: true) },
        { "api/upload", Command(UploadSave, requiresMap: true) },
        { "api/set-file", Command(SelectFile, requiresMap: true) },
        { "api/set-folder", Command(SelectFolder, requiresMap: true) },
        { "api/refresh", Command(body => RefreshSaves(), requiresMap: true) },
        { "api/auto-on", Command(body => SetAuto(true), requiresMap: true) },
        { "api/auto-off", Command(body => SetAuto(false), requiresMap: true) }
    };

    static HttpResponse DispatchAction(HttpRequest request) {
        PostRoute route;
        bool found = PostRoutes.TryGetValue(request.Path, out route);
        try {
            // Unknown actions also require setup before returning 404.
            if ((!found || route.RequiresMap) && !MapResources.Ready)
                throw new InvalidDataException(Locale.T("Primero prepara los recursos del mapa.", "Prepare the map resources first."));
            if (!found) return JsonResponse(new { ok = false, error = (string)null }, 404);

            return JsonResponse(route.Handle(request.Body) ?? new { ok = true, error = (string)null });
        } catch (Exception ex) {
            return JsonResponse(new { ok = false, error = ex.Message }, 400);
        }
    }

    static string BodyText(byte[] body) {
        return Encoding.UTF8.GetString(body).Trim();
    }

    static HttpResponse GetConfig() {
        lock (Gate) return JsonResponse(new {
            language = Locale.Language,
            languagePreference = settings.language,
            windowsCulture = Locale.WindowsCulture,
            runInBackground = settings.runInBackground,
            armorPlan = NormalizeArmorPlan(settings.armorPlan)
        });
    }

    static HttpResponse GetUpdates() {
        Updates.Check(false);
        return JsonResponse(Updates.State());
    }

    static HttpResponse GetFolders(HttpRequest request) {
        try {
            return JsonResponse(BrowseDirectories(request.Uri.Query));
        } catch (Exception ex) {
            return JsonResponse(new { error = ex.Message }, 400);
        }
    }

    static HttpResponse GetCatalog() {
        lock (Gate) return new HttpResponse(catalogBytes ?? Encoding.UTF8.GetBytes("{}"), "application/json; charset=utf-8");
    }

    static void UpdateSettings(Action<Settings> update) {
        lock (Gate) {
            update(settings);
            SaveSettings();
        }
    }

    static void ClosePage(byte[] body) {
        string pageId = Encoding.UTF8.GetString(body);
        if (!ValidPageId(pageId)) throw new InvalidDataException("Invalid page session.");
        pages.Close(pageId, null, DateTime.UtcNow);
    }

    static void SetLinkOpacity(byte[] body) {
        int opacity;
        if (!Int32.TryParse(BodyText(body), out opacity) || opacity < 0 || opacity > 100)
            throw new InvalidDataException(Locale.T("La opacidad debe estar entre 0 y 100.", "Opacity must be between 0 and 100."));
        UpdateSettings(s => s.linkOpacity = opacity);
    }

    static void SetMapQuality(byte[] body) {
        string quality = BodyText(body);
        if (quality != "standard" && quality != "high")
            throw new InvalidDataException(Locale.T("Calidad del mapa inválida.", "Invalid map quality."));
        UpdateSettings(s => s.mapQuality = quality);
    }

    static ArmorPlan NormalizeArmorPlan(ArmorPlan plan) {
        var valid = new HashSet<string>(CollectionReader.ArmorIds());
        return new ArmorPlan {
            target = plan != null && plan.target >= 1 && plan.target <= 4 ? plan.target : 4,
            selected = plan == null || plan.selected == null ? new string[0] : plan.selected.Where(id => id != null && valid.Contains(id)).Distinct().ToArray()
        };
    }

    static void SetArmorPlan(byte[] body) {
        ArmorPlan plan;
        lock (JsonGate) plan = Json.Deserialize<ArmorPlan>(BodyText(body));
        if (plan == null || plan.target < 1 || plan.target > 4 || plan.selected == null || plan.selected.Length > 135)
            throw new InvalidDataException(Locale.T("Plan de armaduras inválido.", "Invalid armor plan."));
        var normalized = NormalizeArmorPlan(plan);
        if (normalized.selected.Length != plan.selected.Length)
            throw new InvalidDataException(Locale.T("El plan contiene piezas inválidas o repetidas.", "The plan contains invalid or duplicate pieces."));
        lock (Gate) {
            var previous = settings.armorPlan;
            settings.armorPlan = normalized;
            if (!SaveSettings()) {
                settings.armorPlan = previous;
                throw new IOException(Locale.T("No se pudo guardar el plan de armaduras.", "The armor plan could not be saved."));
            }
        }
    }

    static object InspectionResult(Snapshot snapshot) {
        return new { ok = true, snapshot, summary = SaveSummary(snapshot) };
    }

    static void UploadSave(byte[] body) {
        var next = Parse(body, "progress.sav");
        lock (Gate) {
            imported = next;
            cache.Clear();
            lastValid = null;
            sourceNotice = "";
            settings.source = "";
            settings.mode = "memory";
            settings.auto = false;
            warning = "";
            force = false;
            SaveSettings();
        }
    }

    static void SelectFile(byte[] body) {
        string file = Path.GetFullPath(BodyText(body));
        Parse(ReadOnly(file), file);
        SetSource(file, "file");
        UpdateSettings(s => s.auto = false);
    }

    static void SelectFolder(byte[] body) {
        string dir = Path.GetFullPath(BodyText(body));
        if (Directory.GetParent(dir) == null)
            throw new InvalidDataException(Locale.T("Elige una carpeta de guardados, no una unidad completa.", "Select a save folder, not an entire drive."));
        if (!Directory.Exists(dir) || !Directory.EnumerateFiles(dir, "progress.sav", SearchOption.AllDirectories).Any())
            throw new InvalidDataException(Locale.T("La carpeta no contiene ningún progress.sav.", "The folder does not contain any progress.sav files."));
        SetSource(dir, "folder");
    }

    static void RefreshSaves() {
        lock (Gate) {
            force = true;
            foreach (var item in cache.Values) item.observed = DateTime.UtcNow;
        }
    }

    static void SetAuto(bool enabled) {
        UpdateSettings(s => {
            s.auto = enabled;
            if (enabled) force = true;
        });
    }
}
