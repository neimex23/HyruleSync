import L from "leaflet";

import { I18N } from "../../shared/i18n.js";
import { fmt, esc } from "../../shared/utils.js";
import {
  questTypes,
  questStates,
  questGuideLink,
  filterQuests,
  prepareQuests,
  questProgress as createQuestProgress,
} from "./model.js";

export function createQuestController(context) {
  const t = (key, values) => I18N.t(key, values);
  const {
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
  } = context;
  let questData = null,
    questLoading = false,
    questFailed = false,
    questView = false,
    selectedQuest = null;
  let questMarkers = null,
    questLoadPromise = null,
    openQuestPopup = false;
  let lastQuestRenderKey = null,
    lastQuestSnapshot = null;
  const hiddenQuests = new Set();
  let filters = {
    query: $("questSearch").value,
    type: $("questType").value,
    state: $("questState").value,
  };

  function setQuestFilters(patch) {
    filters = { ...filters, ...patch };
    selectedQuest = null;
    renderQuests();
    renderQuestMarkers();
  }

  function questsOnMap() {
    return context.active.has("quests");
  }

  function setQuestMapVisible(enabled) {
    enabled ? context.active.add("quests") : context.active.delete("quests");
    const input = $("category-quests");

    if (input) input.checked = enabled;
    savePrefs();
    if (enabled) loadQuests();
    lastQuestRenderKey = null;
    renderQuestMarkers();
  }

  function setQuestVisible(id, enabled) {
    enabled ? hiddenQuests.delete(id) : hiddenQuests.add(id);
    if (!enabled && selectedQuest === id) {
      selectedQuest = null;
      openQuestPopup = false;
    }
    lastQuestRenderKey = null;

    try {
      localStorage.setItem(
        "hyrulesync.hiddenQuests",
        JSON.stringify([...hiddenQuests]),
      );
    } catch {}
    renderQuests();
    renderQuestMarkers();
  }

  function questRenderKey() {
    return JSON.stringify([
      context.layer,
      context.map.getZoom(),
      questsOnMap(),
      filters.query,
      filters.type,
      filters.state,
      selectedQuest,
    ]);
  }

  function questGuideButton(quest) {
    return `<a class="guide-button quest-guide" href="${esc(questGuideLink(quest))}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t("Ver guía en Zelda Dungeon (otra pestaña)"))}">${esc(t("Ver guía"))} · Zelda Dungeon</a>`;
  }

  function setSaveView(view) {
    context.inventoryView = view === "inventory";
    questView = view === "quests";
    document.body.classList.toggle("inventory-view", view !== "map");
    publish({ view });
    if (context.inventoryView) {
      renderInventory();
      loadInventoryNames();
    }
    if (questView) {
      renderQuests();
      loadQuests();
    }
    if (view === "map" && context.map) {
      context.map.invalidateSize();
      render();
    }
  }

  async function loadQuests() {
    if (questData) return;
    if (questLoadPromise) return questLoadPromise;
    questLoading = true;
    questFailed = false;
    renderQuests();
    questLoadPromise = (async () => {
      try {
        const response = await fetch("quest-data.json");

        if (!response.ok) throw Error();
        questData = prepareQuests((await response.json()).quests);
      } catch {
        questFailed = true;
      } finally {
        questLoading = false;
        questLoadPromise = null;
        updateQuestCategoryCount();
        renderQuests();
        renderQuestMarkers();
      }
    })();

    return questLoadPromise;
  }

  function filteredQuests(progress) {
    return filterQuests(
      questData || [],
      progress,
      filters.query,
      filters.type,
      filters.state,
    );
  }

  function renderQuests() {
    if (!questView) return;
    publish({
      quests: {
        snapshot: context.snapshot,
        data: questData,
        loading: questLoading,
        failed: questFailed,
        selected: selectedQuest,
        hidden: [...hiddenQuests],
      },
    });
  }

  function showQuestOnMap(id) {
    const quest = questData?.find((q) => q.id === id);

    if (!quest?.position || !context.map) return;
    setQuestVisible(id, true);
    selectedQuest = id;
    setQuestMapVisible(true);
    setSaveView("map");
    if (context.layer !== playerLayer(quest.position))
      switchLayer(playerLayer(quest.position));
    $("detail").hidden = true;
    context.map.setView(
      ll(quest.position),
      Math.max(context.map.getZoom(), -1),
      {
        animate: false,
      },
    );
    openQuestPopup = true;
    render();
    document
      .querySelectorAll(".quest-map-marker.selected")
      .forEach((node) => node.focus());
  }

  function renderQuestMarkers() {
    if (context.disposed || !context.map || !questData) return;

    const key = questRenderKey();

    if (
      key === lastQuestRenderKey &&
      context.snapshot === lastQuestSnapshot &&
      !openQuestPopup
    )
      return;
    lastQuestRenderKey = key;
    lastQuestSnapshot = context.snapshot;
    if (!questMarkers) questMarkers = L.layerGroup().addTo(context.map);
    questMarkers.clearLayers();
    if (!questsOnMap()) return;

    const progress = createQuestProgress(context.snapshot),
      quests = filteredQuests(progress);
    const selected = questData.find((q) => q.id === selectedQuest);

    if (selected && !quests.includes(selected)) quests.push(selected);

    // Offset co-located markers in screen pixels so every quest at a shared area remains clickable.
    const groups = new Map();

    for (const q of quests) {
      if (!q.position || hiddenQuests.has(q.id) || !inLayer(q)) continue;

      const key = ll(q.position).join(",");

      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(q);
    }
    for (const group of groups.values())
      for (let index = 0; index < group.length; index++) {
        const q = group[index],
          state = progress.get(q.id)?.state || "unknown",
          chosen = q.id === selectedQuest;
        let location = ll(q.position);

        if (group.length > 1) {
          const point = context.map.project(location, context.map.getZoom()),
            angle = (index / group.length) * Math.PI * 2,
            radius = Math.max(22, group.length * 5);
          location = context.map.unproject(
            [
              point.x + Math.cos(angle) * radius,
              point.y + Math.sin(angle) * radius,
            ],
            context.map.getZoom(),
          );
        }

        const marker = L.marker(location, {
          icon: L.divIcon({
            className: `quest-map-marker quest-${state}${chosen ? " selected" : ""}`,
            html: state === "done" ? "✓" : state === "unknown" ? "?" : "!",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
          title: q.name,
          alt: q.name,
          zIndexOffset: chosen ? 1600 : 600,
        });
        const content = `<strong>${esc(q.name)}</strong><br>${esc(t(questStates[state]))} · ${esc(t(questTypes[q.type]))}<br>${esc(q.location)}<br><small>${esc(t(q.locationKind === "shrine" ? "Santuario asociado" : "Zona de referencia; el personaje puede estar en otro punto."))}</small><br>${esc(coordinateString(q.position))}<br>${questGuideButton(q)}`;
        marker.bindTooltip(esc(q.name) + " · " + esc(t(questStates[state])), {
          direction: "top",
        });
        marker.bindPopup(content);
        marker.on("click", () => {
          selectedQuest = q.id;
          lastQuestRenderKey = questRenderKey();
        });
        questMarkers.addLayer(marker);
        if (chosen && openQuestPopup) {
          openQuestPopup = false;
          marker.openPopup();
        }
      }
  }

  function updateQuestCategoryCount() {
    const node = $("count-quests");

    if (!node || !questData) return;
    node.textContent = fmt(questData.length);
    node.title = t("Mostrar misiones en el mapa");
  }

  function initQuests() {
    $("questRetry").onclick = () => {
      loadQuests();
      renderQuests();
    };

    $("questsSidebar").onclick = () => $("sidebar").classList.toggle("open");

    try {
      const ids = JSON.parse(
        localStorage.getItem("hyrulesync.hiddenQuests") || "[]",
      );

      if (Array.isArray(ids))
        for (const id of ids) if (typeof id === "string") hiddenQuests.add(id);
    } catch {}
    updateQuestCategoryCount();
    loadQuests();
  }

  return {
    initQuests,
    loadQuests,
    renderQuests,
    renderQuestMarkers,
    updateQuestCategoryCount,
    setQuestVisible,
    showQuestOnMap,
    setSaveView,
    setQuestFilters,
  };
}
