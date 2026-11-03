import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { App } from "../../web/src/app/App.jsx";
import { I18N } from "../../web/src/shared/i18n.js";
import { createViewStore } from "../../web/src/app/store.js";
import questData from "../../web/public/quest-data.json";
import worldData from "../../web/public/world-data.json";
import collectionData from "../../web/public/collection-data.json";

const leaflet = vi.hoisted(() => {
  const layers = [],
    markers = [],
    tiles = [],
    overlays = [],
    handlers = {};
  const map = {
    getZoom: vi.fn(() => -4),
    setView: vi.fn(),
    removeLayer: vi.fn(),
    remove: vi.fn(),
    invalidateSize: vi.fn(),
    fitBounds: vi.fn(function () {
      return this;
    }),
    createPane: () => ({ style: {} }),
    on: vi.fn((name, fn) => {
      handlers[name] = fn;
    }),
    getBounds: () => ({
      pad() {
        return this;
      },
      contains: (p) => Math.abs(p[1]) < 500,
    }),
    project: () => ({ x: 0, y: 0 }),
    unproject: (p) => p,
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
  };
  const layer = () => {
    const value = {
      items: [],
      addTo() {
        return this;
      },
      clearLayers() {
        this.items = [];
      },
      addLayer(item) {
        this.items.push(item);
      },
    };
    layers.push(value);
    return value;
  };
  return {
    layers,
    markers,
    tiles,
    overlays,
    handlers,
    map,
    L: {
      CRS: { Simple: {} },
      Transformation: function () {},
      extend: Object.assign,
      map: () => map,
      layerGroup: layer,
      divIcon: (options) => options,
      marker: (position, options) => {
        const marker = {
          position,
          options,
          events: {},
          addTo() {
            markers.push(this);
            return this;
          },
          bindTooltip(content) {
            this.tooltip = content;
            return this;
          },
          bindPopup() {
            return this;
          },
          on(name, handler) {
            this.events[name] = handler;
            return this;
          },
          openPopup() {},
        };
        return marker;
      },
      imageOverlay: (url, bounds, options) => {
        const value = {
          url,
          bounds,
          options,
          addTo() {
            return this;
          },
          bringToBack() {},
        };
        overlays.push(value);
        return value;
      },
      tileLayer: (url, options) => {
        const value = {
          url,
          options,
          events: {},
          on(name, fn) {
            this.events[name] = fn;
            return this;
          },
          addTo() {
            return this;
          },
          redraw: vi.fn(),
        };
        tiles.push(value);
        return value;
      },
      polyline: () => ({ addTo() {} }),
    },
  };
});
vi.mock("leaflet", () => ({ default: leaflet.L }));
let state, ready, failures, requests, sessions;
const snapshot = (revision = "1", position = { x: 10, y: 100, z: 20 }) => ({
  file: "test.sav",
  revision,
  savedAt: "2026-11-01T12:00:00Z",
  playtime: 60,
  format: "1.4",
  states: [0, 1, -1],
  values: [0, 1, 0],
  playerPosition: position,
  playerContext: { kind: "world", mapId: "MainField", mapPosition: position },
  quests: [],
  inventory: { groups: [] },
});
const catalog = {
  categories: [
    { id: "shrines", name: "Santuarios", icon: "shrine" },
    { id: "caves", name: "Cuevas", icon: "cave" },
  ],
  points: [
    {
      id: "c0",
      category: "caves",
      name: "Árbol",
      position: { x: 20, y: 100, z: 30 },
    },
    {
      id: "s0",
      category: "shrines",
      name: "Raíz",
      position: { x: 30, y: -500, z: 40 },
    },
    {
      id: "c1",
      category: "caves",
      name: "Lejana",
      position: { x: 1000, y: 100, z: 50 },
    },
  ],
};
beforeEach(() => {
  vi.useFakeTimers();
  I18N.setLanguage("es");
  localStorage.clear();
  leaflet.layers.length = 0;
  leaflet.markers.length = 0;
  leaflet.tiles.length = 0;
  leaflet.overlays.length = 0;
  vi.clearAllMocks();
  ready = true;
  failures = new Set();
  requests = [];
  sessions = [];
  state = {
    source: "test.sav",
    mode: "file",
    status: "ok",
    auto: true,
    followLink: false,
    showLink: true,
    linkOrder: "below",
    linkOpacity: 45,
    mapQuality: "standard",
    snapshot: snapshot(),
  };
  vi.stubGlobal(
    "EventSource",
    class {
      static CLOSED = 2;
      readyState = 1;
      constructor(url) {
        this.url = url;
        this.close = vi.fn();
        sessions.push(this);
      }
    },
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path, options = {}) => {
      requests.push({ path, options });
      const body =
        path === "api/state"
          ? structuredClone(state)
          : path === "api/setup"
            ? { ready, busy: false }
            : path === "catalog.json"
              ? structuredClone(catalog)
              : path === "world-data.json"
                ? structuredClone(worldData)
                : path === "collection-data.json"
                  ? structuredClone(collectionData)
                  : path === "quest-data.json"
                    ? structuredClone(questData)
                    : path === "inventory-data.json"
                      ? { names: { en: {}, es: {} }, armor: {}, enums: [] }
                      : path === "api/updates"
                        ? { currentVersion: "0.6.0", available: false }
                        : path === "api/source-options"
                          ? { saves: [], choices: [] }
                          : path === "api/saves"
                            ? { slots: [] }
                            : path === "api/inspect-file"
                              ? {
                                  ok: true,
                                  snapshot: snapshot("old"),
                                  summary: { ...snapshot("old"), counts: [] },
                                }
                              : { ok: true };
      return {
        ok: !failures.has(path),
        status: failures.has(path) ? 400 : 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => body,
        text: async () => JSON.stringify(body),
      };
    }),
  );
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.className = "";
});
const mount = async (config = {}) => {
  let result;
  await act(async () => {
    result = render(
      <App store={createViewStore()} config={{ language: "es", ...config }} />,
    );
  });
  return result;
};
const tick = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
};
const node = (id) => document.getElementById(id);

