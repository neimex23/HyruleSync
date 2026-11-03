import { useEffect, useMemo } from "react";

import { useStoreValue } from "../../app/use-store.js";
import { I18N } from "../../shared/i18n.js";
import { fmt, saveLabel, savedTime } from "../../shared/utils.js";
import { InventoryIcon } from "../inventory/InventoryCard.jsx";
import { createSummary } from "./model.js";

const t = (key, values) => I18N.t(key, values);

function Progress({ label, found, total }) {
  return (
    <div
      className="summary-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={found}
    >
      <span style={{ width: `${total ? (found / total) * 100 : 0}%` }} />
    </div>
  );
}

function OverviewCard({
  title,
  target = title,
  counts,
  completed,
  details,
  onOpen,
  id,
}) {
  return (
    <article className="summary-card" id={id}>
      <h2>{t(title)}</h2>
      <div className="summary-card-value">
        <strong>{counts ? fmt(counts[completed]) : "—"}</strong>
        {counts && <span>/ {fmt(counts.total)}</span>}
      </div>
      {counts ? (
        <>
          <Progress
            label={t(title)}
            found={counts[completed]}
            total={counts.total}
          />
          <dl className="summary-breakdown">
            {details.map(([key, label]) => (
              <div key={key}>
                <dt>{t(label)}</dt>
                <dd>{fmt(counts[key])}</dd>
              </div>
            ))}
            <div>
              <dt>{t("Sin verificar")}</dt>
              <dd>{fmt(counts.unknown)}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="summary-unavailable">{t("No disponible")}</p>
      )}
      <button className="secondary" onClick={onOpen}>
        {t("Abrir {section}", { section: t(target) })}{" "}
        <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}

export function SummaryPanel({ store }) {
  const view = useStoreValue(store, "view");
  const {
    snapshot,
    catalog,
    collectionData,
    collectionLoading,
    collectionFailed,
  } = useStoreValue(store, "summary");
  useEffect(() => {
    if (view === "summary" && snapshot && !collectionData && !collectionFailed)
      store.actions.loadCollections?.();
  }, [store, view, snapshot, collectionData, collectionFailed]);

  const summary = useMemo(
    () => createSummary(snapshot, catalog, collectionData),
    [snapshot, catalog, collectionData],
  );
  const inv = snapshot?.inventory;
  const unavailable = t("No disponible");
  const value = (number, scale = 1, unit) =>
    number == null
      ? unavailable
      : unit
        ? t(unit, { n: fmt(number / scale) })
        : fmt(number / scale);
  const stats = [
    [
      "Horas de juego",
      snapshot?.playtime == null
        ? unavailable
        : t("{h} h {m} min", {
            h: fmt(Math.floor(snapshot.playtime / 3600)),
            m: fmt(Math.floor((snapshot.playtime % 3600) / 60)),
          }),
      "clock",
    ],
    ["Rupias", value(inv?.rupees), "rupee"],
    ["Vida máxima", value(inv?.maxLife, 4, "{n} corazones"), "heart"],
    ["Stamina máxima", value(inv?.stamina, 1000, "{n} ruedas"), "stamina"],
    [
      "Batería máxima",
      value(inv?.energy, 1, "{n} unidades de energía"),
      "battery",
    ],
    ["Puntos del establo", value(inv?.ponyPoints), "stable"],
  ];
  const open = (target, section, collectionGroup) => {
    store.actions.setSaveView(target, { section, collectionGroup });
    document.getElementById(target + "Tab")?.focus();
  };

  return (
    <section
      id="summaryPanel"
      role="tabpanel"
      aria-labelledby="summaryTab"
      hidden={view !== "summary"}
    >
      <div className="inventory-heading">
        <div>
          <div className="eyebrow">{t("TU AVENTURA · DE UN VISTAZO")}</div>
          <h1>{t("Resumen")}</h1>
        </div>
        <button
          className="secondary mobile"
          onClick={() =>
            document.getElementById("sidebar").classList.toggle("open")
          }
        >
          {t("☰ Partida")}
        </button>
      </div>
      <p className="summary-source" id="summarySource">
        {snapshot
          ? t("Resumen de {file} · {time}", {
              file: saveLabel(snapshot),
              time: savedTime(snapshot),
            })
          : t("Carga una partida para ver el resumen de tu aventura.")}
      </p>
      {snapshot && (
        <>
          <div className="summary-stats">
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
          <div className="summary-overview">
            <OverviewCard
              id="summaryMap"
              title="Mapa"
              counts={summary.map}
              completed="found"
              details={[
                ["found", "Completados"],
                ["missing", "Pendientes"],
              ]}
              onOpen={() => open("map")}
            />
            <OverviewCard
              id="summaryQuests"
              title="Misiones"
              counts={summary.quests}
              completed="done"
              details={[
                ["active", "En curso"],
                ["todo", "Por hacer"],
              ]}
              onOpen={() => open("quests")}
            />
            <OverviewCard
              id="summaryCompendium"
              title="Enciclopedia hyliana"
              counts={summary.compendium}
              completed="registered"
              details={[
                ["photo", "Fotografiada"],
                ["bought", "Comprada"],
                ["missing", "Sin registrar"],
              ]}
              onOpen={() => open("world", "encyclopedia")}
            />
            <OverviewCard
              id="summaryCharacters"
              title="Guía de personajes"
              counts={summary.characters}
              completed="discovered"
              details={[
                ["discovered", "Descubierto"],
                ["missing", "Por descubrir"],
              ]}
              onOpen={() => open("world", "characters")}
            />
          </div>
          <section
            className="summary-categories"
            aria-labelledby="summaryCollectionsTitle"
          >
            <div className="summary-section-heading">
              <h2 id="summaryCollectionsTitle">
                {t("Tus colecciones y mejoras")}
              </h2>
            </div>
            <p>
              {t(
                "Las armaduras reflejan lo que llevas. Las mejoras cuentan cada nivel alcanzado en todas las piezas mejorables.",
              )}
            </p>
            {collectionLoading && (
              <p role="status">{t("Cargando colecciones…")}</p>
            )}
            {collectionFailed && (
              <p role="alert">
                {t("No se pudieron cargar las colecciones.")}{" "}
                <button
                  className="secondary"
                  onClick={() => store.actions.loadCollections?.()}
                >
                  {t("Reintentar")}
                </button>
              </p>
            )}
            <div className="summary-overview">
              {[
                ["Armor", "Armaduras", "armor", "armor"],
                ["ArmorUpgrades", "Mejoras de armadura", "upgrades", "armor"],
                [
                  "Memories",
                  "Recuerdos",
                  "memories",
                  "collections",
                  "memories",
                ],
                [
                  "Fabrics",
                  "Telas de la paravela",
                  "fabrics",
                  "collections",
                  "fabrics",
                ],
                [
                  "HorseEquipment",
                  "Equipamiento de caballo",
                  "horses",
                  "collections",
                  "horses",
                ],
                [
                  "Rewards",
                  "Recompensas de completado",
                  "rewards",
                  "collections",
                  "rewards",
                ],
                ["Medals", "Medallas de jefes", "medals", "medals"],
              ].map(([id, title, key, section, group]) => (
                <OverviewCard
                  key={id}
                  id={`summary${id}`}
                  title={title}
                  target={section === "armor" ? "Armaduras" : title}
                  counts={summary[key]}
                  completed="owned"
                  details={[
                    ["missing", "Pendientes"],
                    ...(key === "medals"
                      ? [["ready", "Listas para reclamar"]]
                      : []),
                  ]}
                  onOpen={() => open("inventory", section, group)}
                />
              ))}
            </div>
          </section>
          <section
            className="summary-categories"
            aria-labelledby="summaryCategoriesTitle"
          >
            <div className="summary-section-heading">
              <h2 id="summaryCategoriesTitle">{t("Progreso por categoría")}</h2>
              <span>{t("Todas las capas")}</span>
            </div>
            <p>
              {t(
                "El total es el del catálogo y no representa el porcentaje oficial del mapa.",
              )}
            </p>
            <div className="summary-category-list">
              {summary.categories
                .filter((category) => category.total > 0)
                .map((category) => (
                  <div className="summary-category" key={category.id}>
                    <div className="summary-category-heading">
                      <span>{category.name}</span>
                      <strong>
                        {fmt(category.found)} / {fmt(category.total)}
                      </strong>
                    </div>
                    <Progress
                      label={category.name}
                      found={category.found}
                      total={category.total}
                    />
                    <small>
                      {t("{n} pendientes", { n: fmt(category.missing) })}
                      {category.unknown
                        ? t(" · {n} sin verificar", {
                            n: fmt(category.unknown),
                          })
                        : ""}
                    </small>
                  </div>
                ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
