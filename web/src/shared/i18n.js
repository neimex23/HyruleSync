// Spanish source strings and their English translations. The app supplies the selected locale.
export const I18N = (() => {
  let language = "en";
  const en = {
    "La descarga HD requiere Windows con TLS 1.3 (Windows 11 o posterior).":
      "HD downloads require Windows with TLS 1.3 (Windows 11 or later).",
    "Mapa:": "Map:",
    SD: "SD",
    HD: "HD",
    "Calidad del mapa": "Map quality",
    "Mapa sin conexión": "Offline map",
    "Descarga del mapa HD": "HD map download",
    "80–120 MB": "80–120 MB",
    "Descargar el mapa HD completo (≈80–120 MB, 29 847 mosaicos) para usarlo sin conexión. Puede tardar varios minutos. ¿Continuar?":
      "Download the full HD map (≈80–120 MB, 29,847 tiles) to use it offline. This may take several minutes. Continue?",
    "Descargando {pct}%": "Downloading {pct}%",
    "Descargar mapa HD completo (~80-120 MB)":
      "Download full HD map (~80-120 MB)",
    "Mapa HD completo": "Full HD map",
    "Descarga todos los mosaicos para usar el mapa sin conexión.":
      "Download all tiles to use the map offline.",
    "Descargando…": "Downloading…",
    "Volver a descargar": "Download again",
    "Descargar mapa HD completo": "Download full HD map",
    "Descargando {done}/{total}…": "Downloading {done}/{total}…",
    "Mapa HD completo descargado.": "Full HD map downloaded.",
    "Estándar · sin conexión": "Standard · offline",
    "Alta resolución · HD": "High resolution · HD",
    "HD descarga las zonas que exploras y las guarda en este equipo. Sin conexión, las zonas sin detalle guardado usan el mapa estándar.":
      "HD downloads the areas you explore and saves them on this computer. Offline, areas without cached detail use the standard map.",
    "Reintentar HD": "Retry HD",
    "HD no disponible en algunas zonas; se muestra el mapa estándar.":
      "HD unavailable in some areas; showing the standard map.",
    "La caché HD está llena; las zonas nuevas usan el mapa estándar.":
      "The HD cache is full; new areas use the standard map.",
    "Descargando detalle del mapa…": "Downloading map detail…",
    "Caché HD: {size} MB": "HD cache: {size} MB",
    "Recursos: TotK Unexplored / ZeldaMods / Nintendo · Leaflet":
      "Resources: TotK Unexplored / ZeldaMods / Nintendo · Leaflet",
    "Mapas HD: mosaicos de ZeldaMods, descargados al explorar y guardados localmente. No se incluyen en el ZIP.":
      "HD maps: ZeldaMods tiles, downloaded while exploring and cached locally. Excluded from the ZIP.",
    "Campo del guardado": "Save field",
    "Etapa registrada": "Recorded stage",
    "Revisión del guardado": "Save revision",
    "El estado se lee del guardado y se actualiza con Autosync. Activa la categoría Misiones en los filtros laterales para ver los marcadores; mostrarlos u ocultarlos solo cambia la vista. Las guías se abren en Zelda Dungeon.":
      "Status is read from the save and updated by Autosync. Enable the Quests category in the sidebar filters to show markers; showing or hiding them only changes the view. Guides open on Zelda Dungeon.",
    "Mostrar misiones en el mapa": "Show quests on the map",
    "Mostrar en el mapa": "Show on the map",
    Misiones: "Quests",
    "TU AVENTURA · PASO A PASO": "YOUR ADVENTURE · STEP BY STEP",
    "Misiones en el mapa": "Quests on the map",
    Principales: "Main quests",
    "Aventuras secundarias": "Side adventures",
    "Pruebas heroicas": "Shrine quests",
    "Misiones secundarias": "Side quests",
    Hechas: "Completed",
    "En curso": "In progress",
    "Por hacer": "Not started",
    "Buscar misiones": "Search quests",
    "Buscar misión, personaje o lugar…": "Search quest, character or location…",
    "Tipo de misión": "Quest type",
    "Estado de misión": "Quest status",
    "Todos los tipos": "All types",
    "Todos los estados": "All statuses",
    "Estados del guardado: hechas, en curso y por hacer. Los nombres de misiones y lugares se muestran en inglés.":
      "Save states: completed, in progress and not started. Quest and location names are shown in English.",
    "Los marcadores indican el santuario o la zona asociada, no el objetivo actual. Las misiones sin ubicación fija no tienen marcador. Los filtros de esta pestaña también se aplican a los marcadores de misiones.":
      "Markers show the associated shrine or area, rather than the current objective. Quests without a fixed location have no marker. Filters in this tab also apply to quest markers.",
    Reintentar: "Retry",
    "Misiones de {file} · {time}": "Quests from {file} · {time}",
    "Carga una partida para ver el estado de las misiones.":
      "Load a save to view quest progress.",
    "No se pudieron cargar las misiones. Reintentar.":
      "Could not load quests. Retry.",
    "Cargando misiones…": "Loading quests…",
    "{shown} de {total} misiones": "{shown} of {total} quests",
    "Ubicación variable": "Variable location",
    "Ver en el mapa": "View on map",
    "Sin ubicación fija": "No fixed location",
    "No hay misiones con estos filtros.": "No quests match these filters.",
    "Santuario asociado": "Associated shrine",
    "Zona de referencia; el personaje puede estar en otro punto.":
      "Reference area; the character may be elsewhere.",
    "Vistas de la partida": "Save views",
    Mapa: "Map",
    Inventario: "Inventory",
    "TU PARTIDA · AL DETALLE": "YOUR SAVE · IN DETAIL",
    "☰ Partida": "☰ Save",
    "Carga una partida para consultar el inventario.":
      "Load a save to view the inventory.",
    "Buscar en el inventario": "Search inventory",
    "Buscar objeto, ingrediente o ID…": "Search item, ingredient or ID…",
    "Categoría del inventario": "Inventory category",
    "Todas las bolsas": "All pouches",
    "Datos del último guardado leído. Los campos ausentes se muestran como no disponibles.":
      "Data from the last save read. Missing fields are shown as unavailable.",
    Armas: "Weapons",
    Arcos: "Bows",
    Escudos: "Shields",
    Armaduras: "Armor",
    Flechas: "Arrows",
    Materiales: "Materials",
    "Comida y elixires": "Food and elixirs",
    "Dispositivos zonnan": "Zonai devices",
    "Objetos importantes": "Key items",
    Durabilidad: "Durability",
    Modificador: "Modifier",
    "Valor del modificador": "Modifier value",
    "Combinado con": "Fused with",
    "Durabilidad de la fusión": "Fuse durability",
    "Durabilidad adicional": "Extra durability",
    "Durabilidad adicional registrada": "Recorded extra durability",
    Tinte: "Dye",
    "Orden de obtención": "Acquisition order",
    "Orden de uso": "Usage order",
    "Corazones que recupera": "Hearts restored",
    "Potencia del efecto": "Effect strength",
    "Duración (segundos)": "Duration (seconds)",
    "Precio de venta": "Sell price",
    Ingredientes: "Ingredients",
    Efecto: "Effect",
    "Sin ingredientes registrados": "No recorded ingredients",
    "Sin fusión": "No fusion",
    Único: "Unique",
    Equipado: "Equipped",
    "Detalles del objeto": "Item details",
    "Casilla {n}": "Slot {n}",
    "No disponible": "Unavailable",
    "Inventario de {file} · {time}": "Inventory from {file} · {time}",
    "No se pudieron cargar los nombres. Vuelve a abrir Inventario para reintentar.":
      "Could not load item names. Reopen Inventory to retry.",
    "Cargando nombres de objetos…": "Loading item names…",
    Vida: "Health",
    "Vida máxima": "Maximum health",
    "Stamina máxima": "Maximum stamina",
    "Batería máxima": "Maximum battery",
    Rupias: "Rupees",
    "Puntos del establo": "Pony points",
    "{n} corazones": "{n} hearts",
    "{n} ruedas": "{n} wheels",
    "{n} unidades de energía": "{n} energy units",
    "Esta bolsa no está disponible en el guardado.":
      "This pouch is unavailable in the save.",
    "Bolsa vacía": "Empty pouch",
    "{n} objetos mostrados": "{n} items shown",
    "No se encontraron objetos.": "No items found.",

    "Ver guía": "View guide",
    "Abre la ficha en Zelda Dungeon.": "Opens the entry on Zelda Dungeon.",
    "Abre la ubicación en Zelda Dungeon. Selecciona su icono para consultar la ayuda.":
      "Opens the location on Zelda Dungeon. Select its icon to view help.",
    "Ver guía en Zelda Dungeon (otra pestaña)":
      "View guide on Zelda Dungeon (new tab)",
    Idioma: "Language",
    "Automático (Windows)": "Automatic (Windows)",
    "Al cerrar la página": "When closing the page",
    "Mantener HyruleSync en la bandeja": "Keep HyruleSync in the tray",
    "Al cerrar la última pestaña, HyruleSync se cierra después de unos segundos. Activa esta opción para seguir leyendo guardados en segundo plano.":
      "Closing the last tab exits HyruleSync after a few seconds. Enable this option to keep monitoring saves in the background.",
    "Link en el mapa": "Link on the map",
    Opacidad: "Opacity",
    "Mostrar Link": "Show Link",
    "Orden del marcador": "Marker order",
    "Encima de los iconos": "Above map icons",
    "Debajo de los iconos": "Below map icons",
    "Diagnóstico de posición": "Position diagnostics",
    "Mapa guardado: {map} · coordenadas originales: {coords}":
      "Saved map: {map} · original coordinates: {coords}",
    "Dentro de {name}": "Inside {name}",
    "Activada: {state}": "Activated: {state}",
    "Visitada: {state}": "Visited: {state}",
    "Activación de la atalaya": "Tower activation",
    "Hash de visita": "Visit hash",
    Sí: "Yes",
    No: "No",
    Guardados: "Saves",
    "Consulta tus slots sin cambiar la carpeta que sigue Autosync.":
      "Inspect your slots without changing the folder watched by Autosync.",
    "Actualizar lista": "Refresh list",
    "No hay slots en la selección actual. Puedes consultar un archivo manualmente.":
      "No slots in the current selection. You can inspect a file manually.",
    Consultar: "Inspect",
    "Consultar archivo": "Inspect file",
    "Detalle del guardado": "Save details",
    "Completados / Total": "Completed / Total",
    "Volver al seguimiento": "Return to live tracking",
    "Consultando {file} · {time}": "Inspecting {file} · {time}",
    "{h} h {m} min · {format} · {time}": "{h} h {m} min · {format} · {time}",
    "Ver cambios": "View changes",
    "Notas de la versión": "Release notes",
    "Ver en GitHub": "View on GitHub",
    "Esta versión no tiene notas de cambios.":
      "This release has no change notes.",
    "Ver licencia de datos de atalayas": "View tower data license",
    "Las 15 atalayas se agregan por separado con datos de Marc Robledo. Se completan al activarlas.":
      "The 15 Skyview Towers are added separately using data from Marc Robledo. Activation is required for completion.",
    "EXPLORA · GUARDA · SINCRONIZA": "EXPLORE · SAVE · SYNC",
    "Descubre lo que queda por encontrar.": "Discover what is left to find.",
    "Sin partida cargada": "No save loaded",
    "SOLO LECTURA": "READ ONLY",
    "Elige tu carpeta de guardados de TOTK Recomp.":
      "Choose your TOTK Recomp save folder.",
    "Cargar .sav": "Load .sav",
    "Seguir carpeta": "Watch folder",
    "Autosync al guardar": "Autosync on save",
    "Actualizar ahora": "Refresh now",
    "TU PROGRESO EN HYRULE": "YOUR PROGRESS IN HYRULE",
    "completados de": "completed out of",
    "Carga una partida para calcular los pendientes.":
      "Load a save to calculate what is missing.",
    "Buscar en el mapa": "Search the map",
    "Buscar nombre, tipo o coordenadas…": "Search name, type or coordinates…",
    Ver: "Show",
    Pendientes: "Missing",
    Completados: "Completed",
    Todos: "All",
    "Sin verificar": "Unverified",
    Categorías: "Categories",
    Todas: "All",
    Ninguna: "None",
    "Datos y funcionamiento": "Data and behavior",
    "Catálogo, mapas, iconos, rutas y condiciones de completado de":
      "Catalog, maps, icons, routes and completion conditions from",
    ". No se han añadido ubicaciones al archivo original.":
      ". No locations have been added to the original file.",
    "«Completado» sigue el criterio de Unexplored. En santuarios exige Clear; en raíces Open. Las entradas que comparten el mismo hash comparten estado.":
      "Completion follows Unexplored rules. Shrines require Clear; lightroots require Open. Entries with a shared hash share the same state.",
    "El total es el del catálogo y no representa el porcentaje oficial del mapa. Los nombres y tipos se conservan en su idioma original.":
      "The total is the catalog total, not the official map percentage. Names and types remain in their original language.",
    "La aplicación solo lee la partida. Un archivo con un hash desconocido se muestra como «sin verificar».":
      "The app only reads saves. Entries with a missing hash are shown as unverified.",
    "«Cargar .sav» abre una instantánea del archivo. En «Seguir carpeta» se elige el guardado con más tiempo de juego, igual que el original. Al elegir la carpeta de una sola cuenta se activa Autosync. Puedes dejarlo abierto mientras juegas. Activa la opción de bandeja en Acerca de para seguir leyendo con la pestaña cerrada.":
      "Load .sav opens a snapshot. Watch folder selects the save with the most playtime. Selecting one account folder enables Autosync. Leave the app running while you play. Enable the tray option in About to keep monitoring with the browser tab closed.",
    "Todo funciona localmente, incluidos los fondos del mapa. Para salir por completo, usa el icono junto al reloj de Windows.":
      "Everything runs locally, including map backgrounds. To quit completely, use the Windows tray icon.",
    "Mapa de HyruleSync": "HyruleSync map",
    "☰ Filtros": "☰ Filters",
    "Capa del mapa": "Map layer",
    Subsuelo: "Depths",
    Superficie: "Surface",
    Cielo: "Sky",
    Acercar: "Zoom in",
    Alejar: "Zoom out",
    "Ver todo el mapa": "Fit map",
    "Rutas de kologs y cuevas": "Korok and cave routes",
    "Este · Norte": "East · North",
    "TU PARTIDA, SIEMPRE AL DÍA": "YOUR SAVE, ALWAYS UP TO DATE",
    "¿Qué queda por explorar?": "What is left to explore?",
    "Elige la carpeta de guardados de tu cuenta. Autosync se activa automáticamente y actualiza el mapa con cada autoguardado o guardado manual.":
      "Choose your account’s save folder. Autosync turns on automatically and updates the map with each autosave or manual save.",
    "No convierte ni modifica el guardado.":
      "Your save is never converted or modified.",
    "Cerrar detalle": "Close details",
    "ESTE · NORTE · ALTURA": "EAST · NORTH · HEIGHT",
    Copiar: "Copy",
    "Centrar y acercar": "Center and zoom",
    "Verificar contra el guardado": "Check against the save",
    "Recursos: TotK Unexplored / Nintendo · Leaflet":
      "Resources: TotK Unexplored / Nintendo · Leaflet",
    "AUTOSYNC DE TOTK RECOMP": "TOTK RECOMP AUTOSYNC",
    "Seguir una carpeta de guardados": "Watch a save folder",
    "Elige la carpeta de una sola cuenta. Autosync se activa automáticamente y detecta autoguardados y guardados manuales para mantener el mapa actualizado.":
      "Choose one account folder. Autosync turns on automatically and detects autosaves and manual saves to keep the map updated.",
    "Carpetas detectadas": "Detected folders",
    "Ruta personalizada": "Custom path",
    "Ruta de la carpeta": "Folder path",
    "Explorar carpetas…": "Browse folders…",
    "↑ Subir": "↑ Parent folder",
    Unidades: "Drives",
    Cancelar: "Cancel",
    "Seguir y activar Autosync": "Watch and enable Autosync",
    "CARGA MANUAL": "MANUAL LOAD",
    "Abrir un guardado": "Open a save",
    "Elige un slot detectado o pega la ruta de tu progress.sav.":
      "Choose a detected slot or paste the path to your progress.sav file.",
    "Guardados detectados": "Detected saves",
    "Ruta del archivo": "File path",
    "Explorar archivos…": "Browse files…",
    "Explorar archivos": "Browse files",
    "Cargar guardado": "Load save",
    "HYRULESYNC · PRIMER INICIO": "HYRULESYNC · FIRST RUN",
    "Prepara tu mapa": "Prepare your map",
    "Descarga una vez los mapas, iconos y el catálogo de ubicaciones (unos 44 MB). Después podrás usarlos sin conexión.":
      "Download the maps, icons and location catalog once (about 44 MB). You can then use them offline.",
    "Los recursos se obtienen del repositorio de TotK Unexplored. HyruleSync es una aplicación independiente y conserva los créditos de esos recursos.":
      "Resources are downloaded from the TotK Unexplored repository. HyruleSync is a standalone app and preserves their credits.",
    "Descargar recursos del mapa": "Download map resources",
    "Luego podrás elegir tu carpeta de guardados.":
      "You can then choose your save folder.",
    Completado: "Completed",
    Pendiente: "Missing",
    "Sin verificar · no hay datos suficientes":
      "Unverified · insufficient data",
    "{n} pendientes": "{n} missing",
    " · {n} sin verificar": " · {n} unverified",
    "{found} completados; {missing} pendientes; {unknown} sin verificar. Todas las capas.":
      "{found} completed; {missing} missing; {unknown} unverified. All layers.",
    "{n} puntos filtrados": "{n} filtered points",
    "Tipo original: {type}": "Original type: {type}",
    " · La ruta está dibujada en el mapa.": " · The route is drawn on the map.",
    "Presencia de GUID UInt64": "UInt64 GUID presence",
    "Valor distinto de cero": "Nonzero value",
    "Valor leído": "Read value",
    "Sin partida": "No save",
    "Criterio original": "Original condition",
    Origen: "Source",
    "map_data.json · sin registros añadidos":
      "map_data.json · no added entries",
    "No se pudo completar la acción.": "The action could not be completed.",
    "Guardado cargado en memoria · no se ha modificado el archivo":
      "Save loaded in memory · the file was not modified",
    "Pega la ruta de progress.sav o usa Explorar archivos.":
      "Paste the path to progress.sav or use Browse files.",
    "Elige una unidad": "Choose a drive",
    "Sin subcarpetas visibles. Puedes seleccionar esta carpeta.":
      "No visible subfolders. You can select this folder.",
    "Pega la ruta de tu carpeta de guardados.":
      "Paste the path to your save folder.",
    "Selecciona en la ventana de Windows": "Select in the Windows dialog",
    "Revisa el guardado": "Check the save",
    "Leyendo guardado…": "Reading save…",
    "Partida cargada": "Save loaded",
    "Carpeta: ": "Folder: ",
    "Archivo: ": "File: ",
    "progress.sav · carga manual": "progress.sav · manual load",
    "Origen: ": "Source: ",
    "● Observando cambios": "● Watching for changes",
    " · mapa actualizado {time}": " · map updated {time}",
    "Autosync en pausa · puedes actualizar manualmente":
      "Autosync paused · you can refresh manually",
    "Elige una carpeta para seguir tu partida automáticamente.":
      "Choose a folder to follow your save automatically.",
    "{file} · {h} h {m} min · formato {format}":
      "{file} · {h} h {m} min · format {format}",
    "Mapa actualizado con el guardado": "Map updated from the save",
    "Ejecutable desconectado": "App disconnected",
    "Abre HyruleSync.exe para reanudar. Se conserva la última vista.":
      "Open HyruleSync.exe to reconnect. The last view is preserved.",
    "No se puede cargar map_data.json.": "Unable to load map_data.json.",
    "Coordenadas copiadas": "Coordinates copied",
    "Preparando mapa…": "Preparing map…",
    "Reintentar descarga": "Retry download",
    "No se pudo conectar con HyruleSync. ": "Could not connect to HyruleSync. ",
    "No se pudo iniciar la descarga.": "Could not start the download.",
    "Acerca de, licencias y créditos": "About, licenses and credits",
    "Acerca de HyruleSync": "About HyruleSync",
    Autoría: "Authorship",
    "Un proyecto fuertemente impulsado por IA.":
      "A project strongly driven by AI.",
    Contribuidores: "Contributors",
    "Desarrollado por Neimex23 con amplia asistencia de Codex · GPT-6.1 · razonamiento Alto.":
      "Developed by Neimex23 with extensive assistance from Codex · GPT-6.1 · High reasoning.",
    "Código de HyruleSync": "HyruleSync code",
    "Ver licencia MIT": "View MIT license",
    "Ver licencia de Leaflet": "View Leaflet license",
    "Ver licencia de React": "View React license",
    "Avisos y procedencia de terceros": "Third-party notices and provenance",
    "Proyectos y referencias": "Projects and references",
    "Catálogo, mapas, iconos y criterios de completado.":
      "Catalog, maps, icons and completion conditions.",
    "Biblioteca del mapa interactivo · BSD-2-Clause.":
      "Interactive map library · BSD-2-Clause.",
    "Referencias reconocidas por TotK Unexplored:":
      "References acknowledged by TotK Unexplored:",
    "No se encontró una licencia explícita de los recursos de Unexplored en la versión revisada. Se descargan por separado y conservan su procedencia.":
      "No explicit license for Unexplored resources was found in the reviewed version. Resources are downloaded separately and retain their provenance.",
    "Proyecto no oficial. The Legend of Zelda y sus recursos pertenecen a sus titulares, incluida Nintendo.":
      "Unofficial project. The Legend of Zelda and its assets belong to their respective owners, including Nintendo.",
    "Los textos originales de licencia se conservan en inglés.":
      "Original license texts are preserved in English.",
    Cerrar: "Close",
    "No se pudo cargar el texto de licencia.":
      "Could not load the license text.",
    "Reportar problema": "Report a problem",
    "Seguir a Link al actualizar": "Follow Link on updates",
    "Centrar en Link": "Center on Link",
    "Última posición conocida de Link": "Last known position of Link",
    "La posición de Link no está disponible en este guardado.":
      "Link’s position is unavailable in this save.",
    "Última posición de Link: {coords} · guardado {time}":
      "Last position of Link: {coords} · saved {time}",
    "Posición del último guardado leído; se actualiza al guardar la partida.":
      "Position from the last save read; updates when you save the game.",
    "Descargar actualización": "Download update",
    "Buscar actualizaciones": "Check for updates",
    "Buscando actualizaciones…": "Checking for updates…",
    "Tienes la última versión.": "You have the latest version.",
    "Todavía no hay versiones publicadas.":
      "No releases have been published yet.",
    "Nueva versión disponible: v{version}": "New version available: v{version}",
    "No se pudieron buscar actualizaciones. Puedes reintentar.":
      "Could not check for updates. You can try again.",
    "Extrae el ZIP y reemplaza los ejecutables con HyruleSync cerrado. Conserva las carpetas .data y .state.":
      "Extract the ZIP and replace the executables with HyruleSync closed. Keep the .data and .state folders.",
    "Extrae el ZIP y reemplaza solo HyruleSync.exe y HyruleSync.Stop.exe con HyruleSync cerrado. Conserva las carpetas .data y .state (mapas y preferencias).":
      "Extract the ZIP and replace only HyruleSync.exe and HyruleSync.Stop.exe with HyruleSync closed. Keep the .data and .state folders (maps and settings).",
  };

  function t(source, values = {}) {
    const trimmed = source.trim();
    let text =
      language === "es"
        ? source
        : (en[source] ??
          (en[trimmed] ? source.replace(trimmed, en[trimmed]) : source));

    return text.replace(/\{(\w+)\}/g, (match, key) =>
      values[key] === undefined ? match : String(values[key]),
    );
  }

  return {
    t,
    translations: en,

    get language() {
      return language;
    },

    setLanguage(value) {
      language = value === "es" ? "es" : "en";
    },
  };
})();
