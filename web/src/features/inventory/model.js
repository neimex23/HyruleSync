import { I18N } from "../../shared/i18n.js";
import { fmt, norm } from "../../shared/utils.js";

const inventoryLabels = {
  weapons: "Armas",
  bows: "Arcos",
  shields: "Escudos",
  armors: "Armaduras",
  arrows: "Flechas",
  materials: "Materiales",
  food: "Comida y elixires",
  devices: "Dispositivos zonnan",
  key: "Objetos importantes",
};

const inventoryCategoryIcons = {
  weapons: "sword",
  bows: "bow",
  shields: "shield",
  armors: "armor",
  arrows: "arrow",
  materials: "leaf",
  food: "meal",
  devices: "device",
  key: "key",
};

const inventoryIconBase =
  "https://raw.githubusercontent.com/marcrobledo/savegame-editors/b4db8cd11157c6d5ae54a0a5edc88dba82aebe9d/zelda-totk/assets/item_icons/";

const inventoryFields = {
  durability: "Durabilidad",
  modifier: "Modificador",
  modifierValue: "Valor del modificador",
  fuseId: "Combinado con",
  fuseDurability: "Durabilidad de la fusión",
  extraDurability: "Durabilidad adicional",
  recordExtraDurability: "Durabilidad adicional registrada",
  dyeColor: "Tinte",
  getOrder: "Orden de obtención",
  useOrder: "Orden de uso",
  heartsHeal: "Corazones que recupera",
  effectMultiplier: "Potencia del efecto",
  effectTime: "Duración (segundos)",
  price: "Precio de venta",
  recipe: "Ingredientes",
};

export function createInventoryModel(data, language = I18N.language) {
  const t = (key, values) => I18N.t(key, values);

  function inventoryItemIconUrl(item, group) {
    if (!Object.hasOwn(inventoryCategoryIcons, group.id)) return null;

    const folder = group.id;
    const file = group.id === "arrows" ? "NormalArrow.png" : item.id + ".png";

    return inventoryIconBase + folder + "/" + encodeURIComponent(file);
  }

  function inventoryItemIcon(item, group) {
    const id = item.id;

    if (group.id === "weapons" && id.startsWith("Weapon_Spear_"))
      return "spear";
    if (group.id === "armors")
      return id.endsWith("_Head")
        ? "helmet"
        : id.endsWith("_Lower")
          ? "boots"
          : "armor";
    if (group.id === "materials") {
      for (const [prefix, icon] of [
        ["Item_Fruit_", "fruit"],
        ["Item_Mushroom", "mushroom"],
        ["Item_Fish", "fish"],
        ["Animal_Fish", "fish"],
        ["Animal_Insect", "bug"],
        ["Item_Ore", "gem"],
        ["Item_Enemy", "horn"],
      ])
        if (id.startsWith(prefix)) return icon;
    }
    if (group.id === "food" && id === "Item_Cook_C_17") return "potion";
    if (group.id === "devices") {
      if (id.includes("WindGenerator")) return "fan";
      if (/Wheel|Tire/.test(id)) return "wheel";
    }

    return inventoryCategoryIcons[group.id] || "key";
  }

  function inventoryName(id) {
    return data?.names?.[language]?.[id] || data?.names?.en?.[id] || id;
  }

  function inventoryHash(text) {
    let h = 0,
      k,
      i = 0;

    for (; i + 4 <= text.length; i += 4) {
      k =
        text.charCodeAt(i) |
        (text.charCodeAt(i + 1) << 8) |
        (text.charCodeAt(i + 2) << 16) |
        (text.charCodeAt(i + 3) << 24);
      k = Math.imul(k, 0xcc9e2d51);
      k = (k << 15) | (k >>> 17);
      k = Math.imul(k, 0x1b873593);
      h ^= k;
      h = (h << 13) | (h >>> 19);
      h = (Math.imul(h, 5) + 0xe6546b64) | 0;
    }
    k = 0;
    for (let j = 0; i + j < text.length; j++)
      k |= text.charCodeAt(i + j) << (8 * j);
    k = Math.imul(k, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, 0x1b873593);
    h ^= k;
    h ^= text.length;
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);

    return (h ^ (h >>> 16)) >>> 0;
  }

  let enumIndex;

  function inventoryEnum(value) {
    enumIndex ??= new Map(
      (data?.enums || []).map((name) => [inventoryHash(name), name]),
    );
    const name = enumIndex.get(value >>> 0);

    return name
      ? inventoryName(data.enumNames?.[name] || name)
      : "0x" + (value >>> 0).toString(16).padStart(8, "0");
  }

  function inventoryValue(key, value) {
    if (key === "recipe")
      return (
        value.filter(Boolean).map(inventoryName).join(", ") ||
        t("Sin ingredientes registrados")
      );
    if (key === "fuseId") return value ? inventoryName(value) : t("Sin fusión");
    if (key === "modifier" || key === "dyeColor") return inventoryEnum(value);
    if (key === "heartsHeal")
      return value < 0 ? t("Sin verificar") : fmt(value / 4);

    return fmt(value);
  }

  const searchTexts = new WeakMap();

  function inventorySearchText(item) {
    if (!searchTexts.has(item))
      searchTexts.set(
        item,
        norm(
          [
            inventoryName(item.id),
            item.id,
            inventoryName(item.details?.fuseId || ""),
            ...(item.details?.recipe || []).map(inventoryName),
          ].join(" "),
        ),
      );

    return searchTexts.get(item);
  }

  return {
    inventoryLabels,
    inventoryCategoryIcons,
    inventoryItemIconUrl,
    inventoryItemIcon,
    inventoryFields,
    inventoryHash,
    inventoryName,
    inventoryEnum,
    inventoryValue,
    inventorySearchText,
  };
}

export function filterInventory(groups, model, search = "", category = "") {
  const query = norm(search);

  return groups
    .filter((group) => !category || category === group.id)
    .map((group) => ({
      ...group,
      items: query
        ? group.items.filter((item) =>
            model.inventorySearchText(item).includes(query),
          )
        : group.items,
    }))
    .filter((group) => !query || group.items.length || !group.available);
}
