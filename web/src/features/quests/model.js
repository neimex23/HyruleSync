import { norm } from "../../shared/utils.js";
import { I18N } from "../../shared/i18n.js";

export const questTypes = {
  main: "Principales",
  adventure: "Aventuras secundarias",
  shrine: "Pruebas heroicas",
  side: "Misiones secundarias",
};

export const questStates = {
  done: "Hechas",
  active: "En curso",
  todo: "Por hacer",
  unknown: "Sin verificar",
};

export function prepareQuests(quests, language = I18N.language) {
  return quests.map((quest) => {
    const localized = (field) =>
      (language === "es" && quest[field + "Es"]) || quest[field];

    return {
      ...quest,
      nameEn: quest.name,
      name: localized("name"),
      giver: localized("giver"),
      location: localized("location"),
      searchText: norm(
        [
          quest.name,
          quest.nameEs,
          quest.id,
          quest.giver,
          quest.giverEs,
          quest.location,
          quest.locationEs,
          I18N.t(questTypes[quest.type]),
        ].join(" "),
      ),
    };
  });
}

export function questProgress(snapshot) {
  return new Map((snapshot?.quests || []).map((quest) => [quest.id, quest]));
}

export function countQuestStates(quests, progress) {
  const counts = { done: 0, active: 0, todo: 0, unknown: 0 };

  for (const quest of quests || [])
    counts[progress.get(quest.id)?.state || "unknown"]++;

  return counts;
}

export function questGuideLink(quest) {
  const title =
    quest.id === "GerudoCanyon_GleeokLiver"
      ? "Gleeok Guts (Side Quest)"
      : quest.nameEn || quest.name;

  return (
    "https://www.zeldadungeon.net/wiki/" +
    encodeURIComponent(title.replace(/ /g, "_"))
  );
}

export function filterQuests(
  quests,
  progress,
  query = "",
  type = "",
  state = "",
) {
  const search = norm(query.trim());

  return quests.filter(
    (q) =>
      (!search || q.searchText.includes(search)) &&
      (!type || q.type === type) &&
      (!state || (progress.get(q.id)?.state || "unknown") === state),
  );
}
