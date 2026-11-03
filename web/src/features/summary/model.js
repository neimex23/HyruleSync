import {
  armorProgress,
  collectionProgress,
  medalProgress,
} from "../inventory/collections.js";

function countStates(entries, states) {
  if (!Array.isArray(entries) || !entries.length) return null;

  const counts = Object.fromEntries(states.map((state) => [state, 0]));
  counts.total = entries.length;
  counts.unknown = 0;
  for (const entry of entries) {
    const state = states.includes(entry.state) ? entry.state : "unknown";
    counts[state]++;
  }

  return counts;
}

export function createSummary(snapshot, catalog, collectionData) {
  const categories = (catalog?.categories || []).map((category) => ({
    ...category,
    total: 0,
    found: 0,
    missing: 0,
    unknown: 0,
  }));
  const byCategory = new Map(
    categories.map((category) => [category.id, category]),
  );
  const map = { total: 0, found: 0, missing: 0, unknown: 0 };

  for (const point of catalog?.points || []) {
    const state = snapshot?.states?.[point.index];
    const key = state === 1 ? "found" : state === 0 ? "missing" : "unknown";

    for (const count of [map, byCategory.get(point.category)].filter(Boolean)) {
      count.total++;
      count[key]++;
    }
  }

  const compendium = countStates(snapshot?.compendium, [
    "photo",
    "bought",
    "missing",
  ]);

  if (compendium) compendium.registered = compendium.photo + compendium.bought;

  const armor =
    snapshot && collectionData
      ? armorProgress(collectionData.armor, snapshot.inventory)
      : [];
  const upgrades = armor.flatMap((piece) =>
    piece.upgrades.map((upgrade) => ({
      state:
        piece.level == null
          ? "unknown"
          : piece.level >= upgrade.level
            ? "owned"
            : "missing",
    })),
  );
  const collections =
    snapshot && collectionData
      ? collectionProgress(collectionData.entries, snapshot)
      : [];
  const groups = Object.fromEntries(
    ["memories", "fabrics", "horses", "rewards", "medals"].map((group) => [
      group,
      countStates(
        collections.filter((entry) => entry.category === group),
        ["owned", "missing"],
      ),
    ]),
  );

  if (groups.medals) {
    const medals = medalProgress(collectionData.medals, catalog, snapshot);
    groups.medals.ready = medals.filter(
      (medal) =>
        medal.ready &&
        collections.some(
          (entry) => entry.id === medal.id && entry.state === "missing",
        ),
    ).length;
  }

  return {
    map: snapshot && map.total ? map : null,
    categories,
    quests: countStates(snapshot?.quests, ["done", "active", "todo"]),
    compendium,
    characters: countStates(snapshot?.characterProfiles, [
      "discovered",
      "missing",
    ]),
    armor: countStates(armor, ["owned", "missing"]),
    upgrades: countStates(upgrades, ["owned", "missing"]),
    ...groups,
  };
}
