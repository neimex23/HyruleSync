# Licenses, third-party notices and provenance

## HyruleSync · Neimex23

HyruleSync is authored by **Neimex23**. It is a project strongly driven by AI, developed with extensive assistance from **Codex · GPT-6.1 · High reasoning**. This describes the development process and does not claim ownership of third-party resources.

The new HyruleSync Windows implementation, local server, interface, monitoring, scripts and compass/checkmark icon are MIT licensed. Copyright © 2026 Neimex23 and HyruleSync contributors. The complete license is in `LICENSE` and inside the app under **About, licenses and credits**.

Save parsing and completion conditions reference the behavior of TotK Unexplored. HyruleSync's MIT license does not relicense external data or artwork.

## TotK Unexplored · catalog, backgrounds and category icons

- Project: https://github.com/lud99/totk-unexplored
- Author: lud99 (BigBear on GBAtemp).
- Contributor to TotK Unexplored: **Jhon Deved**.
- Author's announcement: https://gbatemp.net/threads/totk-unexplored-easily-view-all-the-unexplored-collectibles-in-your-totk-savefile.637254/
- Pinned commit: `a68ffbb083ac220c77f2e4ec3ce60d29924c1213`.
- Resources: `romfs/map_data.json`, `romfs/map/*-medium.png`, selected `romfs/icons/` files.
- Exact paths, sizes and SHA-256 hashes: `assets/resources.json` in the source.

No explicit license file was found in the reviewed version. Public availability is not treated as permission to redistribute these resources. They are **excluded from public source and the generated release ZIP**. Users can download them from the original repository during preparation or import a matching local copy. This separation grants no new rights over the files.

Before bundling them directly in a release, confirm the relevant permissions or replace them with appropriately licensed resources. GitHub's explanation: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository

## References acknowledged by TotK Unexplored

These upstream acknowledgements preserve the provenance of the downloaded catalog and routes. They are not libraries bundled in HyruleSync:

- Marc Robledo's Savegame Editors: https://github.com/marcrobledo/savegame-editors — hashes, coordinates and parsing research.
- ZeldaMods object map: https://github.com/zeldamods/objmap-totk — object information and collectible names.
- ZeldaMods radar data: https://github.com/zeldamods/radar-totk — object data used upstream for Korok routes.
- Zelda Dungeon: https://zeldadungeon.net — interactive map reference acknowledged upstream.

## Leaflet 1.9.4

https://github.com/Leaflet/Leaflet · https://leafletjs.com/

Copyright Vladimir Agafonkin and contributors. JavaScript/CSS are redistributed under **BSD-2-Clause**. The complete original English license is preserved unchanged in `licenses/Leaflet.txt`, included in the ZIP and accessible inside the app.

## Nintendo

The Legend of Zelda and its assets belong to their respective owners, including Nintendo. HyruleSync is unofficial and is not affiliated with or endorsed by Nintendo.

Canonical MIT and Leaflet license texts remain in English. Spanish documentation is separate and does not replace the original license terms.

## Inventory data and format references

Inventory array field names, stat units, item translations (English/Spanish) and armor upgrade metadata reference Marc Robledo's Savegame Editors at commit `b4db8cd11157c6d5ae54a0a5edc88dba82aebe9d`: `zelda-totk.js`, `zelda-totk.variables.js`, `zelda-totk.class.pouch.js`, `zelda-totk.class.armor.js` and `locale/zelda-totk.locale.{en,es}.js`. The selected data is bundled in `web/inventory-data.json`; no Nintendo item artwork is bundled. The generic pictograms in `web/inventory-icons.svg` are original HyruleSync artwork, MIT licensed. MIT, Copyright (c) 2017-2023 Marc Robledo; original license in `licenses/SavegameEditors.txt`. Item-name research credits: Echocolat, Exincracci, HylianLZ, Karlos007, ApacheThunder; translated names compiled by tingod. Inventory parsing is an independent read-only implementation.

## Additional Skyview Tower data

The 15 tower coordinates and visit/activation hashes are derived from Marc Robledo’s Savegame Editors, `zelda-totk.coordinates.js` and `zelda-totk.completism.js` (https://github.com/marcrobledo/savegame-editors). MIT, Copyright (c) 2017-2023 Marc Robledo. The original license is preserved in `licenses/SavegameEditors.txt` and available in the app. Tower artwork is original HyruleSync SVG. The downloaded Unexplored catalog is unchanged; towers are appended separately.


## Quest catalog and save enums

The selected factual quest metadata and reference coordinates in `web/quest-data.json` derive from the TotK Data Collection spreadsheet published as JSON by Ignacio9172 (`spreadsheet_totk_json`, commit `f20920ea28c0fa9aa9357ebf640c222c7de64a31`): https://github.com/Ignacio9172/spreadsheet_totk_json. Only IDs, names, classification, giver/location and coordinate facts are retained; quest descriptions, captions and dialogue are excluded. The 253 `Step_*` field hashes and their known enum names reference Marc Robledo’s MIT-licensed `zelda-totk.hashes.csv`, commit `b4db8cd11157c6d5ae54a0a5edc88dba82aebe9d`: https://github.com/marcrobledo/savegame-editors. The original MIT license is in `licenses/SavegameEditors.txt`. Read-only parsing and marker artwork are original HyruleSync code.

Quest guide links refer to Zelda Dungeon Wiki’s four Tears of the Kingdom quest indexes (Main Quests, Side Adventures, Shrine Quests and Side Quests), checked November 1, 2026: https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Main_Quests, https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Side_Adventures, https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Shrine_Quests and https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Side_Quests. Only external references are provided; no guide text or artwork is bundled. Article detail and availability may change.
