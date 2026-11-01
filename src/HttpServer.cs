using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

// Loopback HTTP transport, request validation and public assets.
public static partial class Program {
    sealed class HttpRequest {
        public string Method, Path;
        public Uri Uri;
        public string[] Headers;
        public byte[] Body = new byte[0];

        public string Header(string name) {
            string prefix = name + ":";
            string line = Headers.FirstOrDefault(h => h.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));
            return line == null ? null : line.Substring(prefix.Length).Trim();
        }
    }

    sealed class HttpResponse {
        public readonly int StatusCode;
        public readonly string ContentType;
        public readonly byte[] Body;

        public HttpResponse(byte[] body, string contentType, int statusCode = 200) {
            Body = body;
            ContentType = contentType;
            StatusCode = statusCode;
        }
    }

    static readonly HashSet<string> LegalFiles = new HashSet<string> {
        "legal/app.txt", "legal/leaflet.txt", "legal/savegame-editors.txt",
        "legal/third-party.en.md", "legal/third-party.es.md"
    };
    static readonly Dictionary<string, string> WebFiles = new Dictionary<string, string> {
        { "", "index.html" }, { "index.html", "index.html" },
        { "app.js", "app.js" }, { "i18n.js", "i18n.js" }, { "style.css", "style.css" },
        { "vendor/leaflet.js", "vendor/leaflet.js" }, { "vendor/leaflet.css", "vendor/leaflet.css" },
        { "app-icon.png", "app-icon.png" }, { "tower.svg", "tower.svg" }
    };

    static HttpResponse TextResponse(string text, int statusCode) {
        return new HttpResponse(Encoding.UTF8.GetBytes(text), "text/plain; charset=utf-8", statusCode);
    }

    static HttpResponse JsonResponse(object value, int statusCode = 200) {
        return new HttpResponse(Encoding.UTF8.GetBytes(Serialize(value)), "application/json; charset=utf-8", statusCode);
    }

    static string ContentType(string path) {
        switch (Path.GetExtension(path)) {
            case ".png": return "image/png";
            case ".svg": return "image/svg+xml";
            case ".js": return "application/javascript; charset=utf-8";
            case ".css": return "text/css; charset=utf-8";
            case ".html": return "text/html; charset=utf-8";
            default: return "text/plain; charset=utf-8";
        }
    }

    static HttpResponse Asset(string path) {
        if (LegalFiles.Contains(path))
            return new HttpResponse(MapResources.Embedded(path), ContentType(path));

        string relative;
        if (WebFiles.TryGetValue(path, out relative))
            return new HttpResponse(MapResources.Embedded("web/" + relative), ContentType(relative));

        if (MapResources.Ready && MapResources.Manifest.files.Any(f => f.path == path) && path.EndsWith(".png"))
            return new HttpResponse(File.ReadAllBytes(Path.Combine(MapResources.Root, path)), "image/png");

        return TextResponse(Locale.T("No encontrado.", "Not found."), 404);
    }

    static HttpRequest ReadRequest(Stream stream) {
        var head = new List<byte>();
        int value;
        while (head.Count < 16384 && (value = stream.ReadByte()) >= 0) {
            head.Add((byte)value);
            int n = head.Count;
            if (n >= 4 && head[n - 4] == 13 && head[n - 3] == 10 && head[n - 2] == 13 && head[n - 1] == 10)
                break;
        }

        string[] lines = Encoding.ASCII.GetString(head.ToArray()).Split(new[] { "\r\n" }, StringSplitOptions.None);
        string[] first = lines[0].Split(' ');
        if (first.Length < 2) return null;

        return new HttpRequest {
            Method = first[0],
            Uri = new Uri("http://127.0.0.1" + first[1]),
            Headers = lines.Skip(1).ToArray()
        };
    }

    static bool Authorized(HttpRequest request) {
        string host = "127.0.0.1:" + ((IPEndPoint)listener.LocalEndpoint).Port;
        string origin = request.Header("Origin");
        return String.Equals(request.Header("Host"), host, StringComparison.OrdinalIgnoreCase)
            && (origin == null || origin == new Uri(url).GetLeftPart(UriPartial.Authority))
            && request.Uri.AbsolutePath.StartsWith("/" + token + "/", StringComparison.Ordinal);
    }

    static byte[] ReadBody(Stream stream, HttpRequest request) {
        int length;
        if (!Int32.TryParse(request.Header("Content-Length"), out length) || length < 0 || length > 4 * 1024 * 1024)
            throw new InvalidDataException(Locale.T("Tamaño de solicitud inválido.", "Invalid request size."));

        var body = new byte[length];
        int read = 0, count;
        while (read < length && (count = stream.Read(body, read, length - read)) > 0) read += count;
        if (read != length) throw new IOException(Locale.T("Carga incompleta.", "Incomplete upload."));
        return body;
    }

    static HttpResponse Dispatch(HttpRequest request) {
        switch (request.Method) {
            case "GET":
                Func<HttpRequest, HttpResponse> handler;
                return GetRoutes.TryGetValue(request.Path, out handler) ? handler(request) : Asset(request.Path);
            case "POST":
                if (request.Header("Origin") != null && request.Path.StartsWith("api/", StringComparison.Ordinal))
                    return DispatchAction(request);
                break;
        }
        return TextResponse(Locale.T("Método no permitido.", "Method not allowed."), 405);
    }

    static string ReasonPhrase(int statusCode) {
        switch (statusCode) {
            case 200: return "OK";
            case 400: return "Bad Request";
            case 403: return "Forbidden";
            case 404: return "Not Found";
            case 405: return "Method Not Allowed";
            default: throw new ArgumentOutOfRangeException("statusCode");
        }
    }

    static void WriteResponse(Stream stream, HttpResponse response) {
        string header = "HTTP/1.1 " + response.StatusCode + " " + ReasonPhrase(response.StatusCode)
            + "\r\nContent-Type: " + response.ContentType
            + "\r\nContent-Length: " + response.Body.Length
            + "\r\nCache-Control: " + (response.ContentType == "image/png" ? "private, max-age=3600" : "no-store")
            + "\r\nX-Content-Type-Options: nosniff"
            + "\r\nReferrer-Policy: no-referrer"
            + "\r\nContent-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'"
            + "\r\nConnection: close\r\n\r\n";
        byte[] bytes = Encoding.ASCII.GetBytes(header);
        stream.Write(bytes, 0, bytes.Length);
        stream.Write(response.Body, 0, response.Body.Length);
    }

    static void Serve(object arg) {
        using (var client = (TcpClient)arg) {
            try {
                client.ReceiveTimeout = 5000;
                client.SendTimeout = 10000;
                using (var stream = client.GetStream()) {
                    var request = ReadRequest(stream);
                    if (request == null) return;
                    if (!Authorized(request)) {
                        WriteResponse(stream, TextResponse(Locale.T("Acceso no autorizado.", "Unauthorized access."), 403));
                        return;
                    }

                    request.Path = request.Uri.AbsolutePath.Substring(token.Length + 2);
                    if (request.Method == "GET" && request.Path == "api/page-session") {
                        string pageId = request.Uri.Query.StartsWith("?id=") ? request.Uri.Query.Substring(4) : "";
                        if (!ValidPageId(pageId)) throw new InvalidDataException("Invalid page session.");
                        ServePageSession(client, stream, pageId);
                        return;
                    }

                    if (request.Method == "POST") request.Body = ReadBody(stream, request);
                    WriteResponse(stream, Dispatch(request));
                }
            } catch {
                // A disconnected client or malformed request must not stop the listener.
            }
        }
    }

    static bool ValidPageId(string id) {
        return id.Length == 32 && id.All(c => (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'));
    }

    static void ServePageSession(TcpClient client, Stream stream, string id) {
        var connection = new object();
        pages.Open(id, connection);
        try {
            byte[] header = Encoding.ASCII.GetBytes("HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n");
            stream.Write(header, 0, header.Length);
            byte[] pulse = Encoding.ASCII.GetBytes(": connected\n\n");
            while (running && pages.Connected(id, connection)) {
                if (client.Client.Poll(0, SelectMode.SelectRead) && client.Client.Available == 0) break;
                stream.Write(pulse, 0, pulse.Length);
                stream.Flush();
                Thread.Sleep(1000);
            }
        } catch (IOException) {
        } catch (SocketException) {
        } finally {
            pages.Close(id, connection, DateTime.UtcNow);
        }
    }

    static void Loop() {
        while (running) {
            try {
                ThreadPool.QueueUserWorkItem(Serve, listener.AcceptTcpClient());
            } catch {
                if (!running) return;
            }
        }
    }
}
