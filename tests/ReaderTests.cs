using System;
using System.IO;

// Fixtures are synthesized here; no user's save files are required or included.
public static class ReaderTests {
    static int passed;
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
        var release=new ReleaseInfo{tag_name="v1.10.0",assets=new[]{asset}};
        Assert(Updates.Evaluate(release,"1.9.0").available,"Compare version numerically");
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
    public static int Main() {
        try {
            Assert(Locale.Resolve("es-UY")=="es", "Spanish Windows locale");
            Assert(Locale.Resolve("en-GB")=="en", "English Windows locale");
            Assert(Locale.Resolve("fr-FR")=="en", "Unsupported Windows locale falls back to English");
            string previousLanguage=Locale.Language;
            Locale.Language="en";Assert(Locale.T("Salir","Exit")=="Exit", "English native strings");
            Locale.Language="es";Assert(Locale.T("Salir","Exit")=="Salir", "Spanish native strings");
            Locale.Language=previousLanguage;
            CheckPosition(2307552,0x46c3c8,0x3c050);
            CheckPosition(2307656,0x47e0f4,0x3c088);
            CheckPosition(2307856,0x49e946,0x3c138);
            CheckUpdates();
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
            Put(data,60,1);rejected=false;try {new SaveReader(data);}catch(InvalidDataException){rejected=true;}
            Assert(rejected,"Reject invalid GUID offset");
            Console.WriteLine(passed+" reader checks passed.");return 0;
        } catch(Exception ex) {Console.Error.WriteLine(ex.Message);return 1;}
    }
}
