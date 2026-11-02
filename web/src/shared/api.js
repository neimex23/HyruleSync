import { I18N } from "./i18n.js";

export async function request(path, options = {}) {
  const response = await fetch(path, { cache: "no-store", ...options });
  const json = response.headers
    ?.get("content-type")
    ?.includes("application/json");
  const body = json ? await response.json() : await response.text();

  if (!response.ok || body?.ok === false) {
    throw new Error(
      body?.error ||
        (typeof body === "string" && body) ||
        I18N.t("No se pudo completar la acción."),
    );
  }

  return body;
}
