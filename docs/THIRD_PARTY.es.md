# Procedencia de componentes y recursos

## Colecciones e imágenes de referencia

`web/public/collection-data.json` selecciona las fuentes y los materiales de mejora de `Ignacio9172/spreadsheet_totk_json`, revisión `f20920ea28c0fa9aa9357ebf640c222c7de64a31`. Los campos de adquisición proceden de la investigación de Marc Robledo en `450752f98876755944ea22eb457f4dc1468d79ea`, incluidas las nuevas telas 1.4. Los títulos de recuerdos proceden de `StaticMsg/DragonMemory.csv` en `zoalasaurusrawr/totk-resources`, revisión `2bc9ea5e0c2eb2e24fcaaff3f7162660559eb082`. Se excluyen diálogos, descripciones y códigos de formato. Los costes de rupias, incluida la excepción del Espíritu del héroe ancestral, se contrastaron con las fichas de Zelda Dungeon indicadas en el aviso en inglés. El catálogo puede regenerarse con `scripts/import-collections.cjs`.

Las imágenes de armaduras, telas, equipo de caballo, recompensas, medallas y recuerdos se solicitan directamente a `TOTKSheet/TOTKImages`, revisión `e0467418215e76bd93c3ec8b55bbf321e4cc43ae`. No se redistribuyen en el código ni en el ZIP. Las ilustraciones de Nintendo conservan su titularidad; las licencias de código o datos no se interpretan como permisos sobre las imágenes. Las solicitudes solo contienen rutas de imágenes, sin datos de partidas ni nombres de archivos locales. Si una imagen falla se utiliza un pictograma local.

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

## Catálogo de HyruleWorld

El registro de personajes se lee de `CharaDirectory_IsInstantTipsDisplayed.<actor>` y `CharaDirectory_IsNew.<actor>`, según los hashes fijados de Savegame Editors. Cualquier marca positiva confirma el descubrimiento; ambas presentes en cero indican que falta. Los campos ausentes o no reconocidos quedan sin verificar. Así, quitar la insignia de nuevo no pierde un perfil ya registrado. `assets/character-profiles.json` documenta los actores y fuentes de retratos, generados en el catálogo compartido. Se comprobaron las 23 URL de retratos PNG el 2 de noviembre de 2026: arte de perfiles de Zelda Dungeon y el retrato de Dorphan del CDN de Zelda Wiki. Las imágenes de Nintendo se solicitan externamente, no se incluyen en repositorio ni ZIP y tienen iniciales de respaldo. Las solicitudes no envían partidas ni rutas locales.

