import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  within,
} from "@testing-library/react";
import data from "../../web/public/world-data.json";
import { I18N } from "../../web/src/shared/i18n.js";
import { createViewStore } from "../../web/src/app/store.js";
import { WorldPanel } from "../../web/src/features/world/WorldPanel.jsx";
import { characters } from "../../web/src/features/world/characters.js";
import { CharacterCard } from "../../web/src/features/world/CharacterCard.jsx";
import {
  filterWorld,
  worldProgress,
  worldImage,
  characterProgress,
  filterCharacters,
} from "../../web/src/features/world/model.js";

beforeEach(() => I18N.setLanguage("es"));
afterEach(cleanup);
const horse = data.entries[0];
const bear = data.entries.find((entry) => entry.id === "Animal_Bear_A");
const apple = data.entries.find((entry) => entry.id === "Item_Fruit_A");
const snapshot = {
  file: "test.sav",
  savedAt: "2026-11-02T12:00:00Z",
  compendium: [
    { id: horse.id, state: "photo" },
    { id: apple.id, state: "bought" },
    { id: bear.id, state: "missing" },
  ],
};
function mount(save = snapshot) {
  const store = createViewStore();
  store.update({ view: "world", world: { snapshot: save, data } });
  return { store, ...render(<WorldPanel store={store} />) };
}

