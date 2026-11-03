import { useMemo, useState } from "react";
import { I18N } from "../../shared/i18n.js";
import { fmt } from "../../shared/utils.js";
import { coordinateString } from "../map/model.js";
import { InventoryIcon, ItemImage } from "./InventoryCard.jsx";
import { PortraitReveal } from "../world/PortraitReveal.jsx";
import {
  armorProgress,
  upgradePlan,
  collectionGroups,
  collectionStates,
  collectionProgress,
  filterCollection,
  medalProgress,
  collectionGuide,
  normalizeArmorPlan,
} from "./collections.js";

const t = (key, values) => I18N.t(key, values);
const localized = (entry) =>
  I18N.language === "es" ? entry.nameEs || entry.name : entry.name;
const stateLabel = (state) => t(collectionStates[state]);
const number = (value) => (value == null ? t("Sin verificar") : fmt(value));

function CollectionArt({ entry, kind = "key", compact = false }) {
  return (
    <CollectionImage
      key={`${entry.id}:${entry.state}`}
      entry={entry}
      kind={kind}
      compact={compact}
    />
  );
}

function CollectionImage({ entry, kind, compact }) {
  const [failed, setFailed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const protectedImage = entry.state !== "owned";
  const concealed = protectedImage && (compact || !revealed);

  return (
    <div
      className={`collection-art${compact ? " collection-art-small" : ""}${entry.category === "memories" ? " collection-art-memory" : ""}${concealed ? " is-concealed" : ""}`}
    >
      {!failed && entry.image ? (
        <img
          src={entry.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <InventoryIcon icon={kind} />
      )}
      {protectedImage && !compact && (
        <PortraitReveal
          name={localized(entry)}
          revealed={revealed}
          onReveal={setRevealed}
          kind="entry"
        />
      )}
    </div>
  );
}

function Guide({ name }) {
  return (
    <a
      className="guide-button"
      href={collectionGuide(name)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t("Ver guía")} · Zelda Dungeon ↗
    </a>
  );
}

function StateFilter({ value, onChange, id }) {
  return (
    <select
      id={id}
      aria-label={t("Estado de la colección")}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{t("Todos los estados")}</option>
      {Object.entries(collectionStates).map(([id, label]) => (
        <option key={id} value={id}>
          {t(label)}
        </option>
      ))}
    </select>
  );
}

function Counts({ entries }) {
  return (
    <p className="collection-counts" role="status">
      {t(
        "{owned} de {total} conseguidos · {missing} pendientes · {unknown} sin verificar",
        {
          owned: fmt(entries.filter((entry) => entry.state === "owned").length),
          total: fmt(entries.length),
          missing: fmt(
            entries.filter((entry) => entry.state === "missing").length,
          ),
          unknown: fmt(
            entries.filter((entry) => entry.state === "unknown").length,
          ),
        },
      )}
    </p>
  );
}

export function ArmorCollection({
  data,
  snapshot,
  model,
  savedPlan,
  onPlanChange,
  saveStatus,
}) {
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [slot, setSlot] = useState("");
  const [localPlan, setLocalPlan] = useState(() => normalizeArmorPlan());
  const currentPlan = savedPlan || localPlan;
  const { target, selected: selection } = currentPlan;
  const changePlan = (patch) =>
    (onPlanChange || setLocalPlan)({ ...currentPlan, ...patch });
  const setTarget = (target) => changePlan({ target });
  const setSelection = (selected) => changePlan({ selected });
  const pieces = useMemo(
    () =>
      armorProgress(data.armor, snapshot?.inventory).map((entry) => ({
        ...entry,
        localizedName: localized(entry),
      })),
    [data.armor, snapshot],
  );
  const selected = useMemo(() => new Set(selection), [selection]);
  const plan = useMemo(
    () => upgradePlan(pieces, selected, target, snapshot?.inventory),
    [pieces, selected, target, snapshot],
  );
  const filtered = filterCollection(pieces, search, state).filter(
    (piece) => !slot || piece.slot === slot,
  );

  function toggle(id) {
    const next = new Set(selected);

    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelection([...next]);
  }

  return (
    <div className="collection-content">
      <h2>{t("Colección de armaduras")}</h2>
      <p className="collection-help">
        {t(
          "Todas las piezas y sus mejoras. La posesión refleja tu bolsa actual; una pieza vendida aparece como pendiente.",
        )}
      </p>
      <Counts entries={pieces} />
      <p className="collection-howto">
        {t(
          "Busca una pieza, consulta dónde conseguirla o marca «Incluir en el plan» para calcular sus mejoras.",
        )}
      </p>
      {onPlanChange && (
        <p
          className="collection-help"
          role={saveStatus === "failed" ? "alert" : "status"}
        >
          {saveStatus === "saving"
            ? t("Guardando plan…")
            : saveStatus === "failed"
              ? t(
                  "No se pudo guardar el plan. Tus cambios siguen en esta ventana.",
                )
              : t(
                  "El plan se guarda con las preferencias de HyruleSync y se recalcula con la partida que consultas.",
                )}
          {saveStatus === "failed" && (
            <>
              {" "}
              <button
                className="secondary"
                onClick={() => onPlanChange(currentPlan)}
              >
                {t("Reintentar")}
              </button>
            </>
          )}
        </p>
      )}
      <div className="inventory-filters collection-filters">
        <input
          type="search"
          aria-label={t("Buscar armaduras")}
          placeholder={t("Buscar pieza o lugar…")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <StateFilter id="armorState" value={state} onChange={setState} />
        <select
          aria-label={t("Parte de la armadura")}
          value={slot}
          onChange={(event) => setSlot(event.target.value)}
        >
          <option value="">{t("Todas las piezas")}</option>
          {[
            ["Head", "Cabeza"],
            ["Body", "Torso"],
            ["Legs", "Piernas"],
            ["All", "Cuerpo entero"],
          ].map(([id, label]) => (
            <option key={id} value={id}>
              {t(label)}
            </option>
          ))}
        </select>
      </div>
      <details
        className="upgrade-planner"
        aria-label={t("Plan de mejoras")}
        open={selection.length > 0}
      >
        <summary className="upgrade-plan-summary">
          <InventoryIcon icon="armor" />
          <strong>{t("Tu plan de mejoras")}</strong>
          <span>{t("{n} piezas elegidas", { n: fmt(selection.length) })}</span>
        </summary>
        <div className="collection-section-heading">
          <h3>{t("Plan de mejoras")}</h3>
          <label>
            {t("Objetivo")}{" "}
            <select
              aria-label={t("Nivel objetivo")}
              value={target}
              onChange={(event) => setTarget(Number(event.target.value))}
            >
              {[1, 2, 3, 4].map((level) => (
                <option key={level} value={level}>
                  {"★".repeat(level)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="collection-help">
          {t(
            "Selecciona las piezas que quieres mejorar. Se usa la copia de mayor nivel de cada pieza y se descuenta el inventario una sola vez del total.",
          )}
        </p>
        <div className="collection-actions">
          <button
            className="secondary"
            onClick={() =>
              setSelection(
                pieces
                  .filter(
                    (piece) =>
                      piece.state === "owned" &&
                      piece.upgrades.length &&
                      piece.level < target,
                  )
                  .map((piece) => piece.id),
              )
            }
          >
            {t("Seleccionar las que tengo")}
          </button>
          <button className="secondary" onClick={() => setSelection([])}>
            {t("Quitar selección")}
          </button>
        </div>
        <p role="status">
          {t("{n} mejoras pendientes", { n: fmt(plan.steps) })}
        </p>
        {plan.unverified > 0 && (
          <p className="collection-help" role="status">
            {t(
              "Hay {n} piezas sin nivel verificado; su coste no está incluido.",
              { n: fmt(plan.unverified) },
            )}
          </p>
        )}
        <div className="upgrade-rupees">
          <InventoryIcon icon="rupee" />
          <strong>{t("{n} rupias necesarias", { n: fmt(plan.rupees) })}</strong>
          <span>
            {t("Tienes: {have} · Faltan: {missing}", {
              have: number(plan.have),
              missing: number(plan.missingRupees),
            })}
          </span>
        </div>
        {plan.materials.length > 0 && (
          <details
            className="upgrade-materials"
            open={plan.materials.length <= 8}
          >
            <summary>
              {t("Materiales para las piezas seleccionadas")} ·{" "}
              {fmt(plan.materials.length)}
            </summary>
            <div className="collection-table-wrap">
              <table className="collection-table">
                <caption>
                  {t("Materiales para las piezas seleccionadas")}
                </caption>
                <thead>
                  <tr>
                    {["Material", "Necesitas", "Tienes", "Faltan"].map(
                      (label) => (
                        <th key={label} scope="col">
                          {t(label)}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {plan.materials.map((material) => (
                    <tr key={material.id}>
                      <th scope="row">
                        <span className="upgrade-material-name">
                          <ItemImage
                            item={{ id: material.id }}
                            group={{ id: "materials" }}
                            model={model}
                          />
                          {model.inventoryName(material.id)}
                        </span>
                      </th>
                      <td>{fmt(material.required)}</td>
                      <td>{number(material.have)}</td>
                      <td
                        className={
                          material.missing > 0 ? "collection-shortage" : ""
                        }
                      >
                        {number(material.missing)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
        {!plan.steps && (
          <p className="collection-help">
            {t(
              "Selecciona piezas con mejoras pendientes para calcular los materiales.",
            )}
          </p>
        )}
      </details>
      <p className="collection-help">
        {t("{n} piezas mostradas", { n: fmt(filtered.length) })}
      </p>
      <div className="inventory-grid">
        {filtered.map((piece) => (
          <article
            className={`inventory-item collection-card collection-${piece.state}`}
            key={piece.id}
          >
            <CollectionArt
              entry={piece}
              kind={
                piece.slot === "Head"
                  ? "helmet"
                  : piece.slot === "Legs"
                    ? "boots"
                    : "armor"
              }
            />
            <div className="collection-section-heading">
              <h3>{piece.localizedName}</h3>
              <span className="collection-badge">
                {stateLabel(piece.state)}
              </span>
            </div>
            <p className="collection-level">
              {piece.state === "owned"
                ? piece.level
                  ? "★".repeat(piece.level)
                  : t("Sin mejorar")
                : stateLabel(piece.state)}
              {piece.copies > 1 && " · " + t("{n} copias", { n: piece.copies })}
            </p>
            <details className="collection-location">
              <summary>{t("Dónde conseguirlo")}</summary>
              <ul className="collection-sources">
                {(I18N.language === "es" ? piece.sourcesEs : piece.sources).map(
                  (source) => (
                    <li key={source}>{source}</li>
                  ),
                )}
              </ul>
              <Guide name={piece.name} />
            </details>
            {piece.upgrades.length ? (
              <>
                <label className="collection-select">
                  <input
                    type="checkbox"
                    checked={selected.has(piece.id)}
                    disabled={
                      (piece.level == null || piece.level >= target) &&
                      !selected.has(piece.id)
                    }
                    onChange={() => toggle(piece.id)}
                  />
                  {t("Incluir en el plan")}
                </label>
                <details>
                  <summary>{t("Coste de cada mejora")}</summary>
                  {piece.upgrades.map((upgrade) => (
                    <div className="upgrade-tier" key={upgrade.level}>
                      <h4>
                        {"★".repeat(upgrade.level)} ·{" "}
                        {t("{n} rupias", { n: fmt(upgrade.rupees) })}
                        {piece.state === "owned" && piece.level >= upgrade.level
                          ? " · " + t("Completado")
                          : ""}
                      </h4>
                      <ul>
                        {upgrade.materials.map((material) => (
                          <li key={material.id}>
                            {model.inventoryName(material.id)} ×{" "}
                            {fmt(material.quantity)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </details>
              </>
            ) : (
              <p className="collection-help">
                {t("Esta pieza no admite mejoras.")}
              </p>
            )}
          </article>
        ))}
      </div>
      {!filtered.length && (
        <p className="inventory-no-results">
          {t("No hay resultados con estos filtros.")}
        </p>
      )}
      <p className="collection-help">
        {t(
          "El plan cubre las mejoras de la Gran Hada. No incluye comprar piezas ni desbloquear las fuentes de las hadas.",
        )}
      </p>
    </div>
  );
}

export function OtherCollections({
  data,
  snapshot,
  selectedCategory,
  onCategoryChange,
}) {
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [localCategory, setLocalCategory] = useState("memories");
  const category = selectedCategory || localCategory;
  const setCategory = onCategoryChange || setLocalCategory;
  const [amiibo, setAmiibo] = useState(true);
  const entries = useMemo(
    () =>
      collectionProgress(data.entries, snapshot).filter(
        (entry) => entry.category !== "medals",
      ),
    [data.entries, snapshot],
  );
  const filtered = filterCollection(entries, search, state).filter(
    (entry) =>
      (!category || entry.category === category) && (amiibo || !entry.amiibo),
  );

  return (
    <div className="collection-content">
      <h2>{t("Otras colecciones")}</h2>
      <p className="collection-howto">
        {t(
          "Elige una colección para ver tu progreso y los elementos que te faltan.",
        )}
      </p>
      <div className="collection-types" aria-label={t("Tipo de colección")}>
        {Object.entries(collectionGroups).map(([id, label]) => {
          const group = entries.filter((entry) => entry.category === id);
          const representative =
            group.find((entry) => entry.state === "owned") || group[0];

          return (
            <button
              key={id}
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              <CollectionArt entry={representative} compact />
              <span>
                {t(label)}
                <small>
                  {fmt(group.filter((entry) => entry.state === "owned").length)}{" "}
                  / {fmt(group.length)}
                </small>
              </span>
            </button>
          );
        })}
      </div>
      <div className="inventory-filters collection-filters">
        <input
          type="search"
          aria-label={t("Buscar colecciones")}
          placeholder={t("Buscar colección o recompensa…")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <StateFilter id="collectionState" value={state} onChange={setState} />
      </div>
      {category === "fabrics" && (
        <label className="collection-select">
          <input
            type="checkbox"
            checked={amiibo}
            onChange={(event) => setAmiibo(event.target.checked)}
          />
          {t("Incluir telas de amiibo")}
        </label>
      )}
      {Object.entries(collectionGroups)
        .filter(([id]) => !category || category === id)
        .map(([id, label]) => {
          const group = filtered.filter((entry) => entry.category === id);

          return (
            <section className="inventory-group" key={id}>
              <h2>
                {t(label)} <span>{fmt(group.length)}</span>
              </h2>
              <Counts
                entries={entries.filter((entry) => entry.category === id)}
              />
              <div className="inventory-grid">
                {group.map((entry) => (
                  <article
                    className={`inventory-item collection-card collection-${entry.state}`}
                    key={entry.id}
                  >
                    <CollectionArt entry={entry} />
                    <span className="collection-badge">
                      {stateLabel(entry.state)}
                    </span>
                    <h3>
                      {entry.number && `#${entry.number} · `}
                      {localized(entry)}
                    </h3>
                    {entry.amiibo && (
                      <span className="collection-tag">amiibo</span>
                    )}
                    <details className="collection-location">
                      <summary>{t("Dónde conseguirlo")}</summary>
                      <p>
                        {I18N.language === "es" ? entry.sourceEs : entry.source}
                      </p>
                      <Guide
                        name={
                          entry.category === "memories"
                            ? "Tears of the Kingdom Memories"
                            : entry.name
                        }
                      />
                    </details>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      {!filtered.length && (
        <p className="inventory-no-results">
          {t("No hay resultados con estos filtros.")}
        </p>
      )}
      <p className="collection-help">
        {t(
          "Conseguir una recompensa y cumplir sus requisitos son estados distintos. Las recompensas se confirman con el guardado.",
        )}
      </p>
    </div>
  );
}

export function BossMedals({ data, snapshot, catalog, onMap }) {
  const entries = collectionProgress(data.entries, snapshot);
  const progress = medalProgress(data.medals, catalog, snapshot);

  return (
    <div className="collection-content">
      <h2>{t("Medallas de jefes")}</h2>
      <p className="collection-help">
        {t(
          "Cada medalla requiere derrotar una vez a todos los jefes de su tipo. Después debes reclamarla en el Fuerte vigía.",
        )}
      </p>
      <div className="medal-grid">
        {progress.map((medal) => {
          const entry = entries.find((entry) => entry.id === medal.id);
          const state = entry?.state || "unknown";

          return (
            <article
              className={`inventory-item collection-card collection-${state}`}
              key={medal.id}
            >
              <CollectionArt entry={entry} />
              <span className="collection-badge">
                {state === "owned"
                  ? t("Medalla conseguida")
                  : medal.ready && state === "missing"
                    ? t("Lista para reclamar")
                    : stateLabel(state)}
              </span>
              <h3>{localized(entry)}</h3>
              <p className="medal-total">
                {fmt(medal.found)} <span>/ {fmt(medal.total)}</span>
              </p>
              <progress
                value={medal.found}
                max={medal.total}
                aria-label={localized(entry)}
              />
              <p>
                {t("{missing} pendientes · {unknown} sin verificar", {
                  missing: fmt(medal.missing),
                  unknown: fmt(medal.unknown),
                })}
              </p>
              {medal.ready && state !== "owned" && (
                <p>
                  {t(
                    "Ya derrotaste a todos. Consulta a Glaren para reclamar la medalla.",
                  )}
                </p>
              )}
              <details>
                <summary>{t("Jefes pendientes o sin verificar")}</summary>
                <ul className="medal-bosses">
                  {medal.points
                    .filter((point) => point.state !== "owned")
                    .map((point) => (
                      <li key={point.id}>
                        <span>
                          {point.name}
                          <small>
                            {stateLabel(point.state)} ·{" "}
                            {coordinateString(point.position)}
                          </small>
                        </span>
                        <button
                          className="secondary"
                          onClick={() => onMap?.(point.id)}
                        >
                          {t("Ver en mapa")}
                        </button>
                      </li>
                    ))}
                </ul>
              </details>
              <Guide name={entry.name} />
            </article>
          );
        })}
      </div>
    </div>
  );
}
