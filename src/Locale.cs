using System;
using System.Globalization;
using System.Runtime.InteropServices;

public static class Locale {
    [DllImport("kernel32.dll")]
    static extern ushort GetUserDefaultUILanguage();
    public static string WindowsCulture = DetectWindowsCulture();
    public static string Language = Resolve(WindowsCulture);
    public static string Resolve(string culture) {
        return (culture ?? "").StartsWith("es", StringComparison.OrdinalIgnoreCase) ? "es" : "en";
    }
    static string DetectWindowsCulture() {
        try { return CultureInfo.GetCultureInfo(GetUserDefaultUILanguage()).Name; }
        catch { return CultureInfo.CurrentUICulture.Name; }
    }
    public static void Configure(string[] args) {
        Language = Resolve(WindowsCulture);
        for (int i=0;i<args.Length-1;i++)
            if(args[i]=="--language") {
                string choice=args[++i].ToLowerInvariant();
                if(choice!="en"&&choice!="es")throw new ArgumentException("--language must be en or es.");
                Language=choice;
            }
    }
    public static string T(string spanish, string english) { return Language=="es"?spanish:english; }
}
