import { I18N } from "../../shared/i18n.js";

const t = (key, values) => I18N.t(key, values);

export function FileDialog() {
  return (
    <dialog id="fileDialog">
      <form method="dialog">
        <div className="eyebrow">{t("CARGA MANUAL")}</div>
        <h2>{t("Abrir un guardado")}</h2>
        <p>{t("Elige un slot detectado o pega la ruta de tu progress.sav.")}</p>
        <label htmlFor="knownSaves">{t("Guardados detectados")}</label>
        <select id="knownSaves">
          <option value="">{t("Ruta personalizada")}</option>
        </select>
        <label htmlFor="filePath">{t("Ruta del archivo")}</label>
        <input
          id="filePath"
          type="text"
          placeholder={t("C:\\…\\slot_00\\progress.sav")}
        />
        <label className="file-button">
          {t("Explorar archivos…")}
          <input
            type="file"
            id="saveFile"
            aria-label={t("Explorar archivos")}
            accept=".sav"
          />
        </label>

        <div className="dialog-actions">
          <button value="cancel" className="secondary">
            {t("Cancelar")}
          </button>
          <button id="confirmFile" value="default">
            {t("Cargar guardado")}
          </button>
        </div>
        <p id="fileError" role="alert"></p>
      </form>
    </dialog>
  );
}
