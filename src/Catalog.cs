using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Script.Serialization;

public class Catalog {
    public string upstreamCommit;
    public List<Category> categories = new List<Category>();
    public List<MapPoint> points = new List<MapPoint>();

    public static Catalog Load(string mapData, string towerData) {
        var json = new JavaScriptSerializer { MaxJsonLength = 12 * 1024 * 1024 };
        var data = json.Deserialize<Dictionary<string, Entry[]>>(mapData);
        // Keep each category's identity, localized name and icon together.
        var definitions = new[] {
            new Category { id = "hidden_koroks", name = Locale.T("Kologs ocultos", "Hidden Koroks"), icon = "korok_hidden" },
            new Category { id = "carry_koroks", name = Locale.T("Kologs viajeros", "Carry Koroks"), icon = "korok_carry" },
            new Category { id = "shrines", name = Locale.T("Santuarios", "Shrines"), icon = "shrine" },
            new Category { id = "lightroots", name = Locale.T("Raíces", "Lightroots"), icon = "lightroot" },
            new Category { id = "caves", name = Locale.T("Cuevas · entradas", "Caves · entrances"), icon = "cave" },
            new Category { id = "bubbuls", name = Locale.T("Fantasmos", "Bubbulfrogs"), icon = "bubbul" },
            new Category { id = "wells", name = Locale.T("Pozos", "Wells"), icon = "well" },
            new Category { id = "chasms", name = Locale.T("Abismos", "Chasms"), icon = "chasm" },
            new Category { id = "locations", name = Locale.T("Lugares", "Locations"), icon = "location" },
            new Category { id = "hinoxes", name = Locale.T("Hinox", "Hinoxes"), icon = "eye" },
            new Category { id = "taluses", name = Locale.T("Petraroks", "Taluses"), icon = "talus" },
            new Category { id = "moldugas", name = Locale.T("Moldoras", "Moldugas"), icon = "molduga" },
            new Category { id = "flux_constructs", name = Locale.T("Gólems cúbicos", "Flux Constructs"), icon = "flux_construct" },
            new Category { id = "froxes", name = Locale.T("Obsidianos", "Froxes"), icon = "frox" },
            new Category { id = "gleeoks", name = Locale.T("Griocks", "Gleeoks"), icon = "gleeok" },
            new Category { id = "sages_wills", name = Locale.T("Voluntades de sabios", "Sage's Wills"), icon = "sages_will" },
            new Category { id = "old_maps", name = Locale.T("Mapas antiguos", "Old Maps"), icon = "old_map" },
            new Category { id = "addison_signposts", name = Locale.T("Carteles de Kabalit", "Addison Signs"), icon = "addison_sign" },
            new Category { id = "schema_stones", name = Locale.T("Piedras esquemáticas", "Schema Stones"), icon = "schema_stone" },
            new Category { id = "yiga_schematics", name = Locale.T("Esquemas Yiga", "Yiga Schematics"), icon = "yiga_schematic" }
        };
        var catalog = new Catalog { upstreamCommit = "a68ffbb083ac220c77f2e4ec3ce60d29924c1213" };
        foreach (var category in definitions) {
            var entries = data[category.id];
            category.count = entries.Length;
            catalog.categories.Add(category);
            for (int index = 0; index < entries.Length; index++) {
                var entry = entries[index];
                catalog.points.Add(new MapPoint {
                    id = category.id + ":" + index, category = category.id,
                    name = String.IsNullOrEmpty(entry.display_name) ? category.name + " " + (index + 1) : entry.display_name,
                    internalName = entry.internal_name, korokType = entry.type, position = entry.position,
                    path = entry.path, hash = entry.completion_hash.ToString(), guid = entry.guid_hash
                });
            }
        }
        var towers = json.Deserialize<Tower[]>(towerData);
        catalog.categories.Add(new Category { id = "towers", name = Locale.T("Atalayas", "Skyview Towers"), icon = "tower", count = towers.Length });
        foreach (var tower in towers) {
            catalog.points.Add(new MapPoint {
                id = "towers:" + tower.id, category = "towers", internalName = tower.id,
                name = Locale.T(tower.nameEs, tower.nameEn), position = tower.position,
                hash = tower.activationHash, visitHash = tower.visitHash,
                origin = "Marc Robledo · Savegame Editors (MIT)"
            });
        }
        return catalog;
    }

    public CategoryProgress[] CountProgress(int[] states) {
        var counts = categories.Select(category => new CategoryProgress { id = category.id, total = category.count }).ToArray();
        var byCategory = counts.ToDictionary(count => count.id);
        // One pass over the points; retain catalog category order in the result.
        for (int index = 0; index < points.Count; index++) {
            var count = byCategory[points[index].category];
            if (states[index] == 1) count.found++;
            else if (states[index] == -1) count.unknown++;
        }
        return counts;
    }
}
