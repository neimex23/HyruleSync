using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

// Format/data provenance: docs/save-format.md and THIRD_PARTY.md. Saves are read-only.
public class SaveReader {
    static readonly Dictionary<int, Tuple<uint, uint, string>> Versions =
        new Dictionary<int, Tuple<uint, uint, string>> {
            {2307552, Tuple.Create(0x0046c3c8u, 0x0003c050u, "1.0")},
            {2307656, Tuple.Create(0x0047e0f4u, 0x0003c088u, "1.1 / 1.2")},
            {2307856, Tuple.Create(0x0049e946u, 0x0003c138u, "1.4 / Recomp 1.4.3")}
        };

    public readonly byte[] bytes;
    public string format;
    public int tableEnd, guidStart;
    public uint playtime;
    public Dictionary<uint, int> offsets = new Dictionary<uint, int>();
    public HashSet<ulong> guids = new HashSet<ulong>();

    public uint U32(int position) {
        Check(position, 4);
        return BitConverter.ToUInt32(bytes, position);
    }

    void Check(int position, int length) {
        if (position < 0 || position > bytes.Length - length)
            throw new InvalidDataException(Locale.T("El archivo está incompleto o contiene una dirección inválida.", "The file is incomplete or contains an invalid offset."));
    }

    public SaveReader(byte[] data) {
        bytes = data;
        if (bytes == null || bytes.Length < 40 || U32(0) != 0x01020304)
            throw new InvalidDataException(Locale.T("Selecciona un progress.sav válido, no caption.sav ni un archivo .nro.", "Select a valid progress.sav file, not caption.sav or an .nro file."));

        Tuple<uint, uint, string> version;
        if (!Versions.TryGetValue(bytes.Length, out version) || U32(4) != version.Item1 || U32(8) != version.Item2)
            throw new InvalidDataException(Locale.T("Formato no reconocido. Se admiten guardados originales 1.0, 1.1/1.2 y 1.4.", "Unrecognized format. Save formats 1.0, 1.1/1.2 and 1.4 are supported."));
        format = version.Item3;

        // Upstream GetHashTableEnd: find MetaData.SaveTypeHash, never hard-code 0x3c800.
        for (int position = 40; position < Math.Min(bytes.Length - 8, 0x60000); position += 8) {
            uint key = U32(position);
            if (key == 0xa3db7114) {
                tableEnd = position;
                guidStart = checked((int)U32(position + 4));
                break;
            }
            if (key == 0) continue;
            if (offsets.ContainsKey(key))
                throw new InvalidDataException(Locale.T("Tabla de hashes duplicada.", "Duplicate hash table entry."));
            offsets.Add(key, position + 4);
        }
        if (tableEnd == 0 || guidStart < tableEnd || guidStart > bytes.Length - 8)
            throw new InvalidDataException(Locale.T("No se encuentra una tabla de progreso válida.", "No valid progress table was found."));

        for (int position = guidStart; position < bytes.Length - 7; position += 8) {
            ulong guid = BitConverter.ToUInt64(bytes, position);
            if (guid == 0) break;
            guids.Add(guid);
        }
        int entry;
        if (offsets.TryGetValue(0xe573f564, out entry)) playtime = U32(entry);
    }

    public Position PlayerPosition() {
        // PlayerStatus.SavePos is a pointer to three little-endian float32 values.
        int entry;
        if (!offsets.TryGetValue(0xc884818du, out entry)) return null;
        uint address = U32(entry);
        if (address < (uint)(tableEnd + 8) || address > (uint)(bytes.Length - 12)) return null;

        int position = (int)address;
        double x = BitConverter.ToSingle(bytes, position);
        double y = BitConverter.ToSingle(bytes, position + 4);
        double z = BitConverter.ToSingle(bytes, position + 8);
        if (Double.IsNaN(x) || Double.IsInfinity(x) || Double.IsNaN(y) || Double.IsInfinity(y) || Double.IsNaN(z) || Double.IsInfinity(z)) return null;
        return new Position { x = x, y = y, z = z };
    }

    public string CurrentMap() {
        int entry;
        if (!offsets.TryGetValue(0x1d6189dau, out entry)) return null;
        uint address = U32(entry);
        if (address < (uint)(tableEnd + 8) || address > (uint)(bytes.Length - 64)) return null;

        int position = (int)address, length = 0;
        while (length < 64 && bytes[position + length] != 0) {
            if (bytes[position + length] < 32 || bytes[position + length] > 126) return null;
            length++;
        }
        return length == 0 || length == 64 ? null : Encoding.ASCII.GetString(bytes, position, length);
    }

    public int BooleanState(string hash) {
        int entry;
        if (String.IsNullOrEmpty(hash) || !offsets.TryGetValue(UInt32.Parse(hash), out entry)) return -1;
        return U32(entry) != 0 ? 1 : 0;
    }

    public ChestProgress ReadChests(MapPoint point) {
        if (point.category != "shrines") return null;
        var result = new ChestProgress();
        if (point.chestHashes == null) return result;
        result.total = point.chestHashes.Length;
        foreach (string hash in point.chestHashes) {
            int state = BooleanState(hash);
            if (state == 1) result.opened++;
            else if (state == -1) result.unknown++;
        }
        return result;
    }

    public static PlayerContext ResolveContext(string map, Position raw, IEnumerable<MapPoint> points) {
        var result = new PlayerContext { mapId = map ?? "", kind = "unknown" };
        if (String.IsNullOrEmpty(map)) return result;
        if (map == "MainField") {
            result.kind = "world";
            result.mapPosition = raw;
            return result;
        }
        // Exact catalog identity only: interiors do not share the overworld coordinate space.
        var shrine = points.FirstOrDefault(point => point.category == "shrines" && point.internalName == map);
        if (shrine != null) {
            result.kind = "shrine";
            result.shrineId = shrine.id;
            result.shrineName = shrine.name;
            result.mapPosition = shrine.position;
        }
        return result;
    }

    public int State(MapPoint point, out string raw) {
        if (!String.IsNullOrEmpty(point.guid)) {
            bool found = guids.Contains(UInt64.Parse(point.guid));
            raw = found ? Locale.T("GUID presente", "GUID present") : Locale.T("GUID ausente", "GUID absent");
            return found ? 1 : 0;
        }
        int offset;
        if (!offsets.TryGetValue(UInt32.Parse(point.hash), out offset)) {
            raw = Locale.T("Hash ausente del guardado", "Hash missing from the save");
            return -1;
        }
        uint status = U32(offset);
        raw = "0x" + status.ToString("X8") + " (" + status + ")";
        // Exactly the comparisons in upstream SavefileIO::ParseFile.
        if (point.category == "shrines" || point.category == "carry_koroks") return status == 1654019904u ? 1 : 0; // Clear
        if (point.category == "lightroots") return status == 404286466u ? 1 : 0; // Open
        return status != 0 ? 1 : 0;
    }
}
