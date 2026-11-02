import { FolderDialog } from "../../features/saves/FolderDialog.jsx";
import { FileDialog } from "../../features/saves/FileDialog.jsx";
import { SetupScreen } from "../../features/setup/SetupScreen.jsx";
import { AboutDialog } from "../../features/settings/AboutDialog.jsx";
import { LicenseDialog } from "../../features/settings/LicenseDialog.jsx";
import { ChangesDialog } from "../../features/settings/ChangesDialog.jsx";
import { SavesDialog } from "../../features/saves/SavesDialog.jsx";

export function Dialogs() {
  return (
    <>
      <FolderDialog />

      <FileDialog />

      <SetupScreen />

      <AboutDialog />

      <LicenseDialog />

      <ChangesDialog />

      <SavesDialog />
    </>
  );
}
