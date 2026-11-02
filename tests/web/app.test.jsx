import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { App } from "../../web/src/app/App.jsx";
import { I18N } from "../../web/src/shared/i18n.js";
import { createViewStore } from "../../web/src/app/store.js";
import questData from "../../web/public/quest-data.json";

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
          addTo() {
            markers.push(this);
            return this;
          },
          bindTooltip() {
            return this;
          },
          bindPopup() {
            return this;
          },
          on() {
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
const mount = async () => {
  let result;
  await act(async () => {
    result = render(
      <App store={createViewStore()} config={{ language: "es" }} />,
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
