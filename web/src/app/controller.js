import L from "leaflet";

import {
  ll,
  playerLayer,
  coordinateString,
  inLayer as pointInLayer,
  prepareMapCatalog,
  createMapPointFilter,
  hasDiscoveryState,
  mapPointState,
  shrineChestState,
} from "../features/map/model.js";
import { createUpdateController } from "../features/settings/updates.js";
import { createQuestController } from "../features/quests/controller.js";
import { trackPageLifetime } from "./page-session.js";
import { I18N } from "../shared/i18n.js";
import { fmt, esc } from "../shared/utils.js";
import { createControllerScope } from "./controller-scope.js";
import { createSaveController } from "../features/saves/controller.js";
import { createMapBackground } from "../features/map/background.js";
import { normalizeArmorPlan } from "../features/inventory/collections.js";

export function createAppController(store, config = {}) {
  const scope = createControllerScope();
  const filterPoints = createMapPointFilter();
  const { fetch, request, setTimeout, clearTimeout, setInterval, listen } =
    scope;
  const publish = (patch) => {
    if (!scope.disposed) store.update(patch);
  };

  // Controller state

  // Fast Refresh can recreate the controller while React preserves the shell.
  // Reset the adapter-owned regions before caching the new instance's nodes.
  document.getElementById("categories").replaceChildren();
  document.getElementById("detail").hidden = true;
  document.getElementById("previewBanner").hidden = true;
  document.getElementById("welcome").hidden = true;
  document.getElementById("startupLoading").hidden = false;
  document.body.classList.remove("inventory-view");
  store.update({
    view: "map",
    inventory: {},
    quests: {},
    world: {},
    summary: {},
  });
  store.update({
    armorPlan: normalizeArmorPlan(config.armorPlan),
    armorPlanStatus: "",
  });
  const nodes = new Map(
    [...document.querySelectorAll("[id]")].map((node) => [node.id, node]),
  );
  const t = (key, values) => I18N.t(key, values),
    $ = (id) => {
      const node = nodes.get(id) || document.getElementById(id);

      if (node) nodes.set(id, node);

      return node;
    };
  const descriptions = {
    shrines: "Clear · 1654019904",
    carry_koroks: "Clear · 1654019904",
    lightroots: "Open · 404286466",
  };
  let catalog,
    categories,
    map,
    objects,
    routes,
    linkMarker,
    renderFrame = null;

  let snapshot = null,
    liveSnapshot = null,
    previewSnapshot = null,
    selected = null;

  let layer = "surface",
    active = new Set(["hidden_koroks", "carry_koroks", "shrines"]),
    points = [];

  let polling = false,
    starting = true,
    startupDeadline = null,
    source = "",
    sourceMode = "file",
    toastTimer;

  let followLink = false,
    showLink = true,
    linkOrder = "below",
    linkOpacity = 45,
    editingOpacity = false;

  let inventoryView = false;

  const prefKey = "hyrulesync.preferences";
  let prefs = {};

  try {
    const stored = JSON.parse(localStorage.getItem(prefKey) || "{}");

    if (stored && typeof stored === "object" && !Array.isArray(stored))
      prefs = stored;
  } catch {}

  const pointState = (p) => (snapshot ? snapshot.states[p.index] : -1);
  const booleanLabel = (s) =>
    s === 1 ? t("Sí") : s === 0 ? t("No") : t("Sin verificar");
  const pointIcon = (p) =>
    p.category === "towers"
      ? "tower.svg"
      : `assets/icons/${categories[p.category].icon}.png`;
  const mapPosition = (s) => s?.playerContext?.mapPosition ?? null;
  const locationText = (s) =>
    s?.playerContext?.kind === "shrine"
      ? t("Dentro de {name}", { name: s.playerContext.shrineName })
      : mapPosition(s)
        ? coordinateString(mapPosition(s))
        : t("La posición de Link no está disponible en este guardado.");
  const inLayer = (point) => pointInLayer(point, layer);

  function toast(s) {
    if (scope.disposed) return;
    $("toast").textContent = s;
    $("toast").hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($("toast").hidden = true), 4500);
  }

  function savePrefs() {
    try {
      localStorage.setItem(
        prefKey,
        JSON.stringify({
          active: [...active],
          mode: $("showMode").value,
          layer,
          paths: $("showPaths").checked,
        }),
      );
    } catch {}
  }

  function showState(p) {
    const state = mapPointState(p, snapshot);

    return state === "found"
      ? t("Completado")
      : state === "discovered"
        ? t("Descubierto")
        : state === "missing"
          ? t("Pendiente")
          : t("Sin verificar · no hay datos suficientes");
  }

  function chestLabel(p) {
    const progress = snapshot?.shrineChests?.[p.index];
    const state = shrineChestState(progress);

    if (state === "found")
      return t("Todos los cofres obtenidos · {opened}/{total}", progress);
    if (!progress?.total) return t("Cofres: sin verificar");

    return state === "unknown"
      ? t("Cofres: {opened}/{total} · {unknown} sin verificar", progress)
      : t("Cofres: {opened}/{total} · quedan cofres pendientes", progress);
  }

  function prepareCatalog(data) {
    catalog = prepareMapCatalog(data);
    categories = Object.fromEntries(
      catalog.categories.map((category) => [category.id, category]),
    );
  }

  function updateCounts() {
    const counts = Object.fromEntries(
      catalog.categories.map((category) => [
        category.id,
        { total: 0, found: 0, unknown: 0 },
      ]),
    );
    let found = 0,
      unknown = 0;

    for (const point of catalog.points) {
      const count = counts[point.category],
        state = pointState(point);
      count.total++;
      if (state === 1) {
        count.found++;
        found++;
      } else if (state === -1) {
        count.unknown++;
        unknown++;
      }
    }
    $("foundCount").textContent = snapshot ? fmt(found) : "—";
    $("totalCount").textContent = fmt(catalog.points.length);
    $("progress").style.width =
      (snapshot
        ? catalog.points.length
          ? (found / catalog.points.length) * 100
          : 0
        : 0) + "%";
    $("missingCount").textContent = snapshot
      ? t("{n} pendientes", {
          n: fmt(catalog.points.length - found - unknown),
        }) + (unknown ? t(" · {n} sin verificar", { n: fmt(unknown) }) : "")
      : t("Carga una partida para calcular los pendientes.");
    for (const category of catalog.categories) {
      const count = counts[category.id],
        missing = count.total - count.found - count.unknown,
        node = $("count-" + category.id);
      node.textContent = snapshot
        ? `${missing} / ${count.total}`
        : `— / ${count.total}`;
      node.title = t(
        "{found} completados; {missing} pendientes; {unknown} sin verificar. Todas las capas.",
        {
          found: fmt(count.found),
          missing: fmt(missing),
          unknown: fmt(count.unknown),
        },
      );
    }
    if (selected) detail(selected, false);
  }

  function addCategoryRow(c, iconSrc) {
    const row = document.createElement("label");
    row.className = "category";
    const check = document.createElement("input");
    check.type = "checkbox";
    check.id = "category-" + c.id;
    check.checked = active.has(c.id);
    check.dataset.category = c.id;

    check.onchange = () => {
      check.checked ? active.add(c.id) : active.delete(c.id);
      if (c.id === "quests" && check.checked) loadQuests();
      savePrefs();
      render();
    };

    const icon = document.createElement("img");
    icon.src = iconSrc;
    icon.alt = "";
    const label = document.createElement("span");
    label.className = "name";
    label.textContent = c.name;
    const count = document.createElement("span");
    count.className = "count";
    count.id = "count-" + c.id;
    row.append(check, icon, label, count);
    $("categories").append(row);
  }

  function buildCategories() {
    for (const c of catalog.categories)
      addCategoryRow(
        c,
        c.id === "towers" ? "tower.svg" : `assets/icons/${c.icon}.png`,
      );
    // Quests use their own dataset and filters, so they join the list as a pseudo-category.
    addCategoryRow({ id: "quests", name: t("Misiones") }, "quest.svg");
    $("count-quests").textContent = "—";
    updateQuestCategoryCount();
  }

  function switchLayer(next) {
    if (!["surface", "sky", "depths"].includes(next)) return;
    layer = next;
    document.querySelectorAll("[data-layer]").forEach((b) => {
      b.classList.toggle("active", b.dataset.layer === layer);
      b.setAttribute("aria-pressed", b.dataset.layer === layer);
    });
    updateMapLayer();
    savePrefs();
    render();
  }

  function centerLink({ zoom = true } = {}) {
    const p = mapPosition(snapshot);

    if (!showLink || !p || !map) return;
    if (layer !== playerLayer(p)) switchLayer(playerLayer(p));
    map.setView(ll(p), zoom ? Math.max(map.getZoom(), -1) : map.getZoom(), {
      animate: false,
    });
  }

  function renderLink() {
    if (linkMarker) {
      map.removeLayer(linkMarker);
      linkMarker = null;
    }

    const p = mapPosition(snapshot),
      shrine = snapshot?.playerContext?.kind === "shrine";
    $("centerLink").disabled = !showLink || !p;
    $("linkPosition").textContent = p
      ? t("Última posición de Link: {coords} · guardado {time}", {
          coords: locationText(snapshot),
          time: new Date(snapshot.savedAt).toLocaleString(I18N.language),
        })
      : t("La posición de Link no está disponible en este guardado.");
    $("linkDiagnostics").textContent = snapshot
      ? t("Mapa guardado: {map} · coordenadas originales: {coords}", {
          map: snapshot.playerContext?.mapId || t("Sin verificar"),
          coords: snapshot.playerPosition
            ? coordinateString(snapshot.playerPosition)
            : t("Sin verificar"),
        })
      : "";
    if (!showLink || !p || playerLayer(p) !== layer) return;

    const icon = L.divIcon({
      className: "link-marker" + (shrine ? " in-shrine" : ""),
      html:
        "&#9650;" +
        (shrine
          ? '<span class="shrine-badge" aria-hidden="true">⌂</span>'
          : ""),
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const title = shrine
      ? locationText(snapshot)
      : t("Última posición conocida de Link");
    linkMarker = L.marker(ll(p), {
      icon,
      title,
      alt: title,
      opacity: linkOpacity / 100,
      interactive: linkOpacity > 0,
      keyboard: linkOpacity > 0,
      pane: linkOrder === "below" ? "linkBelow" : "linkAbove",
    }).addTo(map);
    linkMarker.bindTooltip(esc(title) + "<br>" + esc(coordinateString(p)), {
      direction: "top",
    });
  }

  function render() {
    if (scope.disposed || !map || !catalog) return;
    renderLink();
    renderQuestMarkers();
    points = filterPoints(catalog.points, {
      layer,
      active,
      snapshot,
      query: $("search").value,
      mode: $("showMode").value,
    });
    $("visibleCount").textContent = t("{n} puntos filtrados", {
      n: fmt(points.length),
    });
    objects.clearLayers();
    routes.clearLayers();
    const bounds = map.getBounds().pad(0.15),
      visible = points.filter((p) => bounds.contains(p.latLng));

    if ($("showPaths").checked) {
      for (const p of points)
        if (p.routeCoordinates.length > 1)
          L.polyline(p.routeCoordinates, {
            color: "#e6d9a0",
            weight: 1.5,
            opacity: 0.85,
            interactive: false,
          }).addTo(routes);

      const caves = new Map();

      for (const p of points) {
        if (p.category !== "caves" || pointState(p) === 1) continue;
        if (!caves.has(p.name)) caves.set(p.name, []);
        caves.get(p.name).push(p);
      }
      for (const group of caves.values())
        if (group.length === 2)
          L.polyline(
            group.map((p) => p.latLng),
            {
              color: "#bfa574",
              weight: 1.5,
              dashArray: "4 4",
              opacity: 0.8,
              interactive: false,
            },
          ).addTo(routes);
    }
    for (const p of visible) {
      const state = mapPointState(p, snapshot),
        textLabel = p.category === "locations" && map.getZoom() >= -2.5,
        size = map.getZoom() < -3 ? 15 : map.getZoom() < -1.5 ? 20 : 27;
      const css =
        (textLabel ? "location-label" : "point-icon") +
        " " +
        state +
        (selected?.id === p.id ? " selected" : "");
      const icon = L.divIcon({
        className: css,
        html: textLabel
          ? esc(p.name)
          : `<img alt="" src="${pointIcon(p)}">` +
            (p.category === "shrines" &&
            shrineChestState(snapshot?.shrineChests?.[p.index]) === "found"
              ? '<span class="shrine-chests-badge" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 7V5a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v9H2ZM2 7h12M7 6h2v4H7Z"/></svg></span>'
              : ""),
        iconSize: textLabel ? [150, 24] : [size, size],
        iconAnchor: textLabel ? [75, 12] : [size / 2, size / 2],
      });
      const marker = L.marker(p.latLng, {
        icon,
        title: p.name,
        alt: p.name,
        zIndexOffset:
          selected?.id === p.id ? 1000 : p.category === "locations" ? -100 : 0,
      });
      marker.bindTooltip(
        esc(p.name) +
          "<br><small>" +
          esc(showState(p)) +
          (p.category === "shrines" ? "<br>" + esc(chestLabel(p)) : "") +
          "</small>",
        { direction: "top" },
      );
      marker.on("click", () => detail(p, false));
      objects.addLayer(marker);
    }
  }

  // Leaflet can emit moveend and zoomend together; draw once per browser frame.
  function scheduleRender() {
    if (renderFrame !== null) return;
    renderFrame = requestAnimationFrame(() => {
      renderFrame = null;
      render();
    });
  }

  function guideLink(p) {
    // These categories have named location articles. Unnamed collectibles use the map.
    if (
      [
        "shrines",
        "lightroots",
        "caves",
        "wells",
        "chasms",
        "locations",
        "bubbuls",
      ].includes(p.category)
    )
      return (
        "https://www.zeldadungeon.net/wiki/" +
        encodeURIComponent(p.name.replace(/ /g, "_"))
      );

    // Zelda Dungeon's map uses north/east, whereas our world positions use east/south.
    const region =
      p.position.y <= -50 ? "Depths" : p.position.y >= 750 ? "Sky" : "Surface";

    return `https://www.zeldadungeon.net/tears-of-the-kingdom-interactive-map/?z=6&x=${Math.round(-p.position.z)}&y=${Math.round(p.position.x)}&l=${region}`;
  }

  function detail(p, pan) {
    selected = p;
    $("detailIcon").src = pointIcon(p);
    const state = mapPointState(p, snapshot);
    $("detailIcon").dataset.state = state;
    $("detailCategory").textContent = categories[p.category].name.toUpperCase();
    $("detailName").textContent = p.name;
    $("detailState").textContent = showState(p);
    $("detailState").dataset.state = state;
    $("detailChests").hidden = p.category !== "shrines";
    $("detailChests").textContent =
      p.category === "shrines" ? chestLabel(p) : "";
    $("detailChests").dataset.state = shrineChestState(
      snapshot?.shrineChests?.[p.index],
    );
    $("detailCoords").textContent = coordinateString(p.position);
    $("korokInfo").textContent =
      p.category === "towers"
        ? t("Activada: {state}", {
            state: booleanLabel(pointState(p)),
          })
        : hasDiscoveryState(p)
          ? t("Descubierto: {state}", {
              state: booleanLabel(snapshot?.visited?.[p.index] ?? -1),
            })
          : p.korokType
            ? t("Tipo original: {type}", { type: p.korokType }) +
              (p.path ? t(" · La ruta está dibujada en el mapa.") : "")
            : "";
    const rule =
      p.category === "towers"
        ? t("Activación de la atalaya")
        : p.guid
          ? t("Presencia de GUID UInt64")
          : descriptions[p.category] || t("Valor distinto de cero");
    const rows = [
      ["ID", p.id],
      [
        "Hash / GUID",
        p.guid || "0x" + Number(p.hash).toString(16).padStart(8, "0"),
      ],
      [
        t("Valor leído"),
        snapshot ? snapshot.values[p.index] : t("Sin partida"),
      ],
      [t("Criterio original"), rule],
      [t("Origen"), p.origin || t("map_data.json · sin registros añadidos")],
    ];

    if (p.visitHash)
      rows.push([
        t("Hash de visita"),
        "0x" + Number(p.visitHash).toString(16).padStart(8, "0"),
      ]);
    if (p.chestHashes?.length)
      rows.push([
        t("Hashes de cofres"),
        p.chestHashes
          .map((hash) => "0x" + Number(hash).toString(16).padStart(8, "0"))
          .join(", "),
      ]);
    $("diagnostics").replaceChildren();
    for (const [key, value] of rows) {
      const line = document.createElement("div");
      line.textContent = key + ": " + value;
      $("diagnostics").append(line);
    }
    $("detail").hidden = false;
    $("viewGuide").href = guideLink(p);
    $("guideHint").textContent = [
      "shrines",
      "lightroots",
      "caves",
      "wells",
      "chasms",
      "locations",
      "bubbuls",
    ].includes(p.category)
      ? t("Abre la ficha en Zelda Dungeon.")
      : t(
          "Abre la ubicación en Zelda Dungeon. Selecciona su icono para consultar la ayuda.",
        );
    if (pan) {
      map.setView(ll(p.position), Math.max(map.getZoom(), -1));
      render();
    }
  }

  async function command(action, body) {
    await request("api/" + action, { method: "POST", body: body ?? "" });

    await poll();
  }

  function displaySnapshot(next) {
    snapshot = next;
    $("welcome").hidden = starting || !!next;
    $("saveInfo").textContent = next
      ? t("{file} · {h} h {m} min · formato {format}", {
          file: next.file.split(/[\\/]/).slice(-2).join(" / "),
          h: Math.floor(next.playtime / 3600),
          m: Math.floor((next.playtime % 3600) / 60),
          format: next.format,
        })
      : "";
    $("previewBanner").hidden = !previewSnapshot;
    $("previewLabel").textContent = previewSnapshot
      ? t("Consultando {file} · {time}", {
          file: previewSnapshot.file.split(/[\\/]/).slice(-2).join(" / "),
          time: new Date(previewSnapshot.savedAt).toLocaleString(I18N.language),
        })
      : "";
    updateCounts();
    render();
    renderInventory();
    renderQuests();
    renderWorld();
    renderSummary();
  }

  function returnToLive() {
    previewSnapshot = null;
    displaySnapshot(liveSnapshot);
    if (showLink && followLink) centerLink({ zoom: false });
  }

  function showPreview(next) {
    if (!next) return;
    previewSnapshot = next;
    displaySnapshot(previewSnapshot);
    $("savesDialog").close();
    // Opening a historical save must not move the view to an unverified position.
    if (showLink) centerLink();
  }

  function syncOpacityControl() {
    $("linkOpacity").value = linkOpacity;
    $("linkOpacityValue").textContent = linkOpacity + "%";
    $("linkOpacity").disabled = !showLink;
  }

  function previewOpacity() {
    editingOpacity = true;
    linkOpacity = Number($("linkOpacity").value);
    $("linkOpacityValue").textContent = linkOpacity + "%";
    renderLink();
  }

  async function saveLinkOpacity() {
    $("linkOpacity").disabled = true;

    try {
      await command("link-opacity", String(linkOpacity));
    } catch (e) {
      toast(e.message);
    } finally {
      editingOpacity = false;
      await poll();
      syncOpacityControl();
      renderLink();
    }
  }

  async function poll() {
    if (scope.disposed || polling) return;
    polling = true;

    try {
      const response = await fetch("api/state", { cache: "no-store" });

      if (!response.ok) throw Error(response.status);

      const state = await response.json();

      if (scope.disposed) return;
      source = state.source;
      sourceMode = state.mode;
      // Give the initial stable-write scan time to restore the remembered save.
      // End immediately for a loaded save, no configured source or an error.
      if (starting) {
        startupDeadline ??= Date.now() + 3000;
        starting =
          !!source &&
          !state.snapshot &&
          state.status !== "error" &&
          !state.message &&
          Date.now() < startupDeadline;
      }
      $("startupLoading").hidden = !starting;
      $("welcome").hidden = starting || !!(previewSnapshot || state.snapshot);
      if (state.language && state.language !== I18N.language) {
        location.reload();

        return;
      }
      updateMapQuality(state);
      $("statusDot").className =
        state.status === "ok" ? "ok" : state.status === "error" ? "error" : "";
      $("statusTitle").textContent = state.picking
        ? t("Selecciona en la ventana de Windows")
        : starting
          ? t("Cargando partida…")
          : state.status === "error"
            ? t("Revisa el guardado")
            : state.status === "reading"
              ? t("Leyendo guardado…")
              : state.snapshot
                ? t("Partida cargada")
                : t("Sin partida cargada");
      $("sourceName").textContent = source
        ? (sourceMode === "folder" ? t("Carpeta: ") : t("Archivo: ")) +
          source.split(/[\\/]/).filter(Boolean).slice(-2).join(" / ")
        : state.snapshot
          ? t("progress.sav · carga manual")
          : t("Elige tu carpeta de guardados de TOTK Recomp.");
      $("watchedPath").textContent = source ? t("Origen: ") + source : "";
      $("error").hidden = !state.message;
      $("error").textContent = state.message || "";
      $("autosync").checked = state.auto;
      if (!$("runInBackground").disabled)
        $("runInBackground").checked = state.runInBackground === true;
      $("liveStatus").textContent =
        state.auto && source
          ? t("● Observando cambios") +
            (state.changedAt
              ? t(" · mapa actualizado {time}", {
                  time: new Date(state.changedAt).toLocaleTimeString(
                    I18N.language,
                  ),
                })
              : "")
          : source
            ? t("Autosync en pausa · puedes actualizar manualmente")
            : t("Elige una carpeta para seguir tu partida automáticamente.");
      $("liveStatus").classList.toggle("live", state.auto && !!source);
      $("openSave").disabled = state.picking || starting;
      $("openFolder").disabled = state.picking || starting;
      $("refresh").disabled = !source;
      const wasFollowing = showLink && followLink,
        previousShow = showLink,
        previousOrder = linkOrder,
        previousOpacity = linkOpacity;
      followLink = state.followLink === true;
      showLink = state.showLink !== false;
      linkOrder = state.linkOrder === "above" ? "above" : "below";
      if (!editingOpacity) {
        linkOpacity = Number.isFinite(state.linkOpacity)
          ? Math.max(0, Math.min(100, state.linkOpacity))
          : 45;
        syncOpacityControl();
      }
      $("followLink").checked = followLink;
      $("followLink").disabled = !showLink;
      $("showLink").checked = showLink;
      $("linkOrder").value = linkOrder;
      $("linkOrder").disabled = !showLink;
      const next = state.snapshot;
      liveSnapshot = next;
      if (!previewSnapshot) {
        const changed =
          next?.revision !== snapshot?.revision ||
          next?.file !== snapshot?.file ||
          next?.savedAt !== snapshot?.savedAt;

        if (changed) {
          const previous = !!snapshot;
          displaySnapshot(next);
          if (showLink && followLink) centerLink({ zoom: false });
          if (previous && next) toast(t("Mapa actualizado con el guardado"));
        } else if (showLink && followLink && !wasFollowing)
          centerLink({ zoom: false });
      }
      if (
        showLink !== previousShow ||
        linkOrder !== previousOrder ||
        linkOpacity !== previousOpacity
      )
        render();
    } catch (e) {
      if (scope.disposed) return;
      starting = false;
      $("startupLoading").hidden = true;
      $("welcome").hidden = !!snapshot;
      $("openSave").disabled = false;
      $("openFolder").disabled = false;
      $("statusDot").className = "error";
      $("statusTitle").textContent = t("Ejecutable desconectado");
      $("error").hidden = false;
      $("error").textContent = t(
        "Abre HyruleSync.exe para reanudar. Se conserva la última vista.",
      );
    } finally {
      polling = false;
    }
  }

  async function init() {
    const res = await fetch("catalog.json");

    if (!res.ok) throw Error(t("No se puede cargar map_data.json."));

    const data = await res.json();

    if (scope.disposed) return;
    prepareCatalog(data);
    if (Array.isArray(prefs.active))
      active = new Set(
        prefs.active.filter((c) => categories[c] || c === "quests"),
      );
    $("showMode").value = [
      "missing",
      "discovered",
      "found",
      "chests",
      "all",
      "unknown",
    ].includes(prefs.mode)
      ? prefs.mode
      : "missing";
    $("showPaths").checked = prefs.paths !== false;
    buildCategories();
    updateCounts();
    // ZeldaMods: zoom 7 = 2 px/world unit; origin is x=-6000, z=-5000.
    // Keep our north-positive latitude and existing zooms; tile URLs use zoom + 6.
    const crs = L.extend({}, L.CRS.Simple, {
      transformation: new L.Transformation(1, 6000, -1, 5000),
    });
    map = L.map("map", {
      crs,
      minZoom: -5,
      maxZoom: 2,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [
        [-7500, -7500],
        [7500, 7500],
      ],
      maxBoundsViscosity: 0.8,
    }).fitBounds([
      [-6000, -6000],
      [6000, 6000],
    ]);
    map.createPane("mapBackground").style.zIndex = 190;
    map.createPane("hdMap").style.zIndex = 210;
    map.createPane("linkBelow").style.zIndex = 550;
    map.createPane("linkAbove").style.zIndex = 625;

    routes = L.layerGroup().addTo(map);
    objects = L.layerGroup().addTo(map);
    switchLayer(
      ["surface", "sky", "depths"].includes(prefs.layer)
        ? prefs.layer
        : "surface",
    );

    map.on("moveend zoomend", scheduleRender);
    map.on(
      "mousemove",
      (e) =>
        ($("mouseCoords").textContent =
          `${Math.trunc(e.latlng.lng)}, ${Math.trunc(e.latlng.lat)}`),
    );

    $("centerLink").onclick = centerLink;

    $("followLink").onchange = async () => {
      const enabled = $("followLink").checked;
      $("followLink").disabled = true;

      try {
        await command(enabled ? "follow-on" : "follow-off");
      } catch (e) {
        $("followLink").checked = followLink;
        toast(e.message);
      } finally {
        $("followLink").disabled = !showLink;
      }
    };

    $("showLink").onchange = async () => {
      const enabled = $("showLink").checked;
      $("showLink").disabled = true;

      try {
        await command(enabled ? "show-link" : "hide-link");
      } catch (e) {
        $("showLink").checked = showLink;
        toast(e.message);
      } finally {
        $("showLink").disabled = false;
      }
    };

    $("linkOrder").onchange = async () => {
      try {
        await command(
          $("linkOrder").value === "below" ? "link-below" : "link-above",
        );
      } catch (e) {
        $("linkOrder").value = linkOrder;
        toast(e.message);
      }
    };

    $("linkOpacity").oninput = previewOpacity;
    $("linkOpacity").onchange = saveLinkOpacity;

    initMapQuality();
    document
      .querySelectorAll("[data-layer]")
      .forEach(
        (button) => (button.onclick = () => switchLayer(button.dataset.layer)),
      );

    initSaves();
    $("returnLive").onclick = returnToLive;

    $("refresh").onclick = () =>
      command("refresh").catch((e) => toast(e.message));

    $("autosync").onchange = () => {
      if ($("autosync").checked && !source) chooseFolder();
      else
        command($("autosync").checked ? "auto-on" : "auto-off").catch((e) =>
          toast(e.message),
        );
    };

    $("all").onclick = () => {
      active = new Set([...catalog.categories.map((c) => c.id), "quests"]);
      document
        .querySelectorAll("[data-category]")
        .forEach((c) => (c.checked = true));
      loadQuests();
      savePrefs();
      render();
    };

    $("none").onclick = () => {
      active.clear();
      document
        .querySelectorAll("[data-category]")
        .forEach((c) => (c.checked = false));
      savePrefs();
      render();
    };

    $("showMode").onchange = () => {
      savePrefs();
      render();
    };

    $("search").oninput = scheduleRender;

    $("showPaths").onchange = () => {
      savePrefs();
      render();
    };

    $("search").onkeydown = (e) => {
      if (e.key !== "Enter") return;

      const coords = $("search")
        .value.trim()
        .split(/[\s,;]+/)
        .map(Number);

      if (
        coords.length >= 2 &&
        coords.every(Number.isFinite) &&
        Math.abs(coords[0]) <= 6000 &&
        Math.abs(coords[1]) <= 6000
      )
        map.setView([coords[1], coords[0]], -1);
      else if (points.length) {
        const p = points[0];

        if (!inLayer(p))
          switchLayer(
            p.position.y >= 750
              ? "sky"
              : p.position.y <= -50
                ? "depths"
                : "surface",
          );
        detail(p, true);
      }
    };

    $("closeDetail").onclick = () => {
      $("detail").hidden = true;
      selected = null;
      render();
    };

    $("zoomSelected").onclick = () => {
      if (selected) detail(selected, true);
    };

    $("copyCoords").onclick = async () => {
      try {
        await navigator.clipboard.writeText(
          coordinateString(selected.position),
        );
        toast(t("Coordenadas copiadas"));
      } catch {
        toast(coordinateString(selected.position));
      }
    };

    $("zoomIn").onclick = () => map.zoomIn();

    $("zoomOut").onclick = () => map.zoomOut();

    $("fitMap").onclick = () =>
      map.fitBounds([
        [-6000, -6000],
        [6000, 6000],
      ]);

    $("toggleSidebar").onclick = () => $("sidebar").classList.toggle("open");

    map.on("click", () => {
      if (innerWidth <= 680) $("sidebar").classList.remove("open");
    });

    listen(document, "keydown", (e) => {
      if (e.key === "Escape") {
        $("detail").hidden = true;
        $("sidebar").classList.remove("open");
      }
      if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        $("sidebar").classList.add("open");
        $("search").focus();
      }
    });
    await poll();
    if (location.hash === "#folder") chooseFolder();
    setInterval(poll, 1000);
    listen(document, "visibilitychange", () => {
      if (!document.hidden) poll();
    });
  }

  async function boot() {
    try {
      const state = await (await fetch("api/setup")).json();

      if (scope.disposed) return;
      if (state.ready) {
        $("setup").hidden = true;
        document.body.classList.remove("preparing");
        await init();

        return;
      }
      document.body.classList.add("preparing");
      $("setup").hidden = false;
      $("prepareResources").disabled = state.busy;
      $("prepareResources").textContent = state.busy
        ? t("Preparando mapa…")
        : state.error
          ? t("Reintentar descarga")
          : t("Descargar recursos del mapa");
      const percent = state.total
        ? Math.min(100, Math.round((state.received / state.total) * 100))
        : 0;
      $("setupProgress").value = percent;
      $("setupStatus").textContent = state.busy
        ? `${percent}% · ${state.current}`
        : t("Luego podrás elegir tu carpeta de guardados.");
      $("setupError").textContent = state.error || "";
    } catch (e) {
      $("setup").hidden = false;
      $("setupError").textContent =
        t("No se pudo conectar con HyruleSync. ") + e.message;
    }
    setTimeout(boot, 1000);
  }

  async function showLicense(name, title) {
    $("licenseTitle").textContent = title;
    $("licenseText").textContent = "";
    $("licenseDialog").showModal();

    try {
      const res = await fetch("legal/" + name);

      if (!res.ok) throw Error(t("No se pudo cargar el texto de licencia."));
      $("licenseText").textContent = await res.text();
    } catch (e) {
      $("licenseText").textContent = e.message;
    }
  }

  async function changeBackgroundMode() {
    const input = $("runInBackground"),
      enabled = input.checked;
    input.disabled = true;

    try {
      const res = await fetch(
        "api/" + (enabled ? "background-on" : "background-off"),
        { method: "POST", body: "" },
      );
      const reply = await res.json();

      if (!res.ok || !reply.ok)
        throw Error(reply.error || t("No se pudo completar la acción."));
    } catch (e) {
      input.checked = !enabled;
      toast(e.message);
    } finally {
      input.disabled = false;
    }
  }

  async function changeLanguage(event) {
    const controls = [...document.querySelectorAll("[data-language-select]")];
    controls.forEach((control) => (control.disabled = true));

    try {
      const response = await fetch("api/language", {
          method: "POST",
          body: event.target.value,
        }),
        reply = await response.json();

      if (!response.ok || !reply.ok)
        throw Error(reply.error || t("No se pudo completar la acción."));
      location.reload();
    } catch (e) {
      controls.forEach((control) => {
        control.value = control.dataset.preference;
        control.disabled = false;
      });
      if (!$("setup").hidden) $("setupError").textContent = e.message;
      else toast(e.message);
    }
  }

  async function start() {
    trackPageLifetime(scope);

    $("prepareResources").onclick = async () => {
      try {
        await request("api/prepare-map", { method: "POST", body: "" });
        $("prepareResources").disabled = true;
      } catch (error) {
        if (!scope.disposed) $("setupError").textContent = error.message;
      }
    };

    $("runInBackground").checked = config.runInBackground === true;
    document
      .querySelectorAll("[data-language-select]")
      .forEach(
        (control) => (control.value = config.languagePreference || "auto"),
      );
    document.querySelectorAll("[data-language-select]").forEach((control) => {
      control.dataset.preference = control.value;
      control.onchange = changeLanguage;
    });
    initInventory();
    initQuests();
    const openAbout = () => {
      $("aboutDialog").showModal();
      checkUpdates();
    };
    $("aboutOpen").onclick = openAbout;
    $("setupAboutOpen").onclick = openAbout;

    $("checkUpdates").onclick = () => checkUpdates(true);

    checkUpdates();
    $("viewChanges").onclick = showChanges;
    $("aboutChanges").onclick = showChanges;
    $("runInBackground").onchange = changeBackgroundMode;
    document
      .querySelectorAll("[data-license]")
      .forEach(
        (button) =>
          (button.onclick = () =>
            showLicense(button.dataset.license, button.textContent)),
      );

    $("thirdPartyNotice").onclick = () =>
      showLicense(
        "third-party." + I18N.language + ".md",
        t("Avisos y procedencia de terceros"),
      );

    boot();
  }

  let inventoryData = null,
    inventoryLoading = false,
    inventoryFailed = false;
  let collectionData = null,
    collectionLoading = false,
    collectionFailed = false;
  let armorPlanWrite = Promise.resolve(),
    armorPlanVersion = 0;

  function saveArmorPlan(plan) {
    const next = normalizeArmorPlan(plan);
    const version = ++armorPlanVersion;
    publish({ armorPlan: next, armorPlanStatus: "saving" });
    // Serialize writes so a slower earlier request cannot replace a newer plan.
    armorPlanWrite = armorPlanWrite
      .then(async () => {
        await request("api/armor-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
          keepalive: true,
        });
        if (version === armorPlanVersion) publish({ armorPlanStatus: "saved" });
      })
      .catch(() => {
        if (version === armorPlanVersion)
          publish({ armorPlanStatus: "failed" });
      });

    return armorPlanWrite;
  }

  async function loadCollections() {
    if (collectionData || collectionLoading) return;
    collectionLoading = true;
    collectionFailed = false;
    renderInventory();
    renderSummary();

    try {
      const response = await fetch("collection-data.json");

      if (!response.ok) throw Error();

      const data = await response.json();

      if (
        !Array.isArray(data.armor) ||
        !Array.isArray(data.entries) ||
        !Array.isArray(data.medals)
      )
        throw Error();
      collectionData = data;
    } catch {
      collectionFailed = true;
    } finally {
      collectionLoading = false;
      renderInventory();
      renderSummary();
    }
  }

  async function loadInventoryNames() {
    if (inventoryData || inventoryLoading) return;
    inventoryLoading = true;
    inventoryFailed = false;
    renderInventory();

    try {
      const response = await fetch("inventory-data.json");

      if (!response.ok) throw Error();
      inventoryData = await response.json();
    } catch {
      inventoryFailed = true;
    } finally {
      inventoryLoading = false;
      if (inventoryView) renderInventory();
    }
  }

  function renderInventory() {
    if (!inventoryView) return;
    publish({
      inventory: {
        snapshot,
        data: inventoryData,
        loading: inventoryLoading,
        failed: inventoryFailed,
        collectionData,
        collectionLoading,
        collectionFailed,
        catalog,
      },
    });
  }

  function renderSummary() {
    if (store.getSnapshot().view === "summary")
      publish({
        summary: {
          snapshot,
          catalog,
          collectionData,
          collectionLoading,
          collectionFailed,
        },
      });
  }

  function initInventory() {
    $("inventorySidebar").onclick = () => $("sidebar").classList.toggle("open");
  }

  let worldData = null,
    worldLoading = false,
    worldFailed = false;

  function renderWorld() {
    if (store.getSnapshot().view !== "world") return;
    publish({
      world: {
        snapshot,
        data: worldData,
        loading: worldLoading,
        failed: worldFailed,
      },
    });
  }

  async function loadWorldData() {
    if (worldData || worldLoading) return;
    worldLoading = true;
    worldFailed = false;
    renderWorld();

    try {
      const response = await fetch("world-data.json");

      if (!response.ok) throw Error();

      const data = await response.json();

      if (!Array.isArray(data.entries) || !data.entries.length) throw Error();
      worldData = data;
    } catch {
      worldFailed = true;
    } finally {
      worldLoading = false;
      renderWorld();
    }
  }

  const { updateMapLayer, updateMapQuality, initMapQuality } =
    createMapBackground({
      get map() {
        return map;
      },

      get layer() {
        return layer;
      },

      $,
      command,
      request,
      poll,
      toast,
    });

  const { initSaves, chooseFolder } = createSaveController({
    get source() {
      return source;
    },

    get sourceMode() {
      return sourceMode;
    },

    get categories() {
      return categories;
    },

    get disposed() {
      return scope.disposed;
    },

    $,
    request,
    command,
    toast,
    locationText,
    onPreview: showPreview,
  });

  const { checkUpdates, showChanges } = createUpdateController({
    $,
    t,
    fetch,
    setTimeout,
    clearTimeout,
  });
  const {
    initQuests,
    loadQuests,
    renderQuests,
    renderQuestMarkers,
    updateQuestCategoryCount,
    setQuestVisible,
    showQuestOnMap,
    setSaveView,
    setQuestFilters,
  } = createQuestController({
    get disposed() {
      return scope.disposed;
    },

    get snapshot() {
      return snapshot;
    },

    get active() {
      return active;
    },

    get map() {
      return map;
    },

    get layer() {
      return layer;
    },

    get inventoryView() {
      return inventoryView;
    },

    set inventoryView(value) {
      inventoryView = value;
    },

    $,
    publish,
    fetch,
    savePrefs,
    render,
    renderInventory,
    loadInventoryNames,
    switchLayer,
    playerLayer,
    ll,
    inLayer,
    coordinateString,
  });

  Object.assign(store.actions, {
    loadCollections,
    saveArmorPlan,
    showCollectionBossOnMap: (id) => {
      const point = catalog?.points.find((point) => point.id === id);

      if (!point || !map) return;
      active.add(point.category);
      const checkbox = $("category-" + point.category);

      if (checkbox) checkbox.checked = true;
      $("showMode").value = "all";
      $("search").value = "";
      setSaveView("map");
      switchLayer(playerLayer(point.position));
      detail(point, true);
      savePrefs();
      render();
    },
    setQuestVisible,
    showQuestOnMap,
    setSaveView: (view, { section, collectionGroup } = {}) => {
      if (
        view === "inventory" &&
        ["pouches", "armor", "collections", "medals"].includes(section)
      )
        publish({ inventorySection: section });
      if (
        view === "inventory" &&
        ["memories", "fabrics", "horses", "rewards"].includes(collectionGroup)
      )
        publish({ collectionGroup });
      if (
        view === "world" &&
        ["album", "encyclopedia", "characters", "recipes"].includes(section)
      )
        publish({ worldSection: section });
      setSaveView(view);
      if (view === "summary") {
        renderSummary();
      }
      if (view === "world") {
        renderWorld();
        loadWorldData();
      }
    },
    loadWorldData,
    setQuestFilters,
    refreshMapSize: () => {
      if (!scope.disposed && map) {
        map.invalidateSize();
        render();
      }
    },
  });
  start().catch((error) => {
    if (!scope.disposed) toast(error.message);
  });
  scope.onDispose(() => {
    if (renderFrame !== null) cancelAnimationFrame(renderFrame);
    map?.remove();
  });

  return scope.dispose;
}
