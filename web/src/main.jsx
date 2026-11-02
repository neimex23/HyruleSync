import { createRoot } from "react-dom/client";

import { App } from "./app/App.jsx";
import { I18N } from "./shared/i18n.js";
import { request } from "./shared/api.js";
import { createViewStore } from "./app/store.js";

import "leaflet/dist/leaflet.css";
import "./styles/index.css";

const config = await request("api/config").catch(() => ({ language: "en" }));

I18N.setLanguage(config.language);
document.documentElement.lang = I18N.language;

const root = createRoot(document.getElementById("root"));
root.render(<App store={createViewStore()} config={config} />);

if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
