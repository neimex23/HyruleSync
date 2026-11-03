import { norm } from "../../shared/utils.js";

export const collectionGroups = {
  memories: "Recuerdos",
  fabrics: "Telas de la paravela",
  horses: "Equipamiento de caballo",
  rewards: "Recompensas de completado",
};

export const collectionStates = {
  owned: "Conseguido",
  missing: "Pendiente",
  unknown: "Sin verificar",
};

export function normalizeArmorPlan(plan) {
  return {
    target:
      Number.isInteger(plan?.target) && plan.target >= 1 && plan.target <= 4
        ? plan.target
        : 4,
    selected: Array.isArray(plan?.selected)
      ? [
          ...new Set(plan.selected.filter((id) => typeof id === "string")),
        ].slice(0, 135)
      : [],
  };
}

export function armorProgress(definitions = [], inventory) {
  const pouch = inventory?.groups?.find((group) => group.id === "armors");
  const items = new Map();

  for (const item of pouch?.items || [])
    items.set(item.id, (items.get(item.id) || 0) + 1);

  return definitions.map((entry) => {
    const owned = entry.variants.filter((variant) => items.has(variant.id));

    return {
      ...entry,
      state: owned.length ? "owned" : pouch?.available ? "missing" : "unknown",
      level: owned.length
        ? Math.max(...owned.map((item) => item.level))
        : pouch?.available
          ? 0
          : null,
      copies: owned.reduce((sum, item) => sum + items.get(item.id), 0),
    };
  });
}

export function upgradePlan(armor, selected, target, inventory) {
  const totals = new Map();
  let rupees = 0,
    steps = 0,
    unverified = 0;

  for (const piece of armor) {
    if (!selected.has(piece.id)) continue;
    if (piece.level == null) {
      unverified++;
      continue;
    }
    for (const upgrade of piece.upgrades) {
      if (upgrade.level <= piece.level || upgrade.level > target) continue;
      rupees += upgrade.rupees;
      steps++;
      for (const material of upgrade.materials)
        totals.set(
          material.id,
          (totals.get(material.id) || 0) + material.quantity,
        );
    }
  }

  const pouch = inventory?.groups?.find((group) => group.id === "materials");
  const stock = new Map();

  for (const item of pouch?.items || []) {
    const quantity = item.details?.quantity;
    const known = Number.isInteger(quantity) && quantity >= 0;
    const prior = stock.get(item.id);
    stock.set(
      item.id,
      !known || prior === null ? null : (prior || 0) + quantity,
    );
  }

  const materials = [...totals].map(([id, required]) => {
    const have = pouch?.available ? (stock.has(id) ? stock.get(id) : 0) : null;

    return {
      id,
      required,
      have,
      missing: have == null ? null : Math.max(0, required - have),
    };
  });
  const have = inventory?.rupees ?? null;

  return {
    materials,
    unverified,
    steps,
    rupees,
    have,
    missingRupees: have == null ? null : Math.max(0, rupees - have),
  };
}

export function collectionProgress(entries = [], snapshot) {
  const flags = new Map(
    (snapshot?.collections || []).map((entry) => [entry.id, entry.state]),
  );
  const owned = new Set(
    (snapshot?.inventory?.groups || [])
      .flatMap((group) => group.items || [])
      .filter(
        (item) =>
          item.details?.quantity == null ||
          item.details.quantity === -1 ||
          item.details.quantity > 0,
      )
      .map((item) => item.id),
  );

  return entries.map((entry) => ({
    ...entry,
    state:
      owned.has(entry.itemId || entry.id) ||
      entry.aliases?.some((id) => owned.has(id))
        ? "owned"
        : collectionStates[flags.get(entry.id)]
          ? flags.get(entry.id)
          : "unknown",
  }));
}

export function filterCollection(entries, search, state = "", language = "es") {
  const query = norm(search);

  return entries.filter(
    (entry) =>
      (!state || entry.state === state) &&
      (!query ||
        norm(
          [
            entry.name,
            entry.nameEs,
            entry.id,
            entry.source,
            entry.sourceEs,
            ...(entry.sources || []),
            ...(entry.sourcesEs || []),
            entry.localizedName,
            language === "es" ? entry.nameEs : entry.name,
          ].join(" "),
        ).includes(query)),
  );
}

export function medalProgress(medals = [], catalog, snapshot) {
  return medals.map((medal) => {
    const points = (catalog?.points || []).flatMap((point, index) => {
      if (point.category !== medal.category) return [];

      const raw = snapshot?.states?.[point.index ?? index];

      return [
        {
          ...point,
          state: raw === 1 ? "owned" : raw === 0 ? "missing" : "unknown",
        },
      ];
    });
    const found = points.filter((point) => point.state === "owned").length;
    const missing = points.filter((point) => point.state === "missing").length;
    const unknown =
      points.filter((point) => point.state === "unknown").length +
      Math.max(0, medal.total - points.length);
    const completeCatalog = points.length === medal.total;

    return {
      ...medal,
      points,
      found,
      missing,
      unknown,
      ready: completeCatalog && found === medal.total,
    };
  });
}

export function collectionGuide(name) {
  return (
    "https://www.zeldadungeon.net/wiki/" +
    encodeURIComponent(name.replaceAll("’", "'").replaceAll(" ", "_"))
  );
}
