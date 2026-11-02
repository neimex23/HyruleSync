# Procedencia de componentes y recursos

## Código y marca HyruleSync

El ejecutable Windows, servidor local, interfaz, seguimiento, scripts e icono de brújula con confirmación son la implementación de HyruleSync. El formato del guardado y los criterios de completado se implementaron tomando como referencia el comportamiento de TotK Unexplored. La licencia MIT de esta raíz cubre el código nuevo de HyruleSync; no vuelve a licenciar recursos externos.

## TotK Unexplored: catálogo, mapas e iconos de categorías

- Proyecto: https://github.com/lud99/totk-unexplored
- Autor: lud99 (BigBear en GBAtemp).
- Contribuidor de TotK Unexplored: **Jhon Deved**.
- Anuncio del autor: https://gbatemp.net/threads/totk-unexplored-easily-view-all-the-unexplored-collectibles-in-your-totk-savefile.637254/
- Commit fijado: `a68ffbb083ac220c77f2e4ec3ce60d29924c1213`.
- Recursos: `romfs/map_data.json`, fondos `romfs/map/*-medium.png`, iconos seleccionados de `romfs/icons/`.
- Ubicaciones, tamaños y hashes exactos: `assets/resources.json`.

En la copia revisada no se encontró un archivo de licencia explícita. No se presupone permiso de redistribución por el hecho de que sea un repositorio público. Por eso estos archivos **no están incluidos en el código para subir a Git ni en el ZIP público generado**. El usuario puede obtenerlos desde el repositorio original mediante la preparación inicial o importarlos desde su copia local. Esta separación no concede permisos nuevos sobre esos archivos.

Antes de incluirlos directamente en una Release, confirmar los permisos correspondientes o sustituirlos por recursos con licencia adecuada. Documentación de GitHub sobre repositorios sin licencia: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository

Los elementos visuales de The Legend of Zelda pertenecen a sus titulares; HyruleSync no es oficial ni está afiliado a Nintendo.

## React y React DOM 19.3.1

React, React DOM y Scheduler se incluyen en la interfaz local. Licencia MIT, Copyright (c) Meta Platforms, Inc. and affiliates. Texto original en `licenses/React.txt` y **Acerca de → Ver licencia de React**. Código: https://github.com/facebook/react. Vite y ESLint son herramientas de desarrollo y compilación; no se necesitan para ejecutar el programa distribuido.

## Leaflet 1.9.4

https://leafletjs.com/ · Copyright Vladimir Agafonkin y colaboradores.

Se redistribuyen sus archivos JavaScript y CSS. Licencia BSD-2-Clause conservada íntegramente en `licenses/Leaflet.txt`, también incluida en el ZIP público.

## Autoría y declaración de IA

**Neimex23** es el autor de HyruleSync. Es un proyecto fuertemente impulsado por IA, desarrollado con amplia asistencia de **Codex · GPT-6.1 · razonamiento Alto**. La declaración no atribuye autoría sobre los recursos de terceros.

TotK Unexplored reconoce también estas referencias para sus datos, nombres y rutas: https://github.com/marcrobledo/savegame-editors, https://github.com/zeldamods/objmap-totk, https://github.com/zeldamods/radar-totk y https://zeldadungeon.net. Se conservan como referencias del origen de los datos, no como bibliotecas incluidas en HyruleSync.

La aplicación permite consultar estos avisos y los textos originales de las licencias desde «Acerca de, licencias y créditos».

## Datos y referencias del inventario

Los campos de las bolsas, unidades de atributos, traducciones de objetos y metadatos de mejora de armaduras proceden de Savegame Editors de Marc Robledo, commit `b4db8cd11157c6d5ae54a0a5edc88dba82aebe9d`. Se incluyen datos seleccionados en `web/public/inventory-data.json`, sin ilustraciones de objetos. MIT, Copyright (c) 2017-2023 Marc Robledo; licencia original en `licenses/SavegameEditors.txt`. Investigación y nombres: Echocolat, Exincracci, HylianLZ, Karlos007 y ApacheThunder; nombres traducidos compilados por tingod. La lectura del inventario es una implementación propia de solo lectura. Archivos de referencia y detalles en `THIRD_PARTY.md`.

## Datos adicionales de atalayas

Las coordenadas y hashes de visita y activación de las 15 atalayas proceden de Savegame Editors de Marc Robledo, `zelda-totk.coordinates.js` y `zelda-totk.completism.js` (https://github.com/marcrobledo/savegame-editors). MIT, Copyright (c) 2017-2023 Marc Robledo. Se conserva la licencia original en `licenses/SavegameEditors.txt`, también accesible en la aplicación. El icono SVG de atalaya es propio de HyruleSync. El catálogo descargado de Unexplored se conserva intacto; las atalayas se agregan por separado.


## Catálogo de misiones y enums del guardado

Los metadatos fácticos y coordenadas de referencia seleccionados de `web/public/quest-data.json` proceden de la planilla TotK Data Collection publicada en JSON por Ignacio9172 (`spreadsheet_totk_json`, commit `f20920ea28c0fa9aa9357ebf640c222c7de64a31`): https://github.com/Ignacio9172/spreadsheet_totk_json. Solo se conservan IDs, nombres, clasificación, personaje/lugar y coordenadas; se excluyen descripciones, textos del diario y diálogos. Los hashes y enums conocidos de los 253 campos `Step_*` proceden de `zelda-totk.hashes.csv` de Marc Robledo, commit `b4db8cd11157c6d5ae54a0a5edc88dba82aebe9d`: https://github.com/marcrobledo/savegame-editors (MIT; licencia original en `licenses/SavegameEditors.txt`). El lector y los marcadores son código original de HyruleSync.

Los enlaces de ayuda de las misiones remiten a los cuatro índices de Zelda Dungeon Wiki para Tears of the Kingdom (Main Quests, Side Adventures, Shrine Quests y Side Quests), contrastados el 1 de noviembre de 2026: https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Main_Quests, https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Side_Adventures, https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Shrine_Quests y https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Side_Quests. Solo se ofrecen referencias externas; no se distribuye texto ni arte de las guías. El detalle y disponibilidad de las fichas pueden cambiar.


## ZeldaMods · fondos HD opcionales

Los fondos HD de superficie, cielo y subsuelo se obtienen bajo demanda desde `https://objmap-totk.zeldamods.org/game_files/map/{Ground|Sky|Depths}/maptex/{z}/{x}/{y}.webp`. Configuración de origen: https://github.com/zeldamods/objmap-totk/blob/3c37e5317c5fce3b4edf1bb2daf49c5607871a8f/src/MapBase.ts y `src/util/map.ts`. Comprobado el 1 de noviembre de 2026. El origen usa un lienzo de coordenadas de 24000 × 20000 y niveles nativos hasta 7.

HyruleSync implementa de forma independiente las coordenadas y la caché opcional; no incorpora código de la aplicación de ZeldaMods. El proyecto de origen indica GPL-3.0, que no se considera una autorización sobre las imágenes de Nintendo. No se ha establecido permiso para redistribuir esas imágenes. Los mosaicos se excluyen del código y de los ZIP públicos, y solo se solicitan después de seleccionar HD. Los endpoints son vivos, sin fijar a un commit ni verificar contra un manifiesto de hashes de origen. Se limita el tamaño y se valida el contenedor WebP de 256 × 256; los mosaicos descargados se conservan localmente. No se envían partidas ni rutas locales.
