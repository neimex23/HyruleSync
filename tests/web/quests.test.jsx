import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import data from "../../web/public/quest-data.json";
import { I18N } from "../../web/src/shared/i18n.js";
import {
  filterQuests,
  prepareQuests,
  questGuideLink,
} from "../../web/src/features/quests/model.js";
import { QuestDetails } from "../../web/src/features/quests/QuestCard.jsx";
import { QuestsPanel } from "../../web/src/features/quests/QuestsPanel.jsx";
import { createViewStore } from "../../web/src/app/store.js";
afterEach(cleanup);

it("retains 253 unique quest definitions, valid enums, hashes and coordinates", () => {
  expect(data.quests).toHaveLength(253);
  expect(new Set(data.quests.map((q) => q.id)).size).toBe(253);
  expect(
    data.quests.reduce(
      (counts, q) => ((counts[q.type] = (counts[q.type] || 0) + 1), counts),
      {},
    ),
  ).toEqual({ main: 23, adventure: 60, shrine: 31, side: 139 });
  for (const q of data.quests) {
    expect(q.nameEs, q.id).toBeTruthy();
    expect(q.giverEs, q.id).toBeTruthy();
    expect(q.locationEs, q.id).toBeTruthy();
    expect(q.steps).toContain("Complete");
    expect(q.steps).toContain("NotReady");
    expect(Number.isInteger(q.hash) && q.hash > 0).toBe(true);
    if (q.position)
      expect(Object.values(q.position).every(Number.isFinite)).toBe(true);
    expect(new URL(questGuideLink(q)).hostname).toBe("www.zeldadungeon.net");
  }
  expect(data.quests.find((q) => q.id === "MainChallenge").hash).toBe(
    0x3ee80d28,
  );
  expect(
    questGuideLink(data.quests.find((q) => q.id === "MainChallenge")),
  ).toBe("https://www.zeldadungeon.net/wiki/Find_Princess_Zelda");
  expect(
    questGuideLink(
      data.quests.find((q) => q.id === "GerudoCanyon_GleeokLiver"),
    ),
  ).toBe("https://www.zeldadungeon.net/wiki/Gleeok_Guts_(Side_Quest)");
  expect(questGuideLink({ name: "Presenting: Sensor +!" })).toContain(
    "Presenting%3A_Sensor_%2B!",
  );
});
it("localizes all quest metadata and keeps English guide targets in both languages", () => {
  const original = structuredClone(data.quests);
  const spanish = prepareQuests(data.quests, "es");
  const english = prepareQuests(data.quests, "en");
  expect(spanish[0]).toMatchObject({
    name: "Derrota a Ganondorf",
    giver: "Prunia",
    location: "Fuerte vigía",
  });
  expect(english[0]).toMatchObject({
    name: "Destroy Ganondorf",
    giver: "Purah",
    location: "Lookout Landing",
  });
  for (let i = 0; i < data.quests.length; i++) {
    expect(questGuideLink(spanish[i])).toBe(questGuideLink(original[i]));
    expect(questGuideLink(english[i])).toBe(questGuideLink(original[i]));
  }
  expect(data.quests).toEqual(original);
});
it("finds names, characters and locations in either language regardless of display language", () => {
  for (const language of ["es", "en"]) {
    const quests = prepareQuests(data.quests, language);
    for (const query of [
      "derrota a ganondorf",
      "destroy ganondorf",
      "PRUNIA",
      "Purah",
      "FUERTE VIGIA",
      "Lookout Landing",
      "DefeatGanondorf",
    ])
      expect(
        filterQuests(quests, new Map(), query).map((q) => q.id),
        `${language}: ${query}`,
      ).toContain("DefeatGanondorf");
  }
});
it("falls back to original metadata when a translation is unavailable", () => {
  const [quest] = prepareQuests(
    [
      {
        id: "future",
        name: "New quest",
        giver: "Link",
        location: "-",
        type: "main",
      },
    ],
    "es",
  );
  expect(quest).toMatchObject({
    name: "New quest",
    giver: "Link",
    location: "-",
  });
  expect(quest.searchText).not.toMatch(/undefined|null/);
});
it.each(["es", "en"])(
  "renders localized quest cards in %s with working guide links",
  (language) => {
    I18N.setLanguage(language);
    const store = createViewStore();
    const quests = prepareQuests(data.quests, language).slice(0, 1);
    store.update({ view: "quests", quests: { data: quests } });
    const { container } = render(<QuestsPanel store={store} />);
    const card = container.querySelector(".quest-card");
    expect(card.querySelector("h2").textContent).toBe(quests[0].name);
    expect(card.textContent).toContain(
      quests[0].location + " · " + quests[0].giver,
    );
    expect(card.querySelector(".quest-guide").href).toBe(
      "https://www.zeldadungeon.net/wiki/Destroy_Ganondorf",
    );
    expect(container.querySelector(".quest-note").textContent).toContain(
      language === "es" ? "español o inglés" : "Spanish or English",
    );
  },
);
it("renders saved stages and hexadecimal zero values", () => {
  I18N.setLanguage("es");
  const { container } = render(
    <QuestDetails
      quest={data.quests[0]}
      progress={{ step: "GoToDeepHole", raw: 0 }}
      snapshot={{ revision: "abc" }}
    />,
  );
  expect(container.textContent).toContain("Step_DefeatGanondorf");
  expect(container.textContent).toContain("GoToDeepHole");
  expect(container.textContent).toContain("0x00000000");
  expect(container.textContent).toContain("abc");
});
it("filters quest names and save states, escapes text and delegates visibility actions", () => {
  I18N.setLanguage("es");
  const store = createViewStore();
  const quests = data.quests.slice(0, 4).map((q, i) => ({
    ...q,
    name: i === 0 ? "<script>" : "Misión " + i,
    searchText: i === 0 ? "arbol" : "mision " + i,
    position: { x: 0, y: 0, z: 0 },
  }));
  store.update({
    quests: {
      data: quests,
      snapshot: {
        file: "test.sav",
        savedAt: "2026-11-01T12:00:00Z",
        quests: quests.map((q, i) => ({
          id: q.id,
          state: ["done", "active", "todo", "unknown"][i],
        })),
      },
      hidden: [quests[0].id],
    },
  });
  store.actions.setQuestVisible = vi.fn();
  store.actions.showQuestOnMap = vi.fn();
  const { container } = render(<QuestsPanel store={store} />);
  const list = () => container.querySelector("#questList");
  expect(list().querySelectorAll("article")).toHaveLength(4);
  expect(list().querySelector("script")).toBeNull();
  expect(list().innerHTML).toContain("&lt;script&gt;");
  const check = list().querySelector("input");
  expect(check.checked).toBe(false);
  fireEvent.click(check);
  expect(store.actions.setQuestVisible).toHaveBeenCalledWith(
    quests[0].id,
    true,
  );
  fireEvent.click(list().querySelector("button"));
  expect(store.actions.showQuestOnMap).toHaveBeenCalledWith(quests[0].id);
  for (const state of ["done", "active", "todo", "unknown"]) {
    fireEvent.change(container.querySelector("#questState"), {
      target: { value: state },
    });
    expect(list().querySelectorAll("article")).toHaveLength(1);
  }
  fireEvent.change(container.querySelector("#questState"), {
    target: { value: "" },
  });
  fireEvent.change(container.querySelector("#questSearch"), {
    target: { value: "ÁRBOL" },
  });
  expect(list().querySelectorAll("article")).toHaveLength(1);
  fireEvent.change(container.querySelector("#questSearch"), {
    target: { value: "missing" },
  });
  expect(list().textContent).toContain("No hay misiones");
});
