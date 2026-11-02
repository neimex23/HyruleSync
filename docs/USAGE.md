# HyruleSync · quick start

The app automatically opens `http://hyrulesync.localhost:<port>/<session>/`. Modern Windows browsers resolve this name locally without DNS setup or administrator permissions. Use the full URL opened by the app; the port and private session path change on launch. Access remains limited to this PC.

By **Neimex23**. A project strongly driven by AI, developed with extensive assistance from **Codex · GPT-6.1 · High reasoning**.

1. Extract the ZIP and open **HyruleSync.exe**.
2. On first launch, click **Download map resources**. Internet is needed once to prepare about 44 MB of maps.
3. Choose **Watch folder → Browse folders**. Select one account folder containing `slot_00`, `slot_01`, etc., or paste the path.
4. Leave it running while playing. **Watch folder is the recommended option**: Autosync enables automatically, remembers the folder and detects autosaves and manual saves. The highest-playtime slot is selected.

Choose **Language → Español / English / Automatic (Windows)** in the sidebar or first-run screen. The choice is saved for future launches; the page reloads automatically to apply it. Automatic uses Spanish on Spanish Windows and English otherwise. Browser language is not used. No Unexplored installation, Python, Node or mod is required. Windows, .NET Framework 4.x and a modern browser are required. Use a writable app folder.

Closing the last tab exits HyruleSync after about five seconds. Reloading or another open tab keeps it running. Enable **About → Keep HyruleSync in the tray** to keep monitoring after closing the page; double-click its tray icon to return, or right-click → **Exit** to quit. Run **HyruleSync.Stop.exe** to stop all HyruleSync processes in the current Windows session. It targets HyruleSync only, not the game or browser. Failures are reported if an instance has different permissions.

**Load .sav** opens a snapshot and pauses Autosync. Select a folder or re-enable the switch to follow gameplay. Incomplete writes preserve the last valid state until a successful retry.

**Center on Link** shows his last saved position and zooms in when needed, preserving a closer zoom. Enable **Follow Link on updates** to center the map and select his layer whenever a new save is read, keeping your zoom. This option is off by default and remembered across restarts. Position is taken from the save, so it changes when you save the game. An unavailable position is shown explicitly.

HyruleSync checks GitHub Releases for stable updates on startup and once per hour while the interface is open. **About → Check for updates** retries manually. When a newer Windows package is available, **Download update** appears in both About and the sidebar; click it to download the ZIP. Close HyruleSync before replacing only `HyruleSync.exe` and `HyruleSync.Stop.exe`; keep the `.data/` and `.state/` folders intact (they hold your downloaded maps and settings; do not delete or overwrite them). Offline checks do not stop monitoring. **Report a problem** opens a new issue in the repository; you submit the report yourself.

Saves are read-only. Settings are in `.state/` and maps in `.data/`, beside the EXE. Keep those folders to avoid repeated setup. Do not share `.state/` or saves.

Open **About, licenses and credits** for authorship, AI disclosure, repository references, notices, MIT and Leaflet licenses. The counter is a catalog total, not TOTK's official percentage. Current catalog resources come from TotK Unexplored and retain its credits and limitations.

## Map and save inspection

Link uses the context of the last save: inside a shrine, his marker appears at its entrance with a blue ring and shrine badge. Unknown contexts are not projected onto Hyrule. By default, Link is visible below map icons at 45% opacity. You can hide Link and place his marker above or below map icons. Hiding suspends automatic centering and preserves your follow preference. These settings survive restarts. The **Link on the map** box groups visibility, follow, marker order and opacity (0–100%, with a live preview).

The catalog includes 15 additional Skyview Towers: activation is required for completion, with visits shown separately in the details. There are 21 categories and 2,414 points; the counter is still not the official game percentage.

**Saves** lets you inspect slots in the current folder or a manually selected file, showing modification time, playtime, format, location and progress by category. **View on map** opens a fixed snapshot while Autosync continues reading the watched folder. **Return to live tracking** shows the latest observed save. There is no comparison, backup, restore or save editing. Inspection never changes the watched source.

**View changes**, in the update notice and About, displays the latest available stable Release notes with a GitHub link. It requires a successful update check during the session; missing notes are reported explicitly.


## External guides

Each point has a **View guide** button that opens Zelda Dungeon in a new tab. Named locations open their wiki entry; unnamed collectibles and other categories open the external map at their coordinates and layer, where you can select the relevant icon for help. Third-party pages may change or be incomplete. No reference collection or downloaded guide content is stored locally.


## Inventory

Open **Inventory** next to Map for saved health, maximum hearts/stamina/battery, rupees and pony points. Nine searchable pouches show equipment, armor, arrows, materials, food, Zonai devices and key items, with quantities, available capacity and item details (durability, fusions, bonuses, dyes, food effects and ingredients). Names follow the selected language; original IDs remain visible. Missing data is shown as unavailable. Inventory follows the same live or inspected snapshot as the map. Saves remain read-only.


## Quests

Open **Quests** for all 253 Adventure Log entries: completed, in progress, not started and unknown. Progress follows the same live or inspected save as Map and Inventory. Search by name, character or location and filter by quest type/status. **View on map** selects the relevant layer and highlights a marker. The **Quests** category in the sidebar filters toggles quest markers independently of collectible filters; quest search/type/status filters also apply to markers. Shared locations fan out so each marker is clickable. Markers indicate a reference area or associated shrine, not the NPC’s exact position or current quest objective; five entries have no fixed location. Names and locations are currently English in both interface languages. No manual overrides or save editing.

The **Quests** category in the sidebar filters, with its own icon and disabled by default, toggles all quest markers. Each mission also has a **Show on the map** checkbox; hiding its marker keeps it in the list. Individual choices survive toggling the category. **View on map** makes that mission visible again.

Each quest card and map popup includes **View guide · Zelda Dungeon**, opening its associated wiki entry in another tab. **Verify against the save** shows the quest ID, Step field, stage, raw enum and save revision. Quest status is always read from the save; visibility controls only affect markers. An optional watcher integration test is available: `node tests/quest-autosync.cjs <read-only-save-input> <application-directory>`. It writes only private fixture copies.


## High-resolution maps

**HD** is the default quality: the **Map: HD** control in the map's top-left shows optional ZeldaMods detail on Surface, Sky and Depths. Tiles download as you explore and are cached in `.data/hd-map/zeldamods-v1/` (up to 512 MB). The choice survives restarts. Downloaded areas work offline; areas without cached HD detail show the standard background. **Retry HD** retries unavailable areas. Switching to **SD** makes no HD requests and retains the original offline maps. There is no full-map preload. Use **Download full HD map** in the sidebar to fetch every tile (≈80–120 MB) so the whole map works offline.

HD imagery is external and is excluded from the ZIP. Tile requests go through the local app to ZeldaMods and contain only layer/zoom/tile coordinates, with no saves or local paths. See the third-party notices for provenance.

The current ZeldaMods server requires TLS 1.3 for downloads. This requires Windows 11 or later with a compatible .NET Framework installation; older Windows systems retain the standard map and can use existing cached HD tiles. See [Microsoft TLS support](https://learn.microsoft.com/en-us/dotnet/framework/network-programming/tls).
