import { I18N } from "../../shared/i18n.js";

const t = (key, values) => I18N.t(key, values);

export function ChangesDialog() {
  return (
    <dialog id="changesDialog">
      <form method="dialog">
        <h2>{t("Notas de la versión")}</h2>
        <p id="changesVersion"></p>
        <pre id="changesText"></pre>
        <a id="changesLink" target="_blank" rel="noopener noreferrer">
          {t("Ver en GitHub")}
        </a>

        <div className="dialog-actions">
          <button>{t("Cerrar")}</button>
        </div>
      </form>
    </dialog>
  );
}
