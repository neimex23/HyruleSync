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

## React and React DOM 19.3.1

React, React DOM and Scheduler are bundled into the local web interface. MIT License, Copyright (c) Meta Platforms, Inc. and affiliates. The original text is in `licenses/React.txt` and **About → View React license**. Source: https://github.com/facebook/react. Vite and ESLint are build/development tools; they are not runtime requirements for the packaged application.

## Leaflet 1.9.4

https://github.com/Leaflet/Leaflet · https://leafletjs.com/

Copyright Vladimir Agafonkin and contributors. JavaScript/CSS are redistributed under **BSD-2-Clause**. The complete original English license is preserved unchanged in `licenses/Leaflet.txt`, included in the ZIP and accessible inside the app.

## HyruleWorld reference catalog

Character registration reads `CharaDirectory_IsInstantTipsDisplayed.<actor>` and `CharaDirectory_IsNew.<actor>` from the pinned Savegame Editors hash research. Either positive flag proves discovery; both present and zero indicate undiscovered. Missing/unsupported flags remain unknown. The pairing prevents a cleared unread badge from losing an already registered profile. The factual mapping and portrait source pages are recorded in `assets/character-profiles.json` and generated into the shared catalog. All 23 portrait URLs (including both members of the joint Hudson/Rhondson profile) were checked as PNG responses on November 2, 2026. Twenty-two portraits originate from Zelda Dungeon's character-profile artwork; Dorephan's portrait comes from Zelda Wiki's CDN. These external Nintendo images are not included in source or packages, and use initials when unavailable. Requests send no save content or local paths.

