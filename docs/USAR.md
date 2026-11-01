# HyruleSync · inicio rápido

1. Extrae el ZIP y abre **HyruleSync.exe**.
2. En el primer inicio, pulsa **Descargar recursos del mapa**. Necesita internet una vez para preparar los mapas (unos 44 MB).
3. Pulsa **Seguir carpeta → Explorar carpetas**. Elige la carpeta de una cuenta que contenga `slot_00`, `slot_01`… También puedes pegar la ruta.
4. Déjalo abierto mientras juegas. Autosync se activa automáticamente y recuerda la carpeta. Se sigue el slot con mayor tiempo de juego.

No necesitas instalar Unexplored, Python, Node ni un mod. Requiere Windows, .NET Framework 4.x y un navegador moderno. Extrae en una carpeta con permiso de escritura.

Puedes cerrar la pestaña: el lector continúa junto al reloj de Windows. Haz doble clic en su icono para volver al mapa, o clic derecho → **Salir** para cerrar completamente. No arranca con Windows.

**Cargar .sav** consulta una partida manualmente y desactiva Autosync. Para seguir jugando con actualizaciones, vuelve a seleccionar la carpeta o activa el interruptor. Si el juego está escribiendo un archivo, se conserva el último estado válido y se reintenta.

HyruleSync solo lee los guardados. Sus preferencias están en `.state/` y los mapas descargados en `.data/`, junto al ejecutable. Conserva esas carpetas para evitar configurar o descargar de nuevo. No compartas `.state/` ni tus partidas.

El total es el del catálogo, no el porcentaje oficial de TOTK. Las condiciones y datos proceden del proyecto TotK Unexplored y conservan sus limitaciones.

## Autoría, IA e idiomas

Autor: **Neimex23**. Proyecto fuertemente impulsado por IA, desarrollado con amplia asistencia de **Codex · GPT-6.1 · razonamiento Alto**.

La aplicación detecta el idioma de Windows: español si corresponde; inglés para los demás idiomas. No utiliza el idioma del navegador. El menú «Acerca de, licencias y créditos» muestra la autoría, esta declaración, enlaces a los repositorios y los textos originales de las licencias en inglés.

Ejecuta **HyruleSync.Stop.exe** para cerrar los procesos de HyruleSync de tu sesión. Primero intenta un cierre limpio y después termina las instancias restantes. No cierra el juego ni el navegador; informa si alguna instancia tiene permisos diferentes.
