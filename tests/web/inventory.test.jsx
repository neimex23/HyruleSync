import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import data from "../../web/public/inventory-data.json";
import { I18N } from "../../web/src/shared/i18n.js";
import {
  createInventoryModel,
  filterInventory,
} from "../../web/src/features/inventory/model.js";
import { InventoryCard } from "../../web/src/features/inventory/InventoryCard.jsx";
import { InventoryPanel } from "../../web/src/features/inventory/InventoryPanel.jsx";
import { createViewStore } from "../../web/src/app/store.js";

beforeEach(() => I18N.setLanguage("es"));
afterEach(cleanup);
const sample = {
  file: "test.sav",
  savedAt: "2026-11-01T12:00:00Z",
  inventory: {
    life: 7,
    maxLife: 12,
    stamina: 1200,
    energy: null,
    rupees: 0,
    ponyPoints: null,
    groups: [
      {
        id: "materials",
        available: true,
        items: [
          { id: "Item_Fruit_A", slot: 2, details: { quantity: 0 } },
          {
            id: "<img src=x onerror=alert(1)>",
            slot: 3,
            details: { quantity: 1 },
          },
        ],
      },
      { id: "weapons", available: false, items: [] },
      { id: "arrows", available: true, items: [] },
    ],
  },
};

describe("inventory", () => {
  it("searches localized ingredients and fusions across replacement snapshots", () => {
    const model = createInventoryModel(data);
    const groups = [
      {
        id: "food",
        available: true,
        items: [
          { id: "Item_Cook_A_01", details: { recipe: ["Item_Fruit_A"] } },
        ],
      },
      {
        id: "weapons",
        available: true,
        items: [
          { id: "Weapon_Sword_001", details: { fuseId: "Item_Fruit_A" } },
        ],
      },
    ];
    expect(
      filterInventory(groups, model, "MANZANA").map((group) => group.id),
    ).toEqual(["food", "weapons"]);
    expect(filterInventory(groups, model, "no existe")).toEqual([]);
    const next = [
      {
        ...groups[0],
        items: [{ ...groups[0].items[0], details: { recipe: [] } }],
      },
    ];
    expect(filterInventory(next, model, "manzana")).toEqual([]);
    expect(filterInventory(groups, model)[0].items).toBe(groups[0].items);
  });
  it("keeps signed enums, recipes, localization and unique-item units", () => {
    const model = createInventoryModel(data);
    expect(model.inventoryHash("PlayerStatus.MaxStamina")).toBe(0xf9212c74);
    expect(model.inventoryEnum(model.inventoryHash("AttackUpPlus") | 0)).toBe(
      data.names.es["Attack ↑↑"],
    );
    expect(model.inventoryEnum(-1)).toBe("0xffffffff");
    expect(
      model.inventoryValue("recipe", ["Item_Fruit_A", "Item_Fruit_A", "", ""]),
    ).toBe("Manzana, Manzana");
    const { container, rerender } = render(
      <InventoryCard
        item={{
          id: "Parasail",
          slot: 4,
          equipped: true,
          details: { quantity: -1 },
        }}
        group={{ id: "key" }}
        model={model}
        data={data}
      />,
    );
    expect(container.textContent).toContain("Único");
    rerender(
      <InventoryCard
        item={{ id: "Armor_002_Head", slot: 0, details: {} }}
        group={{ id: "armors" }}
        model={model}
        data={data}
      />,
    );
    expect(container.textContent.match(/★/g)).toHaveLength(1);
  });
  it("renders safe text, stats, filters and missing data from the current snapshot", () => {
    const store = createViewStore();
    store.update({ inventory: { snapshot: sample, data } });
    const { container } = render(<InventoryPanel store={store} />);
    const groups = () => container.querySelector("#inventoryGroups");
    expect(container.querySelector("#inventoryStats").textContent).toContain(
      "1,75 corazones",
    );
    expect(container.querySelector("#inventoryStats").textContent).toContain(
      "1,2 ruedas",
    );
    expect(groups().textContent).toContain("× 0");
    expect(groups().textContent).toContain("Esta bolsa no está disponible");
    expect(groups().textContent).toContain("Bolsa vacía");
    expect(groups().querySelector("[onerror]")).toBeNull();
    expect(groups().querySelector("h3").textContent).toBe("Manzana");
    expect(groups().innerHTML).toContain("&lt;img");
    fireEvent.change(container.querySelector("#inventorySearch"), {
      target: { value: "manzana" },
    });
    expect(container.querySelector("#inventoryResults").textContent).toContain(
      "1 objetos",
    );
    expect(groups().textContent).not.toContain("<img");
    fireEvent.change(container.querySelector("#inventorySearch"), {
      target: { value: "no existe" },
    });
    expect(groups().textContent).toContain("No se encontraron objetos");
    fireEvent.change(container.querySelector("#inventorySearch"), {
      target: { value: "" },
    });
    fireEvent.change(container.querySelector("#inventoryCategory"), {
      target: { value: "arrows" },
    });
    expect(groups().textContent).toContain("Flechas");
    expect(groups().textContent).not.toContain("Materiales");
    act(() => store.update({ inventory: { snapshot: null, data } }));
    expect(groups().textContent).toBe("");
    expect(container.querySelector("#inventoryEmpty").hidden).toBe(false);
  });
  it("shows the fallback icon after an image error without inline JavaScript", () => {
    const { container } = render(
      <InventoryCard
        item={sample.inventory.groups[0].items[0]}
        group={{ id: "materials" }}
        model={createInventoryModel(data)}
        data={data}
      />,
    );
    fireEvent.error(container.querySelector("img"));
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("use").getAttribute("href")).toBe(
      "inventory-icons.svg#fruit",
    );
  });
});
