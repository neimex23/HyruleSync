import { request } from "../shared/api.js";

// Own every browser resource created by a controller so React can dispose it once.
export function createControllerScope() {
  const abort = new AbortController();
  const timeouts = new Set();
  const intervals = new Set();
  const cleanups = [];
  let disposed = false;

  function scopedRequest(send, url, options = {}) {
    if (disposed)
      return Promise.reject(new DOMException("Unmounted", "AbortError"));

    return send(url, { ...options, signal: abort.signal });
  }

  function clearTimeout(id) {
    globalThis.clearTimeout(id);
    timeouts.delete(id);
  }

  return {
    get disposed() {
      return disposed;
    },

    fetch: (url, options) =>
      scopedRequest((...args) => globalThis.fetch(...args), url, options),
    request: (url, options) => scopedRequest(request, url, options),

    setTimeout(callback, delay) {
      if (disposed) return null;

      const id = globalThis.setTimeout(() => {
        timeouts.delete(id);
        if (!disposed) callback();
      }, delay);
      timeouts.add(id);

      return id;
    },

    clearTimeout,

    setInterval(callback, delay) {
      if (disposed) return null;

      const id = globalThis.setInterval(() => {
        if (!disposed) callback();
      }, delay);
      intervals.add(id);

      return id;
    },

    listen(target, event, handler) {
      if (disposed) return;
      target.addEventListener(event, handler);
      cleanups.push(() => target.removeEventListener(event, handler));
    },

    onDispose(cleanup) {
      if (disposed) cleanup();
      else cleanups.push(cleanup);
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      abort.abort();
      for (const id of timeouts) globalThis.clearTimeout(id);
      for (const id of intervals) globalThis.clearInterval(id);
      for (const cleanup of cleanups) cleanup();
      timeouts.clear();
      intervals.clear();
      cleanups.length = 0;
    },
  };
}
