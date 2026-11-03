import { I18N } from "../../shared/i18n.js";
import { norm } from "../../shared/utils.js";

export const worldCategories = {
  creatures: "Fauna",
  monsters: "Monstruos",
  materials: "Materiales",
  equipment: "Equipo",
  treasure: "Tesoros",
};

export const worldStates = {
  photo: "Fotografiada",
  bought: "Comprada",
  missing: "Sin registrar",
  unknown: "Sin verificar",
};

export const registered = (state) => state === "photo" || state === "bought";

export const worldProgress = (snapshot) =>
  new Map((snapshot?.compendium || []).map((entry) => [entry.id, entry.state]));

export const characterStates = {
  discovered: "Descubierto",
  missing: "Por descubrir",
  unknown: "Sin verificar",
};

export const characterProgress = (snapshot) =>
  new Map(
    (snapshot?.characterProfiles || []).map((entry) => [
      entry.id,
      Object.hasOwn(characterStates, entry.state) ? entry.state : "unknown",
    ]),
  );

export function filterCharacters(characters, progress, query = "", state = "") {
  const search = norm(query.trim());

  return characters.filter(
    (character) =>
      (!state || (progress.get(character.id) || "unknown") === state) &&
      norm(
        [
          character.name,
          character.nameEs,
          ...Object.values(character.role),
          ...Object.values(character.location),
        ].join(" "),
      ).includes(search),
  );
}

export function countCharacters(characters, progress) {
  const counts = { discovered: 0, missing: 0, unknown: 0 };

  for (const character of characters)
    counts[progress.get(character.id) || "unknown"]++;

  return counts;
}

export const worldName = (entry) =>
  I18N.language === "es" ? entry.nameEs : entry.name;

export const worldLocations = (entry) =>
  (I18N.language === "es" ? entry.locationsEs : entry.locations) || [];

export function filterWorld(
  entries,
  progress,
  { query = "", category = "", state = "", album = false } = {},
) {
  const search = norm(query.trim());

  return entries.filter((entry) => {
    const status = progress.get(entry.id) || "unknown";

    return (
      (!album || registered(status)) &&
      (!category || entry.category === category) &&
      (!state || status === state) &&
      (!search ||
        norm(
          [
            entry.name,
            entry.nameEs,
            entry.id,
            entry.number,
            ...(entry.locations || []),
            ...(entry.locationsEs || []),
          ].join(" "),
        ).includes(search))
    );
  });
}

export const worldGuideLink = (entry) =>
  "https://www.zeldadungeon.net/wiki/" +
  encodeURIComponent(entry.name.replace(/ /g, "_"));

// Item portraits are reference images, never the user's camera photographs.
export const worldImage = (entry) =>
  "https://raw.githubusercontent.com/gadhagod/Hyrule-Compendium-API/7d5c566dd1563ef6087335cc4ca0ec47e79bb392/images/TOTK/" +
  encodeURIComponent(
    (
      entry.name.toLowerCase().replace(/’/g, "'") +
      (entry.pristine ? " (new)" : "")
    ).replace(/ /g, "_") + ".png",
  );
