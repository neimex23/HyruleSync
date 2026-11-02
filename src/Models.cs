using System;

// Public field names are shared with the resource JSON and browser API.
public class Position { public double x, y, z; }
public class Flower { public Position position; }
public class Route { public Position start, end; public Flower[] flowers; }

public class Entry {
    public uint completion_hash;
    public string guid_hash, display_name, internal_name, type;
    public Position position;
    public Route path;
}

public class Category { public string id, name, icon; public int count; }

public class MapPoint {
    public string id, category, name, internalName, korokType, hash, guid, visitHash, origin;
    public Position position;
    public Route path;
}

public class Tower {
    public string id, nameEs, nameEn, visitHash, activationHash;
    public Position position;
}

public class PlayerContext {
    public string kind, mapId, shrineId, shrineName;
    public Position mapPosition;
}

public class Snapshot {
    public QuestProgress[] quests;
    public Inventory inventory;
    public string revision, file, savedAt, format;
    public uint playtime;
    public int[] states, visited;
    public string[] values;
    public int tableEnd, guidStart;
    public Position playerPosition;
    public PlayerContext playerContext;
}

public class CategoryProgress { public string id; public int total, found, unknown; }

public class SnapshotSummary {
    public string file, savedAt, format;
    public uint playtime;
    public PlayerContext playerContext;
    public CategoryProgress[] counts;
}

public class Cached {
    public long ticks, size;
    public DateTime observed;
    public Snapshot snapshot;
    public string error = "";
}

public class Settings {
    // Version 2 made HD the default map quality. Configs written before it
    // keep their implicit standard value until Upgrade() runs once.
    public int version;
    public string source = "", mode = "file", linkOrder = "below", language = "auto", mapQuality = "high";
    public bool auto = true, followLink = false, showLink = true, runInBackground = false;
    public int linkOpacity = 45;
    public bool Upgrade() {
        if (version >= 2) return false;
        version = 2; mapQuality = "high";
        return true;
    }
}
