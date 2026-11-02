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

## Inventario

Cada instantánea incluye `inventory`, tanto en el seguimiento como en la consulta de archivos. Se leen nueve bolsas: armas, arcos, escudos, armaduras, flechas, materiales, comida, dispositivos zonnan y objetos importantes. Los hashes de las variables se calculan con MurmurHash3 x86_32 (semilla 0). `Pouch.<tipo>.Content.Name` apunta a un array con longitud UInt32 y entradas ASCII String64; los arrays paralelos contienen cantidades Int32, durabilidad, fusiones, modificadores, tintes y detalles de comida. Los ingredientes se agrupan de cinco en cinco. `ValidNum[0]` indica capacidad desbloqueada cuando existe; `EquipIndex` identifica casillas equipadas cuando está disponible. Los huecos no ocultan objetos posteriores. Una cantidad −1 se conserva como objeto único.

`PlayerStatus.Life` y `MaxLife` se leen en cuartos de corazón; `MaxStamina` como float32 (1000 unidades por rueda), `MaxEnergy` como float32 en unidades de energía, y rupias/puntos del establo como Int32. No se estima la stamina actual ni la carga actual de batería. Las direcciones deben estar después de la tabla y los arrays completos dentro del archivo, con un máximo de 4096 elementos. Valores ausentes o inválidos quedan como no disponibles, sin invalidar el progreso del mapa ni otras bolsas. Una bolsa disponible sin objetos se distingue de una bolsa ausente.

Los nombres localizados, estrellas de mejora y nombres de enums proceden del editor de Marc Robledo; el ID original siempre se conserva y se muestra como alternativa si no hay traducción. No se infiere daño, defensa ni durabilidad máxima del equipo a partir de su nombre. Referencia fijada y créditos en `THIRD_PARTY.md`. La pestaña usa la misma instantánea que el mapa, incluidos los guardados consultados temporalmente, y no escribe en el save.


## Misiones

`Snapshot.quests` contiene 253 registros `{id, state, step, raw}`. Se consulta la entrada `Step_<ID>` del diario, cuyo valor es un enum MurmurHash3, no un índice: `Complete` → `done`, `NotReady` → `todo`, cualquier otra etapa conocida del enum de esa misión → `active`. Un hash ausente o un valor ajeno al enum produce `unknown`; cero no se interpreta como pendiente. Se conservan el valor UInt32 y la etapa original para diagnóstico. El formato se prueba en las tres familias admitidas. Los dos objetivos finales pueden seguir en curso después de terminar el juego porque el guardado vuelve al punto anterior al combate.

`web/public/quest-data.json` contiene IDs, nombres, tipos, personaje, lugar, coordenadas de referencia y enums. No incluye descripciones ni diálogos. Coordenadas de la planilla: X → x, Y → −z, Height + 105 → y. Para pruebas heroicas se prefiere el santuario asociado; para el resto se usa el lugar registrado, con alias explícitos de refugios. No se estiman NPC móviles ni objetivos según etapa; posiciones ausentes permanecen nulas. Las misiones tienen contadores propios y no se añaden al porcentaje de coleccionables.

El catálogo puede regenerarse con `node scripts/import-quests.cjs` (requiere red y Node con fetch); las dos revisiones de origen están fijadas en el script y en los metadatos del JSON.

Los enlaces de guía de las 253 misiones se contrastaron con los cuatro índices de Zelda Dungeon el 1 de noviembre de 2026: `Tears_of_the_Kingdom_Main_Quests`, `Tears_of_the_Kingdom_Side_Adventures`, `Tears_of_the_Kingdom_Shrine_Quests` y `Tears_of_the_Kingdom_Side_Quests`. Se conserva la puntuación del título, distinguiendo `The Ancient City Gorondia?` y `The Ancient City Gorondia!`; el ID `GerudoCanyon_GleeokLiver` enlaza a `Gleeok Guts (Side Quest)` para evitar el artículo del material. Se abren fichas externas; no se descarga ni almacena su contenido. Las fichas pueden tener distintos grados de detalle. Los diagnósticos de cada tarjeta muestran ID, campo Step, hash, etapa exacta, valor bruto y revisión de la misma instantánea representada. La prueba `tests/quest-autosync.cjs` verifica cambios reales del observador a partir de copias de un save, incluyendo estados por hacer/en curso/hecha/desconocido, consultas aisladas y recuperación de escritura incompleta.
