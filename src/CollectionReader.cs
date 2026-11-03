using System;
using System.Linq;
using System.Text;
using System.Web.Script.Serialization;

public class CollectionDefinition { public string id; public uint hash; }
public class CollectionData { public CollectionDefinition[] entries, armor; }
public class CollectionProgress { public string id, state; public uint? raw; }

// Only acquisition flags: no writes, quest guesses or inferred completion.
public static class CollectionReader {
    static readonly Lazy<CollectionData> Definitions = new Lazy<CollectionData>(() =>
        new JavaScriptSerializer().Deserialize<CollectionData>(Encoding.UTF8.GetString(
            MapResources.Embedded("web/collection-data.json"))));

    public static CollectionProgress[] Read(SaveReader save) { return Read(save, Definitions.Value.entries); }

    public static string[] ArmorIds() { return Definitions.Value.armor.Select(entry => entry.id).ToArray(); }

    public static CollectionProgress[] Read(SaveReader save, CollectionDefinition[] definitions) {
        return definitions.Select(definition => {
            var entry = new CollectionProgress { id = definition.id, state = "unknown" };
            int offset;
            if (save.offsets.TryGetValue(definition.hash, out offset)) {
                entry.raw = save.U32(offset);
                entry.state = entry.raw == 1 ? "owned" : entry.raw == 0 ? "missing" : "unknown";
            }
            return entry;
        }).ToArray();
    }
}
