# HyruleSync

[Español](docs/README.es.md)

A local progress map for **The Legend of Zelda: Tears of the Kingdom / TOTK Recomp**, with automatic save monitoring on Windows.

**By Neimex23. A project strongly driven by AI**, developed with extensive assistance from **Codex · GPT-6.1 · High reasoning**.

## Run

1. Download the Windows ZIP from this repository's Releases once published. Extract it to a writable folder.
2. Open **HyruleSync.exe**. No Python, Node, mods or Unexplored installation is required.
3. On first launch, click **Download map resources**. About 44 MB are downloaded from a pinned TotK Unexplored commit, verified with SHA-256 and cached in `.data/` for offline use.
4. Choose **Watch folder → Browse folders** and select **one account folder**, containing `slot_00`, `slot_01`, etc. You can also paste a path.
5. Leave it running while playing. Selecting a folder enables Autosync. The map normally updates about 2–3 seconds after a stable save write.

The program detects the current user's Windows UI language: Spanish for Spanish Windows, English otherwise. Categories, errors, tray menus and the stop utility follow this language. Browser language does not select the app language. Developers can use `--language en` or `--language es` to test without changing Windows settings.

Closing the tab leaves the reader running in the notification area. Double-click its icon to reopen it; choose **Exit** to stop it. It does not install a service or start with Windows.

To close all HyruleSync instances in the current Windows session, run **HyruleSync.Stop.exe**. It requests a clean shutdown, then terminates remaining exact-name HyruleSync processes. It does not close the game or browser and never writes saves. Instances with different permissions may be inaccessible; failures are reported.

**Read-only:** no game files or saves are modified, and saves are never uploaded to external servers.

## Features and scope

- Surface, Depths and Sky; category/state filters and coordinates.
- Link's last saved position, a **Center on Link** button and optional **Follow Link on updates** (remembered across restarts, off by default). Following also selects his map layer and keeps your zoom. Position updates when a save is read.
- Stable GitHub release notifications with a Windows ZIP download button, plus **Report a problem** to open GitHub Issues.
- 2,399 catalog entries, Korok routes and cave connections.
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
node tests/map-tracking.cjs
```

To import an existing matching resource repository instead of downloading:

```powershell
.\scripts\import-map-resources.ps1 -Source 'D:\path\to\totk-unexplored'
```

Imports are checked against the pinned manifest. Regenerate the original HyruleSync icon with `scripts/make-icon.ps1`.

## Repository layout

| Path | Content |
|---|---|
| `src/` | Windows app, save reader, locale detection and resource downloader |
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
