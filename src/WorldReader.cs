using System;
using System.Linq;
using System.Text;
using System.Web.Script.Serialization;

public class WorldDefinition { public string id; public uint hash; }
public class WorldData { public WorldDefinition[] entries; public CharacterDefinition[] characters; }
public class CompendiumEntry { public string id, state; public uint? raw; }
public class CharacterDefinition { public string id, actor; public uint notificationHash, newHash; }
public class CharacterProgress { public string id, state; public uint? notificationRaw, newRaw; }

// PictureBookData.*.State is a scalar hashed enum, independent of the pouches.
public static class WorldReader {
    static readonly Lazy<WorldData> Definitions = new Lazy<WorldData>(() =>
        new JavaScriptSerializer().Deserialize<WorldData>(Encoding.UTF8.GetString(
            MapResources.Embedded("web/world-data.json"))));

    public static CompendiumEntry[] Read(SaveReader save) { return Read(save, Definitions.Value.entries); }

    public static CharacterProgress[] ReadCharacters(SaveReader save) { return ReadCharacters(save, Definitions.Value.characters); }

    static uint? CharacterFlag(SaveReader save, uint hash) {
        int offset;
        return save.offsets.TryGetValue(hash, out offset) ? (uint?)save.U32(offset) : null;
    }

    public static CharacterProgress[] ReadCharacters(SaveReader save, CharacterDefinition[] definitions) {
        return definitions.Select(definition => {
            var entry = new CharacterProgress { id = definition.id, state = "unknown",
                notificationRaw = CharacterFlag(save, definition.notificationHash), newRaw = CharacterFlag(save, definition.newHash) };
            // The registration notification persists after the unread "new" badge is cleared.
            // Either positive flag proves registration; absence alone never proves it is missing.
            if (entry.notificationRaw == 1 || entry.newRaw == 1) entry.state = "discovered";
            else if (entry.notificationRaw == 0 && entry.newRaw == 0) entry.state = "missing";
            return entry;
        }).ToArray();
    }

    public static CompendiumEntry[] Read(SaveReader save, WorldDefinition[] definitions) {
        uint unopened = InventoryReader.Hash("Unopened"), photo = InventoryReader.Hash("TakePhoto"), bought = InventoryReader.Hash("Buy");
        return definitions.Select(definition => {
            var entry = new CompendiumEntry { id = definition.id, state = "unknown" };
            int offset;
            if (save.offsets.TryGetValue(definition.hash, out offset)) {
                uint value = save.U32(offset); entry.raw = value;
                entry.state = value == unopened ? "missing" : value == photo ? "photo" : value == bought ? "bought" : "unknown";
            }
            return entry;
        }).ToArray();
    }
}
