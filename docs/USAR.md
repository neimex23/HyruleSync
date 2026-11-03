# HyruleSync · inicio rápido

La app abre automáticamente `http://hyrulesync.localhost:<puerto>/<sesión>/`. Los navegadores modernos de Windows resuelven ese nombre localmente sin configurar DNS ni pedir permisos de administrador. Usa la URL completa que abre el programa; el puerto y la ruta privada de sesión cambian al iniciar. El acceso sigue limitado a este equipo.

1. Extrae el ZIP y abre **HyruleSync.exe**.
2. En el primer inicio, pulsa **Descargar recursos del mapa**. Necesita internet una vez para preparar los mapas (unos 44 MB).
3. Pulsa **Seguir carpeta → Explorar carpetas**. Elige la carpeta de una cuenta que contenga `slot_00`, `slot_01`… También puedes pegar la ruta.
4. Déjalo abierto mientras juegas. **Seguir carpeta es la opción recomendada**: Autosync se activa automáticamente, recuerda la carpeta y detecta autoguardados y guardados manuales. Se sigue el guardado válido con fecha de modificación más reciente; el tiempo de juego solo desempata.

No necesitas instalar Unexplored, Python, Node ni un mod. Requiere Windows, .NET Framework 4.x y un navegador moderno. Extrae en una carpeta con permiso de escritura.

Cerrar la última pestaña cierra también HyruleSync tras unos cinco segundos. Recargar o mantener otra pestaña abierta no lo cierra. Para continuar con Autosync sin la página, activa **Acerca de → Mantener HyruleSync en la bandeja**; después puedes volver con doble clic en su icono o cerrarlo con **Salir**. No arranca con Windows.

**Cargar .sav** consulta una partida manualmente y desactiva Autosync. Para seguir jugando con actualizaciones, vuelve a seleccionar la carpeta o activa el interruptor. Si el juego está escribiendo un archivo, se conserva el último estado válido y se reintenta.

Al seguir una carpeta de Recomp `profile/save/<cuenta>`, HyruleSync también detecta guardados terminados pendientes en `profile/save-tx/ready-*` correspondientes a la cuenta activa de `account.uid`. Si otro programa impide al juego reemplazar su carpeta habitual, el seguimiento usa silenciosamente la transacción terminada más reciente. Vuelve automáticamente a la carpeta habitual cuando el juego la publica. La copia de trabajo `save-tx/work` nunca se sigue automáticamente. HyruleSync no publica transacciones ni libera bloqueos; un respaldo solo de la carpeta habitual puede seguir desactualizado.

**Centrar en Link** muestra su última posición guardada y acerca la vista si hace falta, conservando un zoom más cercano. Activa **Seguir a Link al actualizar** para centrar la vista y cambiar a su capa con cada nuevo guardado leído, conservando el zoom. La opción empieza desactivada y se recuerda al reiniciar. La posición cambia al guardar la partida; si no se puede leer, se indica en pantalla.

La app busca actualizaciones estables de GitHub al abrir la interfaz y una vez por hora. Puedes reintentar desde **Acerca de → Buscar actualizaciones**. Si hay una versión nueva con paquete Windows, aparece **Descargar actualización** tanto en Acerca de como en el panel lateral; pulsa ese enlace para descargar el ZIP. Cierra HyruleSync y reemplaza solo `HyruleSync.exe` y `HyruleSync.Stop.exe`, conservando las carpetas `.data/` y `.state/` (contienen tus mapas descargados y preferencias; no las borres ni las sobrescribas). Los errores de conexión no interrumpen el seguimiento. **Reportar problema** abre un nuevo issue del repositorio para que lo completes y envíes.

HyruleSync solo lee los guardados. Sus preferencias están en `.state/` y los mapas descargados en `.data/`, junto al ejecutable. Conserva esas carpetas para evitar configurar o descargar de nuevo. No compartas `.state/` ni tus partidas.

El total es el del catálogo, no el porcentaje oficial de TOTK. Las condiciones y datos proceden del proyecto TotK Unexplored y conservan sus limitaciones.

## Autoría, IA e idiomas

