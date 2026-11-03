import { I18N } from "../../shared/i18n.js";

const t = (key, values) => I18N.t(key, values);

export function Sidebar() {
  return (
    <aside id="sidebar">
      <header>
        <div className="eyebrow">{t("EXPLORA · GUARDA · SINCRONIZA")}</div>
        <h1 className="brand">
          <img src="app-icon.png" alt="" />
          <span>
            {t("Hyrule")}
            <em>{t("Sync")}</em>
          </span>
        </h1>
        <p>{t("Descubre lo que queda por encontrar.")}</p>
        <button id="aboutOpen" className="link-button about-link">
          {t("Acerca de, licencias y créditos")}
        </button>
        <a
          className="report-button"
          href="https://github.com/neimex23/HyruleSync/issues/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Reportar problema")}
        </a>
        <div className="language-setting">
          <label htmlFor="languageSelect">{t("Idioma")}</label>
          <select id="languageSelect" data-language-select="">
            <option value="auto">{t("Automático (Windows)")}</option>
            <option value="es" lang="es">
              {t("Español")}
            </option>
            <option value="en" lang="en">
              {t("English")}
            </option>
          </select>
        </div>
      </header>

      <section className="source">
        <div className="source-heading">
          <i id="statusDot"></i>
          <strong id="statusTitle">{t("Cargando partida…")}</strong>
          <span className="badge">{t("SOLO LECTURA")}</span>
        </div>
        <p id="sourceName">{t("Reconociendo el guardado configurado…")}</p>

        <div className="load-buttons">
          <button id="openFolder" disabled>
            {t("Seguir carpeta")}
          </button>
          <button id="openSave" className="secondary" disabled>
            {t("Cargar .sav")}
          </button>
        </div>
        <label className="switch">
          <input type="checkbox" id="autosync" />
          <span>{t("Autosync al guardar")}</span>
          <button id="refresh" className="link-button">
            {t("Actualizar ahora")}
          </button>
        </label>
        <p id="liveStatus" role="status"></p>
        <p id="saveInfo"></p>
        <button id="openSaves" className="secondary">
          {t("Guardados")}
        </button>
        <p id="error" role="alert" hidden></p>
      </section>

      <section
        className="source link-tracking"
        aria-labelledby="linkControlsTitle"
      >
        <h2 id="linkControlsTitle">{t("Link en el mapa")}</h2>
        <label className="switch">
          <input type="checkbox" id="showLink" defaultChecked />
          <span>{t("Mostrar Link")}</span>
        </label>
        <label className="switch">
          <input type="checkbox" id="followLink" />
          <span>{t("Seguir a Link al actualizar")}</span>
        </label>

        <div className="link-display-controls">
          <div className="link-order">
            <label htmlFor="linkOrder">{t("Orden del marcador")}</label>
            <select id="linkOrder" defaultValue="below">
              <option value="above">{t("Encima de los iconos")}</option>
              <option value="below">{t("Debajo de los iconos")}</option>
            </select>
          </div>
          <div className="link-opacity">
            <div className="opacity-label">
              <label htmlFor="linkOpacity">{t("Opacidad")}</label>
              <output id="linkOpacityValue" htmlFor="linkOpacity">
                {t("45%")}
              </output>
            </div>
            <input
              type="range"
              id="linkOpacity"
              min="0"
              max="100"
              step="5"
              defaultValue="45"
            />
          </div>
        </div>
        <button id="centerLink" className="secondary" disabled>
          {t("Centrar en Link")}
        </button>
        <p id="linkPosition" role="status">
          {t("La posición de Link no está disponible en este guardado.")}
        </p>
        <p>
          {t(
            "Posición del último guardado leído; se actualiza al guardar la partida.",
          )}
        </p>

        <details>
          <summary>{t("Diagnóstico de posición")}</summary>
          <p id="linkDiagnostics"></p>
        </details>
      </section>

      <section
        id="updateNotice"
        className="source update-notice"
        role="status"
        hidden
      >
        <strong id="updateMessage"></strong>
        <button id="viewChanges" className="secondary" disabled>
          {t("Ver cambios")}
        </button>
        <a
          id="downloadUpdate"
          className="download-button"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Descargar actualización")}
        </a>
        <p>
          {t(
            "Extrae el ZIP y reemplaza solo HyruleSync.exe y HyruleSync.Stop.exe con HyruleSync cerrado. Conserva las carpetas .data y .state (mapas y preferencias).",
          )}
        </p>
      </section>

      <section className="summary">
        <div className="eyebrow">{t("TU PROGRESO EN HYRULE")}</div>

        <div className="numbers">
          <strong id="foundCount">{t("—")}</strong>
          <span>
            {t("completados de ")}
            <b id="totalCount">{t("—")}</b>
          </span>
        </div>

        <div className="progress">
          <i id="progress"></i>
        </div>
        <p id="missingCount">
          {t("Carga una partida para calcular los pendientes.")}
        </p>
      </section>

      <div className="search">
        <input
          type="search"
          id="search"
          aria-label={t("Buscar en el mapa")}
          placeholder={t("Buscar nombre, tipo o coordenadas…")}
        />
      </div>

      <div className="filter-row">
        <label htmlFor="showMode">{t("Ver")}</label>
        <select id="showMode">
          <option value="missing">{t("Pendientes")}</option>
          <option value="discovered">{t("Descubiertos")}</option>
          <option value="found">{t("Completados")}</option>
          <option value="chests">
            {t("Santuarios con cofres pendientes")}
          </option>
          <option value="all">{t("Todos")}</option>
          <option value="unknown">{t("Sin verificar")}</option>
        </select>
      </div>

      <p className="map-state-legend">
        <i aria-hidden="true"></i>
        {t("Amarillo: santuario o atalaya descubierto sin completar.")}
      </p>

      <div className="category-title">
        <h2>{t("Categorías")}</h2>
        <button id="all" className="link-button">
          {t("Todas")}
        </button>
        <button id="none" className="link-button">
          {t("Ninguna")}
        </button>
      </div>

      <div id="categories"></div>

      <footer>
        <details>
          <summary>{t("Datos y funcionamiento")}</summary>
          <p>
            {t(
              "Catálogo, mapas, iconos, rutas y condiciones de completado de ",
            )}
            <a
              href="https://github.com/lud99/totk-unexplored"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("TotK Unexplored")}
            </a>
            {t(". No se han añadido ubicaciones al archivo original.")}
          </p>
          <p>
            {t(
              "«Completado» sigue el criterio de Unexplored. En santuarios exige Clear; en raíces Open. Las entradas que comparten el mismo hash comparten estado.",
            )}
          </p>
          <p>
            {t(
              "Las 15 atalayas se agregan por separado con datos de Marc Robledo. Se completan al activarlas.",
            )}
          </p>
          <p>
            {t(
              "El total es el del catálogo y no representa el porcentaje oficial del mapa. Los nombres y tipos se conservan en su idioma original.",
            )}
          </p>
          <p>
            {t(
              "La aplicación solo lee la partida. Un archivo con un hash desconocido se muestra como «sin verificar».",
            )}
          </p>
          <p>
            {t(
              "«Cargar .sav» abre una instantánea del archivo. En «Seguir carpeta» se elige el guardado con más tiempo de juego, igual que el original. Al elegir la carpeta de una sola cuenta se activa Autosync. Puedes dejarlo abierto mientras juegas. Activa la opción de bandeja en Acerca de para seguir leyendo con la pestaña cerrada.",
            )}
          </p>
          <p>
            {t(
              "Todo funciona localmente, incluidos los fondos del mapa. Para salir por completo, usa el icono junto al reloj de Windows.",
            )}
          </p>
          <p id="watchedPath"></p>
        </details>
      </footer>
    </aside>
  );
}
