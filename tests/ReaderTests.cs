using System;
using System.IO;

// Fixtures are synthesized here; no user's save files are required or included.
public static class ReaderTests {
    static int passed;
    static void CheckHDMap() {
        string relative, remote;
        Assert(HDMapTiles.TryTile("map-tiles/surface/7/93/78.webp", out relative, out remote), "Last native surface tile is in bounds");
        Assert(remote == "https://objmap-totk.zeldamods.org/game_files/map/Ground/maptex/7/93/78.webp", "Surface maps to the fixed Ground endpoint");
        Assert(HDMapTiles.TryTile("map-tiles/depths/0/0/0.webp", out relative, out remote) && remote.Contains("/Depths/"), "Low zoom depth tile accepted");
        Assert(HDMapTiles.TryTile("map-tiles/sky/6/46/39.webp", out relative, out remote) && relative == "sky/6/46/39.webp", "Sky and lower zoom use their own cache keys");
        foreach (string path in new[] { "map-tiles/surface/8/0/0.webp", "map-tiles/surface/7/94/0.webp", "map-tiles/sky/7/0/79.webp", "map-tiles/sky/0/2/0.webp", "map-tiles/sky/1/-1/0.webp", "map-tiles/../1/0/0.webp", "map-tiles/sky/7/0/0.webp/extra", "map-tiles/sky/7/0/0.png", "map-tiles/Sky/7/0/0.webp" })
            Assert(!HDMapTiles.TryTile(path, out relative, out remote), "Reject invalid HD tile: " + path);
        byte[] tile = new byte[30];
        Array.Copy(System.Text.Encoding.ASCII.GetBytes("RIFF"), 0, tile, 0, 4); Put(tile, 4, 22);
        Array.Copy(System.Text.Encoding.ASCII.GetBytes("WEBPVP8 "), 0, tile, 8, 8);
        tile[23] = 0x9d; tile[24] = 1; tile[25] = 0x2a; tile[27] = tile[29] = 1;
        Assert(HDMapTiles.ValidImage(tile), "Validate bounded 256px VP8 container");
        Assert(!HDMapTiles.ValidImage(null) && !HDMapTiles.ValidImage(new byte[29]), "Reject missing or truncated image");
        tile[29] = 2; Assert(!HDMapTiles.ValidImage(tile), "Reject unexpected tile dimensions"); tile[29] = 1;
        tile[4] = 23; Assert(!HDMapTiles.ValidImage(tile), "Reject truncated RIFF container"); tile[4] = 22;
        string cache = Path.Combine(HDMapTiles.Root, "surface/7/93/78.webp");
        Directory.CreateDirectory(Path.GetDirectoryName(cache)); File.WriteAllBytes(cache, tile);
        HDMapTiles.Initialize();
        Assert(HDMapTiles.Read("map-tiles/surface/7/93/78.webp", false).Length == tile.Length, "Cached imagery works without downloads");
        Assert(HDMapTiles.Read("map-tiles/surface/7/92/78.webp", false) == null, "Uncached offline area falls back without network");
        File.WriteAllText(cache, "corrupt");
        Assert(HDMapTiles.Read("map-tiles/surface/7/93/78.webp", false) == null && !File.Exists(cache), "Discard corrupt cached imagery");
    }
    static void Assert(bool ok, string name) {
        if (!ok) throw new Exception("FAIL: " + name);
        passed++;
    }
    static void Put(byte[] bytes, int at, uint value) { Array.Copy(BitConverter.GetBytes(value), 0, bytes, at, 4); }
    static void Float(byte[] bytes,int at,float value){Array.Copy(BitConverter.GetBytes(value),0,bytes,at,4);}
    static void CheckPosition(int length,uint header,uint metadata){
        var data=Fixture(length,header,metadata);
        Assert(new SaveReader(data).PlayerPosition()==null,"Missing position is optional");
        // Insert a pointer entry before the table terminator; vector data is elsewhere.
        Put(data,56,0xc884818d);Put(data,60,128);Put(data,64,0xa3db7114);Put(data,68,80);Put(data,80,0);Put(data,84,0);
        Float(data,128,-1234.5f);Float(data,132,985.25f);Float(data,136,4321.75f);
        var p=new SaveReader(data).PlayerPosition();
        Assert(p!=null&&p.x==-1234.5&&p.y==985.25&&p.z==4321.75,"Position follows pointer with signed float32 XYZ");
        Float(data,128,0);Float(data,132,0);Float(data,136,0);
        Assert(new SaveReader(data).PlayerPosition()!=null,"World origin is a valid position");
        Float(data,128,Single.NaN);Assert(new SaveReader(data).PlayerPosition()==null,"NaN position is unavailable");
        Float(data,128,Single.PositiveInfinity);Assert(new SaveReader(data).PlayerPosition()==null,"Infinite position is unavailable");
        Put(data,60,(uint)(length-8));Assert(new SaveReader(data).PlayerPosition()==null,"Reject truncated vector");
        Put(data,60,UInt32.MaxValue);Assert(new SaveReader(data).PlayerPosition()==null,"Reject overflowing pointer");
        Put(data,60,44);Assert(new SaveReader(data).PlayerPosition()==null,"Reject pointer into hash table");
    }
    static void CheckUpdates(){
        Version version;
        Assert(Updates.TryVersion("v1.10.0",out version),"Stable tag accepted");
        foreach(string tag in new[]{"mayo","v1.0","v1.0.0-beta","v01.2.3","v1.2.3.4","V1.2.3","v999999999999.2.3"})
            Assert(!Updates.TryVersion(tag,out version),"Reject unsupported tag "+tag);
        string prefix="https://github.com/"+Updates.Repository;
        var asset=new ReleaseAsset{name="HyruleSync-v1.10.0-windows.zip",browser_download_url=prefix+"/releases/download/v1.10.0/HyruleSync-v1.10.0-windows.zip",size=100,state="uploaded"};
        var release=new ReleaseInfo{tag_name="v1.10.0",body="## Changes\n<script>alert(1)</script>",assets=new[]{asset}};
        Assert(Updates.Evaluate(release,"1.9.0").available,"Compare version numerically");
        Assert(Updates.Evaluate(release,"1.9.0").releaseNotes==release.body,"Return release notes as unmodified text");
        release.body=null;Assert(Updates.Evaluate(release,"1.10.0").releaseNotes=="","Missing notes are optional for current release");
        Assert(!Updates.Evaluate(release,"1.10.0").available,"Do not offer current release");
        Assert(!Updates.Evaluate(release,"2.0.0").available,"Do not offer downgrade");
        release.prerelease=true;Assert(!Updates.Evaluate(release,"1.0.0").available,"Ignore prerelease");release.prerelease=false;
        release.draft=true;Assert(!Updates.Evaluate(release,"1.0.0").available,"Ignore draft");release.draft=false;
        asset.browser_download_url="https://example.com/update.zip";
        Assert(!Updates.Evaluate(release,"1.0.0").available,"Reject external package URL");
        asset.browser_download_url=prefix+"/releases/download/v1.10.0/HyruleSync-v1.10.0-windows.zip";asset.state="new";
        Assert(!Updates.Evaluate(release,"1.0.0").available,"Ignore unfinished upload");
        release.assets=new ReleaseAsset[0];Assert(!Updates.Evaluate(release,"1.0.0").available,"Ignore release without Windows package");
    }
    static void CheckContext(int length,uint header,uint metadata){
        var data=Fixture(length,header,metadata);
        Assert(new SaveReader(data).CurrentMap()==null,"Missing scene is optional");
        Put(data,56,0x1d6189da);Put(data,60,128);Put(data,64,0xa3db7114);Put(data,68,80);Put(data,80,0);Put(data,84,0);
        Array.Copy(System.Text.Encoding.ASCII.GetBytes("Dungeon048"),0,data,128,10);
        Assert(new SaveReader(data).CurrentMap()=="Dungeon048","Read bounded String64 scene through pointer");
        var points=new[]{new MapPoint{id="shrines:48",category="shrines",internalName="Dungeon048",name="Test Shrine",position=new Position{x=123,y=900,z=456}}};
        var raw=new Position{x=1,y=-100,z=2};
        var context=SaveReader.ResolveContext(new SaveReader(data).CurrentMap(),raw,points);
        Assert(context.kind=="shrine"&&context.shrineId=="shrines:48"&&context.mapPosition.y==900,"Shrine resolves to its sky entrance, not raw interior height");
        Assert(raw.y==-100,"Context resolution preserves raw coordinates");
        points[0].position.y=200;Assert(SaveReader.ResolveContext("Dungeon048",raw,points).mapPosition.y==200,"Surface shrine entrance");
        Assert(SaveReader.ResolveContext("MainField",raw,points).mapPosition==raw,"Leaving shrine restores world position");
        foreach(string scene in new[]{null,"Dungeon999","LargeDungeonFire","SmallDungeon","Dungeon048_extra"})
            Assert(SaveReader.ResolveContext(scene,raw,points).mapPosition==null,"Unknown context never guesses a position");
        Assert(SaveReader.ResolveContext("Dungeon048",null,points).mapPosition!=null,"Known shrine does not require an interior vector");
        Put(data,60,44);Assert(new SaveReader(data).CurrentMap()==null,"Reject scene pointer into table");
        Put(data,60,(uint)(length-63));Assert(new SaveReader(data).CurrentMap()==null,"Reject truncated String64");
        Put(data,60,UInt32.MaxValue);Assert(new SaveReader(data).CurrentMap()==null,"Reject overflowing scene pointer");
        Put(data,60,128);for(int i=128;i<192;i++)data[i]=(byte)'A';Assert(new SaveReader(data).CurrentMap()==null,"Reject unterminated scene");
        data[129]=0;data[128]=255;Assert(new SaveReader(data).CurrentMap()==null,"Reject malformed scene text");
        var tower=new MapPoint{category="towers",hash="123",visitHash="456"};string value;
        Put(data,44,0);Assert(new SaveReader(data).State(tower,out value)==0,"Tower not activated");
        Put(data,44,2);Assert(new SaveReader(data).State(tower,out value)==1,"Tower activation accepts nonzero boolean");
        Assert(new SaveReader(data).BooleanState(tower.visitHash)==-1,"Missing tower visit remains unverified");
        Assert(new SaveReader(data).BooleanState(tower.hash)==1,"Visit and activation use independent hashes");
        Put(data,56,456);Put(data,60,1);Put(data,44,0);
        Assert(new SaveReader(data).State(tower,out value)==0&&new SaveReader(data).BooleanState(tower.visitHash)==1,"Visited tower without activation remains incomplete");
        Put(data,44,1);Put(data,60,0);
        Assert(new SaveReader(data).State(tower,out value)==1&&new SaveReader(data).BooleanState(tower.visitHash)==0,"Activation and visit are reported independently");
    }
    static void CheckPageLifetime(){
        var pages=new PageLifetime();var now=DateTime.UtcNow;var a=new object();var b=new object();
        Assert(!pages.ShouldExit(now.AddHours(1),false),"Headless startup without a page stays running");
        pages.Open("a",a);pages.Open("b",b);pages.Close("a",a,now);
        Assert(!pages.ShouldExit(now.AddHours(1),false),"Closing one of multiple tabs keeps app alive");
        pages.Close("b",b,now);Assert(!pages.ShouldExit(now.AddSeconds(4),false),"Last close has reload grace period");
        Assert(pages.ShouldExit(now.AddSeconds(5),false),"Last close exits after grace period");
        Assert(!pages.ShouldExit(now.AddHours(1),true),"Tray mode keeps app alive");
        pages.Open("a",a);pages.Open("a",b);pages.Close("a",a,now);
        Assert(pages.Connected("a",b)&&!pages.ShouldExit(now.AddHours(1),false),"Delayed old disconnect cannot remove reconnect");
        pages.Close("a",b,now);pages.Open("reload",a);
        Assert(!pages.ShouldExit(now.AddHours(1),false),"Reload cancels scheduled exit");
        pages.Close("unknown",null,now);Assert(pages.Connected("reload",a),"Unknown close cannot close another document");
        pages.Close("reload",null,now);Assert(pages.ShouldExit(now.AddSeconds(5),false),"Pagehide beacon closes its document");
    }
    static void CheckProgressCounts(){
        var catalog=new Catalog();
        catalog.categories.Add(new Category{id="shrines",count=3});
        catalog.categories.Add(new Category{id="towers",count=2});
        catalog.categories.Add(new Category{id="empty",count=0});
        // Interleave categories: the summary must use each point's catalog index.
        foreach(string category in new[]{"shrines","towers","shrines","towers","shrines"})
            catalog.points.Add(new MapPoint{category=category});
        var counts=catalog.CountProgress(new[]{1,0,-1,1,0});
        Assert(counts.Length==3&&counts[0].id=="shrines"&&counts[1].id=="towers"&&counts[2].id=="empty","Summary preserves category order, including empty categories");
        Assert(counts[0].total==3&&counts[0].found==1&&counts[0].unknown==1,"Shrine counts distinguish missing, complete and unknown");
        Assert(counts[1].total==2&&counts[1].found==1&&counts[1].unknown==0,"Tower counts use their own point indices");
        Assert(counts[2].total==0&&counts[2].found==0&&counts[2].unknown==0,"Empty category has zero counts");
        var next=catalog.CountProgress(new[]{0,-1,0,-1,1});
        Assert(next[0].found==1&&next[0].unknown==0&&next[1].found==0&&next[1].unknown==2,"Successive summaries do not retain previous counts");
        Assert(counts[0].unknown==1&&counts[1].found==1,"Previous summaries remain unchanged");
        Assert(new Catalog().CountProgress(new int[0]).Length==0,"Empty catalog produces an empty summary");
    }
    static byte[] Fixture(int length, uint version, uint metadata) {
        byte[] bytes = new byte[length];
        Put(bytes, 0, 0x01020304); Put(bytes, 4, version); Put(bytes, 8, metadata);
        Put(bytes, 40, 123); Put(bytes, 44, 0);
        Put(bytes, 48, 0xe573f564); Put(bytes, 52, 999);
        Put(bytes, 56, 0xa3db7114); Put(bytes, 60, 64);
        Array.Copy(BitConverter.GetBytes(18446744073709551001UL), 0, bytes, 64, 8);
        return bytes;
    }
    static int State(byte[] bytes, string category, string hash, string guid) {
        string raw;
        return new SaveReader(bytes).State(new MapPoint { category=category,hash=hash,guid=guid }, out raw);
    }
    static void CheckInventory(int length, uint header, uint metadata) {
        var data = Fixture(length, header, metadata);
        int table = 40, cursor = 2048;
        Action<string, uint> scalar = (key, value) => { Put(data, table, InventoryReader.Hash(key)); Put(data, table + 4, value); table += 8; };
        Action<string, string[]> strings = (key, values) => {
            scalar(key, (uint)cursor); Put(data, cursor, (uint)values.Length); cursor += 4;
            foreach (var value in values) { var text = System.Text.Encoding.ASCII.GetBytes(value); Array.Copy(text, 0, data, cursor, text.Length); cursor += 64; }
        };
        Action<string, uint[]> numbers = (key, values) => {
            scalar(key, (uint)cursor); Put(data, cursor, (uint)values.Length); cursor += 4;
            foreach (uint value in values) { Put(data, cursor, value); cursor += 4; }
        };
        Assert(InventoryReader.Hash("PlayerStatus.MaxLife") == 0xfbe01da1, "Inventory hashes match independent known key");
        Assert(InventoryReader.Hash("PlayerStatus.MaxStamina") == 0xf9212c74, "Stamina hash matches known key");
        scalar("PlayerStatus.Life", 17); scalar("PlayerStatus.MaxLife", 40);
        scalar("PlayerStatus.MaxStamina", 1157234688); scalar("PlayerStatus.CurrentRupee", 0);
        scalar("PlayerStatus.MaxEnergy", BitConverter.ToUInt32(BitConverter.GetBytes(6000f), 0));
        int weaponEntry = table + 4;
        strings("Pouch.Weapon.Content.Name", new[]{"Weapon_Sword_001", "", "Weapon_Sword_002"});
        numbers("Pouch.Weapon.Content.Life", new uint[]{0, 10, 23});
        numbers("Pouch.Weapon.ValidNum", new uint[]{3}); numbers("Pouch.Weapon.EquipIndex", new uint[]{2});
        strings("Pouch.Weapon.Content.Combined.Name", new[]{"Item_Fruit_A", "", ""});
        strings("Pouch.KeyItem.Content.Name", new[]{"Parasail"}); numbers("Pouch.KeyItem.Content.StockNum", new uint[]{UInt32.MaxValue});
        strings("Pouch.Food.Content.Name", new[]{"Item_Cook_A_01"});
        numbers("Pouch.Food.Content.LifeRecover", new uint[]{12});
        strings("Pouch.Food.Content.MaterialName", new[]{"Item_Fruit_A", "Item_Fruit_A", "", "", ""});
        strings("Pouch.Material.Content.Name", new string[0]);
        Put(data,table,0xa3db7114); Put(data,table+4,1024);
        var inv=InventoryReader.Read(new SaveReader(data));
        Assert(inv.life==17&&inv.maxLife==40&&inv.stamina==2000&&inv.energy==6000&&inv.rupees==0&&inv.ponyPoints==null,"Stats preserve float units, zero and missing values");
        Assert(inv.groups.Length==9&&inv.groups[0].available&&inv.groups[0].capacity==3,"Nine inventory pouches with unlocked capacity");
        Assert(inv.groups[0].items.Count==2&&inv.groups[0].items[1].slot==2,"Empty slot does not hide later items");
        Assert((int)inv.groups[0].items[0].details["durability"]==0&&inv.groups[0].items[0].equipped==false&&inv.groups[0].items[1].equipped==true,"Durability zero and equipped slot preserved");
        Assert((string)inv.groups[0].items[0].details["fuseId"]=="Item_Fruit_A","Fuse identity preserved");
        Assert(inv.groups[1].available==false&&inv.groups[5].available&&inv.groups[5].items.Count==0,"Missing pouch differs from empty pouch");
        Assert((int)inv.groups[8].items[0].details["quantity"]==-1,"Unique key item sentinel remains signed");
        Assert(((string[])inv.groups[6].items[0].details["recipe"])[1]=="Item_Fruit_A","Recipe partition retains repeated ingredients");
        Put(data,weaponEntry,(uint)(data.Length-4)); Put(data,data.Length-4,UInt32.MaxValue);
        Assert(!InventoryReader.Read(new SaveReader(data)).groups[0].available,"Corrupt oversized array is unavailable without losing other pouches");
        Put(data,weaponEntry,44);Assert(!InventoryReader.Read(new SaveReader(data)).groups[0].available,"Inventory pointers cannot target hash table");
    }
    static void CheckQuests(int length, uint header, uint metadata) {
        var data = Fixture(length, header, metadata);
        var definitions = new[] { new QuestDefinition { id = "test", hash = 123,
            steps = new[] { "NotReady", "Ready", "GoToLightSpotOfPurahPad", "Complete" } },
            new QuestDefinition { id = "missing", hash = 124, steps = new[] { "Complete" } } };
        foreach (var step in definitions[0].steps) {
            Put(data, 44, InventoryReader.Hash(step));
            var quests = QuestReader.Read(new SaveReader(data), definitions);
            Assert(quests[0].state == (step == "NotReady" ? "todo" : step == "Complete" ? "done" : "active"), "Quest enum " + step);
            Assert(quests[0].step == step && quests[0].raw == InventoryReader.Hash(step), "Quest retains raw enum");
            Assert(quests[1].state == "unknown" && quests[1].raw == null, "Missing quest is unknown");
        }
        Put(data, 44, 0);
        Assert(QuestReader.Read(new SaveReader(data), definitions)[0].state == "unknown", "Unknown quest enum is not treated as incomplete");
        Put(data, 44, 1654019904);
        Assert(QuestReader.Read(new SaveReader(data), definitions)[0].state == "unknown", "Shrine Clear is not quest Complete");
    }
    public static int Main() {
        try {
            Assert(Locale.Resolve("es-UY")=="es", "Spanish Windows locale");
            Assert(Locale.Resolve("en-GB")=="en", "English Windows locale");
            Assert(Locale.Resolve("fr-FR")=="en", "Unsupported Windows locale falls back to English");
            string previousLanguage=Locale.Language;
            Locale.Configure(new string[0],"es");Assert(Locale.Language=="es","Explicit Spanish preference");
            Locale.Configure(new string[0],"en");Assert(Locale.Language=="en","Explicit English preference");
            Locale.Configure(new string[0],"auto");Assert(Locale.Language==Locale.Resolve(Locale.WindowsCulture),"Automatic Windows preference");
            Locale.Configure(new[]{"--language","es"},"en");Assert(Locale.Language=="es","Command line overrides saved preference");
            Locale.Configure(new string[0],"invalid");Assert(Locale.Language==Locale.Resolve(Locale.WindowsCulture),"Invalid preference falls back to Windows");
            Assert(Locale.Preference(null)=="auto","Older settings without language use automatic mode");
            Assert(new Settings().mapQuality=="high","HD is the default map quality");
            Settings legacy=new Settings{mapQuality="standard"};
            Assert(legacy.Upgrade()&&legacy.version==2&&legacy.mapQuality=="high","Legacy settings upgrade to HD once");
            Assert(!legacy.Upgrade()&&legacy.mapQuality=="high","The settings upgrade runs only once");
            Settings chosen=new Settings{version=2,mapQuality="standard"};
            Assert(!chosen.Upgrade()&&chosen.mapQuality=="standard","An explicit SD choice survives the upgrade");
            Locale.Language="en";Assert(Locale.T("Salir","Exit")=="Exit", "English native strings");
            Locale.Language="es";Assert(Locale.T("Salir","Exit")=="Salir", "Spanish native strings");
            Locale.Language=previousLanguage;
            CheckPosition(2307552,0x46c3c8,0x3c050);
            CheckPosition(2307656,0x47e0f4,0x3c088);
            CheckPosition(2307856,0x49e946,0x3c138);
            CheckUpdates();
            CheckHDMap();
            CheckPageLifetime();
            CheckProgressCounts();
            CheckQuests(2307552,0x46c3c8,0x3c050);
            CheckQuests(2307656,0x47e0f4,0x3c088);
            CheckQuests(2307856,0x49e946,0x3c138);
            CheckInventory(2307552,0x46c3c8,0x3c050);
            CheckInventory(2307656,0x47e0f4,0x3c088);
            CheckInventory(2307856,0x49e946,0x3c138);
            CheckContext(2307552,0x46c3c8,0x3c050);
            CheckContext(2307656,0x47e0f4,0x3c088);
            CheckContext(2307856,0x49e946,0x3c138);
            byte[] data = Fixture(2307856, 0x49e946, 0x3c138);
            Assert(new SaveReader(data).playtime == 999, "Read Playtime");
            Put(data, 44, 1);
            Assert(State(data,"shrines","123",null)==0, "Shrine enum 1 is not Clear");
            Assert(State(data,"carry_koroks","123",null)==0, "Carry enum 1 is not Clear");
            Assert(State(data,"lightroots","123",null)==0, "Root enum 1 is not Open");
            Put(data, 44, 1654019904);
            Assert(State(data,"shrines","123",null)==1, "Shrine Clear");
            Assert(State(data,"carry_koroks","123",null)==1, "Carry Clear");
            Put(data, 44, 404286466);
            Assert(State(data,"lightroots","123",null)==1, "Root Open");
            Put(data, 44, 2);
            Assert(State(data,"wells","123",null)==1, "Boolean nonzero, not only 1");
            Put(data, 44, 0);
            Assert(State(data,"wells","123",null)==0, "Boolean zero");
            Assert(State(data,"wells","124",null)==-1, "Missing hash unknown");
            Assert(State(data,"sages_wills",null,"18446744073709551001")==1, "UInt64 GUID above 2^53");
            Assert(State(data,"sages_wills",null,"18446744073709551000")==0, "Adjacent GUID remains distinct");
            Assert(new SaveReader(Fixture(2307552,0x46c3c8,0x3c050)).format=="1.0", "Original 1.0 header");
            Assert(new SaveReader(Fixture(2307656,0x47e0f4,0x3c088)).format=="1.1 / 1.2", "Original 1.1 header");
            bool rejected=false;try {new SaveReader(new byte[30]);}catch(InvalidDataException){rejected=true;}
            Assert(rejected,"Reject truncated input");
            rejected=false;try {new SaveReader(null);}catch(InvalidDataException){rejected=true;}
            Assert(rejected,"Reject null input with a validation error");
            Put(data,60,1);rejected=false;try {new SaveReader(data);}catch(InvalidDataException){rejected=true;}
            Assert(rejected,"Reject invalid GUID offset");
            Console.WriteLine(passed+" reader checks passed.");return 0;
        } catch(Exception ex) {Console.Error.WriteLine(ex.Message);return 1;}
    }
}
