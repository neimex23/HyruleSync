# HyruleSync

Mapa local para consultar el progreso de **The Legend of Zelda: Tears of the Kingdom / TOTK Recomp**, con seguimiento automático de guardados en Windows.

## Para jugar

1. Descarga `HyruleSync-v0.3.0-windows.zip` desde **Releases** del repositorio donde se publique. Extrae el ZIP en una carpeta con permiso de escritura.
2. Abre **HyruleSync.exe**. No necesitas instalar Python, Node ni TotK Unexplored.
3. En el primer inicio pulsa **Descargar recursos del mapa**. Es una descarga de unos 44 MB desde un commit fijo de TotK Unexplored. Se comprueban los archivos con SHA-256 y se guardan en `.data/`.
4. Pulsa **Seguir carpeta → Explorar carpetas** y elige la carpeta de **una cuenta**, la que contiene `slot_00`, `slot_01`, etc. También puedes pegar una ruta.
5. Déjalo abierto mientras juegas. **Autosync se activa al elegir la carpeta** y el mapa se actualiza después de cada guardado estable, normalmente en unos 2–3 segundos.

La pestaña muestra el mapa y el icono junto al reloj mantiene el lector funcionando. Puedes cerrar la pestaña y reabrirla con doble clic en ese icono. Usa **Salir** en su menú para cerrar completamente. No se inicia con Windows ni instala servicios.

**Solo lectura:** no instala mods ni escribe en los archivos del juego o tus guardados. No envía tu partida a ningún servidor. Una vez preparados los recursos, la consulta funciona sin internet.

## Funciones

- Superficie, subsuelo y cielo; filtros por categoría y por estado.
- Catálogo de 2.399 entradas; rutas de kologs y conexiones de cuevas.
- Carga manual de `progress.sav`, consulta de coordenadas y diagnóstico por hash/GUID.
- Elección del slot con mayor tiempo de juego, espera para evitar lecturas incompletas y conservación del último estado válido.
- Preferencias de carpeta y Autosync guardadas localmente; una instancia por carpeta de aplicación.
- Icono propio en el ejecutable, navegador y área de notificación.

El contador **no equivale al porcentaje oficial del juego** ni cubre todas sus actividades. Los santuarios exigen `Clear` y las raíces `Open`; otras categorías siguen las condiciones documentadas en [docs/save-format.md](save-format.md). Compatible con los formatos reconocidos 1.0, 1.1/1.2 y 1.4; probado con guardados de TOTK Recomp 1.4.3. No se garantiza compatibilidad con formatos futuros.

## Requisitos

Windows con .NET Framework 4.x y un navegador moderno. Compilación probada en este equipo; el proyecto no afirma haber sido probado en todas las versiones de Windows. La aplicación necesita escribir únicamente en su propia carpeta para guardar `.data/` y `.state/`.

## Compilar

```powershell
.\build.cmd
.\scripts\test.ps1
```

El compilador C# de .NET Framework debe estar disponible en Windows. No hay dependencias de NuGet ni instalaciones de paquetes para compilar. La salida queda en `outputs/HyruleSync/`; el ZIP público se genera en `outputs/`. El código de interfaz y Leaflet quedan embebidos en el EXE; mapas y datos no se incluyen en el paquete público.

Para usar una copia local del repositorio de recursos, evitando la descarga:

```powershell
.\scripts\import-map-resources.ps1 -Source 'D:\ruta\totk-unexplored'
```

Los recursos deben coincidir con el commit fijado en `assets/resources.json`. El script comprueba sus hashes. Para regenerar el icono: `scripts/make-icon.ps1`.

## Organización

| Ruta | Contenido |
|---|---|
| `src/` | Lector de guardados, aplicación Windows y descarga verificada de recursos |
| `web/` | Interfaz local embebida y Leaflet |
| `assets/` | Icono propio y manifiesto de procedencia de recursos |
| `scripts/` | Compilación, pruebas, importación y empaquetado |
| `tests/` | Pruebas del lector y seguimiento |
| `docs/` | Guía de uso y formato de guardados |
| `licenses/` | Licencias de dependencias redistribuidas |
| `outputs/` | Ejecutable y ZIP generados; ignorados por Git |
| `.local/` | Copias anteriores y pruebas locales; ignoradas por Git |

## Subir a Git y compartir

Sube el código de esta raíz, respetando `.gitignore`. No subas `.local/`, `.data/`, `.state/`, partidas ni los mapas descargados. El ZIP generado usa una lista explícita de archivos y excluye esos datos.

La acción de GitHub **Build Windows** compila, ejecuta las pruebas del lector y adjunta un paquete descargable a cada ejecución. Puedes ejecutar la acción manualmente. Para ofrecer una descarga estable al público, crea una Release y adjunta ese ZIP y su archivo `.sha256`. El workflow no publica Releases automáticamente.

Este directorio queda preparado para Git; no se crea un repositorio remoto ni se publica contenido automáticamente.

## Independencia y créditos

HyruleSync tiene implementación Windows, interfaz, icono y ciclo de distribución propios. No requiere el `.nro`, instalar Unexplored ni tener su repositorio clonado. **El catálogo y los recursos visuales actuales siguen procediendo de TotK Unexplored.** Se obtienen por separado y mantienen sus créditos. Esto permite sustituir el proveedor de datos en el futuro, pero no convierte esos recursos en creaciones propias.

Consulta [THIRD_PARTY.md](THIRD_PARTY.es.md) antes de redistribuir recursos de terceros. El código nuevo de HyruleSync se distribuye bajo MIT; esa licencia no se aplica a los mapas, datos o iconos de terceros. Proyecto no oficial, sin relación con Nintendo.

## Actualización 0.3.0

Autoría: **Neimex23**. Proyecto fuertemente impulsado por IA, desarrollado con asistencia de **Codex · GPT-6.1 · razonamiento Alto**.

El programa detecta el idioma de Windows y utiliza español o inglés, incluidos los errores, categorías y menú del icono. Incorpora una sección «Acerca de, licencias y créditos». **HyruleSync.Stop.exe** cierra las instancias de HyruleSync de tu sesión sin tocar el juego ni el navegador.

Ahora basta ejecutar `build.cmd`: compila ambos ejecutables y genera automáticamente el ZIP y SHA-256 en `outputs/`. No es necesario ejecutar `package.ps1` después. Las instrucciones de compilación anteriores equivalen a pasos separados, pero el empaquetado ya está integrado.

Las referencias relativas de esta traducción se consultan desde la raíz del repositorio. La documentación principal actualizada está en [README.md](../README.md).