The 509 compendium numbers and common-area facts in `web/public/world-data.json` reference [Hyrule Compendium API](https://github.com/gadhagod/Hyrule-Compendium-API), Copyright 2020 Aarav Borthakur, MIT; original license in `licenses/HyruleCompendium.txt`. The source response SHA-256 is recorded in the dataset. Selected English/Spanish names and location labels reference [totk-resources](https://github.com/zoalasaurusrawr/totk-resources), commit `2bc9ea5e0c2eb2e24fcaaff3f7162660559eb082`, and the existing inventory name table. No captions, descriptions or game dialogue are included. Save hashes and enum meanings reference Marc Robledo's MIT-licensed research at the revision used by the quest importer. `scripts/import-world.cjs` validates all 509 entries, including separate decayed/pristine weapons.

Reference portraits are requested directly from Hyrule Compendium API's GitHub repository at commit `7d5c566dd1563ef6087335cc4ca0ec47e79bb392`. They are excluded from source and release archives. Nintendo artwork retains its original ownership; the API's MIT license is not treated as a license for artwork. Failed requests fall back to local pictograms. Image requests send no saves, filenames or local paths.

The 22 character notes are original HyruleSync summaries. Membership and names were checked against `ActorMsg/CharaDirectory` in the same text revision, [Thonky's checklist](https://www.thonky.com/zelda-tears-of-the-kingdom/character-profiles) and [Zelda Wiki](https://zelda.fandom.com/wiki/Character_Profiles). Locations may change with story progress. Guide buttons open Zelda Dungeon; no guide prose is bundled. All profiles are available independently of save progress. Album state represents compendium registration, including purchased pictures; personal camera images are not extracted from `progress.sav`.

## Nintendo

The Legend of Zelda and its assets belong to their respective owners, including Nintendo. HyruleSync is unofficial and is not affiliated with or endorsed by Nintendo.

Canonical MIT and Leaflet license texts remain in English. Spanish documentation is separate and does not replace the original license terms.

## Inventory data and format references

The collection catalog in `web/public/collection-data.json` selects armor sources and upgrade requirements from `Ignacio9172/spreadsheet_totk_json`, revision `f20920ea28c0fa9aa9357ebf640c222c7de64a31`. Acquisition hashes reference Marc Robledo's research at `450752f98876755944ea22eb457f4dc1468d79ea`, including additional 1.4 fabrics. Memory titles reference `StaticMsg/DragonMemory.csv` from `zoalasaurusrawr/totk-resources` at `2bc9ea5e0c2eb2e24fcaaff3f7162660559eb082`; formatting tokens, descriptions and dialogue are excluded. Rupee costs were checked against [Armor Enhancement](https://www.zeldadungeon.net/wiki/Armor_Enhancement) and [Ancient Hero's Aspect](https://www.zeldadungeon.net/wiki/Ancient_Hero%27s_Aspect), including its triple rupee cost. `scripts/import-collections.cjs` regenerates the selected factual data.

Collection reference images (armor, fabrics, horse equipment, rewards, medals and memory thumbnails) are requested directly from `TOTKSheet/TOTKImages`, revision `e0467418215e76bd93c3ec8b55bbf321e4cc43ae`. They are not included in source or release archives. Nintendo artwork retains its original ownership; upstream code/data licenses do not grant artwork rights. Failed images use local pictograms. Requests contain image paths only, without save data or local filenames.

Inventory array field names, stat units, item translations (English/Spanish) and armor upgrade metadata reference Marc Robledo's Savegame Editors at commit `b4db8cd11157c6d5ae54a0a5edc88dba82aebe9d`: `zelda-totk.js`, `zelda-totk.variables.js`, `zelda-totk.class.pouch.js`, `zelda-totk.class.armor.js` and `locale/zelda-totk.locale.{en,es}.js`. The selected data is bundled in `web/public/inventory-data.json`; no Nintendo item artwork is bundled. The generic pictograms in `web/public/inventory-icons.svg` are original HyruleSync artwork, MIT licensed. MIT, Copyright (c) 2017-2023 Marc Robledo; original license in `licenses/SavegameEditors.txt`. Item-name research credits: Echocolat, Exincracci, HylianLZ, Karlos007, ApacheThunder; translated names compiled by tingod. Inventory parsing is an independent read-only implementation.

## Shrine discovery and chest metadata

`assets/shrines.json` contains selected factual save hashes for 152 shrine visits and 166 individual chests. Discovery and `IsTreasureBoxOpen` hashes come from Marc Robledo's `zelda-totk.hashes.csv` at commit `b4db8cd11157c6d5ae54a0a5edc88dba82aebe9d` (MIT; original notice in `licenses/SavegameEditors.txt`). The shrine-to-chest association comes from [ZeldaMods radar](https://radar-totk.zeldamods.org/), using the same SmallDungeon chest query as [Object Map](https://github.com/zeldamods/objmap-totk/blob/main/src/components/AppMapDetailsDungeon.ts). Only selected identifiers/hashes are included, without object placements, game text or artwork. Source URLs and response SHA-256 digests are recorded in the dataset; `scripts/import-shrines.cjs` regenerates it. The parser, status logic and chest badge are HyruleSync code.

## Additional Skyview Tower data

The 15 tower coordinates and visit/activation hashes are derived from Marc Robledo’s Savegame Editors, `zelda-totk.coordinates.js` and `zelda-totk.completism.js` (https://github.com/marcrobledo/savegame-editors). MIT, Copyright (c) 2017-2023 Marc Robledo. The original license is preserved in `licenses/SavegameEditors.txt` and available in the app. Tower artwork is original HyruleSync SVG. The downloaded Unexplored catalog is unchanged; towers are appended separately.


## Quest catalog and save enums

Spanish quest titles and selected character names in `assets/quest-locales.es.json` were checked against Kiranico's Spanish TotK Adventure Log and character indexes on November 2, 2026: https://zelda.kiranico.com/es/totk/data/quests and https://zelda.kiranico.com/es/totk/data/non_player_characters. Associated location names and remaining aliases were checked against the Spanish side-quest list at https://www.latecnosfera.com/2023/05/lista-misiones-secundarias-zelda-totk.html and Zelda Wiki's location translation tables at https://zeldawiki.wiki/wiki/Tears_of_the_Kingdom_Translations/Locations (including its Surface, Sky and Depths subpages). The locale file records the individual reference URLs and check date. Only selected names are retained, without quest descriptions, dialogue, guide text or artwork. `scripts/import-quests.cjs` combines this local table with the pinned factual catalog; the app needs no translation service or extra runtime download. Original English names remain the targets of external guide links.

The selected factual quest metadata and reference coordinates in `web/public/quest-data.json` derive from the TotK Data Collection spreadsheet published as JSON by Ignacio9172 (`spreadsheet_totk_json`, commit `f20920ea28c0fa9aa9357ebf640c222c7de64a31`): https://github.com/Ignacio9172/spreadsheet_totk_json. Only IDs, names, classification, giver/location and coordinate facts are retained; quest descriptions, captions and dialogue are excluded. The 253 `Step_*` field hashes and their known enum names reference Marc Robledo’s MIT-licensed `zelda-totk.hashes.csv`, commit `b4db8cd11157c6d5ae54a0a5edc88dba82aebe9d`: https://github.com/marcrobledo/savegame-editors. The original MIT license is in `licenses/SavegameEditors.txt`. Read-only parsing and marker artwork are original HyruleSync code.

Quest guide links refer to Zelda Dungeon Wiki’s four Tears of the Kingdom quest indexes (Main Quests, Side Adventures, Shrine Quests and Side Quests), checked November 1, 2026: https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Main_Quests, https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Side_Adventures, https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Shrine_Quests and https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Side_Quests. Only external references are provided; no guide text or artwork is bundled. Article detail and availability may change.


## ZeldaMods · optional HD background tiles

Surface, Sky and Depths HD backgrounds are retrieved on demand from `https://objmap-totk.zeldamods.org/game_files/map/{Ground|Sky|Depths}/maptex/{z}/{x}/{y}.webp`. Source configuration: https://github.com/zeldamods/objmap-totk/blob/3c37e5317c5fce3b4edf1bb2daf49c5607871a8f/src/MapBase.ts and `src/util/map.ts`. Checked November 1, 2026. The source uses a 24000 × 20000 coordinate canvas and native tile levels through 7.

HyruleSync independently implements the coordinate mapping and optional local cache; no ZeldaMods application code is bundled. The upstream application lists GPL-3.0, which is not treated as a license grant for Nintendo artwork. Redistribution permission for the imagery has not been established. Tiles are excluded from source and release archives and are fetched only after selecting HD. These live endpoints are not commit-pinned or verified against an upstream checksum manifest. Responses are bounded and validated as 256 × 256 WebP containers; downloaded tiles are retained locally. No saves or local paths are sent.
