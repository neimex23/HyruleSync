import { useMemo, useState } from "react";
import { useStoreValue } from "../../app/use-store.js";
import { I18N } from "../../shared/i18n.js";
import { fmt, saveLabel, savedTime } from "../../shared/utils.js";
import { InventoryIcon } from "../inventory/InventoryCard.jsx";
import { characters } from "./characters.js";
import { CharacterCard } from "./CharacterCard.jsx";
import { PortraitReveal } from "./PortraitReveal.jsx";
import { RecipeBook } from "./RecipeBook.jsx";
import {
  worldCategories,
  worldStates,
  worldProgress,
  registered,
  filterWorld,
  worldName,
  worldLocations,
  worldGuideLink,
  worldImage,
  characterStates,
  characterProgress,
  countCharacters,
  filterCharacters,
} from "./model.js";

const t = (key, values) => I18N.t(key, values);
const tabs = {
  album: "Tu álbum",
  encyclopedia: "Enciclopedia hyliana",
  characters: "Guía de personajes",
  recipes: "Recetario",
};
const glyphs = {
  creatures: "leaf",
  monsters: "sword",
  materials: "fruit",
  equipment: "shield",
  treasure: "key",
};

function WorldCard({ entry, state }) {
  const [imageStatus, setImageStatus] = useState("loading");
  const [revealed, setRevealed] = useState(false);
  const areas = worldLocations(entry);
  const name = worldName(entry);
  const concealed = state === "missing" && !revealed;

  return (
    <details className={`world-card world-${state}`}>
      <summary>
        <div className="world-card-top">
          <span className="world-number">
            #{String(entry.number).padStart(3, "0")}
          </span>
          <span className={`world-badge world-${state}`}>
            {t(worldStates[state])}
          </span>
        </div>
        <div className={`world-portrait${concealed ? " is-concealed" : ""}`}>
          {imageStatus !== "loaded" && (
            <InventoryIcon icon={glyphs[entry.category]} />
          )}
          {state === "missing" && (
            <PortraitReveal
              name={name}
              revealed={revealed}
              onReveal={setRevealed}
              kind="entry"
            />
          )}
          {imageStatus !== "failed" && (
            <img
              className={imageStatus === "loaded" ? "loaded" : ""}
              src={worldImage(entry)}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onLoad={() => setImageStatus("loaded")}
              onError={() => setImageStatus("failed")}
            />
          )}
        </div>
        <h3>
          {name}
          {entry.pristine && (
            <span className="world-pristine"> ✦ {t("Sin deteriorar")}</span>
          )}
        </h3>
        <p>{t(worldCategories[entry.category])}</p>
        <span className="world-discover">
          {t("Dónde conseguirlo")} <span aria-hidden="true">↗</span>
        </span>
      </summary>
      <div className="world-card-details">
        <h4>{t("Lugares habituales")}</h4>
        {areas.length ? (
          <ul>
            {areas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        ) : (
          <p>
            {t(
              "Sin zona habitual registrada. Consulta la guía para este caso especial.",
            )}
          </p>
        )}
        <p>
          {t(
            "Fotografía el objetivo con la cámara para registrarlo. Rotver también vende imágenes en el laboratorio de Hatelia; algunas se habilitan al avanzar en la historia.",
          )}
        </p>
        <a
          className="guide-button"
          href={worldGuideLink(entry)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Ver guía")} · Zelda Dungeon ↗
        </a>
      </div>
    </details>
  );
}

export function WorldPanel({ store }) {
  const view = useStoreValue(store, "view");
  const { snapshot, data, loading, failed } = useStoreValue(store, "world");
  const tab = useStoreValue(store, "worldSection") || "album";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const progress = useMemo(() => worldProgress(snapshot), [snapshot]);
  const discoveredCharacters = useMemo(
    () => characterProgress(snapshot),
    [snapshot],
  );
  const characterCounts = useMemo(
    () => countCharacters(characters, discoveredCharacters),
    [discoveredCharacters],
  );
  const characterMetadata = useMemo(
    () =>
      new Map(
        (data?.characters || []).map((character) => [character.id, character]),
      ),
    [data],
  );
  const counts = useMemo(() => {
    const counts = { photo: 0, bought: 0, missing: 0, unknown: 0 };

    for (const entry of data?.entries || [])
      counts[progress.get(entry.id) || "unknown"]++;

    return counts;
  }, [data, progress]);
  const entries = useMemo(
    () =>
      filterWorld(data?.entries || [], progress, {
        query,
        category,
        state,
        album: tab === "album",
      }),
    [data, progress, query, category, state, tab],
  );
  const profiles = useMemo(
    () => filterCharacters(characters, discoveredCharacters, query, state),
    [discoveredCharacters, query, state],
  );
  const total = data?.entries.length || 509;
  const found = counts.photo + counts.bought;
  const isCharacters = tab === "characters";

  function changeTab(next) {
    store.update({ worldSection: next });
    setQuery("");
    setCategory("");
    setState("");
  }

  function navigate(event, current) {
    const names = Object.keys(tabs),
      index = names.indexOf(current);
    const next = {
      Home: 0,
      End: names.length - 1,
      ArrowRight: (index + 1) % names.length,
      ArrowLeft: (index + names.length - 1) % names.length,
    }[event.key];

    if (next == null) return;
    event.preventDefault();
    changeTab(names[next]);
    document.getElementById(`world-${names[next]}-tab`).focus();
  }

  return (
    <section
      id="worldPanel"
      role="tabpanel"
      aria-labelledby="worldTab"
      hidden={view !== "world"}
    >
      <div className="inventory-heading world-heading">
        <div>
          <div className="eyebrow">{t("DESCUBRE · REGISTRA · EXPLORA")}</div>
          <h1>
            Hyrule<span>World</span>
          </h1>
          <p>{t("La vida, los tesoros y las historias de Hyrule.")}</p>
        </div>
        <button
          id="worldSidebar"
          className="secondary mobile"
          onClick={() =>
            document.getElementById("sidebar")?.classList.toggle("open")
          }
        >
          {t("☰ Partida")}
        </button>
      </div>
      <nav
        className="world-tabs"
        role="tablist"
        aria-label={t("Secciones de HyruleWorld")}
      >
        {Object.entries(tabs).map(([id, label]) => (
          <button
            key={id}
            id={`world-${id}-tab`}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`world-${id}-panel`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => changeTab(id)}
            onKeyDown={(event) => navigate(event, id)}
          >
            {t(label)}
          </button>
        ))}
      </nav>
      {Object.keys(tabs).map((id) => (
        <div
          key={id}
          id={`world-${id}-panel`}
          role="tabpanel"
          aria-labelledby={`world-${id}-tab`}
          hidden={tab !== id}
        >
          {tab === id && id === "recipes" && <RecipeBook />}
          {tab === id && id !== "recipes" && (
            <>
              <div className="world-section-heading">
                <h2>{t(tabs[tab])}</h2>
                <span>
                  {isCharacters
                    ? t("{n} perfiles completos", { n: characters.length })
                    : t("{n} entradas", { n: fmt(total) })}
                </span>
              </div>
              <p className="world-note">
                {isCharacters
                  ? t(
                      "Compara los 22 perfiles con tu guardado y filtra los que te faltan por descubrir. Las fichas incluyen encuentros del final de la historia.",
                    )
                  : tab === "album"
                    ? t(
                        "Tus registros de la enciclopedia, leídos del guardado. Las imágenes son de referencia; las fotos de la cámara del juego no se incluyen en progress.sav.",
                      )
                    : t(
                        "Consulta todas las entradas, incluso las que todavía no has registrado. Abre una ficha para saber dónde encontrarla.",
                      )}
              </p>
              {isCharacters && (
                <>
                  <p className="world-source">
                    {snapshot
                      ? t("Perfiles de {file} · {time}", {
                          file: saveLabel(snapshot),
                          time: savedTime(snapshot),
                        })
                      : t(
                          "Carga una partida para saber qué personajes te faltan por descubrir.",
                        )}
                  </p>
                  <div className="world-progress">
                    <div>
                      <strong>
                        {snapshot ? characterCounts.discovered : "—"}
                        <small> / {characters.length}</small>
                      </strong>
                      <span>{t("Personajes descubiertos")}</span>
                    </div>
                    <div
                      className="world-progress-track"
                      role="progressbar"
                      aria-label={t("Progreso de personajes")}
                      aria-valuemin={0}
                      aria-valuemax={characters.length}
                      aria-valuenow={
                        snapshot ? characterCounts.discovered : undefined
                      }
                    >
                      <span
                        style={{
                          width: `${(characterCounts.discovered / characters.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="world-stats">
                    {Object.entries(characterStates).map(([id, label]) => (
                      <span key={id} className={`character-${id}`}>
                        <b>{snapshot ? fmt(characterCounts[id]) : "—"}</b>{" "}
                        {t(label)}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {!isCharacters && (
                <>
                  <p className="world-source">
                    {snapshot
                      ? t("Registros de {file} · {time}", {
                          file: saveLabel(snapshot),
                          time: savedTime(snapshot),
                        })
                      : t(
                          "Carga una partida para ver tu álbum y el progreso de la enciclopedia.",
                        )}
                  </p>
                  <div className="world-progress">
                    <div>
                      <strong>
                        {snapshot && data ? found : "—"}
                        <small> / {total}</small>
                      </strong>
                      <span>{t("Entradas registradas")}</span>
                    </div>
                    <div
                      className="world-progress-track"
                      role="progressbar"
                      aria-label={t("Progreso de la enciclopedia")}
                      aria-valuemin={0}
                      aria-valuemax={total}
                      aria-valuenow={snapshot && data ? found : undefined}
                    >
                      <span style={{ width: `${(found / total) * 100}%` }} />
                    </div>
                  </div>
                  <div className="world-stats">
                    {Object.entries(worldStates).map(([id, label]) => (
                      <span key={id} className={`world-${id}`}>
                        <b>{snapshot && data ? fmt(counts[id]) : "—"}</b>{" "}
                        {t(label)}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <div className="world-filters">
                <input
                  type="search"
                  id="worldSearch"
                  aria-label={
                    isCharacters
                      ? t("Buscar personajes")
                      : t("Buscar en HyruleWorld")
                  }
                  placeholder={
                    isCharacters
                      ? t("Buscar personaje o lugar…")
                      : t("Buscar nombre, número o lugar…")
                  }
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {!isCharacters && (
                  <>
                    <select
                      aria-label={t("Categoría de la enciclopedia")}
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                    >
                      <option value="">{t("Todas las categorías")}</option>
                      {Object.entries(worldCategories).map(([id, label]) => (
                        <option key={id} value={id}>
                          {t(label)}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label={t("Estado del registro")}
                      value={state}
                      onChange={(event) => setState(event.target.value)}
                    >
                      <option value="">{t("Todos los estados")}</option>
                      {Object.entries(worldStates)
                        .filter(([id]) => tab !== "album" || registered(id))
                        .map(([id, label]) => (
                          <option key={id} value={id}>
                            {t(label)}
                          </option>
                        ))}
                    </select>
                  </>
                )}
                {isCharacters && (
                  <select
                    aria-label={t("Estado de descubrimiento")}
                    value={state}
                    onChange={(event) => setState(event.target.value)}
                  >
                    <option value="">{t("Todos los personajes")}</option>
                    {Object.entries(characterStates).map(([id, label]) => (
                      <option key={id} value={id}>
                        {t(label)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {isCharacters ? (
                <>
                  <p className="world-note">
                    {t("Las imágenes de referencia requieren conexión.")}
                  </p>
                  <p className="world-results" role="status">
                    {t("{shown} de {total} personajes", {
                      shown: profiles.length,
                      total: characters.length,
                    })}
                  </p>
                  <div className="world-characters">
                    {profiles.map((character) => (
                      <CharacterCard
                        key={character.id}
                        character={character}
                        metadata={characterMetadata.get(character.id)}
                        state={
                          discoveredCharacters.get(character.id) || "unknown"
                        }
                      />
                    ))}
                  </div>
                  {!profiles.length && (
                    <p className="world-empty">
                      {t("No hay personajes con estos filtros.")}
                    </p>
                  )}
                </>
              ) : (
                <>
                  {loading && <p role="status">{t("Cargando HyruleWorld…")}</p>}
                  {failed && (
                    <div className="world-empty" role="alert">
                      <p>{t("No se pudo cargar la enciclopedia.")}</p>
                      <button onClick={() => store.actions.loadWorldData?.()}>
                        {t("Reintentar")}
                      </button>
                    </div>
                  )}
                  {data && (
                    <>
                      <p className="world-results" role="status">
                        {t("{shown} de {total} entradas", {
                          shown: fmt(entries.length),
                          total: fmt(tab === "album" ? found : total),
                        })}
                      </p>
                      <div className="world-grid">
                        {entries.map((entry) => (
                          <WorldCard
                            key={entry.id}
                            entry={entry}
                            state={progress.get(entry.id) || "unknown"}
                          />
                        ))}
                      </div>
                      {!entries.length && (
                        <div className="world-empty">
                          <InventoryIcon icon="key" />
                          <h3>
                            {t(
                              tab === "album" && !found
                                ? "Tu álbum espera nuevas aventuras"
                                : "No hay entradas con estos filtros.",
                            )}
                          </h3>
                          <p>
                            {t(
                              tab === "album" && !found
                                ? "Registra especies con la cámara o compra imágenes a Rotver. Aquí aparecerán con tu próximo guardado."
                                : "Prueba con otro nombre, lugar o categoría.",
                            )}
                          </p>
                          {tab === "album" && (
                            <button
                              className="secondary"
                              onClick={() => changeTab("encyclopedia")}
                            >
                              {t("Explorar la enciclopedia")}
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      ))}
    </section>
  );
}