Autor: **Neimex23**. Proyecto fuertemente impulsado por IA, desarrollado con amplia asistencia de **Codex · GPT-6.1 · razonamiento Alto**.

Puedes elegir **Idioma → Español / English / Automático (Windows)** en la barra lateral o en la pantalla inicial. La elección se guarda para los próximos inicios y la página se recarga automáticamente para aplicarla. En automático se usa español si Windows está en español; inglés en los demás casos. No utiliza el idioma del navegador. El menú «Acerca de, licencias y créditos» muestra la autoría, esta declaración, enlaces a los repositorios y los textos originales de las licencias en inglés.

Ejecuta **HyruleSync.Stop.exe** para cerrar los procesos de HyruleSync de tu sesión. Primero intenta un cierre limpio y después termina las instancias restantes. No cierra el juego ni el navegador; informa si alguna instancia tiene permisos diferentes.

## Mapa y consulta de guardados

Link se muestra según el contexto del último guardado: dentro de un santuario aparece en su entrada con un aro azul y un símbolo de santuario. Un contexto desconocido no se proyecta sobre Hyrule. Por defecto, Link se muestra debajo de los iconos con una opacidad del 45 %. Puedes ocultar Link y elegir si queda encima o debajo de los iconos. Ocultarlo suspende el centrado automático y conserva la preferencia de seguimiento. Estas opciones se recuerdan al reiniciar. El recuadro **Link en el mapa** reúne visibilidad, seguimiento, orden y opacidad (0–100 %, con vista previa al mover el control).

El catálogo incluye 15 atalayas adicionales: el completado exige activación, y el detalle distingue si fueron visitadas. Son 21 categorías y 2.414 puntos; el contador sigue sin representar el porcentaje oficial del juego.

«Guardados» permite consultar los slots de la carpeta actual o un archivo elegido manualmente. Muestra fecha de modificación, tiempo jugado, formato, ubicación y progreso por categoría. «Ver en el mapa» abre una instantánea fija; Autosync sigue leyendo la carpeta en segundo plano. Usa «Volver al seguimiento» para mostrar el último guardado observado. No hay comparación, backups, restauración ni edición de saves. Las consultas no cambian el origen observado.

«Ver cambios», en el aviso de actualización y en «Acerca de», muestra las notas de la última Release estable disponible, con enlace a GitHub. Requiere una consulta de actualizaciones exitosa durante la sesión; si faltan notas se indica expresamente.


## Guías externas

Cada punto tiene un botón **Ver guía** que abre Zelda Dungeon en otra pestaña. Los lugares con nombre abren su ficha; los coleccionables sin nombre y las demás categorías abren el mapa externo en sus coordenadas y capa, donde puedes seleccionar el icono correspondiente para consultar la ayuda. Las páginas externas pueden cambiar o tener información incompleta. No se guarda una colección de referencias ni contenido de guías descargado.


## HyruleWorld

Los retratos de personajes por descubrir aparecen difuminados. Haz clic o pulsa Entrar sobre el retrato para revelarlo; **Volver a difuminar** lo oculta otra vez. Revelar una imagen solo cambia la vista: no registra el personaje ni modifica la partida.

Las imágenes de entradas **Sin registrar** de la enciclopedia tienen el mismo comportamiento. Revelarlas no las registra; **Dónde conseguirlo** sigue abriendo los detalles de la ficha.

La guía compara los 22 perfiles con la partida seleccionada. Usa **Estado de descubrimiento → Por descubrir** para ver quién falta. Los retratos requieren conexión y tienen iniciales locales de respaldo. Los campos ausentes quedan sin verificar; leer un perfil no pierde el descubrimiento. El contador y el filtro siguen Autosync o la partida inspeccionada.

**Tu álbum** muestra registros fotografiados y comprados de la partida activa o inspeccionada. La **Enciclopedia hyliana** incluye las 509 entradas, con búsqueda en español/inglés y filtros de categoría y estado. Abre **Dónde conseguirlo** para consultar zonas habituales y una guía de Zelda Dungeon. La **Guía de personajes** incluye los 22 perfiles, lugares y notas de encuentro, con detalles de la historia. Las fotos personales no se leen de `progress.sav`; las ilustraciones son referencias externas con iconos locales de respaldo. Nombres, lugares y notas funcionan sin conexión. Las partidas siguen siendo de solo lectura.

