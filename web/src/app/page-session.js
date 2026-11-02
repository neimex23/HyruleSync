// Keep one connection per mounted app, including browser back/forward restores.
export function trackPageLifetime({ listen, onDispose }) {
  const pageId = crypto.randomUUID().replace(/-/g, "");
  let connection;
  const connect = () => {
    if (!connection || connection.readyState === EventSource.CLOSED)
      connection = new EventSource("api/page-session?id=" + pageId);
  };
  onDispose(() => connection?.close());
  connect();
  listen(window, "pageshow", connect);
  listen(window, "pagehide", () => {
    connection?.close();
    if (!navigator.sendBeacon("api/page-close", pageId))
      globalThis
        .fetch("api/page-close", {
          method: "POST",
          body: pageId,
          keepalive: true,
        })
        .catch(() => {});
  });
}
