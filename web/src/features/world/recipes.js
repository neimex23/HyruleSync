import data from "./recipe-data.json";
import { I18N } from "../../shared/i18n.js";
import { norm } from "../../shared/utils.js";

export const recipes = data.recipes;

export const recipeCategories = {
  meals: "Platos",
  desserts: "Postres",
  elixirs: "Elixires",
};

export const recipeEffects = {
  recovery: "Recupera corazones",
  hearty: "Recuperación total y corazones extra",
  stamina: "Recupera vigor",
  cold: "Resistencia al frío",
  heat: "Resistencia al calor",
  attack: "Aumenta el ataque",
  defense: "Aumenta la defensa",
  speed: "Aumenta la velocidad",
  stealth: "Aumenta el sigilo",
  fireproof: "Resistencia al fuego",
  sticky: "Reduce los resbalones",
  glow: "Emite luz",
  sunny: "Restaura corazones dañados por el aura maligna",
};

export const recipeItemName = (id, language = I18N.language) =>
  data.names[language]?.[id] || data.names.en[id] || id;

export const recipeName = (recipe, language = I18N.language) =>
  recipe.name?.[language] || recipeItemName(recipe.itemId, language);

export function filterRecipes(
  entries,
  { query = "", category = "", effect = "" } = {},
) {
  const search = norm(query.trim());

  return entries.filter(
    (recipe) =>
      (!category || recipe.category === category) &&
      (!effect || recipe.effect === effect) &&
      (!search ||
        norm(
          ["es", "en"]
            .flatMap((language) => [
              recipeName(recipe, language),
              ...recipe.ingredients.map(({ id }) =>
                recipeItemName(id, language),
              ),
            ])
            .join(" "),
        ).includes(search)),
  );
}
