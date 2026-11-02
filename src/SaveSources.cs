using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

// Directory browsing and discovery of local save folders.
public static partial class Program {
    static object BrowseDirectories(string query) {
        string path = query.StartsWith("?path=") ? Uri.UnescapeDataString(query.Substring(6)) : "";
        if (String.IsNullOrWhiteSpace(path)) return new {
            path = "",
            parent = "",
            folders = DriveInfo.GetDrives().Where(drive => drive.IsReady)
                .Select(drive => new { name = drive.Name, path = drive.RootDirectory.FullName }).ToArray()
        };

        path = Path.GetFullPath(path);
        if (!Directory.Exists(path))
            throw new DirectoryNotFoundException(Locale.T("La carpeta no existe.", "The folder does not exist."));

        var folder = new DirectoryInfo(path);
        return new {
            path = folder.FullName,
            parent = folder.Parent == null ? "" : folder.Parent.FullName,
            folders = folder.GetDirectories()
                .Where(dir => (dir.Attributes & (FileAttributes.Hidden | FileAttributes.System | FileAttributes.ReparsePoint)) == 0)
                .OrderBy(dir => dir.Name)
                .Take(200)
                .Select(dir => new { name = dir.Name, path = dir.FullName }).ToArray()
        };
    }

    static object SourceOptions() {
        var choices = new List<object>();
        var saves = new List<object>();
        string known = @"C:\Games\Zelda TOTK\profile\save";
        var roots = new[] {
            known,
            Path.Combine(Home, "profile", "save"),
            settings.mode == "folder" ? settings.source : ""
        }.Where(Directory.Exists).Distinct().ToArray();

        var accounts = new HashSet<string>();
        foreach (string root in roots) {
            if (Directory.EnumerateDirectories(root, "slot_*").Any()) accounts.Add(root);
            foreach (string dir in Directory.EnumerateDirectories(root)) {
                if (Directory.EnumerateDirectories(dir, "slot_*").Any()) accounts.Add(dir);
            }
        }
        foreach (string dir in accounts) {
            if (!Directory.EnumerateDirectories(dir, "slot_*").Any()) continue;
            choices.Add(new { name = "Recomp · " + Path.GetFileName(dir), path = dir });
            foreach (string save in Directory.EnumerateFiles(dir, "progress.sav", SearchOption.AllDirectories)) {
                saves.Add(new {
                    name = Path.GetFileName(dir) + " / " + Path.GetFileName(Path.GetDirectoryName(save)),
                    path = save
                });
            }
        }
        return new { choices = choices, saves = saves, defaultPath = Directory.Exists(known) ? known : "" };
    }
}
