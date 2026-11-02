import { I18N } from "../../shared/i18n.js";

const t = (key, values) => I18N.t(key, values);

export function SetupScreen() {
  return (
    <section id="setup" hidden>
      <div className="setup-card">
        <img className="setup-logo" src="app-icon.png" alt="" />
        <div className="eyebrow">{t("HYRULESYNC · PRIMER INICIO")}</div>
        <h2>{t("Prepara tu mapa")}</h2>
        <div className="language-setting">
          <label htmlFor="setupLanguageSelect">{t("Idioma")}</label>
          <select id="setupLanguageSelect" data-language-select="">
            <option value="auto">{t("Automático (Windows)")}</option>
            <option value="es" lang="es">
              {t("Español")}
            </option>
            <option value="en" lang="en">
              {t("English")}
            </option>
          </select>
        </div>
        <p>
          {t(
            "Descarga una vez los mapas, iconos y el catálogo de ubicaciones (unos 44 MB). Después podrás usarlos sin conexión.",
          )}
        </p>
        <p className="fine">
          {t(
            "Los recursos se obtienen del repositorio de TotK Unexplored. HyruleSync es una aplicación independiente y conserva los créditos de esos recursos.",
          )}
        </p>
        <button id="prepareResources">
          {t("Descargar recursos del mapa")}
        </button>
        <button id="setupAboutOpen" className="link-button">
          {t("Acerca de, licencias y créditos")}
        </button>
        <progress id="setupProgress" max="100" value="0"></progress>
        <p id="setupStatus" role="status">
          {t("Luego podrás elegir tu carpeta de guardados.")}
        </p>
        <p id="setupError" role="alert"></p>
      </div>
    </section>
  );
}