## Inventario

Abre **Inventario**, junto a Mapa, para consultar vida guardada, corazones/stamina/batería máximos, rupias y puntos del establo. Las nueve bolsas permiten buscar equipo, armaduras, flechas, materiales, comida, dispositivos zonnan y objetos importantes. Incluyen cantidades, capacidad disponible y detalles: durabilidad, fusiones, bonificaciones, tintes, efectos e ingredientes. Los nombres siguen el idioma elegido y se conserva el ID original. Los datos ausentes aparecen como no disponibles. Inventario usa el mismo guardado en vivo o consultado que el mapa. La partida sigue siendo de solo lectura.


## Misiones

La pestaña **Misiones** incluye las 253 entradas del diario: hechas, en curso, por hacer y sin verificar. Usa el mismo guardado en seguimiento o consulta temporal que Mapa e Inventario. Permite buscar por nombre, personaje o lugar y filtrar por tipo/estado. **Ver en el mapa** elige la capa y resalta el marcador. La categoría **Misiones** de los filtros laterales permite mostrarlos u ocultarlos; los filtros de Misiones también se aplican a sus marcadores, independientemente de los filtros de coleccionables. Los marcadores compartidos se separan visualmente para poder elegir cada uno. Indican una zona de referencia o el santuario asociado, no la posición exacta del personaje ni el objetivo actual; cinco misiones no tienen ubicación fija. Los nombres de misiones, personajes y lugares asociados siguen el idioma español/inglés elegido, tanto en las fichas como en sus marcadores. La búsqueda acepta ambos idiomas y los enlaces de las guías conservan su destino original en inglés. No hay marcado manual ni edición del guardado.

La categoría **Misiones** de los filtros laterales, con su propio icono y desactivada por defecto, muestra u oculta todos los marcadores. Cada misión también tiene su casilla **Mostrar en el mapa**: ocultarla conserva la misión en la lista y su preferencia al activar o desactivar la categoría. **Ver en el mapa** vuelve a mostrar esa misión.

Cada misión y marcador incluye **Ver guía · Zelda Dungeon**, con la ficha correspondiente en otra pestaña. **Verificar contra el guardado** permite consultar ID, campo Step, etapa, enum leído y revisión del save. El estado siempre procede del guardado; las casillas de visibilidad solo afectan al mapa. Prueba opcional del seguimiento: `node tests/quest-autosync.cjs <save-de-entrada-solo-lectura> <directorio-app>`; modifica únicamente copias privadas de prueba.


## Mapas de alta resolución

**HD** es la calidad por defecto: el control **Mapa: HD** de los controles superiores izquierdos del mapa muestra el detalle opcional de ZeldaMods en superficie, cielo y subsuelo. Los mosaicos se descargan al explorar y se guardan en `.data/hd-map/zeldamods-v1/` (hasta 512 MB). La elección se recuerda entre reinicios. Las zonas descargadas funcionan sin conexión; donde falte detalle HD se muestra el fondo estándar. **Reintentar HD** vuelve a intentar las zonas no disponibles. El modo **SD** no solicita mosaicos HD y conserva los mapas originales sin conexión. No hay descarga anticipada del mapa completo. Usa **Descargar mapa HD completo** en la barra lateral para bajar todos los mosaicos (≈80–120 MB) y tener el mapa entero sin conexión.

Las imágenes HD son externas y no se incluyen en el ZIP. Las solicitudes pasan por la aplicación local hacia ZeldaMods y contienen solo capa/zoom/coordenadas del mosaico, sin partidas ni rutas locales. Consulta los avisos de terceros para conocer su procedencia.

El servidor actual de ZeldaMods exige TLS 1.3 para descargar. Se necesita Windows 11 o posterior con una instalación compatible de .NET Framework; en Windows anteriores se conserva el mapa estándar y se pueden usar mosaicos HD ya guardados. Consulta el [soporte TLS de Microsoft](https://learn.microsoft.com/en-us/dotnet/framework/network-programming/tls).
