import { I18N } from "../../shared/i18n.js";

const t = (key, values) => I18N.t(key, values);

export function AboutDialog() {
  return (
    <dialog id="aboutDialog">
      <form method="dialog">
        <h2>{t("Acerca de HyruleSync")}</h2>
        <p id="aboutVersion"></p>
        <p id="updateStatus" role="status"></p>
        <button type="button" id="checkUpdates" className="secondary">
          {t("Buscar actualizaciones")}
        </button>
        <button type="button" id="aboutChanges" className="secondary" disabled>
          {t("Ver cambios")}
        </button>
        <a
          id="aboutDownloadUpdate"
          className="download-button"
          target="_blank"
          rel="noopener noreferrer"
          hidden
        >
          {t("Descargar actualización")}
        </a>
        <p id="aboutUpdateInstructions" hidden>
          {t(
            "Extrae el ZIP y reemplaza los ejecutables con HyruleSync cerrado. Conserva las carpetas .data y .state.",
          )}
        </p>
        <a
          className="report-button"
          href="https://github.com/neimex23/HyruleSync/issues/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Reportar problema")}
        </a>

        <h3>{t("Al cerrar la página")}</h3>
        <label className="switch background-setting">
          <input type="checkbox" id="runInBackground" />
          <span>{t("Mantener HyruleSync en la bandeja")}</span>
        </label>
        <p>
          {t(
            "Al cerrar la última pestaña, HyruleSync se cierra después de unos segundos. Activa esta opción para seguir leyendo guardados en segundo plano.",
          )}
        </p>

        <h3>{t("Autoría")}</h3>
        <p>
          <strong>{t("Neimex23")}</strong>
        </p>
        <p>{t("Un proyecto fuertemente impulsado por IA.")}</p>
        <p>
          {t(
            "Desarrollado por Neimex23 con amplia asistencia de Codex · GPT-6.1 · razonamiento Alto.",
          )}
        </p>

        <h3>{t("Código de HyruleSync")}</h3>
        <p>
          {t("MIT · Copyright © 2026 Neimex23 and HyruleSync contributors")}
        </p>

        <div className="legal-actions">
          <button type="button" data-license="app.txt" className="secondary">
            {t("Ver licencia MIT")}
          </button>
          <button
            type="button"
            data-license="leaflet.txt"
            className="secondary"
          >
            {t("Ver licencia de Leaflet")}
          </button>
          <button type="button" data-license="react.txt" className="secondary">
            {t("Ver licencia de React")}
          </button>
          <button
            type="button"
            data-license="savegame-editors.txt"
            className="secondary"
          >
            {t("Ver licencia de datos de atalayas")}
          </button>
          <button type="button" id="thirdPartyNotice" className="secondary">
            {t("Avisos y procedencia de terceros")}
          </button>
        </div>

        <h3>{t("Proyectos y referencias")}</h3>
        <p>
          <a
            href="https://github.com/lud99/totk-unexplored"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("TotK Unexplored · lud99 (BigBear)")}
          </a>
          <br />
          <span>{t("Catálogo, mapas, iconos y criterios de completado.")}</span>
        </p>
        <p>
          <a
            href="https://github.com/Leaflet/Leaflet"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("Leaflet")}
          </a>
          <br />
          <span>{t("Biblioteca del mapa interactivo · BSD-2-Clause.")}</span>
        </p>
        <p>{t("Referencias reconocidas por TotK Unexplored:")}</p>
        <ul>
          <li>
            <a
              href="https://github.com/marcrobledo/savegame-editors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("Savegame Editors · Marc Robledo")}
            </a>
          </li>
          <li>
            <a
              href="https://github.com/zeldamods/objmap-totk"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("ZeldaMods · objmap-totk")}
            </a>
          </li>
          <li>
            <a
              href="https://github.com/zeldamods/radar-totk"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("ZeldaMods · radar-totk")}
            </a>
          </li>
          <li>
            <a
              href="https://zeldadungeon.net"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("Zelda Dungeon")}
            </a>
          </li>
        </ul>
        <p>
          {t(
            "Mapas HD: mosaicos de ZeldaMods, descargados al explorar y guardados localmente. No se incluyen en el ZIP.",
          )}
        </p>
        <p>
          {t(
            "No se encontró una licencia explícita de los recursos de Unexplored en la versión revisada. Se descargan por separado y conservan su procedencia.",
          )}
        </p>
        <p>
          {t(
            "Proyecto no oficial. The Legend of Zelda y sus recursos pertenecen a sus titulares, incluida Nintendo.",
          )}
        </p>
        <p>{t("Los textos originales de licencia se conservan en inglés.")}</p>

        <div className="dialog-actions">
          <button>{t("Cerrar")}</button>
        </div>
      </form>
    </dialog>
  );
}
