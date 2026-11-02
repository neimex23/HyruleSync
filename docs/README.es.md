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

Para compilar necesitas el compilador C# de .NET Framework en Windows y Node.js 22.12 o posterior (CI usa Node 24). `build.cmd` instala las dependencias fijadas en `package-lock.json`, compila React con Vite e incorpora el resultado al EXE. No requiere NuGet ni Python. El usuario final sigue sin necesitar Node. La salida queda en `outputs/HyruleSync/`; el ZIP público se genera en `outputs/`. Los mapas externos se descargan por separado.

Para trabajar en la interfaz: `npm ci` y `npm run check` ejecutan ESLint, las pruebas React y la compilación web. Consulta [Desarrollo web](WEB.es.md) para usar el servidor de desarrollo con recarga automática.

Para usar una copia local del repositorio de recursos, evitando la descarga:

```powershell
.\scripts\import-map-resources.ps1 -Source 'D:\ruta\totk-unexplored'
```

Los recursos deben coincidir con el commit fijado en `assets/resources.json`. El script comprueba sus hashes. Para regenerar el icono: `scripts/make-icon.ps1`.

## Organización

La app abre automáticamente `http://hyrulesync.localhost:<puerto>/<sesión>/`. Los navegadores modernos de Windows resuelven ese nombre localmente, sin configurar DNS ni pedir permisos de administrador. Usa la URL completa que abre el programa; el puerto y la ruta privada de sesión cambian al iniciar. El servidor solo escucha en este equipo.

| Ruta | Contenido |
|---|---|
| `src/` | Aplicación Windows, lector de guardados, catálogo, modelos, servidor HTTP local y recursos |
| `web/src/` | Componentes React, traducciones, adaptador del mapa y módulos JavaScript |
| `web/public/` | Iconos y datos de inventario y misiones |
| `assets/` | Icono propio y manifiesto de procedencia de recursos |
| `scripts/` | Compilación, pruebas, importación y empaquetado |
| `tests/` | Pruebas del lector y seguimiento |
| `docs/` | Guía de uso y formato de guardados |
| `licenses/` | Licencias de dependencias redistribuidas |
| `outputs/` | Ejecutable y ZIP generados; ignorados por Git |
| `.local/` | Copias anteriores y pruebas locales; ignoradas por Git |

## Subir a Git y compartir

Sube el código de esta raíz, respetando `.gitignore`. No subas `.local/`, `.data/`, `.state/`, partidas ni los mapas descargados. El ZIP generado usa una lista explícita de archivos y excluye esos datos.

La única versión de la aplicación se edita en `AssemblyVersion("X.Y.Z.0")`, dentro de `src/AssemblyInfo.cs`; deja el último componente en `0`. Al ejecutar `scripts/build.ps1`, ambos ejecutables, sus detalles de archivo de Windows, los créditos, el comprobador de actualizaciones y el nombre del ZIP toman automáticamente esa versión. El paquete web privado no tiene una versión propia de la aplicación.

La acción **Build Windows** compila, prueba y adjunta un paquete a cada ejecución. **Publish Windows release** publica automáticamente la Release, ZIP y SHA-256 al subir un tag estable `vX.Y.Z` que coincida con `AssemblyVersion`: por ejemplo, después de cambiarla a `0.6.1.0`, sube el commit y ejecuta `git tag v0.6.1` y `git push origin v0.6.1`. Usa un tag nuevo para cada versión y deja que el workflow cree la Release. Si el tag no coincide, la compilación falla sin reemplazar la versión del código. El argumento opcional `scripts/build.ps1 -Version vX.Y.Z` solo comprueba la versión esperada.

La interfaz busca la última Release estable al abrirse y una vez por hora; también puedes usar «Acerca de → Buscar actualizaciones». Solo ofrece versiones numéricamente mayores con el paquete Windows esperado. Descarga el ZIP, cierra HyruleSync y reemplaza solo `HyruleSync.exe` y `HyruleSync.Stop.exe`, conservando las carpetas `.data/` y `.state/` (contienen tus mapas descargados y preferencias; no las borres ni las sobrescribas). La consulta no envía guardados ni rutas locales y sus errores no interrumpen Autosync.

