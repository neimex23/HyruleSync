# Web development

[Español](WEB.es.md)

The interface uses React, Vite and ESLint. Node.js 22.12+ is required for development; CI uses Node 24. The packaged Windows application has no Node runtime dependency.

```powershell
npm ci
npm run dev      # Interface with hot reload; needs the local API proxy below
npm run lint
npm test
npm run build    # Intermediate web bundle in .local/build/web/
npm run check    # Lint, tests and production build
```

`build.cmd` installs the locked dependencies, runs the web build and embeds `.local/build/web/` into the C# executable. After successfully creating the ZIP, it deletes that intermediate web folder. It stays outside `outputs/` and is not distributed to end users. `npm run build` alone keeps the bundle for development. Generated files and `node_modules/` are ignored by Git. Commit `package-lock.json` with dependency changes. The original `node tests/*.cjs` interface checks remain available and invoke their React test suites.

## Connect development mode to the Windows application

Start a built application without opening the browser and request its private URL:

```powershell
.\outputs\HyruleSync\HyruleSync.exe --no-browser --url-file .local\web-url.txt
```

Once the file exists, use a second terminal from the repository root:

```powershell
$env:HYRULESYNC_URL = (Get-Content .local/web-url.txt -Raw).Trim()
npm run dev
```

Open the Vite URL printed in that terminal. The full application URL, including the session path and trailing slash, is required. The proxy forwards API, catalog, map and license requests to that local session and rewrites the Origin header to match its Host. Without the proxy, Vite can serve the React shell but cannot supply save state or maps. Keep the Windows application running; closing the last development tab follows the usual tray setting.

## Structure

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

- `app/`: React root, application controller, state, subscriptions and lifecycle. `components/` contains the sidebar, tabs and view/dialog containers.
- `features/inventory/`: inventory panel, cards and model.
- `features/map/`: map panel, coordinates, filters and SD/HD background management.
- `features/quests/`: quest panel, cards, model and quest/marker controller.
- `features/saves/`: save selection and inspection, folder browsing and related dialogs.
- `features/settings/`: settings, credits, licenses and release notices.
- `features/setup/`: first-run preparation screen.
- `shared/`: local API, translations and shared utilities.
- `styles/index.css`: entry point for styles grouped by area. Import order preserves the cascade.
- `web/public/`: static data and original assets; Vite copies them unchanged.
- `tests/web/`: component and model tests using Vitest and jsdom. Windows HTTP, language and process-lifetime integration checks remain in `tests/`.

Separate imports, exported declarations, functions and operation phases with a blank line. JSX separates visual sections and CSS separates rules. ESLint checks spacing between JavaScript blocks, while Prettier maintains formatting. Each feature keeps its interface and logic together; `app/` components coordinate the views. Subscriptions select only the state slice each component needs.

React renders text safely and handles inventory image fallbacks with an event callback. Leaflet still uses escaped HTML in tooltips/popups. Requests stay relative so the built UI works below every private session path. No CDN is required for React or Leaflet.

Catalogs and snapshots are treated as immutable data. Map filters reuse results when panning; the inventory caches normalized item search text using weak references. Replacement snapshots or catalogs recalculate results from the new data. Preserve this contract when adding save updates or translations.
