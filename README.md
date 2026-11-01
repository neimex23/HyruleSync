# HyruleSync

[![Downloads](https://img.shields.io/github/downloads/neimex23/HyruleSync/total?label=downloads)](https://github.com/neimex23/HyruleSync/releases)

[Español](docs/README.es.md)

A local progress map for **The Legend of Zelda: Tears of the Kingdom / TOTK Recomp**, with automatic save monitoring on Windows.

**By Neimex23. A project strongly driven by AI**, developed with extensive assistance from **Codex · GPT-6.1 · High reasoning**.

## Run

1. Download the Windows ZIP from the [latest release](https://github.com/neimex23/HyruleSync/releases/latest). Extract it to a writable folder.
2. Open **HyruleSync.exe**. No Python, Node, mods or Unexplored installation is required.
3. On first launch, click **Download map resources**. About 44 MB are downloaded from a pinned TotK Unexplored commit, verified with SHA-256 and cached in `.data/` for offline use.
4. Choose **Watch folder → Browse folders** and select **one account folder**, containing `slot_00`, `slot_01`, etc. You can also paste a path.
5. Leave it running while playing. **Watch folder is the recommended option**: it enables Autosync and detects both autosaves and manual saves. The map normally updates about 2–3 seconds after a stable save write. **Load .sav** opens a snapshot and pauses Autosync.

Use **Language** in the sidebar or first-run screen to choose **Español**, **English**, or **Automatic (Windows)**. The choice is saved in `.state/settings.json`; the page reloads to apply it to the interface, categories and tray menu. Automatic uses Spanish for Spanish Windows and English otherwise. Browser language is not used. The stop utility uses Windows language. Developers can temporarily override the saved choice with `--language en` or `--language es`.

Closing the last map tab exits HyruleSync after a five-second grace period. Reloading or keeping another tab open keeps it running. To continue Autosync with the page closed, enable **About → Keep HyruleSync in the tray**. You can then double-click its tray icon to reopen the map or choose **Exit** to stop it. It does not install a service or start with Windows.

To close all HyruleSync instances in the current Windows session, run **HyruleSync.Stop.exe**. It requests a clean shutdown, then terminates remaining exact-name HyruleSync processes. It does not close the game or browser and never writes saves. Instances with different permissions may be inaccessible; failures are reported.

**Read-only:** no game files or saves are modified, and saves are never uploaded to external servers.

The download badge totals GitHub Release asset downloads across all versions, including ZIPs downloaded with the in-app update button and checksum files. Checking for updates does not add a download. This is a download count, not a unique-user count.

## Features and scope

- Surface, Depths and Sky; category/state filters and coordinates.
- Link's last saved position, a **Center on Link** button that zooms in when needed and optional **Follow Link on updates** (remembered across restarts, off by default). Following also selects his map layer and keeps your zoom. Position updates when a save is read.
- Stable GitHub release notifications with a Windows ZIP download button, plus **Report a problem** to open GitHub Issues.
- 2,414 catalog entries, Korok routes and cave connections.
- Manual `progress.sav` loading and hash/GUID diagnostics.
- Highest-playtime selection, stable-write delay and last-valid-state recovery.
- Remembered folder/Autosync settings; one instance per application folder.
- Custom EXE, browser and tray icons.
- In-app authorship, AI-development disclosure, repository references and original license texts.

The counter is **not the official game percentage** and does not cover every activity. Shrines require `Clear`, lightroots require `Open`. Catalog names and Korok types retain their original language; interface and categories are localized. See [save format notes](docs/save-format.md).

Recognized formats: 1.0, 1.1/1.2 and 1.4. Tested with TOTK Recomp 1.4.3; future formats are not guaranteed. Requires Windows, .NET Framework 4.x and a modern browser. Tested on the development machine, not every Windows version.

## Build and package

```cmd
build.cmd
```

**One command builds both executables and creates the Windows ZIP and SHA-256 file.** Outputs go in `outputs/`. Close copies running from that folder before rebuilding. `scripts/package.ps1` can also repackage a build.

The Windows .NET Framework C# compiler is required. No NuGet packages, Python or Node are needed to compile. UI, credits and license texts are embedded. Third-party map resources are downloaded separately and excluded from the public ZIP.

```powershell
.\scripts\test.ps1
# Optional monitoring test using your read-only save input (requires Python):
python tests/autosync.py --save 'D:\your-account\slot_00\progress.sav'
# Optional interface translation checks (requires Node):
node tests/i18n.cjs
node tests/inventory.cjs
node tests/map-tracking.cjs
node tests/map-rendering.cjs
node tests/page-lifetime.cjs
node tests/language.cjs
node tests/http-server.cjs
```

To import an existing matching resource repository instead of downloading:

```powershell
.\scripts\import-map-resources.ps1 -Source 'D:\path\to\totk-unexplored'
```

Imports are checked against the pinned manifest. Regenerate the original HyruleSync icon with `scripts/make-icon.ps1`.

## Repository layout

| Path | Content |
|---|---|
| `src/` | Windows app, save reader, catalog, data models, local HTTP server, locale and resources |
| `tools/` | HyruleSync process stopper |
| `web/` | Embedded interface, translations and Leaflet |
| `assets/` | Original icon, credits and resource manifest |
| `scripts/` | Build, package, tests and resource import |
| `tests/` | Reader, localization and monitoring checks |
| `docs/` | English/Spanish guides and save format notes |
| `licenses/` | Original redistributed dependency licenses |
| `outputs/` | Generated executables/ZIPs; ignored by Git |
| `.local/` | Prior versions and private test files; ignored by Git |

## Sharing and credits

Respect `.gitignore`. Do not commit `.local/`, `.data/`, `.state/`, saves or downloaded maps. The ZIP uses an explicit allowlist. GitHub **Build Windows** builds, tests and attaches a download. **Publish Windows release** publishes a stable Release when you push a tag such as `v0.4.0`:

```sh
git tag v0.4.0
git push origin v0.4.0
```

Push the commit containing the changes first, then tag that commit. Use a new `vX.Y.Z` tag for every release (for example `v0.4.1`); prerelease or named tags are not supported. The workflow builds both executables, embeds the tag version in the EXEs and credits, tests, then publishes `HyruleSync-vX.Y.Z-windows.zip` and its SHA-256 file. Let the workflow create the Release; do not publish one manually for the same tag. A local tagged build can be reproduced with `scripts/build.ps1 -Version v0.4.0`.

While the interface is open, HyruleSync checks GitHub's latest stable Release on startup and at most once per hour. **About → Check for updates** allows a manual retry (at most once per minute). Only a newer numeric version with the expected uploaded Windows package is offered. Offline or failed checks do not interrupt save monitoring. Update checks send no saves or local paths. The user downloads the ZIP, closes HyruleSync and replaces the executables, keeping `.data/` and `.state/`.

HyruleSync runs independently of the Unexplored app. Its current catalog and artwork still originate from that project. See [THIRD_PARTY.md](THIRD_PARTY.md). New HyruleSync code is MIT licensed; this does not license third-party maps, data or artwork. This is an unofficial Nintendo-related project.

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

Open **Quests** for all 253 Adventure Log entries: completed, in progress, not started and unknown. Progress follows the same live or inspected save as Map and Inventory. Search by name, character or location and filter by quest type/status. **View on map** selects the relevant layer and highlights a marker. **Quests on the map** toggles quest markers independently of collectible filters; quest search/type/status filters also apply to markers. Shared locations fan out so each marker is clickable. Markers indicate a reference area or associated shrine, not the NPC’s exact position or current quest objective; five entries have no fixed location. Names and locations are currently English in both interface languages. No manual overrides or save editing.

Use **Show quests on the map** in the Quests tab or map sidebar to toggle all quest markers. Each mission also has a **Show on the map** checkbox; hiding its marker keeps it in the list. Individual choices survive the global toggle. **View on map** makes that mission visible again.

Each quest card and map popup includes **View guide · Zelda Dungeon**, opening its associated wiki entry in another tab. **Verify against the save** shows the quest ID, Step field, stage, raw enum and save revision. Quest status is always read from the save; visibility controls only affect markers. An optional watcher integration test is available: `node tests/quest-autosync.cjs <read-only-save-input> <application-directory>`. It writes only private fixture copies.
