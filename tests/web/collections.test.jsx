import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  within,
} from "@testing-library/react";
import data from "../../web/public/collection-data.json";
import names from "../../web/public/inventory-data.json";
import {
  armorProgress,
  collectionProgress,
  filterCollection,
  medalProgress,
  upgradePlan,
} from "../../web/src/features/inventory/collections.js";
import { InventoryPanel } from "../../web/src/features/inventory/InventoryPanel.jsx";
import {
  ArmorCollection,
  BossMedals,
  OtherCollections,
} from "../../web/src/features/inventory/CollectionPanels.jsx";
import { createInventoryModel } from "../../web/src/features/inventory/model.js";
import { createViewStore } from "../../web/src/app/store.js";
import { I18N } from "../../web/src/shared/i18n.js";

beforeEach(() => I18N.setLanguage("es"));
afterEach(cleanup);
const inventory = (armors = [], materials = [], rupees = 0) => ({
  rupees,
  groups: [
    { id: "armors", available: true, items: armors.map((id) => ({ id })) },
    {
      id: "materials",
      available: true,
      items: materials.map(([id, quantity]) => ({ id, details: { quantity } })),
    },
  ],
});
const snapshot = (inv) => ({
  file: "slot_00/progress.sav",
  savedAt: "2026-11-02T20:00:00Z",
  inventory: inv,
});

describe("collection data and upgrade planning", () => {
  it("covers every armor, four tiers, acquisition sources and all collection types", () => {
    expect(data.armor).toHaveLength(135);
    expect(
      new Set(data.armor.flatMap((piece) => piece.variants.map((v) => v.id)))
        .size,
    ).toBe(
      Object.keys(names.armor).filter(
        (id) => !names.names.en[id].startsWith("*"),
      ).length,
    );
    for (const piece of data.armor) {
      expect(piece.sources.length, piece.id).toBeGreaterThan(0);
      expect(piece.nameEs, piece.id).toBeTruthy();
      expect(
        piece.upgrades.length === 0 || piece.upgrades.length === 4,
        piece.id,
      ).toBe(true);
      for (const tier of piece.upgrades)
        for (const material of tier.materials) {
          expect(names.names.en[material.id], material.id).toBeTruthy();
          expect(material.quantity).toBeGreaterThan(0);
        }
    }
    expect(data.entries.filter((e) => e.category === "memories")).toHaveLength(
      18,
    );
    expect(data.entries.find((e) => e.number === 1).name).toBe(
      "The Master Sword's Power",
    );
    expect(data.entries.filter((e) => e.category === "fabrics")).toHaveLength(
      58,
    );
    expect(data.entries.filter((e) => e.category === "horses")).toHaveLength(
      11,
    );
    for (const entry of data.entries) expect(entry.hash).toBeGreaterThan(0);
    for (const entry of [...data.entries, ...data.armor]) {
      expect(entry.image).toContain(data.imageCommit);
      expect([...entry.nameEs].some((char) => char.charCodeAt(0) < 32)).toBe(
        false,
      );
    }
    expect(
      data.armor
        .find((piece) => piece.id === "Armor_1036_Head")
        .upgrades.map((tier) => tier.rupees),
    ).toEqual([30, 150, 600, 1500]);
  });
  it("merges altered hoods and duplicate pieces and uses the highest owned tier", () => {
    const rows = armorProgress(
      data.armor,
      inventory(["Armor_002_Head", "Armor_1155_Head", "Armor_1155_Head"]),
    );
    expect(rows.find((e) => e.id === "Armor_001_Head")).toMatchObject({
      state: "owned",
      level: 3,
      copies: 3,
    });
    expect(rows.find((e) => e.id === "Armor_001_Upper").state).toBe("missing");
    expect(
      armorProgress(data.armor, { groups: [] }).every(
        (e) => e.state === "unknown",
      ),
    ).toBe(true);
    expect(filterCollection(rows, "capucha hyliana")).toHaveLength(1);
    expect(filterCollection(rows, "Hylian Hood")).toHaveLength(1);
  });
  it("deducts shared stock once, includes only remaining tiers and updates with a replacement save", () => {
    const inv = inventory(
      ["Armor_001_Head", "Armor_001_Upper"],
      [["Item_Enemy_77", 7]],
      15,
    );
    const rows = armorProgress(data.armor, inv);
    const ids = new Set(["Armor_001_Head", "Armor_001_Upper"]);
    const plan = upgradePlan(rows, ids, 1, inv);
    expect(plan).toMatchObject({
      rupees: 20,
      have: 15,
      missingRupees: 5,
      steps: 2,
    });
    expect(plan.materials).toEqual([
      { id: "Item_Enemy_77", required: 10, have: 7, missing: 3 },
    ]);
    const next = inventory(["Armor_002_Head", "Armor_002_Upper"], [], 0);
    expect(
      upgradePlan(armorProgress(data.armor, next), ids, 1, next).steps,
    ).toBe(0);
    expect(
      upgradePlan(rows, ids, 1, { groups: [] }).materials[0].missing,
    ).toBeNull();
    const invalidStock = inventory([], [["Item_Enemy_77", -1]]);
    expect(
      upgradePlan(rows, ids, 1, invalidStock).materials[0].missing,
    ).toBeNull();
    const rich = inventory([], [["Item_Enemy_77", 100]], 100);
    expect(upgradePlan(rows, ids, 1, rich)).toMatchObject({ missingRupees: 0 });
    expect(upgradePlan(rows, ids, 1, rich).materials[0].missing).toBe(0);
    expect(
      upgradePlan(armorProgress(data.armor, { groups: [] }), ids, 4, {
        groups: [],
      }).unverified,
    ).toBe(2);
  });
  it("keeps absent collection flags unknown and accepts positive pouch evidence", () => {
    const entry = data.entries.find(
      (e) => e.category === "rewards" && e.aliases,
    );
    expect(collectionProgress([entry], {}).at(0).state).toBe("unknown");
    expect(
      collectionProgress([entry], {
        collections: [{ id: entry.id, state: "missing" }],
      }).at(0).state,
    ).toBe("missing");
    expect(
      collectionProgress(
        [entry],
        snapshot(inventory([entry.aliases.at(-1)])),
      ).at(0).state,
    ).toBe("owned");
    const fabric = data.entries.find((entry) => entry.category === "fabrics");
    expect(
      collectionProgress([fabric], {
        inventory: {
          groups: [
            { id: "key", items: [{ id: fabric.id, details: { quantity: 0 } }] },
          ],
        },
      })[0].state,
    ).toBe("unknown");
  });
});

