import { I18N } from "../../shared/i18n.js";

export function PortraitReveal({
  name,
  revealed,
  onReveal,
  kind = "portrait",
}) {
  const label =
    kind === "portrait"
      ? revealed
        ? "Difuminar retrato de {name}"
        : "Mostrar retrato de {name}"
      : revealed
        ? "Difuminar imagen de {name}"
        : "Mostrar imagen de {name}";

  return (
    <button
      type="button"
      className="portrait-reveal-toggle"
      aria-label={I18N.t(label, { name })}
      aria-pressed={revealed}
      onClick={(event) => {
        // An encyclopedia image sits inside the guide's disclosure summary.
        event.preventDefault();
        event.stopPropagation();
        onReveal(!revealed);
      }}
    >
      <span>
        {I18N.t(revealed ? "Volver a difuminar" : "Clic para revelar")}
      </span>
    </button>
  );
}
