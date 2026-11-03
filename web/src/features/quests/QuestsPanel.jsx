import { useMemo, useState } from "react";

import { QuestCard } from "./QuestCard.jsx";
import { useStoreValue } from "../../app/use-store.js";
import { I18N } from "../../shared/i18n.js";
import { fmt, saveLabel, savedTime } from "../../shared/utils.js";
import {
  questTypes,
  questStates,
  filterQuests,
  questProgress,
  countQuestStates,
} from "./model.js";

const t = (key, values) => I18N.t(key, values);

export function QuestsPanel({ store }) {
  const view = useStoreValue(store, "view");
  const { snapshot, data, loading, failed, selected, hidden } = useStoreValue(
    store,
    "quests",
  );

  const [query, setQuery] = useState(""),
    [type, setType] = useState(""),
    [state, setState] = useState("");

  const progress = useMemo(() => questProgress(snapshot), [snapshot]);
  const counts = useMemo(
    () => countQuestStates(data, progress),
    [data, progress],
  );
  const hiddenIds = useMemo(() => new Set(hidden), [hidden]);
  const quests = useMemo(
    () => filterQuests(data || [], progress, query, type, state),
    [data, progress, query, type, state],
  );

  return (
    <section
      id="questsPanel"
      role="tabpanel"
      aria-labelledby="questsTab"
      hidden={view !== "quests"}
    >
      <div className="inventory-heading">
        <div>
          <div className="eyebrow">{t("TU AVENTURA · PASO A PASO")}</div>
          <h1>{t("Misiones")}</h1>
        </div>
        <button id="questsSidebar" className="secondary mobile">
          {t("☰ Partida")}
        </button>
      </div>

      <p id="questSource">
        {snapshot
          ? t("Misiones de {file} · {time}", {
              file: saveLabel(snapshot),
              time: savedTime(snapshot),
            })
          : t("Carga una partida para ver el estado de las misiones.")}
      </p>

      <p className="quest-note">
        {t(
          "Estados del guardado: hechas, en curso y por hacer. Puedes buscar misiones, personajes y lugares en español o inglés.",
        )}
      </p>

      <p className="quest-note">
        {t(
          "El estado se lee del guardado y se actualiza con Autosync. Activa la categoría Misiones en los filtros laterales para ver los marcadores; mostrarlos u ocultarlos solo cambia la vista. Las guías se abren en Zelda Dungeon.",
        )}
      </p>

      <div id="questStats">
        {data &&
          Object.entries(questStates).map(([id, label]) => (
            <div className={`inventory-stat quest-${id}`} key={id}>
              <span>{t(label)}</span>

              <strong>{fmt(counts[id])}</strong>
            </div>
          ))}
      </div>

      <div className="quest-filters">
        <input
          type="search"
          id="questSearch"
          aria-label={t("Buscar misiones")}
          placeholder={t("Buscar misión, personaje o lugar…")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            store.actions.setQuestFilters?.({ query: e.target.value });
          }}
        />
        <select
          id="questType"
          aria-label={t("Tipo de misión")}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            store.actions.setQuestFilters?.({ type: e.target.value });
          }}
        >
          <option value="">{t("Todos los tipos")}</option>
          {Object.entries(questTypes).map(([id, label]) => (
            <option key={id} value={id}>
              {t(label)}
            </option>
          ))}
        </select>
        <select
          id="questState"
          aria-label={t("Estado de misión")}
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            store.actions.setQuestFilters?.({ state: e.target.value });
          }}
        >
          <option value="">{t("Todos los estados")}</option>
          {Object.entries(questStates).map(([id, label]) => (
            <option key={id} value={id}>
              {t(label)}
            </option>
          ))}
        </select>
      </div>

      <p id="questResults" role="status">
        {data &&
          t("{shown} de {total} misiones", {
            shown: fmt(quests.length),
            total: fmt(data.length),
          })}
      </p>

      <p id="questLoadStatus" role="status">
        {failed
          ? t("No se pudieron cargar las misiones. Reintentar.")
          : loading
            ? t("Cargando misiones…")
            : ""}
      </p>

      <button id="questRetry" className="secondary" hidden={!failed}>
        {t("Reintentar")}
      </button>

      <div id="questList">
        {data &&
          (quests.length ? (
            quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                progress={progress.get(quest.id)}
                snapshot={snapshot}
                selected={selected === quest.id}
                hidden={hiddenIds.has(quest.id)}
                actions={store.actions}
              />
            ))
          ) : (
            <p>{t("No hay misiones con estos filtros.")}</p>
          ))}
      </div>

      <p className="quest-note">
        {t(
          "Los marcadores indican el santuario o la zona asociada, no el objetivo actual. Las misiones sin ubicación fija no tienen marcador. Los filtros de esta pestaña también se aplican a los marcadores de misiones.",
        )}
      </p>
    </section>
  );
}
