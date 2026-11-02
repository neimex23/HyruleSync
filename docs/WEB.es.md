# Desarrollo web

[English](WEB.md)

La interfaz usa React, Vite y ESLint. Para desarrollarla necesitas Node.js 22.12 o posterior; CI usa Node 24. El usuario del ejecutable Windows no necesita Node.

```powershell
npm ci
npm run dev      # Recarga automática; requiere el proxy explicado abajo
npm run lint
npm test
npm run build    # Archivos web intermedios en .local/build/web/
npm run check    # Lint, pruebas y compilación de producción
```

`build.cmd` instala las dependencias fijadas, compila la web e incorpora `.local/build/web/` al ejecutable C#. Tras crear correctamente el ZIP, elimina esa carpeta web intermedia. Queda fuera de `outputs/` y no se distribuye al usuario final. `npm run build` por separado conserva el resultado para desarrollo. Los archivos generados y `node_modules/` se ignoran en Git. Incluye `package-lock.json` al cambiar dependencias. Los comandos existentes `node tests/*.cjs` de interfaz siguen funcionando y ejecutan las pruebas React correspondientes.

## Usar la API local durante el desarrollo

Inicia una copia compilada sin abrir el navegador y guarda su URL privada:

```powershell
.\outputs\HyruleSync\HyruleSync.exe --no-browser --url-file .local\web-url.txt
```

Cuando exista el archivo, abre otra terminal en la raíz del repositorio:

```powershell
$env:HYRULESYNC_URL = (Get-Content .local/web-url.txt -Raw).Trim()
npm run dev
```

Abre la dirección de Vite que aparece en esa terminal. La variable debe contener la URL completa de la aplicación, incluida la ruta de sesión y la barra final. El proxy envía las solicitudes de API, catálogo, mapas y licencias a esa sesión local y adapta Origin para que coincida con Host. Sin el proxy, Vite sirve la interfaz pero no dispone de guardados ni mapas. Mantén el ejecutable abierto; cerrar la última pestaña de desarrollo respeta la opción de bandeja habitual.

## Organización

```text
web/src/
  main.jsx
  app/
    components/
  features/
    inventory/
    map/
    quests/
    saves/
    settings/
    setup/
  shared/
  styles/
```

- `app/`: raíz React, controlador de la aplicación, estado, suscripciones y ciclo de vida. `components/` contiene la barra lateral, las pestañas y los contenedores de vistas y diálogos.
- `features/inventory/`: panel, tarjetas y modelo del inventario.
- `features/map/`: panel del mapa, coordenadas, filtros y gestión de fondos SD/HD.
- `features/quests/`: panel, tarjetas, modelo y controlador de misiones y marcadores.
- `features/saves/`: selección e inspección de guardados, navegación de carpetas y sus diálogos.
- `features/settings/`: ajustes, créditos, licencias y avisos de versiones.
- `features/setup/`: pantalla de preparación del primer inicio.
- `shared/`: API local, traducciones y utilidades compartidas.
- `styles/index.css`: punto de entrada de los estilos por área. El orden de importación conserva la cascada.
- `web/public/`: datos e iconos estáticos que Vite copia sin cambios.
- `tests/web/`: pruebas de componentes y modelos con Vitest y jsdom. Las pruebas Windows del servidor, idiomas y cierre de procesos siguen en `tests/`.

Separa con una línea en blanco las importaciones, declaraciones exportadas, funciones y fases de una operación. JSX separa los bloques visuales y CSS separa las reglas. ESLint verifica el espaciado entre bloques JavaScript y Prettier conserva el formato. Cada funcionalidad mantiene juntos su interfaz y su lógica; los componentes de `app/` coordinan las vistas. Las suscripciones usan solo el fragmento de estado que necesita cada componente.

React escapa los textos y gestiona las imágenes de inventario ausentes con un callback. Leaflet conserva HTML escapado en sus tooltips y popups. Las rutas del resultado compilado son relativas para funcionar con cualquier sesión privada. React y Leaflet se distribuyen localmente, sin depender de un CDN.

Los catálogos y snapshots se tratan como datos inmutables. Los filtros del mapa reutilizan resultados al desplazar la vista; el inventario conserva el texto normalizado de cada objeto mediante referencias débiles. Al recibir otro snapshot o catálogo, los resultados se recalculan con los datos nuevos. Mantén este contrato al agregar funciones que actualicen guardados o traducciones.
