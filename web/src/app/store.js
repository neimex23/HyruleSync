// Each mounted app gets its own store, so async work cannot update a replacement UI.
export function createViewStore() {
  let state = { view: "map", inventory: {}, quests: {} };
  const listeners = new Set();

  return {
    actions: {},
    getSnapshot: () => state,

    subscribe(listener) {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },

    update(patch) {
      if (Object.keys(patch).every((key) => Object.is(state[key], patch[key])))
        return;
      state = { ...state, ...patch };
      for (const listener of listeners) listener();
    },
  };
}
