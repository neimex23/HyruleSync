# HyruleSync

[![Descargas](https://img.shields.io/github/downloads/neimex23/HyruleSync/total?label=descargas)](https://github.com/neimex23/HyruleSync/releases)

Mapa local para consultar el progreso de **The Legend of Zelda: Tears of the Kingdom / TOTK Recomp**, con seguimiento automático de guardados en Windows.

## Para jugar

1. Descarga el ZIP para Windows desde la [última versión publicada](https://github.com/neimex23/HyruleSync/releases/latest). Extrae el ZIP en una carpeta con permiso de escritura.
2. Abre **HyruleSync.exe**. No necesitas instalar Python, Node ni TotK Unexplored.
3. En el primer inicio pulsa **Descargar recursos del mapa**. Es una descarga de unos 44 MB desde un commit fijo de TotK Unexplored. Se comprueban los archivos con SHA-256 y se guardan en `.data/`.
4. Pulsa **Seguir carpeta → Explorar carpetas** y elige la carpeta de **una cuenta**, la que contiene `slot_00`, `slot_01`, etc. También puedes pegar una ruta.
5. Déjalo abierto mientras juegas. **Seguir carpeta es la opción recomendada**: activa Autosync y detecta autoguardados y guardados manuales. El mapa se actualiza después de cada guardado estable, normalmente en unos 2–3 segundos. **Cargar .sav** abre una instantánea y pausa Autosync.

Al cerrar la última pestaña del mapa, HyruleSync se cierra tras un margen de cinco segundos. Recargar la página o dejar otra pestaña abierta mantiene el programa activo. Para seguir leyendo guardados sin la página, activa **Acerca de → Mantener HyruleSync en la bandeja**. En ese modo, el doble clic en el icono vuelve al mapa y **Salir** cierra el programa. No se inicia con Windows ni instala servicios.

**Solo lectura:** no instala mods ni escribe en los archivos del juego o tus guardados. No envía tu partida a ningún servidor. Una vez preparados los recursos, la consulta funciona sin internet.

El contador suma las descargas de archivos de GitHub Releases de todas las versiones, incluidos los ZIP descargados desde el botón de actualización del programa y los archivos de comprobación SHA-256. Buscar actualizaciones no suma una descarga. Cuenta descargas, no usuarios únicos.

## Funciones

- Superficie, subsuelo y cielo; filtros por categoría y por estado.
- Última posición guardada de Link, botón para centrarlo y seguimiento opcional que recuerda la elección y cambia de capa al actualizar.
- Aviso de nuevas versiones con descarga del ZIP y botón «Reportar problema» que abre GitHub Issues.
- Catálogo de 2.414 entradas; rutas de kologs y conexiones de cuevas.
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
| `src/` | Aplicación Windows, lector de guardados, catálogo, modelos, servidor HTTP local y recursos |
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

La acción **Build Windows** compila, prueba y adjunta un paquete a cada ejecución. **Publish Windows release** publica automáticamente la Release, ZIP y SHA-256 al subir un tag estable `vX.Y.Z`: primero sube el commit y luego ejecuta `git tag v0.4.0` y `git push origin v0.4.0`. Usa un tag nuevo para cada versión y deja que el workflow cree la Release. La versión del tag se incorpora en ambos ejecutables, créditos y nombre del ZIP; no necesitas editarla a mano para publicar. Para reproducirlo localmente: `scripts/build.ps1 -Version v0.4.0`.

La interfaz busca la última Release estable al abrirse y una vez por hora; también puedes usar «Acerca de → Buscar actualizaciones». Solo ofrece versiones numéricamente mayores con el paquete Windows esperado. Descarga el ZIP, cierra HyruleSync y reemplaza los ejecutables conservando `.data/` y `.state/`. La consulta no envía guardados ni rutas locales y sus errores no interrumpen Autosync.

Este directorio queda preparado para Git; no se crea un repositorio remoto ni se publica contenido automáticamente.

## Independencia y créditos

HyruleSync tiene implementación Windows, interfaz, icono y ciclo de distribución propios. No requiere el `.nro`, instalar Unexplored ni tener su repositorio clonado. **El catálogo y los recursos visuales actuales siguen procediendo de TotK Unexplored.** Se obtienen por separado y mantienen sus créditos. Esto permite sustituir el proveedor de datos en el futuro, pero no convierte esos recursos en creaciones propias.

Consulta [THIRD_PARTY.md](THIRD_PARTY.es.md) antes de redistribuir recursos de terceros. El código nuevo de HyruleSync se distribuye bajo MIT; esa licencia no se aplica a los mapas, datos o iconos de terceros. Proyecto no oficial, sin relación con Nintendo.

## Actualización 0.3.0

Autoría: **Neimex23**. Proyecto fuertemente impulsado por IA, desarrollado con asistencia de **Codex · GPT-6.1 · razonamiento Alto**.

Puedes elegir **Idioma → Español / English / Automático (Windows)** desde la barra lateral o la pantalla inicial. La elección se guarda en `.state/settings.json` y la página se recarga para aplicarla a la interfaz, categorías y menú del icono. En automático se usa español si Windows está en español; inglés en los demás casos. Incorpora una sección «Acerca de, licencias y créditos». **HyruleSync.Stop.exe** cierra las instancias de HyruleSync de tu sesión sin tocar el juego ni el navegador.

Ahora basta ejecutar `build.cmd`: compila ambos ejecutables y genera automáticamente el ZIP y SHA-256 en `outputs/`. No es necesario ejecutar `package.ps1` después. Las instrucciones de compilación anteriores equivalen a pasos separados, pero el empaquetado ya está integrado.

Las referencias relativas de esta traducción se consultan desde la raíz del repositorio. La documentación principal actualizada está en [README.md](../README.md).

## Mapa y consulta de guardados

Link se muestra según el contexto del último guardado: dentro de un santuario aparece en su entrada con un aro azul y un símbolo de santuario. Un contexto desconocido no se proyecta sobre Hyrule. Por defecto, Link se muestra debajo de los iconos con una opacidad del 45 %. «Centrar en Link» acerca la vista si hace falta, conservando un zoom más cercano. Puedes ocultar Link y elegir si queda encima o debajo de los iconos. Ocultarlo suspende el centrado automático y conserva la preferencia de seguimiento. Estas opciones se recuerdan al reiniciar. El recuadro **Link en el mapa** reúne visibilidad, seguimiento, orden y opacidad (0–100 %, con vista previa al mover el control).

El catálogo incluye 15 atalayas adicionales: el completado exige activación, y el detalle distingue si fueron visitadas. Son 21 categorías y 2.414 puntos; el contador sigue sin representar el porcentaje oficial del juego.

«Guardados» permite consultar los slots de la carpeta actual o un archivo elegido manualmente. Muestra fecha de modificación, tiempo jugado, formato, ubicación y progreso por categoría. «Ver en el mapa» abre una instantánea fija; Autosync sigue leyendo la carpeta en segundo plano. Usa «Volver al seguimiento» para mostrar el último guardado observado. No hay comparación, backups, restauración ni edición de saves. Las consultas no cambian el origen observado.

«Ver cambios», en el aviso de actualización y en «Acerca de», muestra las notas de la última Release estable disponible, con enlace a GitHub. Requiere una consulta de actualizaciones exitosa durante la sesión; si faltan notas se indica expresamente.
