import { useEffect } from "react";

import { useStoreValue } from "../use-store.js";
import { MapPanel } from "../../features/map/MapPanel.jsx";
import { ViewTabs } from "./ViewTabs.jsx";
import { I18N } from "../../shared/i18n.js";
import { InventoryPanel } from "../../features/inventory/InventoryPanel.jsx";
import { QuestsPanel } from "../../features/quests/QuestsPanel.jsx";
import { WorldPanel } from "../../features/world/WorldPanel.jsx";
import { SummaryPanel } from "../../features/summary/SummaryPanel.jsx";

const t = (key, values) => I18N.t(key, values);

export function Workspace({ store }) {
  const view = useStoreValue(store, "view");
  useEffect(() => {
    if (view === "map") store.actions.refreshMapSize?.();
  }, [store, view]);

  return (
    <main>
      <ViewTabs store={store} />

      <section id="previewBanner" hidden>
        <span id="previewLabel"></span>
        <button id="returnLive" className="secondary">
          {t("Volver al seguimiento")}
        </button>
      </section>

      <MapPanel hidden={view !== "map"} />

      <InventoryPanel store={store} />

      <QuestsPanel store={store} />
      <WorldPanel store={store} />
      <SummaryPanel store={store} />

      <div id="toast" role="status" hidden></div>
    </main>
  );
}
