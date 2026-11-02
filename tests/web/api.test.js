import { afterEach, expect, it, vi } from "vitest";
import { request } from "../../web/src/shared/api.js";
afterEach(() => vi.unstubAllGlobals());
it("reports HTTP and application errors instead of treating a rejected command as success", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: false, error: "Rejected" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        }),
    ),
  );
  await expect(
    request("api/download-hd-map", { method: "POST", body: "" }),
  ).rejects.toThrow("Rejected");
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: false, error: "Busy" }), {
          headers: { "content-type": "application/json" },
        }),
    ),
  );
  await expect(request("api/refresh")).rejects.toThrow("Busy");
});