Los 509 números y zonas habituales de `web/public/world-data.json` usan datos de [Hyrule Compendium API](https://github.com/gadhagod/Hyrule-Compendium-API), Copyright 2020 Aarav Borthakur, MIT; licencia original en `licenses/HyruleCompendium.txt`. El catálogo registra el SHA-256 de la respuesta de origen. Los nombres y lugares en inglés/español proceden de campos seleccionados de [totk-resources](https://github.com/zoalasaurusrawr/totk-resources), revisión `2bc9ea5e0c2eb2e24fcaaff3f7162660559eb082`, y de la tabla del inventario. No se incluyen descripciones, textos de guía ni diálogos del juego. Los hashes y enums se basan en la investigación MIT de Marc Robledo, en la revisión del importador de misiones. `scripts/import-world.cjs` valida las 509 entradas, incluidas las armas deterioradas y sin deteriorar.

Las ilustraciones de referencia se solicitan a GitHub, revisión `7d5c566dd1563ef6087335cc4ca0ec47e79bb392` de Hyrule Compendium API. Están excluidas del repositorio y del ZIP. La licencia MIT de la API no concede derechos sobre ilustraciones de Nintendo. Si no hay conexión, se muestran pictogramas locales. Las solicitudes no incluyen partidas ni rutas locales.

Las notas de los 22 personajes son resúmenes originales. Se comprobaron los nombres y miembros contra `ActorMsg/CharaDirectory`, [Thonky](https://www.thonky.com/zelda-tears-of-the-kingdom/character-profiles) y [Zelda Wiki](https://zelda.fandom.com/wiki/Character_Profiles). Los lugares pueden cambiar con la historia. Las guías abren Zelda Dungeon y todos los perfiles se pueden consultar desde el principio. El álbum refleja registros de la enciclopedia, incluidas imágenes compradas; no extrae fotos personales de `progress.sav`.

## Datos y referencias del inventario

Los campos de las bolsas, unidades de atributos, traducciones de objetos y metadatos de mejora de armaduras proceden de Savegame Editors de Marc Robledo, commit `b4db8cd11157c6d5ae54a0a5edc88dba82aebe9d`. Se incluyen datos seleccionados en `web/public/inventory-data.json`, sin ilustraciones de objetos. MIT, Copyright (c) 2017-2023 Marc Robledo; licencia original en `licenses/SavegameEditors.txt`. Investigación y nombres: Echocolat, Exincracci, HylianLZ, Karlos007 y ApacheThunder; nombres traducidos compilados por tingod. La lectura del inventario es una implementación propia de solo lectura. Archivos de referencia y detalles en `THIRD_PARTY.md`.

## Descubrimiento de santuarios y cofres

`assets/shrines.json` contiene hashes seleccionados de las visitas a 152 santuarios y sus 166 cofres. Los hashes de visita e `IsTreasureBoxOpen` proceden de `zelda-totk.hashes.csv` de Marc Robledo, revisión `b4db8cd11157c6d5ae54a0a5edc88dba82aebe9d` (MIT; aviso original en `licenses/SavegameEditors.txt`). La asociación de cofres y santuarios procede de [ZeldaMods radar](https://radar-totk.zeldamods.org/), con la consulta SmallDungeon de cofres que usa [Object Map](https://github.com/zeldamods/objmap-totk/blob/main/src/components/AppMapDetailsDungeon.ts). Solo se incluyen identificadores y hashes seleccionados, sin coordenadas de objetos, textos ni ilustraciones. El archivo registra las URLs y los SHA-256 de las respuestas; se regenera con `scripts/import-shrines.cjs`. El lector, los estados y la insignia de cofre son código propio de HyruleSync.

## Datos adicionales de atalayas

Las coordenadas y hashes de visita y activación de las 15 atalayas proceden de Savegame Editors de Marc Robledo, `zelda-totk.coordinates.js` y `zelda-totk.completism.js` (https://github.com/marcrobledo/savegame-editors). MIT, Copyright (c) 2017-2023 Marc Robledo. Se conserva la licencia original en `licenses/SavegameEditors.txt`, también accesible en la aplicación. El icono SVG de atalaya es propio de HyruleSync. El catálogo descargado de Unexplored se conserva intacto; las atalayas se agregan por separado.


## Catálogo de misiones y enums del guardado

Los títulos de misiones en español y nombres seleccionados de personajes de `assets/quest-locales.es.json` se contrastaron con los índices españoles del diario y personajes de Kiranico el 2 de noviembre de 2026: https://zelda.kiranico.com/es/totk/data/quests y https://zelda.kiranico.com/es/totk/data/non_player_characters. Los lugares asociados y alias restantes se contrastaron con la lista española de misiones secundarias de https://www.latecnosfera.com/2023/05/lista-misiones-secundarias-zelda-totk.html y las tablas de lugares de Zelda Wiki en https://zeldawiki.wiki/wiki/Tears_of_the_Kingdom_Translations/Locations (incluidas sus páginas de superficie, cielo y subsuelo). El archivo local registra las URLs concretas y la fecha de consulta. Solo se conservan nombres seleccionados, sin descripciones de misiones, diálogos, textos de guías ni imágenes. `scripts/import-quests.cjs` combina esta tabla local con el catálogo de revisión fija; la aplicación no necesita servicios de traducción ni descargas adicionales para traducir. Los enlaces de las guías mantienen los nombres originales en inglés.

Los metadatos fácticos y coordenadas de referencia seleccionados de `web/public/quest-data.json` proceden de la planilla TotK Data Collection publicada en JSON por Ignacio9172 (`spreadsheet_totk_json`, commit `f20920ea28c0fa9aa9357ebf640c222c7de64a31`): https://github.com/Ignacio9172/spreadsheet_totk_json. Solo se conservan IDs, nombres, clasificación, personaje/lugar y coordenadas; se excluyen descripciones, textos del diario y diálogos. Los hashes y enums conocidos de los 253 campos `Step_*` proceden de `zelda-totk.hashes.csv` de Marc Robledo, commit `b4db8cd11157c6d5ae54a0a5edc88dba82aebe9d`: https://github.com/marcrobledo/savegame-editors (MIT; licencia original en `licenses/SavegameEditors.txt`). El lector y los marcadores son código original de HyruleSync.

Los enlaces de ayuda de las misiones remiten a los cuatro índices de Zelda Dungeon Wiki para Tears of the Kingdom (Main Quests, Side Adventures, Shrine Quests y Side Quests), contrastados el 1 de noviembre de 2026: https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Main_Quests, https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Side_Adventures, https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Shrine_Quests y https://www.zeldadungeon.net/wiki/Tears_of_the_Kingdom_Side_Quests. Solo se ofrecen referencias externas; no se distribuye texto ni arte de las guías. El detalle y disponibilidad de las fichas pueden cambiar.


## ZeldaMods · fondos HD opcionales

Los fondos HD de superficie, cielo y subsuelo se obtienen bajo demanda desde `https://objmap-totk.zeldamods.org/game_files/map/{Ground|Sky|Depths}/maptex/{z}/{x}/{y}.webp`. Configuración de origen: https://github.com/zeldamods/objmap-totk/blob/3c37e5317c5fce3b4edf1bb2daf49c5607871a8f/src/MapBase.ts y `src/util/map.ts`. Comprobado el 1 de noviembre de 2026. El origen usa un lienzo de coordenadas de 24000 × 20000 y niveles nativos hasta 7.

HyruleSync implementa de forma independiente las coordenadas y la caché opcional; no incorpora código de la aplicación de ZeldaMods. El proyecto de origen indica GPL-3.0, que no se considera una autorización sobre las imágenes de Nintendo. No se ha establecido permiso para redistribuir esas imágenes. Los mosaicos se excluyen del código y de los ZIP públicos, y solo se solicitan después de seleccionar HD. Los endpoints son vivos, sin fijar a un commit ni verificar contra un manifiesto de hashes de origen. Se limita el tamaño y se valida el contenedor WebP de 256 × 256; los mosaicos descargados se conservan localmente. No se envían partidas ni rutas locales.
