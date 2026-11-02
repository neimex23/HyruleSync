import { I18N } from "../../shared/i18n.js";

const t = (key, values) => I18N.t(key, values);

export function FolderDialog() {
  return (
    <dialog id="folderDialog">
      <form method="dialog">
        <div className="eyebrow">{t("AUTOSYNC DE TOTK RECOMP")}</div>
        <h2>{t("Seguir una carpeta de guardados")}</h2>
        <p>
          {t(
            "Elige la carpeta de una sola cuenta. Autosync se activa automáticamente y detecta autoguardados y guardados manuales para mantener el mapa actualizado.",
          )}
        </p>
        <label htmlFor="knownFolders">{t("Carpetas detectadas")}</label>
        <select id="knownFolders">
          <option value="">{t("Ruta personalizada")}</option>
        </select>
        <label htmlFor="folderPath">{t("Ruta de la carpeta")}</label>
        <input
          type="text"
          id="folderPath"
          placeholder={t("C:\\Games\\Zelda TOTK\\profile\\save\\…")}
        />
        <button
          type="button"
          id="browseFolder"
          className="secondary browse-button"
        >
          {t("Explorar carpetas…")}
        </button>

        <section id="folderBrowser" hidden>
          <div className="folder-toolbar">
            <button type="button" id="folderUp" className="secondary">
              {t("↑ Subir")}
            </button>
            <button type="button" id="folderDrives" className="secondary">
              {t("Unidades")}
            </button>
          </div>
          <p id="folderCurrent"></p>

          <div id="folderEntries"></div>
        </section>

        <div className="dialog-actions">
          <button value="cancel" className="secondary">
            {t("Cancelar")}
          </button>
          <button id="confirmFolder" value="default">
            {t("Seguir y activar Autosync")}
          </button>
        </div>
        <p id="folderError" role="alert"></p>
      </form>
    </dialog>
  );
}
