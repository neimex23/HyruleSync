import { useState } from "react";
import { I18N } from "../../shared/i18n.js";
import { InventoryIcon } from "../inventory/InventoryCard.jsx";
import {
  recipes,
  recipeCategories,
  recipeEffects,
  recipeItemName,
  recipeName,
  filterRecipes,
} from "./recipes.js";

const t = (key, values) => I18N.t(key, values);

export function RecipeBook() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [effect, setEffect] = useState("");
  const entries = filterRecipes(recipes, { query, category, effect });

  function clearFilters() {
    setQuery("");
    setCategory("");
    setEffect("");
  }

  return (
    <>
      <div className="world-section-heading">
        <h2>{t("Recetario")}</h2>
        <span>{t("{n} recetas", { n: recipes.length })}</span>
      </div>
      <p className="world-note">
        {t(
          "Una selección de platos y elixires para tus aventuras. Consulta ingredientes y preparación sin cargar una partida.",
        )}
      </p>
      <div className="recipe-tips">
        <InventoryIcon icon="meal" />
        <p>
          {t(
            "Usa una cacerola encendida y un máximo de cinco ingredientes. Los efectos y su duración dependen de los ingredientes; evita mezclar efectos distintos.",
          )}
        </p>
      </div>
      <div className="world-filters">
        <input
          type="search"
          aria-label={t("Buscar recetas")}
          placeholder={t("Buscar plato o ingrediente…")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          aria-label={t("Tipo de receta")}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">{t("Todos los tipos")}</option>
          {Object.entries(recipeCategories).map(([id, label]) => (
            <option key={id} value={id}>
              {t(label)}
            </option>
          ))}
        </select>
        <select
          aria-label={t("Efecto de la receta")}
          value={effect}
          onChange={(event) => setEffect(event.target.value)}
        >
          <option value="">{t("Todos los efectos")}</option>
          {Object.entries(recipeEffects).map(([id, label]) => (
            <option key={id} value={id}>
              {t(label)}
            </option>
          ))}
        </select>
      </div>
      <p className="world-results" role="status">
        {t("{shown} de {total} recetas", {
          shown: entries.length,
          total: recipes.length,
        })}
      </p>
      <div className="world-recipes">
        {entries.map((recipe) => (
          <article className="world-recipe" key={recipe.id}>
            <div className="recipe-heading">
              <InventoryIcon
                icon={recipe.category === "elixirs" ? "potion" : "meal"}
              />
              <div>
                <span className="recipe-category">
                  {t(recipeCategories[recipe.category])}
                </span>
                <h3>{recipeName(recipe)}</h3>
              </div>
            </div>
            <p className="recipe-effect">{t(recipeEffects[recipe.effect])}</p>
            <h4>{t("Ingredientes")}</h4>
            <ul className="recipe-ingredients">
              {recipe.ingredients.map(({ id, quantity }) => (
                <li key={id}>
                  <span>{recipeItemName(id)}</span>
                  <b>× {quantity}</b>
                </li>
              ))}
            </ul>
            <h4>{t("Preparación")}</h4>
            <p className="recipe-preparation">
              {t(
                recipe.category === "elixirs"
                  ? "Cocina juntos el animal y la parte de monstruo en una cacerola encendida."
                  : "Sostén los ingredientes indicados y cocínalos juntos en una cacerola encendida.",
              )}
            </p>
          </article>
        ))}
      </div>
      {!entries.length && (
        <div className="world-empty">
          <InventoryIcon icon="meal" />
          <h3>{t("No hay recetas con estos filtros.")}</h3>
          <p>{t("Prueba con otro plato, ingrediente o efecto.")}</p>
          <button className="secondary" onClick={clearFilters}>
            {t("Limpiar filtros")}
          </button>
        </div>
      )}
      <p className="world-note recipe-reference">
        {t(
          "Cada ficha muestra una combinación de ejemplo. El efecto indicado corresponde a esos ingredientes.",
        )}{" "}
        <a
          href="https://www.pockettactics.com/zelda-tears-of-the-kingdom/recipe"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Referencias de cocina")} ↗
        </a>
      </p>
    </>
  );
}
