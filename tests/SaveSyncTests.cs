using System;
using System.IO;
using System.Linq;
using System.Reflection;

// Compile only into ReaderTests.exe. All writes stay in a generated fixture folder.
public static partial class Program {
    static string SyncTestPath(string parent, string relative) {
        return Path.GetFullPath(Path.Combine(parent, relative));
    }

    static T SyncTestProperty<T>(object value, string name) {
        return (T)value.GetType().GetProperty(name).GetValue(value, null);
    }

    public static void CheckSaveSync(Action<bool, string> check, Func<byte[]> fixture) {
        string root = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "autosync-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        var readyField = typeof(MapResources).GetField("ready", BindingFlags.NonPublic | BindingFlags.Static);
        bool previousReady = MapResources.Ready;
        var previousSettings = settings;
        var previousCatalog = catalog;
        readyField.SetValue(null, true);
        settings = new Settings { source = root, mode = "folder", auto = true };
        catalog = new Catalog();
        cache.Clear(); imported = null; lastValid = null;
        DateTime start = new DateTime(2026, 11, 1, 12, 0, 0, DateTimeKind.Utc);
        Action<string, uint, DateTime, float> write = (path, playtime, when, x) => {
            Directory.CreateDirectory(Path.GetDirectoryName(path));
            byte[] bytes = fixture();
            Action<int, uint> put = (at, value) => Array.Copy(BitConverter.GetBytes(value), 0, bytes, at, 4);
            put(52, playtime);
            put(56, 0xc884818d); put(60, 128);
            put(64, 0xa3db7114); put(68, 80); put(80, 0); put(84, 0);
            Array.Copy(BitConverter.GetBytes(x), 0, bytes, 128, 4);
            File.WriteAllBytes(path, bytes);
            File.SetLastWriteTimeUtc(path, when);
        };
        Action settle = () => {
            Scan(null);
            foreach (var item in cache.Values.Where(item => item.observed != DateTime.MaxValue))
                item.observed = DateTime.UtcNow.AddSeconds(-2);
            Scan(null);
        };
        Func<Snapshot> selected = () => SyncTestProperty<Snapshot>(State(), "snapshot");
        try {
            string manual = SyncTestPath(root, "slot_00/progress.sav");
            string oldAuto = SyncTestPath(root, "slot_03/progress.sav");
            string newAuto = SyncTestPath(root, "slot_05/progress.sav");
            write(manual, 10000, start, 1);
            write(oldAuto, 20000, start.AddMinutes(1), 3);
            write(newAuto, 1000, start.AddMinutes(2), 5);
            settle();
            check(selected() != null, "Folder snapshots parse successfully: " + String.Join("; ", cache.Values.Select(item => item.error)));
            check(selected().file == newAuto && selected().playerPosition.x == 5,
                "Folder tracking follows the newest autosave even with lower playtime");
            var slots = (Array)SaveSlots().GetType().GetProperty("slots").GetValue(SaveSlots(), null);
            check(SyncTestProperty<string>(slots.GetValue(0), "file") == newAuto,
                "Save inspection lists the newest slot first");

            write(manual, 500, start.AddMinutes(3), 7); settle();
            check(selected().file == manual && selected().playerPosition.x == 7,
                "A newer manual save replaces the autosave after loading an older game");
            write(newAuto, 600, start.AddMinutes(3), 8); settle();
            check(selected().file == newAuto, "Equal file timestamps use playtime as a tie breaker");
            File.WriteAllText(newAuto, "partial"); File.SetLastWriteTimeUtc(newAuto, start.AddMinutes(4)); settle();
            check(selected().file == newAuto && selected().playerPosition.x == 8 && cache[newAuto].error != "",
                "An incomplete newest slot keeps its previous valid snapshot");
            write(newAuto, 400, start.AddMinutes(5), 9); settle();
            check(selected().playtime == 400 && selected().playerPosition.x == 9,
                "The newest slot recovers after an incomplete write");

            for (int i = 0; i < 50; i++) {
                string extra = Path.Combine(root, "extra_" + i + "/progress.sav");
                Directory.CreateDirectory(Path.GetDirectoryName(extra)); File.WriteAllText(extra, "fixture");
            }
            check(FindSavePaths().Length == 53, "Folder discovery does not silently truncate after 48 saves");

            string profile = Path.Combine(root, "profile");
            string account = SyncTestPath(profile, "save/00000000000000020000000000000001");
            string committed = SyncTestPath(account, "slot_03/progress.sav");
            write(committed, 30000, start, 3);
            File.WriteAllBytes(Path.Combine(profile, "account.uid"),
                BitConverter.GetBytes(1UL).Concat(BitConverter.GetBytes(2UL)).ToArray());
            string transactions = Path.Combine(profile, "save-tx");
            string ready9 = Path.Combine(transactions, "ready-0000000009");
            string ready10 = Path.Combine(transactions, "ready-0000000010");
            string pending = SyncTestPath(ready10, "slot_05/progress.sav");
            write(Path.Combine(ready9, "slot_03/progress.sav"), 40000, start.AddHours(1), 4);
            write(pending, 700, start.AddHours(2), 10);
            write(Path.Combine(transactions, "work/slot_00/progress.sav"), 90000, start.AddDays(1), 99);
            write(Path.Combine(transactions, "ready-invalid/slot_00/progress.sav"), 90000, start.AddDays(1), 99);
            SetSource(account, "folder");
            check(selected() == null, "Choosing another source clears the previous live snapshot");
            settle();
            check(selected().file == pending && selected().playerPosition.x == 10,
                "Recomp follows the newest completed pending transaction, ignoring work and older transactions");
            check(sourceNotice != "" && settings.source == account && settings.auto,
                "Pending transactions explain the stale folder without replacing the watched account");

            string ready11 = Path.Combine(transactions, "ready-0000000011");
            string next = SyncTestPath(ready11, "slot_00/progress.sav");
            Directory.CreateDirectory(Path.GetDirectoryName(next)); File.WriteAllText(next, "partial");
            Scan(null);
            check(selected().file == pending, "Transaction rotation preserves the last valid map while the next save settles");
            settle();
            check(selected().file == pending, "An unreadable pending transaction does not blank the map");
            write(next, 500, start.AddHours(3), 11); settle();
            check(selected().file == next && selected().playerPosition.x == 11,
                "A later pending manual save updates Link even with lower playtime");

            Directory.Move(ready9, Path.Combine(root, "previous9"));
            Directory.Move(ready10, Path.Combine(root, "previous10"));
            Directory.Move(account, Path.Combine(root, "previous-account"));
            check(FindSavePaths().Single() == next, "A pending transaction remains readable while the usual account folder is replaced");
            Directory.Move(ready11, account);
            Scan(null);
            check(selected().playerPosition.x == 11, "Publishing a transaction preserves the map during the path change");
            settle();
            check(selected().file == SyncTestPath(account, "slot_00/progress.sav") && sourceNotice == "",
                "Tracking returns to the usual account after the game publishes its save");

            write(pending, 100000, start.AddDays(2), 100);
            string other = SyncTestPath(profile, "save/00000000000000030000000000000001");
            write(Path.Combine(other, "slot_00/progress.sav"), 200, start, 2);
            SetSource(other, "folder"); settle();
            check(selected().file.StartsWith(other) && sourceNotice == "",
                "Pending transactions from the active account cannot replace a different watched account");
            File.WriteAllBytes(Path.Combine(profile, "account.uid"), new byte[15]);
            check(ResolveSaveFolder(account) == account, "Malformed account IDs never enable pending transaction discovery");
        } finally {
            readyField.SetValue(null, previousReady);
            settings = previousSettings; catalog = previousCatalog;
            cache.Clear(); imported = null; lastValid = null; sourceNotice = "";
            warning = ""; force = true; lastRevision = ""; checkedAt = ""; changedAt = ""; updateCount = 0;
        }
    }
}
