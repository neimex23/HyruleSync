import { useSyncExternalStore } from "react";

// A stable slice keeps unrelated controller updates from rerendering a panel.
export function useStoreValue(store, key) {
  const getSnapshot = () => store.getSnapshot()[key];

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
