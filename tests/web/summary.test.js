import { expect, it } from "vitest";
import { createSummary } from "../../web/src/features/summary/model.js";

it("keeps unknown and absent flags separate from pending progress across layers", () => {
  const catalog = {
    categories: [{ id: "shrines" }, { id: "caves" }],
    points: [
      { index: 0, category: "shrines" },
      { index: 1, category: "shrines" },
      { index: 2, category: "caves" },
      { index: 3, category: "caves" },
    ],
  };
  const result = createSummary(
    {
      states: [1, 0, -1],
      quests: [
        { state: "done" },
        { state: "active" },
        { state: "todo" },
        { state: "unexpected" },
        {},
      ],
      compendium: [
        { state: "photo" },
        { state: "bought" },
        { state: "missing" },
        {},
      ],
      characterProfiles: [{ state: "discovered" }, { state: "missing" }, {}],
    },
    catalog,
  );
  expect(result.map).toEqual({ total: 4, found: 1, missing: 1, unknown: 2 });
  expect(result.categories[1]).toMatchObject({
    total: 2,
    found: 0,
    missing: 0,
    unknown: 2,
  });
  expect(result.quests).toEqual({
    total: 5,
    done: 1,
    active: 1,
    todo: 1,
    unknown: 2,
  });
  expect(result.compendium).toEqual({
    total: 4,
    registered: 2,
    photo: 1,
    bought: 1,
    missing: 1,
    unknown: 1,
  });
  expect(result.characters).toEqual({
    total: 3,
    discovered: 1,
    missing: 1,
    unknown: 1,
  });
});

it("counts actual armor tiers and distinguishes unclaimed medals from earned medals", () => {
  const data = {
    armor: [
      {
        id: "a",
        variants: [{ id: "a2", level: 2 }],
        upgrades: [1, 2, 3, 4].map((level) => ({ level })),
      },
      {
        id: "b",
        variants: [{ id: "b0", level: 0 }],
        upgrades: [{ level: 1 }, { level: 2 }],
      },
      { id: "c", variants: [{ id: "c0", level: 0 }], upgrades: [] },
    ],
    entries: [
      { id: "memory1", category: "memories" },
      { id: "memory2", category: "memories" },
      { id: "memory3", category: "memories" },
      { id: "medal", category: "medals" },
      { id: "fabric", category: "fabrics" },
    ],
    medals: [{ id: "medal", category: "hinoxes", total: 1 }],
  };
  const catalog = {
    categories: [{ id: "hinoxes" }],
    points: [{ index: 0, id: "boss", category: "hinoxes" }],
  };
  const snapshot = {
    states: [1],
    inventory: {
      groups: [
        {
          id: "armors",
          available: true,
          items: [{ id: "a2" }, { id: "a2" }, { id: "c0" }],
        },
      ],
    },
    collections: [
      { id: "memory1", state: "owned" },
      { id: "memory2", state: "missing" },
      { id: "medal", state: "missing" },
    ],
  };
  const result = createSummary(snapshot, catalog, data);
  expect(result.armor).toEqual({ total: 3, owned: 2, missing: 1, unknown: 0 });
  expect(result.upgrades).toEqual({
    total: 6,
    owned: 2,
    missing: 4,
    unknown: 0,
  });
  expect(result.memories).toEqual({
    total: 3,
    owned: 1,
    missing: 1,
    unknown: 1,
  });
  expect(result.fabrics).toEqual({
    total: 1,
    owned: 0,
    missing: 0,
    unknown: 1,
  });
  expect(result.medals).toEqual({
    total: 1,
    owned: 0,
    missing: 1,
    unknown: 0,
    ready: 1,
  });
  const claimed = createSummary(
    { ...snapshot, collections: [{ id: "medal", state: "owned" }] },
    catalog,
    data,
  );
  expect(claimed.medals).toMatchObject({ owned: 1, ready: 0 });
  const unknown = createSummary(
    { ...snapshot, inventory: null, collections: [] },
    catalog,
    data,
  );
  expect(unknown.armor).toMatchObject({ owned: 0, missing: 0, unknown: 3 });
  expect(unknown.upgrades).toMatchObject({ owned: 0, missing: 0, unknown: 6 });
  expect(unknown.medals).toMatchObject({ ready: 0, unknown: 1 });
  expect(createSummary(null, catalog, data).armor).toBeNull();
  expect(createSummary(snapshot, catalog).memories).toBeNull();
});
