'use strict';
// Spanish source strings and their English translations. Windows selects the locale.
window.I18N = (() => {
  let language = 'en';
  const en = {
    'EXPLORA · GUARDA · SINCRONIZA':'EXPLORE · SAVE · SYNC',
    'Descubre lo que queda por encontrar.':'Discover what is left to find.',
    'Sin partida cargada':'No save loaded', 'SOLO LECTURA':'READ ONLY',
    'Selecciona tu progress.sav de TOTK Recomp.':'Select your TOTK Recomp progress.sav file.',
    'Cargar .sav':'Load .sav', 'Seguir carpeta':'Watch folder',
    'Autosync al guardar':'Autosync on save', 'Actualizar ahora':'Refresh now',
    'TU PROGRESO EN HYRULE':'YOUR PROGRESS IN HYRULE', 'completados de':'completed out of',
    'Carga una partida para calcular los pendientes.':'Load a save to calculate what is missing.',
    'Buscar en el mapa':'Search the map', 'Buscar nombre, tipo o coordenadas…':'Search name, type or coordinates…',
    'Ver':'Show', 'Pendientes':'Missing', 'Completados':'Completed', 'Todos':'All', 'Sin verificar':'Unverified',
    'Categorías':'Categories', 'Todas':'All', 'Ninguna':'None', 'Datos y funcionamiento':'Data and behavior',
    'Catálogo, mapas, iconos, rutas y condiciones de completado de':'Catalog, maps, icons, routes and completion conditions from',
    '. No se han añadido ubicaciones al archivo original.':'. No locations have been added to the original file.',
    '«Completado» sigue el criterio de Unexplored. En santuarios exige Clear; en raíces Open. Las entradas que comparten el mismo hash comparten estado.':'Completion follows Unexplored rules. Shrines require Clear; lightroots require Open. Entries with a shared hash share the same state.',
    'El total es el del catálogo y no representa el porcentaje oficial del mapa. Los nombres y tipos se conservan en su idioma original.':'The total is the catalog total, not the official map percentage. Names and types remain in their original language.',
    'La aplicación solo lee la partida. Un archivo con un hash desconocido se muestra como «sin verificar».':'The app only reads saves. Entries with a missing hash are shown as unverified.',
    '«Cargar .sav» abre una instantánea del archivo. En «Seguir carpeta» se elige el guardado con más tiempo de juego, igual que el original. Al elegir la carpeta de una sola cuenta se activa Autosync. Puedes dejarlo abierto mientras juegas, incluso con la pestaña cerrada.':'Load .sav opens a snapshot. Watch folder selects the save with the most playtime. Selecting one account folder enables Autosync. Leave the app running while you play, even with the browser tab closed.',
    'Todo funciona localmente, incluidos los fondos del mapa. Para salir por completo, usa el icono junto al reloj de Windows.':'Everything runs locally, including map backgrounds. To quit completely, use the Windows tray icon.',
    'Mapa de HyruleSync':'HyruleSync map', '☰ Filtros':'☰ Filters', 'Capa del mapa':'Map layer',
    'Subsuelo':'Depths', 'Superficie':'Surface', 'Cielo':'Sky', 'Acercar':'Zoom in', 'Alejar':'Zoom out',
    'Ver todo el mapa':'Fit map', 'Rutas de kologs y cuevas':'Korok and cave routes', 'Este · Norte':'East · North',
    'TU PARTIDA, SIEMPRE AL DÍA':'YOUR SAVE, ALWAYS UP TO DATE', '¿Qué queda por explorar?':'What is left to explore?',
    'Carga':'Load', 'para ver tus pendientes. O selecciona una carpeta de guardados y activa Autosync para actualizar el mapa mientras juegas.':'to see what is missing. Or select a save folder and enable Autosync to update the map while you play.',
    'Cargar partida':'Load save', 'No convierte ni modifica el guardado.':'Your save is never converted or modified.',
    'Cerrar detalle':'Close details', 'ESTE · NORTE · ALTURA':'EAST · NORTH · HEIGHT', 'Copiar':'Copy',
    'Centrar y acercar':'Center and zoom', 'Verificar contra el guardado':'Check against the save',
    'Recursos: TotK Unexplored / Nintendo · Leaflet':'Resources: TotK Unexplored / Nintendo · Leaflet',
    'AUTOSYNC DE TOTK RECOMP':'TOTK RECOMP AUTOSYNC', 'Seguir una carpeta de guardados':'Watch a save folder',
    'Elige la carpeta de una sola cuenta. HyruleSync detectará los guardados nuevos y mantendrá el mapa actualizado.':'Choose one account folder. HyruleSync will detect new saves and keep the map updated.',
    'Carpetas detectadas':'Detected folders', 'Ruta personalizada':'Custom path', 'Ruta de la carpeta':'Folder path',
    'Explorar carpetas…':'Browse folders…', '↑ Subir':'↑ Parent folder', 'Unidades':'Drives', 'Cancelar':'Cancel',
    'Seguir y activar Autosync':'Watch and enable Autosync', 'CARGA MANUAL':'MANUAL LOAD', 'Abrir un guardado':'Open a save',
    'Elige un slot detectado o pega la ruta de tu progress.sav.':'Choose a detected slot or paste the path to your progress.sav file.',
    'Guardados detectados':'Detected saves', 'Ruta del archivo':'File path', 'Explorar archivos…':'Browse files…',
    'Explorar archivos':'Browse files', 'Cargar guardado':'Load save', 'HYRULESYNC · PRIMER INICIO':'HYRULESYNC · FIRST RUN',
    'Prepara tu mapa':'Prepare your map',
    'Descarga una vez los mapas, iconos y el catálogo de ubicaciones (unos 44 MB). Después podrás usarlos sin conexión.':'Download the maps, icons and location catalog once (about 44 MB). You can then use them offline.',
    'Los recursos se obtienen del repositorio de TotK Unexplored. HyruleSync es una aplicación independiente y conserva los créditos de esos recursos.':'Resources are downloaded from the TotK Unexplored repository. HyruleSync is a standalone app and preserves their credits.',
    'Descargar recursos del mapa':'Download map resources', 'Luego podrás elegir tu carpeta de guardados.':'You can then choose your save folder.',
    'Completado':'Completed', 'Pendiente':'Missing', 'Sin verificar · no hay datos suficientes':'Unverified · insufficient data',
    '{n} pendientes':'{n} missing', ' · {n} sin verificar':' · {n} unverified',
    '{found} completados; {missing} pendientes; {unknown} sin verificar. Todas las capas.':'{found} completed; {missing} missing; {unknown} unverified. All layers.',
    '{n} puntos filtrados':'{n} filtered points', 'Tipo original: {type}':'Original type: {type}',
    ' · La ruta está dibujada en el mapa.':' · The route is drawn on the map.',
    'Presencia de GUID UInt64':'UInt64 GUID presence', 'Valor distinto de cero':'Nonzero value',
    'Valor leído':'Read value', 'Sin partida':'No save', 'Criterio original':'Original condition', 'Origen':'Source',
    'map_data.json · sin registros añadidos':'map_data.json · no added entries',
    'No se pudo completar la acción.':'The action could not be completed.',
    'Guardado cargado en memoria · no se ha modificado el archivo':'Save loaded in memory · the file was not modified',
    'Pega la ruta de progress.sav o usa Explorar archivos.':'Paste the path to progress.sav or use Browse files.',
    'Elige una unidad':'Choose a drive',
    'Sin subcarpetas visibles. Puedes seleccionar esta carpeta.':'No visible subfolders. You can select this folder.',
    'Pega la ruta de tu carpeta de guardados.':'Paste the path to your save folder.',
    'Selecciona en la ventana de Windows':'Select in the Windows dialog', 'Revisa el guardado':'Check the save',
    'Leyendo guardado…':'Reading save…', 'Partida cargada':'Save loaded', 'Carpeta: ':'Folder: ', 'Archivo: ':'File: ',
    'progress.sav · carga manual':'progress.sav · manual load', 'Origen: ':'Source: ', '● Observando cambios':'● Watching for changes',
    ' · mapa actualizado {time}':' · map updated {time}',
    'Autosync en pausa · puedes actualizar manualmente':'Autosync paused · you can refresh manually',
    'Elige una carpeta para seguir tu partida automáticamente.':'Choose a folder to follow your save automatically.',
    '{file} · {h} h {m} min · formato {format}':'{file} · {h} h {m} min · format {format}',
    'Mapa actualizado con el guardado':'Map updated from the save', 'Ejecutable desconectado':'App disconnected',
    'Abre HyruleSync.exe para reanudar. Se conserva la última vista.':'Open HyruleSync.exe to reconnect. The last view is preserved.',
    'No se puede cargar map_data.json.':'Unable to load map_data.json.', 'Coordenadas copiadas':'Coordinates copied',
    'Preparando mapa…':'Preparing map…', 'Reintentar descarga':'Retry download',
    'No se pudo conectar con HyruleSync. ':'Could not connect to HyruleSync. ',
    'No se pudo iniciar la descarga.':'Could not start the download.',
    'Acerca de, licencias y créditos':'About, licenses and credits', 'Acerca de HyruleSync':'About HyruleSync',
    'Autoría':'Authorship', 'Un proyecto fuertemente impulsado por IA.':'A project strongly driven by AI.',
    'Desarrollado por Neimex23 con amplia asistencia de Codex · GPT-6.1 · razonamiento Alto.':'Developed by Neimex23 with extensive assistance from Codex · GPT-6.1 · High reasoning.',
    'Código de HyruleSync':'HyruleSync code', 'Ver licencia MIT':'View MIT license', 'Ver licencia de Leaflet':'View Leaflet license',
    'Avisos y procedencia de terceros':'Third-party notices and provenance', 'Proyectos y referencias':'Projects and references',
    'Catálogo, mapas, iconos y criterios de completado.':'Catalog, maps, icons and completion conditions.',
    'Biblioteca del mapa interactivo · BSD-2-Clause.':'Interactive map library · BSD-2-Clause.',
    'Referencias reconocidas por TotK Unexplored:':'References acknowledged by TotK Unexplored:',
    'No se encontró una licencia explícita de los recursos de Unexplored en la versión revisada. Se descargan por separado y conservan su procedencia.':'No explicit license for Unexplored resources was found in the reviewed version. Resources are downloaded separately and retain their provenance.',
    'Proyecto no oficial. The Legend of Zelda y sus recursos pertenecen a sus titulares, incluida Nintendo.':'Unofficial project. The Legend of Zelda and its assets belong to their respective owners, including Nintendo.',
    'Los textos originales de licencia se conservan en inglés.':'Original license texts are preserved in English.',
    'Cerrar':'Close', 'No se pudo cargar el texto de licencia.':'Could not load the license text.'
  };
  function t(source, values = {}) {
    let text = language === 'es' ? source : (en[source] ?? source);
    return text.replace(/\{(\w+)\}/g, (match, key) => values[key] === undefined ? match : String(values[key]));
  }
  function apply(root = document.body) {
    document.documentElement.lang = language;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const value = node.nodeValue, trimmed = value.trim();
      if (en[trimmed]) node.nodeValue = value.replace(trimmed, t(trimmed));
    }
    for (const element of root.querySelectorAll('[placeholder],[title],[aria-label]')) {
      for (const attribute of ['placeholder','title','aria-label']) {
        const value = element.getAttribute(attribute);
        if (value && en[value]) element.setAttribute(attribute,t(value));
      }
    }
  }
  return { t, apply, translations:en, get language(){return language;}, setLanguage(value){language=value==='es'?'es':'en';} };
})();
