import { describe, expect, it } from "vitest";
import {
  coordinateString,
  createMapPointFilter,
  filterMapPoints,
  ll,
  playerLayer,
  prepareMapCatalog,
} from "../../web/src/features/map/model.js";

const fixture = {
  categories: [
    { id: "shrines", name: "Santuarios" },
    { id: "caves", name: "Cuevas" },
  ],
  points: [
    {
      id: "s0",
      category: "shrines",
      name: "Árbol",
      internalName: "Dungeon048",
      position: { x: 10, y: 900, z: 20 },
    },
    {
      id: "c0",
      category: "caves",
      name: "Cueva",
      korokType: "RouteType",
      position: { x: 20, y: 100, z: 30 },
      path: { start: { x: 20, z: 30 }, end: { x: 40, z: 50 } },
    },
    {
      id: "s1",
      category: "shrines",
      name: "Raíz",
      position: { x: 30, y: -500, z: 40 },
    },
    {
      id: "c1",
      category: "caves",
      name: "Otra",
      position: { x: 40, y: 100, z: 50 },
      path: {
        flowers: [
          { position: { x: 40, z: 50 } },
          { position: { x: 45, z: 55 } },
        ],
      },
    },
  ],
};
describe("map model", () => {
  it("reuses matching points while panning and invalidates changed filters and snapshots", () => {
    const catalog = prepareMapCatalog(fixture);
    const filter = createMapPointFilter();
    const options = {
      layer: "surface",
      active: new Set(["caves"]),
      snapshot: { states: [1, 0, -1, 0] },
      mode: "missing",
    };
    const first = filter(catalog.points, options);
    expect(first.map((point) => point.id)).toEqual(["c0", "c1"]);
    expect(filter(catalog.points, { ...options })).toBe(first);
    options.active.clear();
    expect(filter(catalog.points, options)).toEqual([]);
    options.active.add("caves");
    expect(filter(catalog.points, options)).toEqual(first);
    expect(
      filter(catalog.points, { ...options, query: "otra" }).map(
        (point) => point.id,
      ),
    ).toEqual(["c1"]);
    expect(
      filter(catalog.points, {
        ...options,
        snapshot: { states: [1, 1, -1, 0] },
      }).map((point) => point.id),
    ).toEqual(["c1"]);
  });
  it("prepares both route formats without modifying catalog input", () => {
    const catalog = prepareMapCatalog(fixture);
    expect(fixture.points[0]).not.toHaveProperty("index");
    expect(catalog.points[0].index).toBe(0);
    expect(catalog.points[1].routeCoordinates).toEqual([
      [-30, 20],
      [-50, 40],
    ]);
    expect(catalog.points[3].routeCoordinates).toEqual([
      [-50, 40],
      [-55, 45],
    ]);
    expect(catalog.points[0].latLng).toEqual([-20, 10]);
  });
  it("filters layers, categories, accents, internal names, coordinates and save states", () => {
    const catalog = prepareMapCatalog(fixture),
      options = {
        layer: "sky",
        active: new Set(["shrines", "caves"]),
        snapshot: { states: [1, 0, -1, 0] },
      };
    for (const query of ["arbol", "DUNGEON048", "santuarios"])
      expect(
        filterMapPoints(catalog.points, { ...options, query }).map((p) => p.id),
      ).toEqual(["s0"]);
    expect(
      filterMapPoints(catalog.points, {
        ...options,
        layer: "surface",
        query: "routetype",
      }).map((p) => p.id),
    ).toEqual(["c0"]);
    expect(
      filterMapPoints(catalog.points, { ...options, query: "10, -20" }).map(
        (p) => p.id,
      ),
    ).toEqual(["s0"]);
    expect(
      filterMapPoints(catalog.points, {
        ...options,
        layer: "depths",
        mode: "unknown",
      }).map((p) => p.id),
    ).toEqual(["s1"]);
    expect(
      filterMapPoints(catalog.points, {
        ...options,
        layer: "surface",
        mode: "missing",
      }),
    ).toHaveLength(2);
    expect(
      filterMapPoints(catalog.points, { ...options, mode: "found" }),
    ).toHaveLength(1);
    expect(
      filterMapPoints(catalog.points, { ...options, active: new Set() }),
    ).toHaveLength(0);
    expect(
      filterMapPoints(catalog.points, {
        ...options,
        snapshot: null,
        mode: "unknown",
      }),
    ).toHaveLength(1);
  });
  it("converts game coordinates and keeps player layer boundary rules", () => {
    expect(playerLayer({ y: -50 })).toBe("depths");
    expect(playerLayer({ y: 750 })).toBe("sky");
    expect(playerLayer({ y: 0 })).toBe("surface");
    expect(ll({ x: 123, z: -456 })).toEqual([456, 123]);
    expect(coordinateString({ x: -1.7, y: 110, z: -456 })).toBe(
      "-0001  0456  0005",
    );
  });
});
