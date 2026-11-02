import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { createViewStore } from "../../web/src/app/store.js";
import { useStoreValue } from "../../web/src/app/use-store.js";

afterEach(cleanup);

it("updates only subscribers whose state slice changed", () => {
  const store = createViewStore();
  const renders = vi.fn();
  const { result } = renderHook(() => {
    renders();
    return useStoreValue(store, "inventory");
  });
  const initial = result.current;
  act(() => store.update({ quests: { loading: true } }));
  expect(result.current).toBe(initial);
  expect(renders).toHaveBeenCalledOnce();
  const inventory = { loading: true };
  act(() => store.update({ inventory }));
  expect(result.current).toBe(inventory);
  expect(renders).toHaveBeenCalledTimes(2);
});

it("skips unchanged patches and removes disposed subscriptions", () => {
  const store = createViewStore();
  const listener = vi.fn();
  const unsubscribe = store.subscribe(listener);
  const initial = store.getSnapshot();
  store.update({ view: "map" });
  expect(store.getSnapshot()).toBe(initial);
  expect(listener).not.toHaveBeenCalled();
  store.update({ view: "quests" });
  expect(listener).toHaveBeenCalledOnce();
  unsubscribe();
  store.update({ view: "inventory" });
  expect(listener).toHaveBeenCalledOnce();
});
