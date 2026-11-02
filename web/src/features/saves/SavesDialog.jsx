import { I18N } from "../../shared/i18n.js";

const t = (key, values) => I18N.t(key, values);

export function SavesDialog() {
  return (
    <dialog id="savesDialog">
      <form method="dialog">
        <h2>{t("Guardados")}</h2>
        <p>
          {t("Consulta tus slots sin cambiar la carpeta que sigue Autosync.")}
        </p>
        <button id="reloadSlots" type="button" className="secondary">
          {t("Actualizar lista")}
        </button>
        <p id="noSlots" hidden>
          {t(
            "No hay slots en la selección actual. Puedes consultar un archivo manualmente.",
          )}
        </p>

        <div id="saveSlots"></div>
        <label htmlFor="inspectFilePath">{t("Ruta del archivo")}</label>
        <input
          id="inspectFilePath"
          type="text"
          placeholder={t("C:\\…\\slot_00\\progress.sav")}
        />

        <div className="inspect-actions">
          <button id="inspectPath" type="button" className="secondary">
            {t("Consultar archivo")}
          </button>
          <label className="file-button">
            {t("Explorar archivos…")}
            <input
              id="inspectUpload"
              type="file"
              accept=".sav"
              aria-label={t("Explorar archivos")}
            />
          </label>
        </div>
        <p id="savesError" role="alert"></p>

        <section id="inspectedDetails" hidden>
          <h3>{t("Detalle del guardado")}</h3>
          <p id="inspectedInfo"></p>
          <p id="inspectedLocation"></p>
          <table className="save-counts">
            <thead>
              <tr>
                <th>{t("Categorías")}</th>
                <th>{t("Completados / Total")}</th>
                <th>{t("Sin verificar")}</th>
              </tr>
            </thead>
            <tbody id="saveCounts"></tbody>
          </table>
          <button id="viewInspected" type="button" disabled>
            {t("Ver en el mapa")}
          </button>
        </section>

        <div className="dialog-actions">
          <button>{t("Cerrar")}</button>
        </div>
      </form>
    </dialog>
  );
}
