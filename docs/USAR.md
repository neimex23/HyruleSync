# HyruleSync · inicio rápido

1. Extrae el ZIP y abre **HyruleSync.exe**.
2. En el primer inicio, pulsa **Descargar recursos del mapa**. Necesita internet una vez para preparar los mapas (unos 44 MB).
3. Pulsa **Seguir carpeta → Explorar carpetas**. Elige la carpeta de una cuenta que contenga `slot_00`, `slot_01`… También puedes pegar la ruta.
4. Déjalo abierto mientras juegas. **Seguir carpeta es la opción recomendada**: Autosync se activa automáticamente, recuerda la carpeta y detecta autoguardados y guardados manuales. Se sigue el slot con mayor tiempo de juego.

No necesitas instalar Unexplored, Python, Node ni un mod. Requiere Windows, .NET Framework 4.x y un navegador moderno. Extrae en una carpeta con permiso de escritura.

Cerrar la última pestaña cierra también HyruleSync tras unos cinco segundos. Recargar o mantener otra pestaña abierta no lo cierra. Para continuar con Autosync sin la página, activa **Acerca de → Mantener HyruleSync en la bandeja**; después puedes volver con doble clic en su icono o cerrarlo con **Salir**. No arranca con Windows.

**Cargar .sav** consulta una partida manualmente y desactiva Autosync. Para seguir jugando con actualizaciones, vuelve a seleccionar la carpeta o activa el interruptor. Si el juego está escribiendo un archivo, se conserva el último estado válido y se reintenta.

**Centrar en Link** muestra su última posición guardada y acerca la vista si hace falta, conservando un zoom más cercano. Activa **Seguir a Link al actualizar** para centrar la vista y cambiar a su capa con cada nuevo guardado leído, conservando el zoom. La opción empieza desactivada y se recuerda al reiniciar. La posición cambia al guardar la partida; si no se puede leer, se indica en pantalla.

La app busca actualizaciones estables de GitHub al abrir la interfaz y una vez por hora. Puedes reintentar desde **Acerca de → Buscar actualizaciones**. Si hay una versión nueva con paquete Windows, aparece **Descargar actualización**. Descarga el ZIP, cierra HyruleSync y reemplaza los ejecutables conservando `.data/` y `.state/`. Los errores de conexión no interrumpen el seguimiento. **Reportar problema** abre un nuevo issue del repositorio para que lo completes y envíes.

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
