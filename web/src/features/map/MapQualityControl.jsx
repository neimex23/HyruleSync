import { useEffect, useRef } from "react";

import { I18N } from "../../shared/i18n.js";

const t = (key, values) => I18N.t(key, values);

export function MapQualityControl() {
  const control = useRef(null);

  useEffect(() => {
    const closeOutside = (event) => {
      if (!control.current.contains(event.target)) control.current.open = false;
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape" || !control.current.open) return;
      control.current.open = false;
      control.current.querySelector("summary").focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <details className="map-quality-control" ref={control}>
      <summary
        id="mapQualityToggle"
        title={t("Calidad del mapa")}
        aria-controls="mapQualityMenu"
      >
        <span className="map-quality-caption">{t("Mapa")}</span>
        <span id="mapQualityLabel" className="map-quality-badge">
          {t("HD")}
        </span>
        <span
          id="mapQualityActivity"
          className="map-quality-activity"
          hidden
          aria-hidden="true"
        ></span>
        <span
          id="hdDownloadSummary"
          className="hd-download-summary"
          hidden
        ></span>
        <svg
          className="map-quality-chevron"
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m4 6 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>

      <div id="mapQualityMenu" className="map-quality-menu">
        <div className="map-quality-row">
          <label htmlFor="mapQuality">{t("Calidad del mapa")}</label>
          <select
            id="mapQuality"
            aria-label={t("Calidad del mapa")}
            aria-describedby="mapQualityHint"
            defaultValue="high"
          >
            <option value="standard">{t("Estándar · sin conexión")}</option>
            <option value="high">{t("Alta resolución · HD")}</option>
          </select>
        </div>
        <p id="mapQualityHint" className="map-quality-hint">
          {t(
            "HD descarga las zonas que exploras y las guarda en este equipo. Sin conexión, las zonas sin detalle guardado usan el mapa estándar.",
          )}
        </p>
        <div className="map-hd-status">
          <span id="hdStatus" className="hd-status" role="status" hidden></span>
          <button
            id="hdRetry"
            className="hd-retry"
            type="button"
            hidden
            title={t("Reintentar HD")}
            aria-label={t("Reintentar HD")}
          >
            {t("↻")}
          </button>
        </div>

        <div className="map-offline-download">
          <div className="map-offline-heading">
            <strong>{t("Mapa sin conexión")}</strong>
            <span>{t("80–120 MB")}</span>
          </div>
          <p className="map-quality-hint">
            {t("Descarga todos los mosaicos para usar el mapa sin conexión.")}
          </p>
          <button
            id="hdDownloadButton"
            className="hd-download-button"
            type="button"
            title={t("Descargar mapa HD completo (~80-120 MB)")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span id="hdDownloadLabel">{t("Descargar mapa HD completo")}</span>
          </button>
          <progress
            id="hdDownloadProgress"
            max="100"
            value="0"
            aria-label={t("Descarga del mapa HD")}
            hidden
          ></progress>
        </div>
      </div>
    </details>
  );
}
