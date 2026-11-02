import { useState } from "react";

import { I18N } from "../../shared/i18n.js";
import { fmt } from "../../shared/utils.js";

const t = (key, values) => I18N.t(key, values);

export function InventoryIcon({ icon }) {
  return (
    <svg
      className="inventory-glyph"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <use href={`inventory-icons.svg#${icon}`} />
    </svg>
  );
}

function ItemImage({ item, group, model }) {
  const [failed, setFailed] = useState(false);
  const url = model.inventoryItemIconUrl(item, group);

  return url && !failed ? (
    <img
      className="inventory-item-image"
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <InventoryIcon icon={model.inventoryItemIcon(item, group)} />
  );
}

export function InventoryCard({ item, group, model, data }) {
  const name = model.inventoryName(item.id),
    details = item.details || {},
    armor = data?.armor?.[item.id];
  const stars =
    group.id === "armors" && armor?.level > 0 && !/[★☆]/.test(name)
      ? " " + "★".repeat(armor.level)
      : "";
  const quantity =
    details.quantity == null
      ? ""
      : group.id === "key" && details.quantity === -1
        ? t("Único")
        : details.quantity < 0
          ? t("Sin verificar")
          : "× " + fmt(details.quantity);
  const rows = ["weapons", "bows", "shields"].includes(group.id)
    ? []
    : Object.entries(details).filter(
        ([key, value]) => key !== "quantity" && value != null,
      );

  return (
    <article className="inventory-item">
      <div className="inventory-item-heading">
        <span className="inventory-item-icon">
          <ItemImage key={item.id} item={item} group={group} model={model} />
        </span>
        <div className="inventory-item-title">
          <h3>{name + stars}</h3>
          <strong>{quantity}</strong>
        </div>
      </div>

      {item.equipped && (
        <span className="inventory-equipped">{t("Equipado")}</span>
      )}

      <p className="inventory-id">{item.id}</p>

      {rows.length > 0 && (
        <details>
          <summary>{t("Detalles del objeto")}</summary>
          <dl>
            {rows.map(([key, value]) => (
              <div key={key}>
                <dt>
                  {t(
                    group.id === "food" && key === "modifier"
                      ? "Efecto"
                      : model.inventoryFields[key] || key,
                  )}
                </dt>

                <dd>{model.inventoryValue(key, value)}</dd>
              </div>
            ))}
          </dl>
          <p>{t("Casilla {n}", { n: item.slot + 1 })}</p>
        </details>
      )}
    </article>
  );
}
