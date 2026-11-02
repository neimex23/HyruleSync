import { I18N } from "../../shared/i18n.js";

const t = (key, values) => I18N.t(key, values);

export function LicenseDialog() {
  return (
    <dialog id="licenseDialog">
      <form method="dialog">
        <h2 id="licenseTitle"></h2>
        <pre id="licenseText"></pre>

        <div className="dialog-actions">
          <button>{t("Cerrar")}</button>
        </div>
      </form>
    </dialog>
  );
}
