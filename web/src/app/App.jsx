import { useEffect } from "react";

import { Sidebar } from "./components/Sidebar.jsx";
import { Workspace } from "./components/Workspace.jsx";
import { Dialogs } from "./components/Dialogs.jsx";
import { createAppController } from "./controller.js";

export function App({ store, config }) {
  useEffect(() => createAppController(store, config), [store, config]);

  return (
    <>
      <Sidebar />

      <Workspace store={store} />

      <Dialogs />
    </>
  );
}
