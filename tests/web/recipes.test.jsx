import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { I18N } from "../../web/src/shared/i18n.js";
import { createViewStore } from "../../web/src/app/store.js";
import { WorldPanel } from "../../web/src/features/world/WorldPanel.jsx";
import {
  recipes,
  filterRecipes,
  recipeItemName,
} from "../../web/src/features/world/recipes.js";

beforeEach(() => I18N.setLanguage("es"));
afterEach(cleanup);

function mount(language = "es") {
  I18N.setLanguage(language);
  const store = createViewStore();
  // The cookbook remains available when compendium data fails and no save is loaded.
  store.update({ view: "world", world: { snapshot: null, failed: true } });
  return { store, ...render(<WorldPanel store={store} />) };
}

describe("HyruleWorld recipe book", () => {
  it("opens from the keyboard without a save or compendium, with ingredients and preparation", () => {
    const result = mount();
    fireEvent.keyDown(result.getByRole("tab", { name: "Tu álbum" }), {
      key: "End",
    });
    const tab = result.getByRole("tab", { name: "Recetario" });
    expect(document.activeElement).toBe(tab);
    expect(tab.getAttribute("aria-selected")).toBe("true");
    expect(tab.getAttribute("aria-controls")).toBe("world-recipes-panel");
    expect(result.getAllByRole("article")).toHaveLength(36);
    expect(result.queryByRole("alert")).toBeNull();
    expect(result.queryByRole("progressbar")).toBeNull();
    const pizza = result
      .getByRole("heading", { name: "Pizza de tomate" })
      .closest("article");
    expect(within(pizza).getByText("Tomates hylianos")).toBeTruthy();
    expect(within(pizza).getByText("Queso de Hatelia")).toBeTruthy();
    expect(within(pizza).getByText("Trigo de Tabanta")).toBeTruthy();
    expect(within(pizza).getByText("Preparación")).toBeTruthy();
    expect(result.store.getSnapshot().world.snapshot).toBeNull();
    fireEvent.keyDown(tab, { key: "ArrowRight" });
    expect(document.activeElement).toBe(
      result.getByRole("tab", { name: "Tu álbum" }),
    );
  });

  it("combines ingredient, type and effect filters and recovers from empty results", () => {
    const result = mount();
    fireEvent.click(result.getByRole("tab", { name: "Recetario" }));
    fireEvent.change(
      result.getByRole("searchbox", { name: "Buscar recetas" }),
      { target: { value: "RANA" } },
    );
    fireEvent.change(result.getByRole("combobox", { name: "Tipo de receta" }), {
      target: { value: "elixirs" },
    });
    expect(result.getAllByRole("article")).toHaveLength(1);
    expect(
      result.getByRole("heading", { name: "Elixir adherente" }),
    ).toBeTruthy();
    expect(result.getByText("Colmillo de bokoblin")).toBeTruthy();
    fireEvent.change(
      result.getByRole("combobox", { name: "Efecto de la receta" }),
      { target: { value: "cold" } },
    );
    expect(result.queryAllByRole("article")).toHaveLength(0);
    expect(result.getByText("No hay recetas con estos filtros.")).toBeTruthy();
    fireEvent.click(result.getByRole("button", { name: "Limpiar filtros" }));
    expect(result.getAllByRole("article")).toHaveLength(36);
    expect(result.getByRole("searchbox").value).toBe("");
    expect(
      result.getByRole("combobox", { name: "Efecto de la receta" }).value,
    ).toBe("");
  });

  it("translates the cookbook and searches dish and ingredient names in either language", () => {
    const result = mount("en");
    fireEvent.click(result.getByRole("tab", { name: "Recipe book" }));
    const search = result.getByRole("searchbox", { name: "Search recipes" });
    fireEvent.change(search, { target: { value: "Queso de Hatelia" } });
    expect(result.getAllByRole("article")).toHaveLength(4);
    expect(
      result.getByRole("heading", { name: "Hylian Tomato Pizza" }),
    ).toBeTruthy();
    fireEvent.change(search, { target: { value: "APPLE PIE" } });
    expect(result.getAllByRole("article")).toHaveLength(1);
    expect(result.getByText("Preparation")).toBeTruthy();
    expect(result.getByText("Cane Sugar")).toBeTruthy();
    expect(
      filterRecipes(recipes, { query: "ELIXIR GELIDO" }).map(
        (recipe) => recipe.effect,
      ),
    ).toEqual(["heat"]);
  });

  it("bundles bilingual names and valid quantities for cooking examples", () => {
    expect(new Set(recipes.map((recipe) => recipe.id)).size).toBe(
      recipes.length,
    );
    for (const recipe of recipes) {
      const total = recipe.ingredients.reduce(
        (sum, ingredient) => sum + ingredient.quantity,
        0,
      );
      expect(total).toBeGreaterThan(0);
      expect(total).toBeLessThanOrEqual(5);
      for (const language of ["es", "en"])
        for (const ingredient of recipe.ingredients)
          expect(recipeItemName(ingredient.id, language)).not.toBe(
            ingredient.id,
          );
    }
  });
});
