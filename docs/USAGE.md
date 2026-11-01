# HyruleSync · quick start

By **Neimex23**. A project strongly driven by AI, developed with extensive assistance from **Codex · GPT-6.1 · High reasoning**.

1. Extract the ZIP and open **HyruleSync.exe**.
2. On first launch, click **Download map resources**. Internet is needed once to prepare about 44 MB of maps.
3. Choose **Watch folder → Browse folders**. Select one account folder containing `slot_00`, `slot_01`, etc., or paste the path.
4. Leave it running while playing. Autosync enables automatically and remembers the folder. The highest-playtime slot is selected.

The app uses Spanish on Spanish Windows and English for other Windows UI languages. Browser language is not used. No Unexplored installation, Python, Node or mod is required. Windows, .NET Framework 4.x and a modern browser are required. Use a writable app folder.

Closing the tab leaves monitoring running in the notification area. Double-click its icon to return, or right-click → **Exit** to quit. Run **HyruleSync.Stop.exe** to stop all HyruleSync processes in the current Windows session. It targets HyruleSync only, not the game or browser. Failures are reported if an instance has different permissions.

**Load .sav** opens a snapshot and pauses Autosync. Select a folder or re-enable the switch to follow gameplay. Incomplete writes preserve the last valid state until a successful retry.

**Center on Link** shows his last saved position. Enable **Follow Link on updates** to center the map and select his layer whenever a new save is read, keeping your zoom. This option is off by default and remembered across restarts. Position is taken from the save, so it changes when you save the game. An unavailable position is shown explicitly.

HyruleSync checks GitHub Releases for stable updates on startup and once per hour while the interface is open. **About → Check for updates** retries manually. When a newer Windows package is available, **Download update** opens the ZIP download. Close HyruleSync before replacing the executables; keep `.data/` and `.state/`. Offline checks do not stop monitoring. **Report a problem** opens a new issue in the repository; you submit the report yourself.

Saves are read-only. Settings are in `.state/` and maps in `.data/`, beside the EXE. Keep those folders to avoid repeated setup. Do not share `.state/` or saves.

Open **About, licenses and credits** for authorship, AI disclosure, repository references, notices, MIT and Leaflet licenses. The counter is a catalog total, not TOTK's official percentage. Current catalog resources come from TotK Unexplored and retain its credits and limitations.
