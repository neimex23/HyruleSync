// HyruleSync: independent Windows save reader and local map application.
// Format/data provenance: docs/save-format.md and THIRD_PARTY.md. Saves are read-only.
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

public static partial class Program {
    static readonly string Home = AppDomain.CurrentDomain.BaseDirectory;
    static readonly object Gate = new object();
    static readonly object JsonGate = new object();
    static readonly JavaScriptSerializer Json = new JavaScriptSerializer { MaxJsonLength = 12 * 1024 * 1024 };
    static readonly PageLifetime pages = new PageLifetime();

    static Settings settings = new Settings();
    static string token, url;
    static volatile bool running = true;
    static Mutex instance;
    static TcpListener listener;
    static System.Threading.Timer timer;
    static System.Windows.Forms.Timer pageTimer;
    static NotifyIcon tray;
    static ApplicationContext context;
    static EventWaitHandle stopSignal;
    static RegisteredWaitHandle stopWait;

    [STAThread]
    public static void Main(string[] args) {
        bool inspect = args.Length >= 3 && args[0] == "--inspect";
        try {
            InitializeApplication(args);
            if (inspect) {
                InspectToFile(args[1], args[2]);
                return;
            }

            Directory.CreateDirectory(Path.Combine(Home, ".state"));
            settings.linkOpacity = Math.Max(0, Math.Min(100, settings.linkOpacity));
            string urlFile = ApplyArguments(args);
            if (!AcquireInstance(args)) return;

            // Settings v2: HD is now the default quality; migrate older configs once.
            if (settings.Upgrade()) SaveSettings();
            StartServer(urlFile);
            StartDesktop();
            timer = new System.Threading.Timer(Scan, null, 0, 500);
            new Thread(Loop) { IsBackground = true }.Start();

            if (!args.Contains("--no-browser")) OpenMap();
            Application.Run(context);
        } catch (Exception ex) {
            if (inspect) {
                File.WriteAllText(args[2], "ERROR: " + ex.Message);
                Environment.ExitCode = 1;
            } else {
                MessageBox.Show(ex.Message, "HyruleSync", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        } finally {
            StopApplication();
        }
    }

    static string Serialize(object value) {
        lock (JsonGate) return Json.Serialize(value);
    }

    static string Sha(byte[] data) {
        using (var hash = SHA256.Create())
            return BitConverter.ToString(hash.ComputeHash(data)).Replace("-", "").ToLowerInvariant();
    }

    static void InitializeApplication(string[] args) {
        LoadSettings();
        Locale.Configure(args, settings.language);
        MapResources.Initialize();
        HDMapTiles.Initialize();
        if (MapResources.Ready) LoadCatalog();
        MapResources.OnReady = LoadCatalog;
        settings.mapQuality = settings.mapQuality == "high" ? "high" : "standard";
    }

    static void LoadSettings() {
        string config = Path.Combine(Home, ".state", "settings.json");
        if (File.Exists(config)) {
            try {
                settings = Json.Deserialize<Settings>(File.ReadAllText(config)) ?? new Settings();
            } catch {
                // Unreadable preferences leave the defaults in place.
            }
        }
        settings.language = Locale.Preference(settings.language);
    }

    static bool SaveSettings() {
        try {
            string stateDir = Path.Combine(Home, ".state");
            Directory.CreateDirectory(stateDir);
            File.WriteAllText(Path.Combine(stateDir, "settings.json"), Serialize(settings), Encoding.UTF8);
            return true;
        } catch {
            // Keep running with the in-memory preferences if they cannot be saved.
            return false;
        }
    }

    static void SetLanguage(string preference) {
        if (preference != "en" && preference != "es" && preference != "auto")
            throw new ArgumentException(Locale.T("Elige español, inglés o automático.", "Choose Spanish, English or automatic."));

        lock (Gate) {
            Locale.Configure(new string[0], preference);
            settings.language = preference;
            if (catalog != null) {
                LoadCatalog();
                foreach (var item in cache.Values) LocalizeSnapshot(item.snapshot);
                LocalizeSnapshot(imported);
            }
            SaveSettings();
        }
    }

    static string ApplyArguments(string[] args) {
        string urlFile = null;
        for (int i = 0; i < args.Length; i++) {
            if (args[i] == "--auto") settings.auto = true;
            if (i >= args.Length - 1) continue;

            switch (args[i]) {
                case "--source":
                    settings.source = Path.GetFullPath(args[++i]);
                    settings.mode = "file";
                    break;
                case "--folder":
                    settings.source = Path.GetFullPath(args[++i]);
                    settings.mode = "folder";
                    break;
                case "--url-file":
                    urlFile = Path.GetFullPath(args[++i]);
                    break;
            }
        }
        return urlFile;
    }

    static bool AcquireInstance(string[] args) {
        bool created;
        string name = "Local\\HyruleSync-" + Sha(Encoding.UTF8.GetBytes(Home)).Substring(0, 20);
        instance = new Mutex(true, name, out created);
        if (created) return true;

        string prior = Path.Combine(Home, ".state", "url.txt");
        if (File.Exists(prior) && !args.Contains("--no-browser"))
            Process.Start(new ProcessStartInfo(File.ReadAllText(prior)) { UseShellExecute = true });
        return false;
    }

    static void StartServer(string urlFile) {
        token = Guid.NewGuid().ToString("N");
        listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        url = "http://hyrulesync.localhost:" + ((IPEndPoint)listener.LocalEndpoint).Port + "/" + token + "/";
        File.WriteAllText(Path.Combine(Home, ".state", "url.txt"), url);
        if (urlFile != null) File.WriteAllText(urlFile, url);
    }

    static void StartDesktop() {
        Application.EnableVisualStyles();
        context = new ApplicationContext();
        pageTimer = new System.Windows.Forms.Timer { Interval = 500 };
        pageTimer.Tick += CheckPageLifetime;
        pageTimer.Start();

        stopSignal = new EventWaitHandle(false, EventResetMode.ManualReset,
            "Local\\HyruleSync.Stop." + Process.GetCurrentProcess().Id);
        stopWait = ThreadPool.RegisterWaitForSingleObject(stopSignal,
            (state, timedOut) => Application.Exit(), null, Timeout.Infinite, true);

        var menu = CreateTrayMenu();
        tray = new NotifyIcon {
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath),
            Text = "HyruleSync",
            ContextMenuStrip = menu,
            Visible = true
        };
        tray.DoubleClick += (sender, e) => OpenMap();
    }

    static void CheckPageLifetime(object sender, EventArgs e) {
        bool background;
        lock (Gate) background = settings.runInBackground;
        if (pages.ShouldExit(DateTime.UtcNow, background)) context.ExitThread();
    }

    static ContextMenuStrip CreateTrayMenu() {
        var menu = new ContextMenuStrip();
        menu.Items.Add(Locale.T("Abrir HyruleSync", "Open HyruleSync"), null, (sender, e) => OpenMap());
        menu.Items.Add(Locale.T("Elegir carpeta de guardados…", "Choose save folder…"), null,
            (sender, e) => OpenMap("#folder"));
        menu.Items.Add(Locale.T("Pausar / reanudar Autosync", "Pause / resume Autosync"), null,
            (sender, e) => ToggleAutosync());
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add(Locale.T("Salir", "Exit"), null, (sender, e) => context.ExitThread());
        menu.Opening += (sender, e) => {
            menu.Items[0].Text = Locale.T("Abrir HyruleSync", "Open HyruleSync");
            menu.Items[1].Text = Locale.T("Elegir carpeta de guardados…", "Choose save folder…");
            menu.Items[2].Text = Locale.T("Pausar / reanudar Autosync", "Pause / resume Autosync");
            menu.Items[4].Text = Locale.T("Salir", "Exit");
        };
        return menu;
    }

    static void ToggleAutosync() {
        lock (Gate) {
            settings.auto = !settings.auto;
            force = settings.auto;
            SaveSettings();
        }
    }

    static void OpenMap(string fragment = "") {
        Process.Start(new ProcessStartInfo(url + fragment) { UseShellExecute = true });
    }

    static void StopApplication() {
        running = false;
        if (pageTimer != null) pageTimer.Dispose();
        if (timer != null) timer.Dispose();
        if (listener != null) listener.Stop();
        if (tray != null) tray.Dispose();
        if (instance != null) instance.Dispose();
        if (stopWait != null) stopWait.Unregister(null);
        if (stopSignal != null) stopSignal.Dispose();
    }
}
