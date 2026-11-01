using System;
using System.Collections.Generic;
using System.Text;

// Read-only pouch arrays; field names/units researched by Marc Robledo (see THIRD_PARTY.md).
public class Inventory {
    public double? life, maxLife, stamina, energy, rupees, ponyPoints;
    public InventoryGroup[] groups;
}
public class InventoryGroup {
    public string id;
    public bool available;
    public int? capacity;
    public List<InventoryItem> items = new List<InventoryItem>();
}
public class InventoryItem {
    public string id;
    public int slot;
    public bool? equipped;
    public Dictionary<string, object> details = new Dictionary<string, object>();
}
public static class InventoryReader {
    public static uint Hash(string name) {
        // MurmurHash3 x86_32, seed 0; GameData keys are ASCII.
        unchecked {
            byte[] data = Encoding.ASCII.GetBytes(name); uint h = 0, k;
            int i = 0;
            for (; i + 4 <= data.Length; i += 4) {
                k = BitConverter.ToUInt32(data, i); k *= 0xcc9e2d51; k = (k << 15) | (k >> 17); k *= 0x1b873593;
                h ^= k; h = (h << 13) | (h >> 19); h = h * 5 + 0xe6546b64;
            }
            k = 0; for (int j = 0; i + j < data.Length; j++) k |= (uint)data[i + j] << (8 * j);
            k *= 0xcc9e2d51; k = (k << 15) | (k >> 17); k *= 0x1b873593; h ^= k;
            h ^= (uint)data.Length; h ^= h >> 16; h *= 0x85ebca6b; h ^= h >> 13; h *= 0xc2b2ae35; h ^= h >> 16; return h;
        }
    }
    static int Entry(SaveReader save, string key) { int at; return save.offsets.TryGetValue(Hash(key), out at) ? at : -1; }
    static double? Scalar(SaveReader save, string key, bool floating) {
        int at = Entry(save, key); if (at < 0) return null;
        double value = floating ? BitConverter.ToSingle(save.bytes, at) : BitConverter.ToInt32(save.bytes, at);
        return Double.IsNaN(value) || Double.IsInfinity(value) || value < 0 ? (double?)null : value;
    }
    static object[] ArrayData(SaveReader save, string key, bool text) {
        int entry = Entry(save, key); if (entry < 0) return null;
        uint address = save.U32(entry); int width = text ? 64 : 4;
        if (address < save.tableEnd + 8 || address > save.bytes.Length - 4) return null;
        uint count = save.U32((int)address);
        if (count > 4096 || (long)address + 4 + (long)count * width > save.bytes.Length) return null;
        var result = new object[(int)count];
        for (int i = 0; i < result.Length; i++) {
            int at = (int)address + 4 + i * width;
            if (!text) { result[i] = BitConverter.ToInt32(save.bytes, at); continue; }
            int length = 0;
            while (length < width && save.bytes[at + length] != 0) {
                byte ch = save.bytes[at + length]; if (ch < 32 || ch > 126) return null; length++;
            }
            if (length == width) return null;
            result[i] = Encoding.ASCII.GetString(save.bytes, at, length);
        }
        return result;
    }
    static object At(object[] values, int slot) { return values != null && slot < values.Length ? values[slot] : null; }
    static readonly string[] Fields = {
        "quantity|StockNum", "durability|Life", "modifier|Effect.Type", "modifierValue|Effect.Value",
        "fuseId|Combined.Name", "fuseDurability|Combined.Life", "extraDurability|ExtraLife", "recordExtraDurability|RecordExtraLife",
        "dyeColor|ColorVariation", "getOrder|GetOrder", "useOrder|UseOrder", "heartsHeal|LifeRecover",
        "effectMultiplier|Effect.Level", "effectTime|Effect.Time", "price|Price"
    };
    public static Inventory Read(SaveReader save) {
        var inventory = new Inventory {
            life = Scalar(save, "PlayerStatus.Life", false), maxLife = Scalar(save, "PlayerStatus.MaxLife", false),
            stamina = Scalar(save, "PlayerStatus.MaxStamina", true), energy = Scalar(save, "PlayerStatus.MaxEnergy", true),
            rupees = Scalar(save, "PlayerStatus.CurrentRupee", false), ponyPoints = Scalar(save, "HorseInnMemberPoint", false)
        };
        var groups = new List<InventoryGroup>();
        foreach (string pair in new[] { "weapons|Weapon", "bows|Bow", "shields|Shield", "armors|Armor", "arrows|Arrow", "materials|Material", "food|Food", "devices|SpecialParts", "key|KeyItem" }) {
            string[] parts = pair.Split('|'); string prefix = "Pouch." + parts[1] + ".";
            var group = new InventoryGroup { id = parts[0] }; groups.Add(group);
            object[] names = ArrayData(save, prefix + "Content.Name", true);
            group.available = names != null;
            var valid = At(ArrayData(save, prefix + "ValidNum", false), 0);
            group.capacity = valid is int && (int)valid >= 0 && names != null && (int)valid <= names.Length ? (int?)valid : null;
            if (names == null) continue;
            var fields = new Dictionary<string, object[]>();
            foreach (string field in Fields) {
                string[] spec = field.Split('|');
                fields[spec[0]] = ArrayData(save, prefix + "Content." + spec[1], spec[0] == "fuseId");
            }
            var recipe = group.id == "food" ? ArrayData(save, prefix + "Content.MaterialName", true) : null;
            var equipped = ArrayData(save, prefix + "EquipIndex", false);
            for (int slot = 0; slot < names.Length; slot++) {
                string id = (string)names[slot]; if (id.Length == 0) continue;
                var item = new InventoryItem { id = id, slot = slot, equipped = equipped == null ? (bool?)null : System.Array.IndexOf(equipped, (object)slot) >= 0 };
                foreach (var field in fields) item.details[field.Key] = At(field.Value, slot);
                if (recipe != null && slot * 5 + 5 <= recipe.Length) {
                    var ingredients = new string[5]; for (int j = 0; j < 5; j++) ingredients[j] = (string)recipe[slot * 5 + j];
                    item.details["recipe"] = ingredients;
                }
                group.items.Add(item);
            }
        }
        inventory.groups = groups.ToArray(); return inventory;
    }
}
