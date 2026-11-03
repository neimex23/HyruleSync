import { useEffect, useMemo, useState } from "react";

import { InventoryCard, InventoryIcon } from "./InventoryCard.jsx";
import { useStoreValue } from "../../app/use-store.js";
import { I18N } from "../../shared/i18n.js";
import { fmt, saveLabel, savedTime } from "../../shared/utils.js";
import { createInventoryModel, filterInventory } from "./model.js";
import {
  ArmorCollection,
  OtherCollections,
  BossMedals,
} from "./CollectionPanels.jsx";

const t = (key, values) => I18N.t(key, values);

export function InventoryPanel({ store }) {
  const view = useStoreValue(store, "view");
  const {
    snapshot,
    data,
    loading,
    failed,
    collectionData,
    collectionLoading,
    collectionFailed,
    catalog,
  } = useStoreValue(store, "inventory");
  const tab = useStoreValue(store, "inventorySection") || "pouches";
  const setTab = (inventorySection) => store.update({ inventorySection });
  const collectionGroup = useStoreValue(store, "collectionGroup");
  const armorPlan = useStoreValue(store, "armorPlan");
  const armorPlanStatus = useStoreValue(store, "armorPlanStatus");
  const tabs = {
    pouches: "Bolsas",
    armor: "Armaduras",
    collections: "Otras colecciones",
    medals: "Medallas de jefes",
  };
  useEffect(() => {
    if (view === "inventory" && tab !== "pouches")
      store.actions.loadCollections?.();
  }, [store, view, tab]);

  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("");

  const model = useMemo(() => createInventoryModel(data), [data]),
    inv = snapshot?.inventory,
    playtime = snapshot?.playtime,
    missing = t("No disponible");

  const groups = useMemo(
    () => filterInventory(inv?.groups || [], model, search, category),
    [inv, model, search, category],
  );
  const totals = useMemo(
    () => new Map(inv?.groups.map((group) => [group.id, group.items.length])),
    [inv],
  );
  const matched = groups.reduce((sum, group) => sum + group.items.length, 0);

  const value = (number, scale = 1) =>
    number == null ? missing : fmt(number / scale);
  const unit = (number, scale, key) =>
    number == null ? missing : t(key, { n: value(number, scale) });

  const stats = inv
    ? [
        ["Vida", unit(inv.life, 4, "{n} corazones"), "heart"],
        ["Vida máxima", unit(inv.maxLife, 4, "{n} corazones"), "heart"],
        ["Stamina máxima", unit(inv.stamina, 1000, "{n} ruedas"), "stamina"],
        [
          "Batería máxima",
          unit(inv.energy, 1, "{n} unidades de energía"),
          "battery",
        ],
        ["Rupias", value(inv.rupees), "rupee"],
        ["Puntos del establo", value(inv.ponyPoints), "stable"],
        [
          "Horas de juego",
          playtime == null
            ? missing
            : t("{h} h {m} min", {
                h: fmt(Math.floor(playtime / 3600)),
                m: fmt(Math.floor((playtime % 3600) / 60)),
              }),
          "clock",
        ],
      ]
    : [];

  return (
    <section
      id="inventoryPanel"
      role="tabpanel"
      aria-labelledby="inventoryTab"
      hidden={view !== "inventory"}
    >
      <div className="inventory-heading">
        <div>
          <div className="eyebrow">{t("TU PARTIDA · AL DETALLE")}</div>
          <h1>{t("Inventario")}</h1>
        </div>
        <button id="inventorySidebar" className="secondary mobile">
          {t("☰ Partida")}
        </button>
      </div>

      <p id="inventorySource">
        {snapshot
          ? t("Inventario de {file} · {time}", {
              file: saveLabel(snapshot),
              time: savedTime(snapshot),
            })
          : t("Carga una partida para consultar el inventario.")}
      </p>

      <div
        className="inventory-tabs"
        role="tablist"
        aria-label={t("Secciones del inventario")}
      >
        {Object.entries(tabs).map(([id, label]) => (
          <button
            key={id}
            id={`inventory-section-${id}`}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`inventory-content-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            onKeyDown={(event) => {
              const keys = Object.keys(tabs),
                index = keys.indexOf(id);
              const next =
                event.key === "ArrowRight"
                  ? keys[(index + 1) % keys.length]
                  : event.key === "ArrowLeft"
                    ? keys[(index + keys.length - 1) % keys.length]
                    : event.key === "Home"
                      ? keys[0]
                      : event.key === "End"
                        ? keys.at(-1)
                        : null;

              if (next) {
                event.preventDefault();
                setTab(next);
                event.currentTarget.parentElement
                  .querySelector(`#inventory-section-${next}`)
                  .focus();
              }
            }}
          >
            {t(label)}
          </button>
        ))}
      </div>

      <div
        id="inventory-content-pouches"
        role="tabpanel"
        aria-labelledby="inventory-section-pouches"
        hidden={tab !== "pouches"}
      >
        <p id="inventoryEmpty" hidden={!!inv}>
          {t("Carga una partida para consultar el inventario.")}
        </p>

        <div id="inventoryStats" hidden={!inv}>
          {stats.map(([label, number, icon]) => (
            <div className="inventory-stat" key={label}>
              <span className="inventory-stat-label">
                <InventoryIcon icon={icon} />
                {t(label)}
              </span>

              <strong>{number}</strong>
            </div>
          ))}
        </div>

        <div id="inventoryControls" hidden={!inv}>
          <div className="inventory-filters">
            <input
              id="inventorySearch"
              type="search"
              aria-label={t("Buscar en el inventario")}
              placeholder={t("Buscar objeto, ingrediente o ID…")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              id="inventoryCategory"
              aria-label={t("Categoría del inventario")}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">{t("Todas las bolsas")}</option>
              {Object.entries(model.inventoryLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {t(label)}
                </option>
              ))}
            </select>
          </div>
          <p id="inventoryResults" role="status">
            {t("{n} objetos mostrados", { n: fmt(matched) })}
          </p>
        </div>

        <p id="inventoryNameStatus" role="status">
          {failed
            ? t(
                "No se pudieron cargar los nombres. Vuelve a abrir Inventario para reintentar.",
              )
            : loading
              ? t("Cargando nombres de objetos…")
              : ""}
        </p>

        <div id="inventoryGroups">
          {inv &&
            (search && !matched ? (
              <p className="inventory-no-results">
                {t("No se encontraron objetos.")}
              </p>
            ) : (
              groups.map((group) => (
                <section className="inventory-group" key={group.id}>
                  <h2>
                    <span className="inventory-group-label">
                      <InventoryIcon
                        icon={model.inventoryCategoryIcons[group.id] || "key"}
                      />
                      {t(model.inventoryLabels[group.id])}
                    </span>
                    <span>
                      {group.available
                        ? fmt(totals.get(group.id) || 0) +
                          (group.capacity == null
                            ? ""
                            : " / " + fmt(group.capacity))
                        : missing}
                    </span>
                  </h2>

                  {!group.available ? (
                    <p>{t("Esta bolsa no está disponible en el guardado.")}</p>
                  ) : group.items.length ? (
                    <div className="inventory-grid">
                      {group.items.map((item) => (
                        <InventoryCard
                          key={`${item.slot}:${item.id}`}
                          item={item}
                          group={group}
                          model={model}
                          data={data}
                        />
                      ))}
                    </div>
                  ) : (
                    <p>{t("Bolsa vacía")}</p>
                  )}
                </section>
              ))
            ))}
        </div>
      </div>

      {Object.keys(tabs)
        .filter((id) => id !== "pouches")
        .map((id) => (
          <div
            key={id}
            id={`inventory-content-${id}`}
            role="tabpanel"
            aria-labelledby={`inventory-section-${id}`}
            hidden={tab !== id}
          >
            {!snapshot && (
              <p className="collection-help">
                {t(
                  "Explora el catálogo. Carga una partida para ver qué te falta y descontar tu inventario.",
                )}
              </p>
            )}
            {collectionLoading && (
              <p role="status" className="collection-help">
                {t("Cargando colecciones…")}
              </p>
            )}
            {collectionFailed && (
              <p role="alert" className="collection-help">
                {t("No se pudieron cargar las colecciones.")}{" "}
                <button
                  className="secondary"
                  onClick={() => store.actions.loadCollections?.()}
                >
                  {t("Reintentar")}
                </button>
              </p>
            )}
            {collectionData &&
              (id === "armor" ? (
                <ArmorCollection
                  data={collectionData}
                  snapshot={snapshot}
                  model={model}
                  savedPlan={store.actions.saveArmorPlan ? armorPlan : undefined}
                  onPlanChange={store.actions.saveArmorPlan}
                  saveStatus={armorPlanStatus}
                />
              ) : id === "collections" ? (
                <OtherCollections
                  data={collectionData}
                  snapshot={snapshot}
                  selectedCategory={collectionGroup}
                  onCategoryChange={(collectionGroup) =>
                    store.update({ collectionGroup })
                  }
                />
              ) : (
                <BossMedals
                  data={collectionData}
                  snapshot={snapshot}
                  catalog={catalog}
                  onMap={store.actions.showCollectionBossOnMap}
                />
              ))}
          </div>
        ))}

      <p className="inventory-note">
        {t(
          "Datos del último guardado leído. Los campos ausentes se muestran como no disponibles.",
        )}
      </p>
    </section>
  );
}
