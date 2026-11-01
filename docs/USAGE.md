# HyruleSync · quick start

By **Neimex23**. A project strongly driven by AI, developed with extensive assistance from **Codex · GPT-6.1 · High reasoning**.

1. Extract the ZIP and open **HyruleSync.exe**.
2. On first launch, click **Download map resources**. Internet is needed once to prepare about 44 MB of maps.
3. Choose **Watch folder → Browse folders**. Select one account folder containing `slot_00`, `slot_01`, etc., or paste the path.
4. Leave it running while playing. **Watch folder is the recommended option**: Autosync enables automatically, remembers the folder and detects autosaves and manual saves. The highest-playtime slot is selected.

Choose **Language → Español / English / Automatic (Windows)** in the sidebar or first-run screen. The choice is saved for future launches; the page reloads automatically to apply it. Automatic uses Spanish on Spanish Windows and English otherwise. Browser language is not used. No Unexplored installation, Python, Node or mod is required. Windows, .NET Framework 4.x and a modern browser are required. Use a writable app folder.

Closing the last tab exits HyruleSync after about five seconds. Reloading or another open tab keeps it running. Enable **About → Keep HyruleSync in the tray** to keep monitoring after closing the page; double-click its tray icon to return, or right-click → **Exit** to quit. Run **HyruleSync.Stop.exe** to stop all HyruleSync processes in the current Windows session. It targets HyruleSync only, not the game or browser. Failures are reported if an instance has different permissions.

**Load .sav** opens a snapshot and pauses Autosync. Select a folder or re-enable the switch to follow gameplay. Incomplete writes preserve the last valid state until a successful retry.

**Center on Link** shows his last saved position and zooms in when needed, preserving a closer zoom. Enable **Follow Link on updates** to center the map and select his layer whenever a new save is read, keeping your zoom. This option is off by default and remembered across restarts. Position is taken from the save, so it changes when you save the game. An unavailable position is shown explicitly.

HyruleSync checks GitHub Releases for stable updates on startup and once per hour while the interface is open. **About → Check for updates** retries manually. When a newer Windows package is available, **Download update** opens the ZIP download. Close HyruleSync before replacing the executables; keep `.data/` and `.state/`. Offline checks do not stop monitoring. **Report a problem** opens a new issue in the repository; you submit the report yourself.

Saves are read-only. Settings are in `.state/` and maps in `.data/`, beside the EXE. Keep those folders to avoid repeated setup. Do not share `.state/` or saves.

Open **About, licenses and credits** for authorship, AI disclosure, repository references, notices, MIT and Leaflet licenses. The counter is a catalog total, not TOTK's official percentage. Current catalog resources come from TotK Unexplored and retain its credits and limitations.

## Map and save inspection

Link uses the context of the last save: inside a shrine, his marker appears at its entrance with a blue ring and shrine badge. Unknown contexts are not projected onto Hyrule. By default, Link is visible below map icons at 45% opacity. You can hide Link and place his marker above or below map icons. Hiding suspends automatic centering and preserves your follow preference. These settings survive restarts. The **Link on the map** box groups visibility, follow, marker order and opacity (0–100%, with a live preview).

The catalog includes 15 additional Skyview Towers: activation is required for completion, with visits shown separately in the details. There are 21 categories and 2,414 points; the counter is still not the official game percentage.

**Saves** lets you inspect slots in the current folder or a manually selected file, showing modification time, playtime, format, location and progress by category. **View on map** opens a fixed snapshot while Autosync continues reading the watched folder. **Return to live tracking** shows the latest observed save. There is no comparison, backup, restore or save editing. Inspection never changes the watched source.

**View changes**, in the update notice and About, displays the latest available stable Release notes with a GitHub link. It requires a successful update check during the session; missing notes are reported explicitly.
