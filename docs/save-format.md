# Correspondencia con TotK Unexplored

Esta versión conserva datos y reglas del repositorio proporcionado y sustituye la interfaz Switch/libnx/OpenGL por un ejecutable Windows con interfaz local Leaflet. No ejecuta ni convierte el binario `.nro`.

| Original | Adaptación |
|---|---|
| `romfs/map_data.json` | Copia byte por byte; 20 arrays, 2.399 entradas |
| `SavefileIO.cpp`: fin de tabla | Buscar `0xa3db7114` desde offset 40; su valor apunta a la lista GUID |
| `SavefileIO.cpp`: santuarios y kologs viajeros | Valor `1654019904` (`Clear`) |
| `SavefileIO.cpp`: raíces | Valor `404286466` (`Open`) |
| Resto de objetos con hash | Valor distinto de cero |
| Voluntades de sabios y carteles | GUID UInt64 presente; se compara en C#, sin redondeo JavaScript |
| Selección de slot | Mayor `Playtime`, hash `0xe573f564`; fecha como desempate |
| Posición de Link | `PlayerStatus.SavePos`, hash `0xc884818d`: su valor es un puntero a tres float32 little-endian x, y, z |
| `MapObject.cpp`: capas | Subsuelo y ≤ −50; superficie −50 ≤ y ≤ 750; cielo y ≥ 750 |
| `ObjectInfo.cpp`: coordenadas | x, −z, y−105, truncadas y rellenadas a cuatro dígitos |
| `Map.cpp`: fondos | PNG originales 4500×4500; escala 0,375; límites del mapa ±6000 |
| Rutas | Puntos de flores o inicio/final; conexiones de cuevas pendientes con dos entradas del mismo nombre |

Los estados ausentes se muestran como «sin verificar» en lugar de atribuir un completado. La apertura de archivos permite compartir lectura con el juego y aplica espera de estabilidad antes de leer. Una carga inválida conserva el último resultado válido.

La lectura de `PlayerStatus.SavePos` y la conversión de coordenadas se contrastaron con el [editor de Marc Robledo](https://github.com/marcrobledo/savegame-editors/blob/master/zelda-totk/zelda-totk.js). No se copia código del editor. Un hash ausente, puntero fuera del área de datos o vector con NaN/infinito produce posición no disponible sin impedir consultar el progreso. El marcador usa las mismas coordenadas y capas que el catálogo. No lee la memoria del juego: representa la posición de la última instantánea válida seleccionada.

No se han portado el QR para Switch, los controles de mando, el acceso libnx a perfiles ni el marcado manual de completados. La consulta manual de archivos y Autosync sustituyen al acceso y sistema de respaldos de Switch. No hay edición de partidas.

La verificación independiente compara todos los objetos con las condiciones del C++ en siete guardados (16.793 comparaciones). Los casos adicionales cubren enums, booleanos distintos de 1, GUID mayores que 2^53, hashes de cueva compartidos, archivos incompletos, cambio de slot, pausa y reanudación. Coincidir con el original no garantiza que su catálogo cubra todo el juego ni que todas sus condiciones equivalgan a la palabra «descubierto».

## Contexto, atalayas y consulta de slots

`Sequence_CurrentBanc` (hash `0x1d6189da`) apunta a una String64 terminada en NUL. Solo se aceptan punteros dentro del área de datos y texto ASCII válido. `MainField` utiliza `PlayerStatus.SavePos`; un identificador que coincida exactamente con `internal_name` de un santuario utiliza su entrada del catálogo. La posición original se conserva en `playerPosition`, mientras `playerContext` incluye contexto, mapa, santuario y `mapPosition`. Un contexto ausente, inválido o desconocido no ofrece posición de mapa. No se estiman interiores por distancia o altura.

Las 15 atalayas de `assets/towers.json` se agregan al final del catálogo sin modificar los 2.399 registros originales ni sus índices. `IsActivateCannon.TowerXX` determina completado (booleano distinto de cero); `IsVisitLocation.TowerXX` se consulta por separado. Hash ausente significa sin verificar. Los datos proceden de los archivos de coordenadas y completismo de Savegame Editors de Marc Robledo; licencia y procedencia en los avisos de terceros.

`GET api/saves` devuelve los slots observados, su estado/error y el último resumen válido. `POST api/inspect-file` recibe una ruta UTF-8 y verifica que tamaño y fecha no cambien durante la lectura. `POST api/inspect-upload` recibe el binario. Ambas respuestas incluyen `snapshot` y `summary` y no modifican configuración, caché ni origen. La vista temporal se conserva en memoria del navegador mientras el polling actualiza `liveSnapshot`. No se escribe en los archivos de partida.
