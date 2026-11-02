import { useStoreValue } from "../use-store.js";
import { I18N } from "../../shared/i18n.js";

const views = ["map", "inventory", "quests"];

const labels = { map: "Mapa", inventory: "Inventario", quests: "Misiones" };

export function ViewTabs({ store }) {
  const view = useStoreValue(store, "view");

  function navigate(event, current) {
    const index = views.indexOf(current);
    const next = {
      Home: 0,
      End: views.length - 1,
      ArrowRight: (index + 1) % views.length,
      ArrowLeft: (index + views.length - 1) % views.length,
    }[event.key];

    if (next == null) return;
    event.preventDefault();
    store.actions.setSaveView(views[next]);
    document.getElementById(views[next] + "Tab").focus();
  }

  return (
    <nav
      className="view-tabs"
      role="tablist"
      aria-label={I18N.t("Vistas de la partida")}
    >
      {views.map((name) => (
        <button
          key={name}
          id={name + "Tab"}
          role="tab"
          aria-selected={view === name}
          aria-controls={name + "Panel"}
          tabIndex={view === name ? 0 : -1}
          onClick={() => store.actions.setSaveView(name)}
          onKeyDown={(event) => navigate(event, name)}
        >
          {I18N.t(labels[name])}
        </button>
      ))}
    </nav>
  );
}
