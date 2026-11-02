import { I18N } from "./i18n.js";

const formats = new Map();

export function fmt(value) {
  if (!formats.has(I18N.language))
    formats.set(I18N.language, new Intl.NumberFormat(I18N.language));

  return formats.get(I18N.language).format(value);
}

export const norm = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Leaflet accepts HTML strings for tooltips; React escapes its own text nodes.
export const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

export const saveLabel = (snapshot) =>
  snapshot.file.split(/[\\/]/).slice(-2).join(" / ");

export const savedTime = (snapshot) =>
  new Date(snapshot.savedAt).toLocaleString(I18N.language);