Este directorio queda preparado para Git; no se crea un repositorio remoto ni se publica contenido automáticamente.

## Independencia y créditos

HyruleSync tiene implementación Windows, interfaz, icono y ciclo de distribución propios. No requiere el `.nro`, instalar Unexplored ni tener su repositorio clonado. **El catálogo y los recursos visuales actuales siguen procediendo de TotK Unexplored.** Se obtienen por separado y mantienen sus créditos. Esto permite sustituir el proveedor de datos en el futuro, pero no convierte esos recursos en creaciones propias.

Consulta [THIRD_PARTY.md](THIRD_PARTY.es.md) antes de redistribuir recursos de terceros. El código nuevo de HyruleSync se distribuye bajo MIT; esa licencia no se aplica a los mapas, datos o iconos de terceros. Proyecto no oficial, sin relación con Nintendo.

## Actualización 0.3.0

Autoría: **Neimex23**. Proyecto fuertemente impulsado por IA, desarrollado con asistencia de **Codex · GPT-6.1 · razonamiento Alto**.

Puedes elegir **Idioma → Español / English / Automático (Windows)** desde la barra lateral o la pantalla inicial. La elección se guarda en `.state/settings.json` y la página se recarga para aplicarla a la interfaz, categorías y menú del icono. En automático se usa español si Windows está en español; inglés en los demás casos. Incorpora una sección «Acerca de, licencias y créditos». **HyruleSync.Stop.exe** cierra las instancias de HyruleSync de tu sesión sin tocar el juego ni el navegador.

Ahora basta ejecutar `build.cmd`: reemplaza los archivos del programa en `outputs/HyruleSync/` aunque cambie la versión o siga siendo la misma, conservando `.data/`, `.state/`, partidas y otros archivos personales. Ambos ejecutables se compilan antes de reemplazar los instalados. Tras generar correctamente el paquete, en `outputs/` quedan solo el ZIP y SHA-256 actuales. Cierra las copias abiertas desde esa carpeta antes de recompilar. No es necesario ejecutar `package.ps1` después; el empaquetado ya está integrado.

Las referencias relativas de esta traducción se consultan desde la raíz del repositorio. La documentación principal actualizada está en [README.md](../README.md).

## Mapa y consulta de guardados

Link se muestra según el contexto del último guardado: dentro de un santuario aparece en su entrada con un aro azul y un símbolo de santuario. Un contexto desconocido no se proyecta sobre Hyrule. Por defecto, Link se muestra debajo de los iconos con una opacidad del 45 %. «Centrar en Link» acerca la vista si hace falta, conservando un zoom más cercano. Puedes ocultar Link y elegir si queda encima o debajo de los iconos. Ocultarlo suspende el centrado automático y conserva la preferencia de seguimiento. Estas opciones se recuerdan al reiniciar. El recuadro **Link en el mapa** reúne visibilidad, seguimiento, orden y opacidad (0–100 %, con vista previa al mover el control).

El catálogo incluye 15 atalayas adicionales: el completado exige activación, y el detalle distingue si fueron visitadas. Son 21 categorías y 2.414 puntos; el contador sigue sin representar el porcentaje oficial del juego.

«Guardados» permite consultar los slots de la carpeta actual o un archivo elegido manualmente. Muestra fecha de modificación, tiempo jugado, formato, ubicación y progreso por categoría. «Ver en el mapa» abre una instantánea fija; Autosync sigue leyendo la carpeta en segundo plano. Usa «Volver al seguimiento» para mostrar el último guardado observado. No hay comparación, backups, restauración ni edición de saves. Las consultas no cambian el origen observado.

«Ver cambios», en el aviso de actualización y en «Acerca de», muestra las notas de la última Release estable disponible, con enlace a GitHub. Requiere una consulta de actualizaciones exitosa durante la sesión; si faltan notas se indica expresamente.


## Guías externas

