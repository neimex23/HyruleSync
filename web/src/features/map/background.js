import L from "leaflet";

import { I18N } from "../../shared/i18n.js";
import { fmt } from "../../shared/utils.js";

export function createMapBackground(context) {
  const { $, command, request, poll, toast } = context;
  const t = (key, values) => I18N.t(key, values);
  let background;
  let mapQuality = "standard",
    hdTiles = null,
    hdTileError = false;
  // Leaflet reserves its own empty GIF for aborted tiles; use a different
  // transparent image so failed downloads still finish and emit tileerror/load.
  const emptyTile =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  function updateMapLayer() {
    if (background) context.map.removeLayer(background);
    // Upstream: a centred 4500x4500 image and MapScale=0.375 => 12000x12000 world units.
    background = L.imageOverlay(
      `assets/map/${context.layer}-medium.png`,
      [
        [-6000, -6000],
        [6000, 6000],
      ],
      { interactive: false, pane: "mapBackground" },
    ).addTo(context.map);
    background.bringToBack();
    updateHDMap();
  }

  function updateHDMap() {
    if (hdTiles) {
      context.map.removeLayer(hdTiles);
      hdTiles = null;
    }
    hdTileError = false;
    if (mapQuality !== "high") return;

    const tiles = L.tileLayer(`map-tiles/${context.layer}/{z}/{x}/{y}.webp`, {
      pane: "hdMap",
      tileSize: 256,
      zoomOffset: 6,
      minNativeZoom: -6,
      maxNativeZoom: 1,
      minZoom: -5,
      maxZoom: 2,
      noWrap: true,
      bounds: [
        [-5000, -6000],
        [5000, 6000],
      ],
      keepBuffer: 2,
      updateWhenZooming: false,
      errorTileUrl: emptyTile,
    });
    hdTiles = tiles;
    tiles.on("loading", () => {
      if (hdTiles === tiles) hdTileError = false;
    });
    tiles.on("tileerror", () => {
      if (hdTiles === tiles) {
        hdTileError = true;
        $("hdRetry").hidden = false;
        $("hdStatus").textContent = t(
          "HD no disponible en algunas zonas; se muestra el mapa estándar.",
        );
        $("hdStatus").hidden = false;
        $("mapQualityToggle").title = $("hdStatus").textContent;
        const activity = $("mapQualityActivity");

        activity.hidden = false;
        if (activity.dataset.state !== "downloading")
          activity.dataset.state = "warning";
      }
    });
    tiles.addTo(context.map);
  }

  function updateMapQuality(state) {
    const next = state.mapQuality === "high" ? "high" : "standard";

    if (next !== mapQuality) {
      mapQuality = next;
      updateHDMap();
    }

    const select = $("mapQuality"),
      hd = state.hdMap || {},
      missing = hd.unavailable || hdTileError;
    select.value = mapQuality;
    $("mapQualityLabel").textContent =
      mapQuality === "high" ? t("HD") : t("SD");
    const status =
      mapQuality !== "high"
        ? ""
        : hd.cacheFull
          ? t("La caché HD está llena; las zonas nuevas usan el mapa estándar.")
          : missing
            ? t(
                "HD no disponible en algunas zonas; se muestra el mapa estándar.",
              )
            : hd.downloading
              ? t("Descargando detalle del mapa…")
              : t("Caché HD: {size} MB", {
                  size: fmt(
                    Math.round(((hd.cachedBytes || 0) / 1048576) * 10) / 10,
                  ),
                });
    select.title = status || t("Calidad del mapa");
    $("hdStatus").textContent = status;
    $("hdStatus").hidden = !status;
    $("hdRetry").hidden = mapQuality !== "high" || !missing;
    const hdDownload = state.hdMapDownload || {};
    const hdTotal = hdDownload.total || 0,
      hdDone = hdDownload.done || 0;
    const hdPct = hdTotal
      ? Math.min(100, Math.round((hdDone / hdTotal) * 100))
      : 0;
    const hdBtn = $("hdDownloadButton");
    const activity = $("mapQualityActivity");
    const busy = !!hdDownload.busy;
    const warning = mapQuality === "high" && (missing || hd.cacheFull);
    activity.hidden = !busy && !warning;
    activity.dataset.state = busy ? "downloading" : "warning";
    $("mapQualityToggle").title = busy
      ? t("Descargando {pct}%", { pct: hdPct })
      : status || t("Calidad del mapa");
    $("hdDownloadSummary").hidden = !busy;
    $("hdDownloadSummary").textContent = `${hdPct}%`;
    $("hdDownloadProgress").hidden = !busy;
    $("hdDownloadProgress").value = hdPct;

    if (hdBtn) {
      hdBtn.disabled = busy;
      $("hdDownloadLabel").textContent = hdDownload.busy
        ? t("Descargando {pct}%", { pct: hdPct })
        : hdTotal > 0 && hdDone >= hdTotal
          ? t("Volver a descargar")
          : t("Descargar mapa HD completo");
      hdBtn.title = hdDownload.busy
        ? t("Descargando {done}/{total}…", {
            done: fmt(hdDone),
            total: fmt(hdTotal),
          })
        : t("Descargar mapa HD completo (~80-120 MB)");
    }
  }

  function initMapQuality() {
    $("mapQuality").onchange = async () => {
      const input = $("mapQuality"),
        next = input.value;
      input.disabled = true;

      try {
        await command("map-quality", next);
      } catch (e) {
        input.value = mapQuality;
        toast(e.message);
      } finally {
        input.disabled = false;
      }
    };

    $("hdRetry").onclick = async () => {
      const input = $("hdRetry");
      input.disabled = true;

      try {
        await command("retry-map-tiles");
        if (hdTiles) hdTiles.redraw();
      } catch (e) {
        toast(e.message);
      } finally {
        input.disabled = false;
      }
    };

    $("hdDownloadButton").onclick = async () => {
      const btn = $("hdDownloadButton");

      if (btn.disabled) return;

      const ok = confirm(
        t(
          "Descargar el mapa HD completo (≈80–120 MB, 29 847 mosaicos) para usarlo sin conexión. Puede tardar varios minutos. ¿Continuar?",
        ),
      );

      if (!ok) return;
      btn.disabled = true;

      try {
        await request("api/download-hd-map", { method: "POST", body: "" });
        await poll();
      } catch (e) {
        toast(e.message);
        btn.disabled = false;
      }
    };
  }

  return { updateMapLayer, updateMapQuality, initMapQuality };
}