describe("inventory subtabs", () => {
  it("preserves the plan between tabs, supports keyboard navigation and follows snapshots", () => {
    const store = createViewStore();
    const inv = inventory(["Armor_001_Head"], [["Item_Enemy_77", 3]], 7);
    store.update({
      view: "inventory",
      inventory: { snapshot: snapshot(inv), data: names, collectionData: data },
    });
    const ui = render(<InventoryPanel store={store} />);
    fireEvent.click(ui.getByRole("tab", { name: "Armaduras" }));
    const panel = () =>
      within(ui.container.querySelector("#inventory-content-armor"));
    expect(ui.container.querySelector(".upgrade-planner").open).toBe(false);
    const hood = ui
      .getByRole("heading", { name: "Capucha hyliana" })
      .closest("article");
    expect(hood.querySelector("img").src).toContain("Armor_001_Head.png");
    fireEvent.error(hood.querySelector("img"));
    expect(hood.querySelector(".collection-art img")).toBeNull();
    expect(hood.querySelector(".collection-art use")).toBeTruthy();
    fireEvent.click(within(hood).getByLabelText("Incluir en el plan"));
    expect(ui.container.querySelector(".upgrade-planner").open).toBe(true);
    fireEvent.change(panel().getByLabelText("Nivel objetivo"), {
      target: { value: "1" },
    });
    expect(panel().getByRole("table").textContent).toContain(
      "Cuerno de bokoblin",
    );
    expect(panel().getByText("Tienes: 7 · Faltan: 3")).toBeTruthy();
    fireEvent.click(ui.getByRole("tab", { name: "Otras colecciones" }));
    expect(ui.getByRole("heading", { name: /^Recuerdos/ })).toBeTruthy();
    fireEvent.keyDown(ui.getByRole("tab", { name: "Otras colecciones" }), {
      key: "ArrowLeft",
    });
    expect(panel().getByLabelText("Nivel objetivo").value).toBe("1");
    const next = inventory(["Armor_002_Head"], [], 50);
    act(() =>
      store.update({
        inventory: {
          snapshot: snapshot(next),
          data: names,
          collectionData: data,
        },
      }),
    );
    expect(panel().getByText("0 mejoras pendientes")).toBeTruthy();
  });
  it("separates medal acquisition from defeat requirements and never marks a partial catalog ready", () => {
    const definition = {
      id: "Obj_DefeatHonor_02",
      category: "moldugas",
      total: 4,
    };
    const catalog = {
      points: [0, 1, 2, 3].map((i) => ({
        id: `m${i}`,
        name: `Molduga ${i}`,
        category: "moldugas",
        position: { x: i, y: 100, z: 10 },
      })),
    };
    expect(
      medalProgress(
        [definition],
        { points: catalog.points.slice(0, 3) },
        { states: [1, 1, 1] },
      )[0],
    ).toMatchObject({ ready: false, unknown: 1 });
    expect(
      medalProgress([definition], catalog, { states: [1, 0, -1, 1] })[0],
    ).toMatchObject({ ready: false, found: 2, missing: 1, unknown: 1 });
    const onMap = vi.fn();
    const ui = render(
      <BossMedals
        data={{ ...data, medals: [definition] }}
        snapshot={{ states: [1, 0, -1, 1] }}
        catalog={catalog}
        onMap={onMap}
      />,
    );
    fireEvent.click(
      ui.getAllByRole("button", { name: "Ver en mapa", hidden: true })[0],
    );
    expect(onMap).toHaveBeenCalledWith("m1");
    ui.rerender(
      <BossMedals
        data={{ ...data, medals: [definition] }}
        snapshot={{
          states: [1, 1, 1, 1],
          collections: [{ id: definition.id, state: "missing" }],
        }}
        catalog={catalog}
      />,
    );
    expect(ui.getByText("Lista para reclamar")).toBeTruthy();
    ui.rerender(
      <BossMedals
        data={{ ...data, medals: [definition] }}
        snapshot={{
          states: [1, 1, 1, 1],
          collections: [{ id: definition.id, state: "owned" }],
        }}
        catalog={catalog}
      />,
    );
    expect(ui.getByText("Medalla conseguida")).toBeTruthy();
  });
});

