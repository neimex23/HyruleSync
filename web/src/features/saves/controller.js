import { I18N } from "../../shared/i18n.js";
import { fmt, saveLabel, savedTime } from "../../shared/utils.js";

// File selection and historical inspection share the app's request lifetime.
export function createSaveController(context) {
  const { $, request, command, toast, locationText, onPreview } = context;
  const t = (key, values) => I18N.t(key, values);
  let savesLoading = false;

  function populateSources(id, sources, selected) {
    const select = $(id);
    select.replaceChildren(
      new Option(t("Ruta personalizada"), ""),
      ...sources.map((item) => new Option(item.name, item.path)),
    );
    select.value = selected || "";

    return select;
  }

  async function uploadSave(file) {
    try {
      if (!file) return;
      await command("upload", await file.arrayBuffer());
      if (context.disposed) return;
      $("fileDialog").close();
      toast(t("Guardado cargado en memoria · no se ha modificado el archivo"));
    } catch (e) {
      toast(e.message);
    } finally {
      if (!context.disposed) $("saveFile").value = "";
    }
  }

  async function chooseSave() {
    $("fileError").textContent = "";
    $("fileDialog").showModal();

    try {
      const data = await request("api/source-options");

      if (context.disposed) return;

      const select = populateSources(
        "knownSaves",
        data.saves,
        data.saves.at(-1)?.path,
      );
      $("filePath").value =
        (context.sourceMode === "file" ? context.source : "") || select.value;
    } catch {
      if (context.disposed) return;
      $("fileError").textContent = t(
        "Pega la ruta de progress.sav o usa Explorar archivos.",
      );
    }
  }

  async function browseFolders(path) {
    try {
      const data = await request(
        "api/folders?path=" + encodeURIComponent(path || ""),
      );

      if (context.disposed) return;
      $("folderBrowser").hidden = false;
      $("folderCurrent").textContent = data.path || t("Elige una unidad");
      $("folderUp").dataset.parent = data.parent;
      $("folderUp").disabled = !data.path;
      if (data.path) $("folderPath").value = data.path;
      $("folderEntries").replaceChildren();
      for (const item of data.folders) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "folder-entry";
        b.textContent = "▸ " + item.name;

        b.onclick = () => browseFolders(item.path);

        $("folderEntries").append(b);
      }
      if (!data.folders.length) {
        const empty = document.createElement("p");
        empty.textContent = t(
          "Sin subcarpetas visibles. Puedes seleccionar esta carpeta.",
        );
        $("folderEntries").append(empty);
      }
      $("folderError").textContent = "";
    } catch (e) {
      if (context.disposed) return;
      $("folderError").textContent = e.message;
    }
  }

  async function chooseFolder() {
    $("folderError").textContent = "";
    $("folderBrowser").hidden = true;
    $("folderDialog").showModal();

    try {
      const data = await request("api/source-options");

      if (context.disposed) return;
      populateSources("knownFolders", data.choices, data.choices[0]?.path);
      $("folderPath").value =
        (context.sourceMode === "folder" ? context.source : "") ||
        data.choices[0]?.path ||
        data.defaultPath ||
        "";
    } catch (e) {
      if (context.disposed) return;
      $("folderError").textContent = t(
        "Pega la ruta de tu carpeta de guardados.",
      );
    }
  }

  let inspectedSnapshot = null,
    inspectBusy = false;

  function showSaveSummary(summary) {
    $("inspectedInfo").textContent = t(
      "{file} · {h} h {m} min · formato {format}",
      {
        file: saveLabel(summary),
        h: Math.floor(summary.playtime / 3600),
        m: Math.floor((summary.playtime % 3600) / 60),
        format: summary.format,
      },
    );
    $("inspectedLocation").textContent =
      locationText(summary) + " · " + savedTime(summary);
    $("saveCounts").replaceChildren();
    for (const count of summary.counts) {
      const row = document.createElement("tr");

      for (const value of [
        context.categories[count.id].name,
        fmt(count.found) + " / " + fmt(count.total),
        fmt(count.unknown),
      ]) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }
      $("saveCounts").append(row);
    }
    $("inspectedDetails").hidden = false;
    $("viewInspected").disabled = !inspectedSnapshot;
  }

  async function inspectSave(path, file) {
    if (inspectBusy) return;
    inspectBusy = true;
    $("savesError").textContent = "";
    $("inspectPath").disabled = true;
    $("inspectUpload").disabled = true;
    $("viewInspected").disabled = true;

    try {
      const reply = await request(
        "api/" + (file ? "inspect-upload" : "inspect-file"),
        {
          method: "POST",
          body: file ? await file.arrayBuffer() : path,
        },
      );

      if (context.disposed) return;
      if (file) {
        reply.snapshot.file = file.name;
        reply.snapshot.savedAt = new Date(file.lastModified).toISOString();
        reply.summary.file = file.name;
        reply.summary.savedAt = reply.snapshot.savedAt;
      }
      inspectedSnapshot = reply.snapshot;
      showSaveSummary(reply.summary);
    } catch (e) {
      if (context.disposed) return;
      $("savesError").textContent = e.message;
    } finally {
      inspectBusy = false;
      if (!context.disposed) {
        $("inspectPath").disabled = false;
        $("inspectUpload").disabled = false;
        $("viewInspected").disabled = !inspectedSnapshot;
        $("inspectUpload").value = "";
      }
    }
  }

  async function loadSaveSlots() {
    if (savesLoading) return;
    savesLoading = true;
    $("reloadSlots").disabled = true;
    $("savesError").textContent = "";

    try {
      const data = await request("api/saves");

      if (context.disposed) return;
      $("saveSlots").replaceChildren();
      for (const slot of data.slots) {
        const card = document.createElement("article");
        card.className = "save-slot";
        const title = document.createElement("strong");
        title.textContent = saveLabel(slot);
        const info = document.createElement("p");
        info.textContent = slot.summary
          ? t("{h} h {m} min · {format} · {time}", {
              h: Math.floor(slot.summary.playtime / 3600),
              m: Math.floor((slot.summary.playtime % 3600) / 60),
              format: slot.summary.format,
              time: savedTime(slot.summary),
            })
          : "";
        const status = document.createElement("p");
        status.textContent =
          slot.status === "error"
            ? slot.error
            : slot.status === "reading"
              ? t("Leyendo guardado…")
              : locationText(slot.summary);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "secondary";
        button.textContent = t("Consultar");
        button.disabled = slot.status !== "ok";

        button.onclick = () => {
          if (!inspectBusy) inspectSave(slot.file);
        };

        card.append(title, info, status, button);
        $("saveSlots").append(card);
      }
      $("noSlots").hidden = !!data.slots.length;
    } catch (e) {
      if (context.disposed) return;
      $("savesError").textContent = e.message;
    } finally {
      savesLoading = false;
      if (!context.disposed) $("reloadSlots").disabled = false;
    }
  }

  function openSaves() {
    $("savesDialog").showModal();
    loadSaveSlots();
  }

  function viewInspected() {
    if (inspectedSnapshot) onPreview(inspectedSnapshot);
  }

  function initSaves() {
    // Fast Refresh preserves these DOM nodes, but inspection belongs to this instance.
    $("reloadSlots").disabled = false;
    $("inspectPath").disabled = false;
    $("inspectUpload").disabled = false;
    $("inspectUpload").value = "";
    $("inspectedDetails").hidden = true;
    $("viewInspected").disabled = true;
    $("savesError").textContent = "";
    $("openSaves").onclick = openSaves;
    $("reloadSlots").onclick = loadSaveSlots;
    $("viewInspected").onclick = viewInspected;

    $("inspectPath").onclick = () => inspectSave($("inspectFilePath").value);

    $("inspectUpload").onchange = () => {
      const file = $("inspectUpload").files[0];

      if (file) inspectSave(null, file);
    };

    $("openSave").onclick = $("welcomeLoad").onclick = chooseSave;

    $("saveFile").onchange = () => uploadSave($("saveFile").files[0]);

    $("openFolder").onclick = $("welcomeFolder").onclick = chooseFolder;

    $("browseFolder").onclick = () => browseFolders($("folderPath").value);

    $("folderUp").onclick = () =>
      browseFolders($("folderUp").dataset.parent || "");

    $("folderDrives").onclick = () => browseFolders("");

    $("knownSaves").onchange = () => {
      if ($("knownSaves").value) $("filePath").value = $("knownSaves").value;
    };

    $("fileDialog").querySelector("form").onsubmit = async (e) => {
      if (e.submitter?.value === "cancel") return;
      e.preventDefault();

      try {
        await command("set-file", $("filePath").value);
        if (!context.disposed) $("fileDialog").close();
      } catch (error) {
        if (!context.disposed) $("fileError").textContent = error.message;
      }
    };

    $("knownFolders").onchange = () => {
      if ($("knownFolders").value)
        $("folderPath").value = $("knownFolders").value;
    };

    $("folderDialog").querySelector("form").onsubmit = async (e) => {
      if (e.submitter?.value === "cancel") return;
      e.preventDefault();

      try {
        await command("set-folder", $("folderPath").value);
        if (!context.disposed) $("folderDialog").close();
      } catch (error) {
        if (!context.disposed) $("folderError").textContent = error.message;
      }
    };
  }

  return { initSaves, chooseFolder };
}
