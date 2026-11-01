using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.Script.Serialization;

public class QuestDefinition {
    public string id;
    public uint hash;
    public string[] steps;
}
public class QuestData { public QuestDefinition[] quests; }
public class QuestProgress {
    public string id, state, step;
    public uint? raw;
}

// Step_* fields contain MurmurHash3 enum values, not ordinal stage numbers.
public static class QuestReader {
    static readonly Lazy<QuestDefinition[]> Definitions = new Lazy<QuestDefinition[]>(() =>
        new JavaScriptSerializer().Deserialize<QuestData>(Encoding.UTF8.GetString(
            MapResources.Embedded("web/quest-data.json"))).quests);

    public static QuestProgress[] Read(SaveReader save) { return Read(save, Definitions.Value); }

    public static QuestProgress[] Read(SaveReader save, IEnumerable<QuestDefinition> definitions) {
        return definitions.Select(quest => {
            var result = new QuestProgress { id = quest.id, state = "unknown" };
            int offset;
            if (!save.offsets.TryGetValue(quest.hash, out offset)) return result;
            uint value = save.U32(offset);
            result.raw = value;
            result.step = quest.steps.FirstOrDefault(step => InventoryReader.Hash(step) == value);
            if (result.step != null)
                result.state = result.step == "Complete" ? "done" : result.step == "NotReady" ? "todo" : "active";
            return result;
        }).ToArray();
    }
}
