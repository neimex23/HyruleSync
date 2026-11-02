export function createUpdateController({
  $,
  t,
  fetch,
  setTimeout,
  clearTimeout,
}) {
  let checkingUpdates = false,
    updateTimer,
    latestUpdate = null;

  async function checkUpdates(manual = false) {
    if (checkingUpdates) return;
    checkingUpdates = true;
    clearTimeout(updateTimer);
    $("checkUpdates").disabled = true;

    try {
      if (manual) {
        const response = await fetch("api/check-updates", {
          method: "POST",
          body: "",
        });

        if (!response.ok) throw Error();
      }

      const response = await fetch("api/updates", { cache: "no-store" });

      if (!response.ok) throw Error();

      const state = await response.json();
      latestUpdate = state;
      $("viewChanges").disabled = !state.releaseUrl;
      $("aboutChanges").disabled = !state.releaseUrl;
      $("aboutVersion").textContent = "HyruleSync " + state.currentVersion;
      $("updateNotice").hidden = !state.available;
      $("updateMessage").textContent = state.available
        ? t("Nueva versión disponible: v{version}", {
            version: state.latestVersion,
          })
        : "";
      // The server accepts only this repository's exact Windows release asset.
      const canDownload = Boolean(state.available && state.downloadUrl);

      for (const id of ["downloadUpdate", "aboutDownloadUpdate"]) {
        const download = $(id);
        download.hidden = !canDownload;
        download.removeAttribute("href");
        if (canDownload) download.href = state.downloadUrl;
      }
      $("aboutUpdateInstructions").hidden = !canDownload;
      $("updateStatus").textContent = state.busy
        ? t("Buscando actualizaciones…")
        : state.error ||
          (state.available
            ? t("Nueva versión disponible: v{version}", {
                version: state.latestVersion,
              })
            : state.latestVersion
              ? t("Tienes la última versión.")
              : t("Todavía no hay versiones publicadas."));
      updateTimer = setTimeout(() => checkUpdates(), state.busy ? 1000 : 60000);
    } catch {
      $("updateStatus").textContent = t(
        "No se pudieron buscar actualizaciones. Puedes reintentar.",
      );
      updateTimer = setTimeout(() => checkUpdates(), 60000);
    } finally {
      checkingUpdates = false;
      $("checkUpdates").disabled = false;
    }
  }

  function showChanges() {
    if (!latestUpdate?.releaseUrl) return;
    $("changesVersion").textContent =
      "HyruleSync v" + latestUpdate.latestVersion;
    $("changesText").textContent =
      latestUpdate.releaseNotes?.trim() ||
      t("Esta versión no tiene notas de cambios.");
    $("changesLink").href = latestUpdate.releaseUrl;
    $("changesDialog").showModal();
  }

  return { checkUpdates, showChanges };
}