describe("map and React integration", () => {
  it("opens summary shortcuts in the exact collection or world section and retries collection loading", async () => {
    failures.add("collection-data.json");
    await mount();
    await act(async () => fireEvent.click(node("summaryTab")));
    expect(node("summaryPanel").textContent).toContain(
      "No se pudieron cargar las colecciones.",
    );
    failures.delete("collection-data.json");
    await act(async () =>
      fireEvent.click(
        node("summaryPanel").querySelector('[role="alert"] button'),
      ),
    );
    expect(
      node("summaryArmor").querySelector('[role="progressbar"]'),
    ).not.toBeNull();
    for (const [id, section, group] of [
      ["summaryArmor", "armor"],
      ["summaryArmorUpgrades", "armor"],
      ["summaryMemories", "collections", "memories"],
      ["summaryFabrics", "collections", "fabrics"],
      ["summaryHorseEquipment", "collections", "horses"],
      ["summaryRewards", "collections", "rewards"],
      ["summaryMedals", "medals"],
    ]) {
      await act(async () => fireEvent.click(node("summaryTab")));
      await act(async () => fireEvent.click(node(id).querySelector("button")));
      expect(node("inventory-content-" + section).hidden, id).toBe(false);
      if (group) {
        const labels = {
          memories: "Recuerdos",
          fabrics: "Telas de la paravela",
          horses: "Equipamiento de caballo",
          rewards: "Recompensas de completado",
        };
        expect(
          node("inventory-content-collections").querySelector(
            '[aria-pressed="true"]',
          ).textContent,
        ).toContain(labels[group]);
      }
    }
    for (const [id, section] of [
      ["summaryCharacters", "characters"],
      ["summaryCompendium", "encyclopedia"],
    ]) {
      await act(async () => fireEvent.click(node("summaryTab")));
      await act(async () => fireEvent.click(node(id).querySelector("button")));
      expect(node(`world-${section}-panel`).hidden).toBe(false);
      expect(node(`world-${section}-tab`).getAttribute("aria-selected")).toBe(
        "true",
      );
    }
  });

  it("restores the saved armor plan, persists changes and lets failed writes retry", async () => {
    const selected = collectionData.armor.find(
      (piece) => piece.upgrades.length,
    ).id;
    await mount({ armorPlan: { target: 2, selected: [selected] } });
    await act(async () => fireEvent.click(node("inventoryTab")));
    await act(async () => fireEvent.click(node("inventory-section-armor")));
    const panel = node("inventory-content-armor");
    expect(
      panel.querySelector('select[aria-label="Nivel objetivo"]').value,
    ).toBe("2");
    expect(
      panel.querySelectorAll('input[type="checkbox"]:checked'),
    ).toHaveLength(1);
    failures.add("api/armor-plan");
    await act(async () =>
      fireEvent.change(
        panel.querySelector('select[aria-label="Nivel objetivo"]'),
        { target: { value: "3" } },
      ),
    );
    expect(panel.querySelector('[role="alert"]').textContent).toContain(
      "No se pudo guardar el plan.",
    );
    failures.delete("api/armor-plan");
    await act(async () =>
      fireEvent.click(panel.querySelector('[role="alert"] button')),
    );
    expect(panel.querySelector('[role="alert"]')).toBeNull();
    const writes = requests.filter((entry) => entry.path === "api/armor-plan");
    expect(JSON.parse(writes.at(-1).options.body)).toEqual({
      target: 3,
      selected: [selected],
    });
    expect(writes.at(-1).options.method).toBe("POST");
  });

  it("saves rapid plan changes in order so earlier requests cannot overwrite the latest target", async () => {
    await mount();
    await act(async () => fireEvent.click(node("inventoryTab")));
    await act(async () => fireEvent.click(node("inventory-section-armor")));
    const originalFetch = fetch;
    const pending = [],
      writes = [];
    vi.stubGlobal("fetch", (path, options) => {
      if (path !== "api/armor-plan") return originalFetch(path, options);
      writes.push(JSON.parse(options.body));
      return new Promise((resolve) =>
        pending.push(async () => resolve(await originalFetch(path, options))),
      );
    });
    const target = node("inventory-content-armor").querySelector(
      'select[aria-label="Nivel objetivo"]',
    );
    await act(async () => fireEvent.change(target, { target: { value: "2" } }));
    await act(async () => fireEvent.change(target, { target: { value: "3" } }));
    expect(writes.map((plan) => plan.target)).toEqual([2]);
    await act(async () => pending[0]());
    expect(writes.map((plan) => plan.target)).toEqual([2, 3]);
    await act(async () => pending[1]());
    expect(target.value).toBe("3");
    expect(node("inventory-content-armor").textContent).not.toContain(
      "Guardando plan…",
    );
  });

  it("summarizes every layer independently of map filters and follows live and inspected saves", async () => {
    state.snapshot = {
      ...snapshot(),
      playtime: 9000,
      inventory: { groups: [], rupees: 0, maxLife: 40, stamina: 2000 },
      quests: [
        { id: "a", state: "done" },
        { id: "b", state: "active" },
        { id: "c", state: "todo" },
        { id: "d", state: "unknown" },
      ],
      compendium: [
        { id: "a", state: "photo" },
        { id: "b", state: "bought" },
        { id: "c", state: "missing" },
        { id: "d", state: "unknown" },
      ],
      characterProfiles: [{ id: "link", state: "discovered" }],
    };
    await mount();
    const initialRequests = requests.length;
    fireEvent.click(node("none"));
    fireEvent.keyDown(node("mapTab"), { key: "End" });
    expect(document.activeElement.id).toBe("summaryTab");
    expect(node("summaryPanel").hidden).toBe(false);
    expect(node("mapPanel").hidden).toBe(true);
    expect(node("summaryPanel").textContent).toContain("2 h 30 min");
    expect(
      node("summaryPanel").querySelector(".summary-stats").textContent,
    ).toContain("Rupias0");
    expect(
      node("summaryMap")
        .querySelector('[role="progressbar"]')
        .getAttribute("aria-valuenow"),
    ).toBe("1");
    expect(
      node("summaryMap")
        .querySelector('[role="progressbar"]')
        .getAttribute("aria-valuemax"),
    ).toBe("3");
    expect(
      node("summaryQuests")
        .querySelector('[role="progressbar"]')
        .getAttribute("aria-valuenow"),
    ).toBe("1");
    expect(
      node("summaryCompendium")
        .querySelector('[role="progressbar"]')
        .getAttribute("aria-valuenow"),
    ).toBe("2");
    expect(
      node("summaryCharacters")
        .querySelector('[role="progressbar"]')
        .getAttribute("aria-valuenow"),
    ).toBe("1");
    expect(
      requests
        .slice(initialRequests)
        .some((request) =>
          [
            "inventory-data.json",
            "quest-data.json",
            "world-data.json",
          ].includes(request.path),
        ),
    ).toBe(false);
    state.snapshot = { ...snapshot("summary-live"), states: [1, 1, 0] };
    await tick();
    expect(
      node("summaryMap")
        .querySelector('[role="progressbar"]')
        .getAttribute("aria-valuenow"),
    ).toBe("2");
    await act(async () => fireEvent.click(node("openSaves")));
    fireEvent.change(node("inspectFilePath"), { target: { value: "old.sav" } });
    await act(async () => fireEvent.click(node("inspectPath")));
    fireEvent.click(node("viewInspected"));
    expect(
      node("summaryMap")
        .querySelector('[role="progressbar"]')
        .getAttribute("aria-valuenow"),
    ).toBe("1");
    state.snapshot = { ...snapshot("summary-newer"), states: [1, 1, 1] };
    await tick();
    expect(
      node("summaryMap")
        .querySelector('[role="progressbar"]')
        .getAttribute("aria-valuenow"),
    ).toBe("1");
    fireEvent.click(node("returnLive"));
    expect(
      node("summaryMap")
        .querySelector('[role="progressbar"]')
        .getAttribute("aria-valuenow"),
    ).toBe("3");
    fireEvent.click(node("summaryMap").querySelector("button"));
    expect(node("mapPanel").hidden).toBe(false);
    expect(document.activeElement.id).toBe("mapTab");
    fireEvent.keyDown(node("mapTab"), { key: "ArrowLeft" });
    expect(node("summaryPanel").hidden).toBe(false);
  });
  it("offers the summary without a save and keeps unavailable fields distinct from zero", async () => {
    state.source = "";
    state.snapshot = null;
    state.status = "empty";
    await mount();
    fireEvent.click(node("summaryTab"));
    expect(node("summarySource").textContent).toBe(
      "Carga una partida para ver el resumen de tu aventura.",
    );
    expect(node("summaryPanel").querySelector(".summary-stats")).toBeNull();
    state.snapshot = snapshot("summary-loaded");
    state.status = "ok";
    await tick();
    expect(
      node("summaryPanel").querySelector(".summary-stats").textContent,
    ).toContain("No disponible");
    expect(node("summaryQuests").textContent).toContain("No disponible");
    expect(
      node("summaryQuests").querySelector('[role="progressbar"]'),
    ).toBeNull();
  });
  it("loads inventory collections on demand, retries and follows the active snapshot", async () => {
    state.snapshot.collections = [
      { id: collectionData.entries[0].id, state: "owned" },
    ];
    await mount();
    await act(async () => fireEvent.click(node("inventoryTab")));
    expect(
      requests.some((request) => request.path === "collection-data.json"),
    ).toBe(false);
    failures.add("collection-data.json");
    await act(async () =>
      fireEvent.click(node("inventory-section-collections")),
    );
    expect(node("inventory-content-collections").textContent).toContain(
      "No se pudieron cargar las colecciones.",
    );
    failures.delete("collection-data.json");
    await act(async () =>
      fireEvent.click(
        node("inventory-content-collections").querySelector(
          '[role="alert"] button',
        ),
      ),
    );
    expect(
      node("inventory-content-collections").querySelectorAll(
        ".collection-owned",
      ),
    ).toHaveLength(1);
    state.snapshot = { ...snapshot("collection-next"), collections: [] };
    await tick();
    expect(
      node("inventory-content-collections").querySelectorAll(
        ".collection-owned",
      ),
    ).toHaveLength(0);
    await act(async () => fireEvent.click(node("openSaves")));
    fireEvent.change(node("inspectFilePath"), { target: { value: "old.sav" } });
    await act(async () => fireEvent.click(node("inspectPath")));
    fireEvent.click(node("viewInspected"));
    state.snapshot = {
      ...snapshot("collection-live"),
      collections: [{ id: collectionData.entries[0].id, state: "owned" }],
    };
    await tick();
    expect(
      node("inventory-content-collections").querySelectorAll(
        ".collection-owned",
      ),
    ).toHaveLength(0);
    fireEvent.click(node("returnLive"));
    expect(
      node("inventory-content-collections").querySelectorAll(
        ".collection-owned",
      ),
    ).toHaveLength(1);
  });
  it("shows discovered shrines/towers in yellow, tracks all chests and refreshes the open detail", async () => {
    const fetch = globalThis.fetch;
    const shrineCatalog = {
      categories: [
        { id: "shrines", name: "Santuarios", icon: "shrine" },
        { id: "towers", name: "Atalayas", icon: "tower" },
      ],
      points: [
        {
          id: "s0",
          category: "shrines",
          name: "Santuario",
          hash: "123",
          visitHash: "456",
          chestHashes: ["789", "790"],
          position: { x: 10, y: 100, z: 20 },
        },
        {
          id: "t0",
          category: "towers",
          name: "Atalaya",
          hash: "124",
          visitHash: "457",
          position: { x: 30, y: 100, z: 40 },
        },
      ],
    };
    vi.stubGlobal("fetch", async (url, options) =>
      url === "catalog.json"
        ? { ok: true, json: async () => structuredClone(shrineCatalog) }
        : fetch(url, options),
    );
    state.snapshot = {
      ...snapshot(),
      states: [0, 0],
      values: [0, 0],
      visited: [1, 1],
      shrineChests: [{ opened: 1, total: 2, unknown: 0 }, null],
    };
    localStorage.setItem(
      "hyrulesync.preferences",
      JSON.stringify({ active: ["shrines", "towers"], mode: "discovered" }),
    );
    await mount();
    const markers = () => leaflet.layers[1].items;
    expect(markers()).toHaveLength(2);
    expect(
      markers().every((marker) =>
        marker.options.icon.className.includes("discovered"),
      ),
    ).toBe(true);
    expect(markers()[0].tooltip).toContain("Cofres: 1/2");
    act(() => markers()[0].events.click());
    expect(node("detailState").textContent).toBe("Descubierto");
    expect(node("detailState").dataset.state).toBe("discovered");
    expect(node("detailChests").textContent).toContain("1/2");
    expect(node("foundCount").textContent).toBe("0");
    state.snapshot = {
      ...state.snapshot,
      revision: "2",
      states: [1, 1],
      shrineChests: [{ opened: 2, total: 2, unknown: 0 }, null],
    };
    await tick();
    expect(markers()).toHaveLength(0);
    expect(node("detailState").textContent).toBe("Completado");
    expect(node("detailChests").textContent).toBe(
      "Todos los cofres obtenidos · 2/2",
    );
    expect(node("foundCount").textContent).toBe("2");
    fireEvent.change(node("showMode"), { target: { value: "found" } });
    expect(markers()[0].options.icon.html).toContain("shrine-chests-badge");
    act(() => markers()[1].events.click());
    expect(node("detailChests").hidden).toBe(true);
    expect(node("korokInfo").textContent).toBe("Activada: Sí");
    state.snapshot = {
      ...state.snapshot,
      revision: "3",
      shrineChests: [{ opened: 1, total: 2, unknown: 0 }, null],
    };
    await tick();
    fireEvent.change(node("showMode"), { target: { value: "chests" } });
    expect(markers()).toHaveLength(1);
    expect(markers()[0].options.icon.html).not.toContain("shrine-chests-badge");
    act(() => markers()[0].events.click());
    expect(node("detailState").textContent).toBe("Completado");
    expect(node("detailChests").textContent).toContain(
      "quedan cofres pendientes",
    );
    state.snapshot = {
      ...state.snapshot,
      revision: "4",
      shrineChests: [{ opened: 1, total: 2, unknown: 1 }, null],
    };
    await tick();
    expect(markers()).toHaveLength(0);
    expect(node("detailChests").textContent).toContain("1 sin verificar");
  });
  it("keeps the save chooser hidden while the initial requests are pending", async () => {
    const fetch = globalThis.fetch;
    let finishSetup;
    vi.stubGlobal("fetch", (path, options) =>
      path === "api/setup"
        ? new Promise((resolve) => {
            finishSetup = async () => resolve(await fetch(path, options));
          })
        : fetch(path, options),
    );
    await mount();
    expect(node("startupLoading").hidden).toBe(false);
    expect(node("welcome").hidden).toBe(true);
    expect(node("statusTitle").textContent).toBe("Cargando partida…");
    expect(node("sourceName").textContent).toBe(
      "Reconociendo el guardado configurado…",
    );
    expect(node("openFolder").disabled).toBe(true);
    expect(node("openSave").disabled).toBe(true);
    await act(async () => finishSetup());
    expect(node("startupLoading").hidden).toBe(true);
    expect(node("welcome").hidden).toBe(true);
    expect(node("statusTitle").textContent).toBe("Partida cargada");
  });
  it("waits for the remembered save without flashing the chooser", async () => {
    state.snapshot = null;
    state.status = "empty";
    await mount();
    expect(node("startupLoading").hidden).toBe(false);
    expect(node("welcome").hidden).toBe(true);
    expect(node("statusTitle").textContent).toBe("Cargando partida…");
    await tick();
    expect(node("welcome").hidden).toBe(true);
    state.snapshot = snapshot();
    state.status = "ok";
    await tick();
    expect(node("startupLoading").hidden).toBe(true);
    expect(node("welcome").hidden).toBe(true);
    expect(node("statusTitle").textContent).toBe("Partida cargada");
    expect(node("openFolder").disabled).toBe(false);
    expect(node("openSave").disabled).toBe(false);
  });
  it("shows the chooser immediately once no configured source is confirmed", async () => {
    state.source = "";
    state.snapshot = null;
    state.status = "empty";
    await mount();
    expect(node("startupLoading").hidden).toBe(true);
    expect(node("welcome").hidden).toBe(false);
    expect(node("statusTitle").textContent).toBe("Sin partida cargada");
    expect(node("openFolder").disabled).toBe(false);
  });
  it("releases the startup buffer after three seconds and still accepts a later save", async () => {
    state.snapshot = null;
    state.status = "empty";
    await mount();
    await tick();
    await tick();
    expect(node("startupLoading").hidden).toBe(false);
    expect(node("welcome").hidden).toBe(true);
    await tick();
    expect(node("startupLoading").hidden).toBe(true);
    expect(node("welcome").hidden).toBe(false);
    expect(node("openSave").disabled).toBe(false);
    state.snapshot = snapshot();
    state.status = "ok";
    await tick();
    expect(node("welcome").hidden).toBe(true);
    expect(node("statusTitle").textContent).toBe("Partida cargada");
  });
  it("shows initial read errors without waiting for the startup buffer", async () => {
    state.snapshot = null;
    state.status = "error";
    state.message = "No se pudo leer el guardado.";
    await mount();
    expect(node("startupLoading").hidden).toBe(true);
    expect(node("welcome").hidden).toBe(false);
    expect(node("error").hidden).toBe(false);
    expect(node("error").textContent).toBe(state.message);
    expect(node("openFolder").disabled).toBe(false);
  });
  it("leaves the initial loading state when the executable is disconnected", async () => {
    failures.add("api/state");
    await mount();
    expect(node("startupLoading").hidden).toBe(true);
    expect(node("welcome").hidden).toBe(false);
    expect(node("statusTitle").textContent).toBe("Ejecutable desconectado");
    expect(node("error").hidden).toBe(false);
    expect(node("openFolder").disabled).toBe(false);
    expect(node("openSave").disabled).toBe(false);
  });
  it("compares character profiles with the live or inspected save while keeping the discovery filter", async () => {
    state.snapshot.characterProfiles = [
      { id: "zelda", state: "discovered" },
      { id: "purah", state: "missing" },
    ];
    await mount();
    await act(async () => fireEvent.click(node("worldTab")));
    fireEvent.click(node("world-characters-tab"));
    const filter = () => node("world-characters-panel").querySelector("select");
    fireEvent.change(filter(), { target: { value: "missing" } });
    expect(
      node("worldPanel").querySelector(".world-character h3").textContent,
    ).toBe("Prunia");
    state.snapshot = {
      ...snapshot("next-characters"),
      characterProfiles: [
        { id: "zelda", state: "missing" },
        { id: "purah", state: "discovered" },
      ],
    };
    await tick();
    expect(
      node("worldPanel").querySelector(".world-character h3").textContent,
    ).toBe("Zelda");
    await act(async () => fireEvent.click(node("openSaves")));
    fireEvent.change(node("inspectFilePath"), { target: { value: "old.sav" } });
    await act(async () => fireEvent.click(node("inspectPath")));
    fireEvent.click(node("viewInspected"));
    expect(
      node("worldPanel").querySelectorAll(".world-character"),
    ).toHaveLength(0);
    fireEvent.change(filter(), { target: { value: "unknown" } });
    expect(
      node("worldPanel").querySelectorAll(".world-character"),
    ).toHaveLength(22);
    state.snapshot = {
      ...snapshot("latest-characters"),
      characterProfiles: worldData.characters.map((character) => ({
        id: character.id,
        state: "discovered",
      })),
    };
    await tick();
    expect(
      node("worldPanel").querySelectorAll(".world-character"),
    ).toHaveLength(22);
    fireEvent.click(node("returnLive"));
    expect(
      node("worldPanel").querySelectorAll(".world-character"),
    ).toHaveLength(0);
    fireEvent.change(filter(), { target: { value: "discovered" } });
    expect(
      node("worldPanel").querySelectorAll(".world-character"),
    ).toHaveLength(22);
    expect(
      node("worldPanel")
        .querySelector('[role="progressbar"]')
        .getAttribute("aria-valuenow"),
    ).toBe("22");
  });
  it("loads HyruleWorld on demand, retries failures and shares live and inspected compendium records", async () => {
    state.snapshot.compendium = [
      { id: worldData.entries[0].id, state: "photo" },
    ];
    await mount();
    expect(requests.some((request) => request.path === "world-data.json")).toBe(
      false,
    );
    failures.add("world-data.json");
    await act(async () => fireEvent.click(node("worldTab")));
    expect(node("worldPanel").hidden).toBe(false);
    expect(node("worldPanel").textContent).toContain(
      "No se pudo cargar la enciclopedia.",
    );
    failures.delete("world-data.json");
    await act(async () =>
      fireEvent.click(
        node("worldPanel").querySelector('[role="alert"] button'),
      ),
    );
    expect(node("worldPanel").querySelectorAll(".world-card")).toHaveLength(1);
    state.snapshot = {
      ...snapshot("next"),
      compendium: [{ id: worldData.entries[1].id, state: "bought" }],
    };
    await tick();
    expect(node("worldPanel").querySelector(".world-card h3").textContent).toBe(
      worldData.entries[1].nameEs,
    );
    await act(async () => fireEvent.click(node("openSaves")));
    fireEvent.change(node("inspectFilePath"), { target: { value: "old.sav" } });
    await act(async () => fireEvent.click(node("inspectPath")));
    fireEvent.click(node("viewInspected"));
    expect(node("worldPanel").querySelectorAll(".world-card")).toHaveLength(0);
    state.snapshot = {
      ...snapshot("latest"),
      compendium: [{ id: worldData.entries[2].id, state: "photo" }],
    };
    await tick();
    expect(node("worldPanel").querySelectorAll(".world-card")).toHaveLength(0);
    fireEvent.click(node("returnLive"));
    expect(node("worldPanel").querySelector(".world-card h3").textContent).toBe(
      worldData.entries[2].nameEs,
    );
    fireEvent.click(node("mapTab"));
    expect(node("worldPanel").hidden).toBe(true);
    expect(node("mapPanel").hidden).toBe(false);
  });
  it("shares Spanish quest names, locations and bilingual search between cards and map markers", async () => {
    await mount();
    await act(async () => fireEvent.click(node("questsTab")));
    fireEvent.change(node("questSearch"), {
      target: { value: "Destroy Ganondorf" },
    });
    const card = node("questList").querySelector("article");
    expect(card.querySelector("h2").textContent).toBe("Derrota a Ganondorf");
    expect(card.textContent).toContain("Fuerte vigía · Prunia");
    await act(async () => fireEvent.click(card.querySelector("button")));
    const markers = leaflet.layers.flatMap((layer) => layer.items);
    expect(
      markers.some((marker) => marker.options.title === "Derrota a Ganondorf"),
    ).toBe(true);
    expect(card.querySelector(".quest-guide").href).toBe(
      "https://www.zeldadungeon.net/wiki/Destroy_Ganondorf",
    );
  });
  it("keeps detected save selection, folder browsing and source submission working", async () => {
    const base = fetch.getMockImplementation();
    fetch.mockImplementation((path, options) => {
      const body =
        path === "api/source-options"
          ? {
              saves: [{ name: "Slot 1", path: "slot_01/progress.sav" }],
              choices: [{ name: "Profile", path: "saves/profile" }],
            }
          : path.startsWith("api/folders?")
            ? {
                path: "saves/profile",
                parent: "saves",
                folders: [{ name: "Slot 1", path: "saves/profile/slot_01" }],
              }
            : null;
      return body
        ? Promise.resolve(
            new Response(JSON.stringify(body), {
              headers: { "content-type": "application/json" },
            }),
          )
        : base(path, options);
    });
    await mount();
    await act(async () => fireEvent.click(node("openSave")));
    expect(node("knownSaves").value).toBe("slot_01/progress.sav");
    expect(node("filePath").value).toBe("test.sav");
    fireEvent.change(node("knownSaves"), {
      target: { value: "slot_01/progress.sav" },
    });
    await act(async () =>
      fireEvent.submit(node("fileDialog").querySelector("form"), {
        submitter: node("confirmFile"),
      }),
    );
    expect(requests).toContainEqual(
      expect.objectContaining({
        path: "api/set-file",
        options: expect.objectContaining({ body: "slot_01/progress.sav" }),
      }),
    );
    expect(node("fileDialog").open).toBe(false);
    await act(async () => fireEvent.click(node("openFolder")));
    expect(node("folderPath").value).toBe("saves/profile");
    await act(async () => fireEvent.click(node("browseFolder")));
    expect(node("folderCurrent").textContent).toBe("saves/profile");
    expect(node("folderEntries").textContent).toContain("Slot 1");
    await act(async () =>
      fireEvent.submit(node("folderDialog").querySelector("form"), {
        submitter: node("confirmFolder"),
      }),
    );
    expect(requests).toContainEqual(
      expect.objectContaining({
        path: "api/set-folder",
        options: expect.objectContaining({ body: "saves/profile" }),
      }),
    );
    expect(node("folderDialog").open).toBe(false);
  });
  it("keeps late inspection errors out of a replacement React controller", async () => {
    let resolveInspection;
    const base = fetch.getMockImplementation();
    fetch.mockImplementation((path, options) =>
      path === "api/inspect-file"
        ? new Promise((resolve) => {
            resolveInspection = resolve;
          })
        : base(path, options),
    );
    const result = await mount();
    await act(async () => fireEvent.click(node("openSaves")));
    fireEvent.click(node("inspectPath"));
    expect(node("inspectPath").disabled).toBe(true);
    await act(async () =>
      result.rerender(
        <App store={createViewStore()} config={{ language: "es" }} />,
      ),
    );
    expect(node("inspectPath").disabled).toBe(false);
    await act(async () =>
      resolveInspection(
        new Response(JSON.stringify({ ok: false, error: "Stale error" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    expect(node("savesError").textContent).toBe("");
    expect(node("viewInspected").disabled).toBe(true);
  });
  it("recreates the map adapter without duplicating categories during React refresh", async () => {
    const store = createViewStore();
    let result;
    await act(async () => {
      result = render(<App store={store} config={{ language: "es" }} />);
    });
    expect(node("categories").children).toHaveLength(3);
    await act(async () => fireEvent.click(node("inventoryTab")));
    await act(async () =>
      result.rerender(<App store={store} config={{ language: "es" }} />),
    );
    expect(node("categories").children).toHaveLength(3);
    expect(node("mapPanel").hidden).toBe(false);
    expect(leaflet.map.remove).toHaveBeenCalledOnce();
  });
  it.each(["null", "42", "true", "[]", "{invalid"])(
    "recovers invalid preferences %s and keeps controls working without storage",
    async (stored) => {
      localStorage.setItem("hyrulesync.preferences", stored);
      await mount();
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Storage unavailable");
      });
      fireEvent.click(node("all"));
      expect(node("category-caves").checked).toBe(true);
      fireEvent.click(node("none"));
      expect(node("category-caves").checked).toBe(false);
    },
  );
  it("does not initialize a map after a pending setup request outlives the React mount", async () => {
    let resolveSetup;
    const base = fetch.getMockImplementation();
    fetch.mockImplementation((path, options) =>
      path === "api/setup"
        ? new Promise((resolve) => {
            resolveSetup = resolve;
          })
        : base(path, options),
    );
    const result = await mount();
    result.unmount();
    await act(async () =>
      resolveSetup({ json: async () => ({ ready: true }) }),
    );
    expect(fetch.mock.calls.some(([path]) => path === "catalog.json")).toBe(
      false,
    );
    expect(leaflet.overlays).toHaveLength(0);
  });
  it("initializes categories, filters, tabs and accessible keyboard navigation", async () => {
    await mount();
    expect(node("setup").hidden).toBe(true);
    expect(node("foundCount").textContent).toBe("1");
    fireEvent.click(node("all"));
    expect(leaflet.layers[1].items.map((m) => m.options.title)).toContain(
      "Árbol",
    );
    fireEvent.change(node("showMode"), { target: { value: "all" } });
    expect(node("visibleCount").textContent).toContain("2 puntos");
    expect(leaflet.layers[1].items).toHaveLength(1);
    fireEvent.input(node("search"), { target: { value: "ARBOL" } });
    await act(async () => vi.advanceTimersByTimeAsync(20));
    expect(node("visibleCount").textContent).toContain("1 puntos");
    await act(async () => fireEvent.click(node("inventoryTab")));
    expect(node("inventoryPanel").hidden).toBe(false);
    fireEvent.keyDown(node("inventoryTab"), { key: "ArrowRight" });
    expect(node("questsPanel").hidden).toBe(false);
    expect(document.activeElement.id).toBe("questsTab");
    fireEvent.keyDown(node("questsTab"), { key: "Home" });
    expect(node("mapPanel").hidden).toBe(false);
    expect(leaflet.map.invalidateSize).toHaveBeenCalled();
    fireEvent.click(node("none"));
    expect(node("visibleCount").textContent).toContain("0 puntos");
  });
  it("keeps Link follow optional, preserves zoom and changes layers for new saves", async () => {
    await mount();
    expect(leaflet.map.setView).not.toHaveBeenCalled();
    expect(leaflet.markers.at(-1).options).toMatchObject({
      pane: "linkBelow",
      opacity: 0.45,
    });
    state.followLink = true;
    await tick();
    expect(leaflet.map.setView).toHaveBeenLastCalledWith([-20, 10], -4, {
      animate: false,
    });
    state.snapshot = snapshot("2", { x: 30, y: 900, z: 40 });
    await tick();
    expect(leaflet.map.setView).toHaveBeenLastCalledWith([-40, 30], -4, {
      animate: false,
    });
    expect(leaflet.overlays.at(-1).url).toContain("sky");
    state.followLink = false;
    state.snapshot = snapshot("3", { x: 50, y: -500, z: 60 });
    leaflet.map.setView.mockClear();
    await tick();
    expect(leaflet.map.setView).not.toHaveBeenCalled();
    state.showLink = false;
    await tick();
    expect(node("centerLink").disabled).toBe(true);
    expect(node("followLink").disabled).toBe(true);
  });
  it("keeps an inspected preview while autosync advances, then returns to the latest save", async () => {
    await mount();
    await act(async () => fireEvent.click(node("openSaves")));
    fireEvent.change(node("inspectFilePath"), { target: { value: "old.sav" } });
    await act(async () => fireEvent.click(node("inspectPath")));
    fireEvent.click(node("viewInspected"));
    expect(node("previewBanner").hidden).toBe(false);
    state.snapshot = snapshot("new");
    await tick();
    expect(node("previewBanner").hidden).toBe(false);
    fireEvent.click(node("returnLive"));
    expect(node("previewBanner").hidden).toBe(true);
  });
  it("tracks buffered saves silently with the normal loaded status", async () => {
    await mount();
    const previousPosition = node("linkPosition").textContent;
    state.sourceNotice = "Siguiendo el último guardado terminado en el buffer.";
    state.snapshot.savedAt = "2026-11-02T15:00:00Z";
    await tick();
    expect(node("statusTitle").textContent).toBe("Partida cargada");
    expect(node("statusDot").className).toBe("ok");
    expect(document.body.textContent).not.toContain(state.sourceNotice);
    expect(node("error").hidden).toBe(true);
    expect(node("linkPosition").textContent).not.toBe(previousPosition);
    state.snapshot = snapshot("next-buffer", { x: 30, y: 100, z: 40 });
    await tick();
    expect(node("linkPosition").textContent).toContain("30");
    expect(node("statusTitle").textContent).toBe("Partida cargada");
    state.sourceNotice = "";
    await tick();
    expect(node("statusTitle").textContent).toBe("Partida cargada");
    expect(node("statusDot").className).toBe("ok");
    expect(node("error").hidden).toBe(true);
  });
  it("keeps offline maps below HD tiles, handles errors and switches back to SD", async () => {
    await mount();
    expect(leaflet.tiles).toHaveLength(0);
    expect(leaflet.overlays[0].options.pane).toBe("mapBackground");
    state.mapQuality = "high";
    await tick();
    const tiles = leaflet.tiles.at(-1);
    expect(tiles.url).toBe("map-tiles/surface/{z}/{x}/{y}.webp");
    expect(tiles.options).toMatchObject({
      pane: "hdMap",
      keepBuffer: 2,
      updateWhenZooming: false,
      zoomOffset: 6,
      minNativeZoom: -6,
      maxNativeZoom: 1,
    });
    act(() => tiles.events.tileerror());
    expect(node("hdRetry").hidden).toBe(false);
    state.mapQuality = "standard";
    await tick();
    expect(leaflet.map.removeLayer).toHaveBeenCalledWith(tiles);
    expect(node("hdRetry").hidden).toBe(true);
  });
  it("starts resource preparation on the first-run screen and reports server rejection", async () => {
    ready = false;
    await mount();
    expect(node("setup").hidden).toBe(false);
    failures.add("api/prepare-map");
    await act(async () => fireEvent.click(node("prepareResources")));
    expect(requests.some((r) => r.path === "api/prepare-map")).toBe(true);
    expect(node("setupError").textContent).not.toBe("");
  });
  it("aborts requests, removes events, closes the page connection and clears timers on unmount", async () => {
    const result = await mount();
    const before = requests.length,
      signal = requests.find((r) => r.path === "api/state").options.signal;
    result.unmount();
    expect(signal.aborted).toBe(true);
    expect(sessions[0].close).toHaveBeenCalled();
    expect(leaflet.map.remove).toHaveBeenCalledOnce();
    await tick();
    window.dispatchEvent(new Event("pageshow"));
    expect(requests).toHaveLength(before);
    expect(sessions).toHaveLength(1);
  });
});
