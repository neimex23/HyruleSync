import fs from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { I18N } from "../../web/src/shared/i18n.js";
import { Sidebar } from "../../web/src/app/components/Sidebar.jsx";
import { Workspace } from "../../web/src/app/components/Workspace.jsx";
import { Dialogs } from "../../web/src/app/components/Dialogs.jsx";
import { createViewStore } from "../../web/src/app/store.js";
import credits from "../../assets/credits.json";

it("keeps interpolation and English/Spanish coverage across the React source", () => {
  I18N.setLanguage("en");
  expect(I18N.t("Partida cargada")).toBe("Save loaded");
  expect(I18N.t("{n} pendientes", { n: 123 })).toBe("123 missing");
  I18N.setLanguage("es");
  expect(I18N.t("Partida cargada")).toBe("Partida cargada");
  expect(I18N.t("{n} pendientes", { n: 123 })).toBe("123 pendientes");
  const fields = (text) =>
    [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const [source, translated] of Object.entries(I18N.translations))
    expect(fields(source), source).toEqual(fields(translated));
  const unchanged = new Set([
    "HyruleSync",
    "Hyrule",
    "Sync",
    "progress.sav",
    "TotK Unexplored",
    "—",
    "+",
    "−",
    "⛶",
    "×",
    "↻",
    "45%",
    "0%",
    "Neimex23",
    "MIT · Copyright © 2026 Neimex23 and HyruleSync contributors",
    "TotK Unexplored · lud99 (BigBear)",
    "Leaflet",
    "Savegame Editors · Marc Robledo",
    "ZeldaMods · objmap-totk",
    "ZeldaMods · radar-totk",
    "Zelda Dungeon",
    "Español",
    "English",
    "C:\\Games\\Zelda TOTK\\profile\\save\\…",
    "C:\\…\\slot_00\\progress.sav",
  ]);
  const files = fs
    .readdirSync("web/src", { recursive: true })
    .filter((name) => /\.(js|jsx)$/.test(name));
  for (const name of files) {
    const source = fs.readFileSync(path.join("web/src", name), "utf8");
    for (const match of source.matchAll(/\bt\(\s*("(?:[^"\\]|\\.)*")/g)) {
      const raw = JSON.parse(match[1]),
        key = raw.trim();
      expect(
        unchanged.has(key) ||
          Object.hasOwn(I18N.translations, raw) ||
          Object.hasOwn(I18N.translations, key),
        `${name}: ${key}`,
      ).toBe(true);
    }
  }
  expect(
    I18N.translations[
      "Desarrollado por Neimex23 con amplia asistencia de Codex · GPT-6.1 · razonamiento Alto."
    ],
  ).toContain("High reasoning");
  expect(credits.contributors).not.toContain("Jhon Deved");
  expect(credits.upstreamContributors).toContainEqual({
    project: "TotK Unexplored",
    name: "Jhon Deved",
  });
});
it("translates static React text and accessible labels on initial rendering", () => {
  I18N.setLanguage("en");
  const html = renderToStaticMarkup(
    <>
      <Sidebar />
      <Workspace store={createViewStore()} />
      <Dialogs />
    </>,
  );
  expect(html).toContain('aria-label="Search the map"');
  expect(html).toContain("completed out of");
  expect(html).not.toContain("completados de");
  expect(html).toContain("View Leaflet license");
});
