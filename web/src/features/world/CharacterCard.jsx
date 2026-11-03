import { useState } from "react";
import { I18N } from "../../shared/i18n.js";
import { characterStates } from "./model.js";
import { PortraitReveal } from "./PortraitReveal.jsx";

const t = (key, values) => I18N.t(key, values);

function Portrait({ image, name }) {
  const [status, setStatus] = useState("loading");

  return (
    <div className="character-portrait-image">
      {status !== "loaded" && (
        <span className="character-portrait-fallback" aria-hidden="true">
          {name.slice(0, 1)}
        </span>
      )}
      {image && status !== "failed" && (
        <img
          className={status === "loaded" ? "loaded" : ""}
          src={image.url}
          alt={t("Retrato de {name}", { name })}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("failed")}
        />
      )}
    </div>
  );
}

export function CharacterCard({ character, metadata, state }) {
  const [revealed, setRevealed] = useState(false);
  const name = I18N.language === "es" ? character.nameEs : character.name;
  const images = metadata?.images || [];
  const concealed = state === "missing" && !revealed;

  return (
    <article className={`world-character character-${state}`}>
      <div className={`character-portrait${concealed ? " is-concealed" : ""}`}>
        {images.length ? (
          images.map((image) => (
            <Portrait key={image.url} image={image} name={name} />
          ))
        ) : (
          <Portrait name={name} />
        )}
        {state === "missing" && (
          <PortraitReveal
            name={name}
            revealed={revealed}
            onReveal={setRevealed}
          />
        )}
      </div>
      <div className="world-character-heading">
        <h3>{name}</h3>
        <span className={`world-badge character-${state}`}>
          {t(characterStates[state])}
        </span>
      </div>
      <p>{character.role[I18N.language]}</p>
      <h4>{t("Dónde encontrarlo")}</h4>
      <p>{character.location[I18N.language]}</p>
      <h4>{t("Cómo conocerlo")}</h4>
      <p>{character.unlock[I18N.language]}</p>
      <a href={character.guide} target="_blank" rel="noopener noreferrer">
        {t("Ver guía")} · Zelda Dungeon ↗
      </a>
    </article>
  );
}
