import { I18N } from "../../shared/i18n.js";
import { questTypes, questStates, questGuideLink } from "./model.js";

const t = (key, values) => I18N.t(key, values);

export function QuestDetails({ quest, progress, snapshot }) {
  const missing = t("Sin verificar");
  const rows = [
    ["ID", quest.id],
    [t("Campo del guardado"), "Step_" + quest.id],
    ["Hash", "0x" + quest.hash.toString(16).padStart(8, "0")],
    [t("Etapa registrada"), progress?.step || missing],
    [
      t("Valor leído"),
      progress?.raw == null
        ? missing
        : "0x" + (progress.raw >>> 0).toString(16).padStart(8, "0"),
    ],
    [t("Revisión del guardado"), snapshot?.revision || missing],
  ];

  return (
    <details className="quest-save-details">
      <summary>{t("Verificar contra el guardado")}</summary>

      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>

            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export function QuestCard({
  quest,
  progress,
  snapshot,
  selected,
  hidden,
  actions,
}) {
  const current = progress?.state || "unknown";

  return (
    <article
      className={`quest-card${selected ? " selected" : ""}`}
      id={`quest-${quest.id}`}
    >
      <div className="quest-card-heading">
        <span>{t(questTypes[quest.type])}</span>
        <span className={`quest-badge quest-${current}`}>
          {t(questStates[current])}
        </span>
      </div>

      <h2>{quest.name}</h2>

      <p>
        {quest.location === "-" ? t("Ubicación variable") : quest.location}
        {quest.giver && quest.giver !== "-" ? " · " + quest.giver : ""}
      </p>

      <div className="quest-card-actions">
        <button
          className="secondary"
          data-quest-map={quest.id}
          disabled={!quest.position}
          onClick={() => actions.showQuestOnMap(quest.id)}
        >
          {t(quest.position ? "Ver en el mapa" : "Sin ubicación fija")}
        </button>
        <a
          className="guide-button quest-guide"
          href={questGuideLink(quest)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("Ver guía en Zelda Dungeon (otra pestaña)")}
        >
          {t("Ver guía")} · Zelda Dungeon
        </a>
        {quest.position && (
          <label className="quest-visibility">
            <input
              type="checkbox"
              data-quest-visible={quest.id}
              checked={!hidden}
              onChange={(e) =>
                actions.setQuestVisible(quest.id, e.target.checked)
              }
            />{" "}
            {t("Mostrar en el mapa")}
          </label>
        )}
      </div>

      <QuestDetails quest={quest} progress={progress} snapshot={snapshot} />
    </article>
  );
}
