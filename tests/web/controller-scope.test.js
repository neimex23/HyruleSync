import { afterEach, expect, it, vi } from "vitest";
import { createControllerScope } from "../../web/src/app/controller-scope.js";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("aborts requests and prevents async follow-up requests after disposal", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("ok")),
  );
  const scope = createControllerScope();
  await scope.fetch("catalog.json");
  const signal = fetch.mock.calls[0][1].signal;
  expect(signal.aborted).toBe(false);
  scope.dispose();
  expect(signal.aborted).toBe(true);
  await expect(
    scope.request("api/upload", { method: "POST" }),
  ).rejects.toMatchObject({ name: "AbortError" });
  await expect(scope.fetch("quest-data.json")).rejects.toMatchObject({
    name: "AbortError",
  });
  expect(fetch).toHaveBeenCalledOnce();
});

it("removes browser events and scheduled work, even when disposed twice", () => {
  vi.useFakeTimers();
  const scope = createControllerScope();
  const work = vi.fn();
  const close = vi.fn();
  scope.listen(window, "pageshow", work);
  scope.setTimeout(work, 100);
  scope.setInterval(work, 100);
  scope.onDispose(close);
  scope.dispose();
  scope.dispose();
  window.dispatchEvent(new Event("pageshow"));
  vi.advanceTimersByTime(1000);
  expect(work).not.toHaveBeenCalled();
  expect(close).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});
