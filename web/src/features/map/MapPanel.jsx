import { I18N } from "../../shared/i18n.js";
import { MapQualityControl } from "./MapQualityControl.jsx";

const t = (key, values) => I18N.t(key, values);

export function MapPanel({ hidden }) {
  return (
    <div id="mapPanel" role="tabpanel" aria-labelledby="mapTab" hidden={hidden}>
      <div id="map" aria-label={t("Mapa de HyruleSync")}></div>

      <div className="topbar">
        <MapQualityControl />
        <button id="toggleSidebar" className="small-button mobile">
          {t("☰ Filtros")}
        </button>
        <div className="layers" role="group" aria-label={t("Capa del mapa")}>
          <button data-layer="depths">{t("Subsuelo")}</button>
          <button data-layer="surface" className="active">
            {t("Superficie")}
          </button>
          <button data-layer="sky">{t("Cielo")}</button>
        </div>
        <span id="visibleCount">{t("—")}</span>
      </div>

      <div className="map-controls">
        <button id="zoomIn" title={t("Acercar")} aria-label={t("Acercar")}>
          {t("+")}
        </button>
        <button id="zoomOut" title={t("Alejar")} aria-label={t("Alejar")}>
          {t("−")}
        </button>
        <button
          id="fitMap"
          title={t("Ver todo el mapa")}
          aria-label={t("Ver todo el mapa")}
        >
          {t("⛶")}
        </button>
      </div>

      <div className="bottom">
        <label>
          <input type="checkbox" id="showPaths" defaultChecked />
          {t(" Rutas de kologs y cuevas")}
        </label>
        <span id="mouseCoords">{t("Este · Norte")}</span>
      </div>

      <section id="startupLoading" role="status" aria-live="polite">
        <span className="startup-spinner" aria-hidden="true"></span>
        <p>{t("Cargando partida…")}</p>
      </section>

      <section id="welcome" hidden>
        <div className="eyebrow">{t("TU PARTIDA, SIEMPRE AL DÍA")}</div>
        <h2>{t("¿Qué queda por explorar?")}</h2>
        <p>
          {t(
            "Elige la carpeta de guardados de tu cuenta. Autosync se activa automáticamente y actualiza el mapa con cada autoguardado o guardado manual.",
          )}
        </p>

        <div className="load-buttons">
          <button id="welcomeFolder">{t("Seguir carpeta")}</button>
          <button id="welcomeLoad" className="secondary">
            {t("Cargar .sav")}
          </button>
        </div>
        <p className="fine">{t("No convierte ni modifica el guardado.")}</p>
      </section>

      <section id="detail" hidden>
        <button id="closeDetail" aria-label={t("Cerrar detalle")}>
          {t("×")}
        </button>

        <div className="detail-title">
          <img id="detailIcon" alt="" />
          <div>
            <div id="detailCategory" className="eyebrow"></div>
            <h2 id="detailName"></h2>
          </div>
        </div>

        <div id="detailState"></div>
        <p id="detailChests" hidden></p>

        <div className="coords">
          <span>{t("ESTE · NORTE · ALTURA")}</span>
          <strong id="detailCoords"></strong>
          <button id="copyCoords" className="link-button">
            {t("Copiar")}
          </button>
        </div>
        <p id="korokInfo"></p>
        <button id="zoomSelected" className="secondary">
          {t("Centrar y acercar")}
        </button>
        <a
          id="viewGuide"
          className="guide-button"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("Ver guía en Zelda Dungeon (otra pestaña)")}
        >
          {t("Ver guía")}
        </a>
        <p id="guideHint"></p>

        <details>
          <summary>{t("Verificar contra el guardado")}</summary>
          <div id="diagnostics"></div>
        </details>
      </section>

      <div className="attribution">
        {t("Recursos: TotK Unexplored / ZeldaMods / Nintendo · Leaflet")}
      </div>
    </div>
  );
}