describe("collection spoiler protection", () => {
  const pieces = data.armor.filter((piece) =>
    ["Armor_001_Head", "Armor_001_Upper"].includes(piece.id),
  );
  const armorData = { ...data, armor: pieces };

  it.each(["es", "en"])(
    "reveals and reblurs only the chosen missing image in %s without changing progress",
    (language) => {
      I18N.setLanguage(language);
      const save = snapshot(inventory(["Armor_001_Upper"]));
      const before = JSON.stringify(save);
      const model = createInventoryModel(names);
      const ui = render(
        <ArmorCollection data={armorData} snapshot={save} model={model} />,
      );
      const name = language === "es" ? "Capucha hyliana" : "Hylian Hood";
      const showLabel = I18N.t("Mostrar imagen de {name}", { name });
      const hideLabel = I18N.t("Difuminar imagen de {name}", { name });
      const reveal = ui.getByRole("button", { name: showLabel });
      const art = reveal.closest(".collection-art");
      const card = art.closest("article");
      expect(art.classList.contains("is-concealed")).toBe(true);
      expect(reveal.getAttribute("aria-pressed")).toBe("false");
      expect(
        ui.container.querySelector(".collection-owned .is-concealed"),
      ).toBeNull();
      expect(
        ui.container.querySelector(".collection-owned .portrait-reveal-toggle"),
      ).toBeNull();
      fireEvent.click(reveal);
      expect(art.classList.contains("is-concealed")).toBe(false);
      expect(
        ui
          .getByRole("button", { name: hideLabel })
          .getAttribute("aria-pressed"),
      ).toBe("true");
      expect(card.classList.contains("collection-missing")).toBe(true);
      expect(card.querySelector(".collection-location").open).toBe(false);
      expect(ui.container.querySelector(".upgrade-planner").open).toBe(false);
      expect(JSON.stringify(save)).toBe(before);
      fireEvent.click(ui.getByRole("button", { name: hideLabel }));
      expect(art.classList.contains("is-concealed")).toBe(true);
      fireEvent.error(art.querySelector("img"));
      expect(art.querySelector("svg")).toBeTruthy();
      expect(art.classList.contains("is-concealed")).toBe(true);
      fireEvent.click(ui.getByRole("button", { name: showLabel }));
      expect(art.classList.contains("is-concealed")).toBe(false);
    },
  );

  it("protects unknown images, reveals independently and resets when acquisition changes across saves", () => {
    const model = createInventoryModel(names);
    const ui = render(
      <ArmorCollection data={armorData} snapshot={null} model={model} />,
    );
    expect(
      ui.container.querySelectorAll(".collection-art.is-concealed"),
    ).toHaveLength(2);
    fireEvent.click(
      ui.getByRole("button", { name: "Mostrar imagen de Capucha hyliana" }),
    );
    expect(
      ui.container.querySelectorAll(".collection-art.is-concealed"),
    ).toHaveLength(1);
    const acquired = snapshot(inventory(["Armor_001_Head"]));
    ui.rerender(
      <ArmorCollection data={armorData} snapshot={acquired} model={model} />,
    );
    expect(
      ui.queryByRole("button", { name: /imagen de Capucha hyliana/ }),
    ).toBeNull();
    ui.rerender(
      <ArmorCollection
        data={armorData}
        snapshot={snapshot(inventory())}
        model={model}
      />,
    );
    const reveal = ui.getByRole("button", {
      name: "Mostrar imagen de Capucha hyliana",
    });
    expect(
      reveal.closest(".collection-art").classList.contains("is-concealed"),
    ).toBe(true);
    expect(
      ui.container.querySelectorAll(".collection-art.is-concealed"),
    ).toHaveLength(2);
  });

  it("protects memory, fabric, horse and reward images and selector thumbnails without nesting buttons", () => {
    const ui = render(<OtherCollections data={data} snapshot={null} />);
    const selectors = [
      ...ui.container.querySelectorAll(".collection-types > button"),
    ];
    for (const selector of selectors) {
      expect(
        selector
          .querySelector(".collection-art")
          .classList.contains("is-concealed"),
      ).toBe(true);
      expect(selector.querySelector("button")).toBeNull();
    }
    for (const selector of selectors) {
      fireEvent.click(selector);
      const card = ui.container.querySelector(".collection-card");
      const art = card.querySelector(".collection-art");
      expect(art.classList.contains("is-concealed")).toBe(true);
      fireEvent.click(within(art).getByRole("button"));
      expect(art.classList.contains("is-concealed")).toBe(false);
      expect(card.classList.contains("collection-unknown")).toBe(true);
      expect(card.querySelector("details").open).toBe(false);
    }
  });

  it("uses acquired selector artwork and conceals unclaimed medal artwork", () => {
    const acquired = data.entries.find(
      (entry) => entry.category === "fabrics" && entry.amiibo,
    );
    const save = { collections: [{ id: acquired.id, state: "owned" }] };
    const ui = render(<OtherCollections data={data} snapshot={save} />);
    const art = ui.container.querySelectorAll(
      ".collection-types .collection-art",
    )[1];
    expect(art.querySelector("img").src).toBe(acquired.image);
    expect(art.classList.contains("is-concealed")).toBe(false);
    ui.rerender(<BossMedals data={data} snapshot={save} />);
    const medalArt = ui.container.querySelector(".collection-art");
    expect(medalArt.classList.contains("is-concealed")).toBe(true);
    fireEvent.click(within(medalArt).getByRole("button"));
    expect(medalArt.classList.contains("is-concealed")).toBe(false);
    ui.rerender(
      <BossMedals
        data={data}
        snapshot={{ collections: [{ id: data.medals[0].id, state: "owned" }] }}
      />,
    );
    const ownedArt = ui.container.querySelector(".collection-art");
    expect(ownedArt.querySelector(".portrait-reveal-toggle")).toBeNull();
    expect(ownedArt.classList.contains("is-concealed")).toBe(false);
  });
});
