import { afterEach, expect, it, vi } from "vitest";
import { I18N } from "../../web/src/shared/i18n.js";
import { createUpdateController } from "../../web/src/features/settings/updates.js";

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
});
it("shows release downloads inside About and treats release notes as plain text", async () => {
  vi.useFakeTimers();
  I18N.setLanguage("es");
  for (const id of [
    "checkUpdates",
    "viewChanges",
    "aboutChanges",
    "aboutVersion",
    "updateNotice",
    "updateMessage",
    "downloadUpdate",
    "aboutDownloadUpdate",
    "aboutUpdateInstructions",
    "updateStatus",
    "changesVersion",
    "changesText",
    "changesLink",
    "changesDialog",
  ]) {
    const node = document.createElement(
      id.toLowerCase().includes("download") ? "a" : "div",
    );
    node.id = id;
    document.body.append(node);
  }
  const $ = (id) => document.getElementById(id);
  $("changesDialog").showModal = vi.fn();
  let update = {
    currentVersion: "0.4.0",
    latestVersion: "0.5.0",
    available: true,
    releaseUrl: "https://github.com/neimex23/HyruleSync/releases/tag/v0.5.0",
    releaseNotes: "## Changes\n<script>bad()</script>",
    downloadUrl:
      "https://github.com/neimex23/HyruleSync/releases/download/v0.5.0/HyruleSync-v0.5.0-windows.zip",
  };
  const fetch = vi.fn(async () => ({ ok: true, json: async () => update }));
  const controller = createUpdateController({
    $,
    t: (key, values) => I18N.t(key, values),
    fetch,
    setTimeout,
    clearTimeout,
  });
  await controller.checkUpdates();
  expect($("updateNotice").hidden).toBe(false);
  expect($("aboutDownloadUpdate").href).toBe(update.downloadUrl);
  controller.showChanges();
  expect($("changesText").textContent).toBe(update.releaseNotes);
  expect($("changesText").querySelector("script")).toBeNull();
  update = { ...update, releaseNotes: null };
  await controller.checkUpdates();
  controller.showChanges();
  expect($("changesText").textContent).toBe(
    "Esta versión no tiene notas de cambios.",
  );
  update = {
    currentVersion: "0.4.0",
    latestVersion: "0.4.0",
    available: false,
  };
  await controller.checkUpdates();
  expect($("downloadUpdate").getAttribute("href")).toBeNull();
  expect($("aboutDownloadUpdate").hidden).toBe(true);
  expect($("aboutUpdateInstructions").hidden).toBe(true);
  fetch.mockRejectedValue(new Error("Disconnected"));
  await controller.checkUpdates();
  expect($("checkUpdates").disabled).toBe(false);
});