describe("HyruleWorld", () => {
  it("reveals unregistered encyclopedia images without registering entries or opening their guides", () => {
    const result = mount();
    fireEvent.click(result.getByRole("tab", { name: "Enciclopedia hyliana" }));
    const reveal = result.getByRole("button", {
      name: "Mostrar imagen de Oso común",
    });
    const card = reveal.closest(".world-card");
    expect(
      card.querySelector(".world-portrait").classList.contains("is-concealed"),
    ).toBe(true);
    expect(
      result.queryByRole("button", { name: "Mostrar imagen de Caballo" }),
    ).toBeNull();
    expect(
      result.queryByRole("button", { name: "Mostrar imagen de Manzana" }),
    ).toBeNull();
    fireEvent.click(reveal);
    expect(
      card.querySelector(".world-portrait").classList.contains("is-concealed"),
    ).toBe(false);
    expect(card.hasAttribute("open")).toBe(false);
    expect(card.querySelector(".world-badge").textContent).toBe(
      "Sin registrar",
    );
    expect(result.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "2",
    );
    expect(result.store.getSnapshot().world.snapshot).toBe(snapshot);
    fireEvent.click(
      result.getByRole("button", { name: "Difuminar imagen de Oso común" }),
    );
    expect(
      card.querySelector(".world-portrait").classList.contains("is-concealed"),
    ).toBe(true);
    act(() =>
      result.store.update({
        world: {
          data,
          snapshot: {
            ...snapshot,
            compendium: [{ id: bear.id, state: "photo" }],
          },
        },
      }),
    );
    expect(card.querySelector(".is-concealed")).toBeNull();
    expect(
      result.queryByRole("button", { name: "Mostrar imagen de Oso común" }),
    ).toBeNull();
  });
  it("blurs undiscovered portraits and reveals them without changing save progress", () => {
    const save = {
      ...snapshot,
      characterProfiles: [
        { id: "purah", state: "missing" },
        { id: "zelda", state: "discovered" },
      ],
    };
    const result = mount(save);
    fireEvent.click(result.getByRole("tab", { name: "Guía de personajes" }));
    const reveal = result.getByRole("button", {
      name: "Mostrar retrato de Prunia",
    });
    expect(
      reveal.closest(".character-portrait").classList.contains("is-concealed"),
    ).toBe(true);
    expect(
      result.queryByRole("button", { name: "Mostrar retrato de Zelda" }),
    ).toBeNull();
    expect(
      result.queryByRole("button", { name: "Mostrar retrato de Rotver" }),
    ).toBeNull();
    fireEvent.click(reveal);
    const blur = result.getByRole("button", {
      name: "Difuminar retrato de Prunia",
    });
    expect(blur.getAttribute("aria-pressed")).toBe("true");
    expect(
      blur.closest(".character-portrait").classList.contains("is-concealed"),
    ).toBe(false);
    expect(
      blur.closest("article").querySelector(".world-badge").textContent,
    ).toBe("Por descubrir");
    expect(result.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "1",
    );
    expect(result.store.getSnapshot().world.snapshot).toBe(save);
    fireEvent.click(blur);
    expect(
      result
        .getByRole("button", { name: "Mostrar retrato de Prunia" })
        .closest(".character-portrait")
        .classList.contains("is-concealed"),
    ).toBe(true);
  });
  it("automatically shows a portrait when its character becomes discovered", () => {
    const character = characters.find((character) => character.id === "purah");
    const metadata = data.characters.find(
      (character) => character.id === "purah",
    );
    const result = render(
      <CharacterCard
        character={character}
        metadata={metadata}
        state="missing"
      />,
    );
    expect(result.container.querySelector(".is-concealed")).not.toBeNull();
    result.rerender(
      <CharacterCard
        character={character}
        metadata={metadata}
        state="discovered"
      />,
    );
    expect(result.container.querySelector(".is-concealed")).toBeNull();
    expect(result.queryByRole("button")).toBeNull();
  });
  it("matches 22 unique character definitions to save fields and verified portrait sources", () => {
    expect(data.characters.map((character) => character.id)).toEqual(
      characters.map((character) => character.id),
    );
    expect(
      new Set(data.characters.map((character) => character.actor)).size,
    ).toBe(22);
    for (const character of data.characters) {
      expect(character.notificationHash).toBeGreaterThan(0);
      expect(character.newHash).toBeGreaterThan(0);
      expect(character.images.length).toBeGreaterThan(0);
      for (const image of character.images) {
        expect(["www.zeldadungeon.net", "cdn.wikimg.net"]).toContain(
          new URL(image.url).hostname,
        );
        expect(image.page.startsWith("https://")).toBe(true);
      }
    }
    expect(
      filterCharacters(characters, characterProgress(null), "", "missing"),
    ).toEqual([]);
    expect(
      filterCharacters(characters, characterProgress(null), "", "unknown"),
    ).toHaveLength(22);
  });
  it("shows portraits and discovery status from the current save and updates missing-character filters", () => {
    const result = mount({
      ...snapshot,
      characterProfiles: [
        { id: "zelda", state: "discovered" },
        { id: "purah", state: "missing" },
      ],
    });
    fireEvent.click(result.getByRole("tab", { name: "Guía de personajes" }));
    expect(result.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "1",
    );
    expect(
      result.container.querySelectorAll(".character-portrait img"),
    ).toHaveLength(23);
    fireEvent.change(
      result.getByRole("combobox", { name: "Estado de descubrimiento" }),
      { target: { value: "missing" } },
    );
    expect(result.container.querySelectorAll(".world-character")).toHaveLength(
      1,
    );
    const portrait = result.getByRole("img", { name: "Retrato de Prunia" });
    expect(portrait.getAttribute("src")).toBe(
      data.characters.find((character) => character.id === "purah").images[0]
        .url,
    );
    fireEvent.load(portrait);
    expect(portrait.className).toBe("loaded");
    fireEvent.error(portrait);
    expect(
      result.container.querySelector(".character-portrait img"),
    ).toBeNull();
    expect(
      result.container.querySelector(".character-portrait-fallback")
        .textContent,
    ).toBe("P");
    act(() =>
      result.store.update({
        world: {
          snapshot: {
            ...snapshot,
            characterProfiles: [{ id: "purah", state: "discovered" }],
          },
          data,
        },
      }),
    );
    expect(result.container.querySelectorAll(".world-character")).toHaveLength(
      0,
    );
    fireEvent.change(
      result.getByRole("combobox", { name: "Estado de descubrimiento" }),
      { target: { value: "discovered" } },
    );
    expect(
      result.container.querySelector(".world-character h3").textContent,
    ).toBe("Prunia");
    act(() => result.store.update({ world: { snapshot: null, data } }));
    expect(result.container.querySelectorAll(".world-character")).toHaveLength(
      0,
    );
    expect(result.getByRole("progressbar").hasAttribute("aria-valuenow")).toBe(
      false,
    );
    fireEvent.change(
      result.getByRole("combobox", { name: "Estado de descubrimiento" }),
      { target: { value: "unknown" } },
    );
    expect(result.container.querySelectorAll(".world-character")).toHaveLength(
      22,
    );
  });
  it("contains all numbered entries, localized names and separate pristine weapon records", () => {
    expect(data.entries.map((entry) => entry.number)).toEqual(
      Array.from({ length: 509 }, (_, i) => i + 1),
    );
    expect(new Set(data.entries.map((entry) => entry.hash)).size).toBe(509);
    for (const entry of data.entries) {
      expect(entry.name).toBeTruthy();
      expect(entry.nameEs).toBeTruthy();
      expect(entry.locationsEs).toHaveLength(entry.locations.length);
    }
    const swords = data.entries.filter(
      (entry) => entry.name === "Traveler's Sword",
    );
    expect(swords).toHaveLength(2);
    expect(swords.map((entry) => entry.pristine).sort()).toEqual([false, true]);
    expect(
      worldImage(data.entries.find((entry) => entry.id === "Weapon_Bow_002")),
    ).not.toContain("%E2%80%99");
  });
  it("filters actual photo/purchase records, searches either language and keeps unknown distinct from missing", () => {
    const progress = worldProgress(snapshot);
    expect(
      filterWorld(data.entries, progress, { album: true }).map(
        (entry) => entry.id,
      ),
    ).toEqual([horse.id, apple.id]);
    expect(
      filterWorld(data.entries, progress, {
        query: "OSO COMUN",
        state: "missing",
      }).map((entry) => entry.id),
    ).toEqual([bear.id]);
    expect(
      filterWorld(data.entries, progress, { query: "honeyvore bear" }).map(
        (entry) => entry.id,
      ),
    ).toEqual([bear.id]);
    expect(filterWorld(data.entries, new Map(), { state: "missing" })).toEqual(
      [],
    );
    expect(
      filterWorld(data.entries, new Map(), { state: "unknown" }),
    ).toHaveLength(509);
  });
  it("renders registered entries, where-to-find details, links and updated or inspected saves", () => {
    const { container, store } = mount();
    expect(container.querySelectorAll(".world-card")).toHaveLength(2);
    const card = container.querySelector(".world-card");
    expect(card.textContent).toContain("Caballo");
    expect(card.querySelector("summary").textContent).toContain(
      "Dónde conseguirlo",
    );
    expect(card.querySelector("li").textContent).toBe("Llanura de Hyrule");
    expect(card.querySelector("a").getAttribute("href")).toBe(
      "https://www.zeldadungeon.net/wiki/Horse",
    );
    expect(card.querySelector("a").getAttribute("rel")).toContain("noopener");
    fireEvent.error(card.querySelector("img"));
    expect(card.querySelector("img")).toBeNull();
    expect(card.querySelector("use")).not.toBeNull();
    act(() =>
      store.update({
        world: {
          snapshot: {
            ...snapshot,
            compendium: [{ id: bear.id, state: "photo" }],
          },
          data,
        },
      }),
    );
    expect(container.querySelectorAll(".world-card")).toHaveLength(1);
    expect(container.querySelector(".world-card").textContent).toContain(
      "Oso común",
    );
    expect(
      container
        .querySelector('[role="progressbar"]')
        .getAttribute("aria-valuenow"),
    ).toBe("1");
    act(() => store.update({ world: { snapshot: null, data } }));
    expect(container.querySelectorAll(".world-card")).toHaveLength(0);
    expect(
      container
        .querySelector('[role="progressbar"]')
        .hasAttribute("aria-valuenow"),
    ).toBe(false);
  });
  it("browses the full encyclopedia and all characters without a save, with accessible tab navigation", () => {
    const result = mount(null);
    fireEvent.keyDown(result.getByRole("tab", { name: "Tu álbum" }), {
      key: "ArrowRight",
    });
    expect(document.activeElement).toBe(
      result.getByRole("tab", { name: "Enciclopedia hyliana" }),
    );
    expect(result.container.querySelectorAll(".world-card")).toHaveLength(509);
    fireEvent.change(result.getByRole("searchbox"), {
      target: { value: "Manzana dorada" },
    });
    expect(result.container.querySelectorAll(".world-card")).toHaveLength(1);
    fireEvent.click(result.getByRole("tab", { name: "Guía de personajes" }));
    expect(characters).toHaveLength(22);
    expect(result.container.querySelectorAll(".world-character")).toHaveLength(
      22,
    );
    fireEvent.change(result.getByRole("searchbox"), {
      target: { value: "Hestu" },
    });
    expect(result.container.querySelectorAll(".world-character")).toHaveLength(
      1,
    );
    expect(
      result.container.querySelector(".world-character h3").textContent,
    ).toBe("Obab");
    fireEvent.change(result.getByRole("searchbox"), {
      target: { value: "nothing matches" },
    });
    expect(
      result.getByText("No hay personajes con estos filtros."),
    ).toBeTruthy();
  });
  it("shows English labels, supports category and state filters and retries data failures", () => {
    I18N.setLanguage("en");
    const result = mount();
    fireEvent.change(
      result.getByRole("combobox", { name: "Registration status" }),
      { target: { value: "bought" } },
    );
    expect(result.container.querySelectorAll(".world-card")).toHaveLength(1);
    expect(result.container.querySelector(".world-card").textContent).toContain(
      "Apple",
    );
    fireEvent.click(result.getByRole("tab", { name: "Hyrule Compendium" }));
    fireEvent.change(
      result.getByRole("combobox", { name: "Compendium category" }),
      { target: { value: "treasure" } },
    );
    expect(result.container.querySelectorAll(".world-card")).toHaveLength(6);
    result.store.actions.loadWorldData = vi.fn();
    act(() => result.store.update({ world: { snapshot, failed: true } }));
    fireEvent.click(
      within(result.getByRole("alert")).getByRole("button", { name: "Retry" }),
    );
    expect(result.store.actions.loadWorldData).toHaveBeenCalledOnce();
    expect(result.getByText("Could not load the compendium.")).toBeTruthy();
  });
});