Cada punto tiene un botón **Ver guía** que abre Zelda Dungeon en otra pestaña. Los lugares con nombre abren su ficha; los coleccionables sin nombre y las demás categorías abren el mapa externo en sus coordenadas y capa, donde puedes seleccionar el icono correspondiente para consultar la ayuda. Las páginas externas pueden cambiar o tener información incompleta. No se guarda una colección de referencias ni contenido de guías descargado.


## Inventario

Abre **Inventario**, junto a Mapa, para consultar vida guardada, corazones/stamina/batería máximos, rupias y puntos del establo. Las nueve bolsas permiten buscar equipo, armaduras, flechas, materiales, comida, dispositivos zonnan y objetos importantes. Incluyen cantidades, capacidad disponible y detalles: durabilidad, fusiones, bonificaciones, tintes, efectos e ingredientes. Los nombres siguen el idioma elegido y se conserva el ID original. Los datos ausentes aparecen como no disponibles. Inventario usa el mismo guardado en vivo o consultado que el mapa. La partida sigue siendo de solo lectura.


## Misiones

La pestaña **Misiones** incluye las 253 entradas del diario: hechas, en curso, por hacer y sin verificar. Usa el mismo guardado en seguimiento o consulta temporal que Mapa e Inventario. Permite buscar por nombre, personaje o lugar y filtrar por tipo/estado. **Ver en el mapa** elige la capa y resalta el marcador. La categoría **Misiones** de los filtros laterales permite mostrarlos u ocultarlos; los filtros de Misiones también se aplican a sus marcadores, independientemente de los filtros de coleccionables. Los marcadores compartidos se separan visualmente para poder elegir cada uno. Indican una zona de referencia o el santuario asociado, no la posición exacta del personaje ni el objetivo actual; cinco misiones no tienen ubicación fija. Los nombres y lugares se muestran en inglés. No hay marcado manual ni edición del guardado.

La categoría **Misiones** de los filtros laterales, con su propio icono y desactivada por defecto, muestra u oculta todos los marcadores. Cada misión también tiene su casilla **Mostrar en el mapa**: ocultarla conserva la misión en la lista y su preferencia al activar o desactivar la categoría. **Ver en el mapa** vuelve a mostrar esa misión.

Cada misión y marcador incluye **Ver guía · Zelda Dungeon**, con la ficha correspondiente en otra pestaña. **Verificar contra el guardado** permite consultar ID, campo Step, etapa, enum leído y revisión del save. El estado siempre procede del guardado; las casillas de visibilidad solo afectan al mapa. Prueba opcional del seguimiento: `node tests/quest-autosync.cjs <save-de-entrada-solo-lectura> <directorio-app>`; modifica únicamente copias privadas de prueba.


## Mapas de alta resolución

**HD** es la calidad por defecto: el control **Mapa: HD** de los controles superiores izquierdos del mapa muestra el detalle opcional de ZeldaMods en superficie, cielo y subsuelo. Los mosaicos se descargan al explorar y se guardan en `.data/hd-map/zeldamods-v1/` (hasta 512 MB). La elección se recuerda entre reinicios. Las zonas descargadas funcionan sin conexión; donde falte detalle HD se muestra el fondo estándar. **Reintentar HD** vuelve a intentar las zonas no disponibles. El modo **SD** no solicita mosaicos HD y conserva los mapas originales sin conexión. No hay descarga anticipada del mapa completo. Usa **Descargar mapa HD completo** en la barra lateral para bajar todos los mosaicos (≈80–120 MB) y tener el mapa entero sin conexión.

Las imágenes HD son externas y no se incluyen en el ZIP. Las solicitudes pasan por la aplicación local hacia ZeldaMods y contienen solo capa/zoom/coordenadas del mosaico, sin partidas ni rutas locales. Consulta los avisos de terceros para conocer su procedencia.

El servidor actual de ZeldaMods exige TLS 1.3 para descargar. Se necesita Windows 11 o posterior con una instalación compatible de .NET Framework; en Windows anteriores se conserva el mapa estándar y se pueden usar mosaicos HD ya guardados. Consulta el [soporte TLS de Microsoft](https://learn.microsoft.com/en-us/dotnet/framework/network-programming/tls).
