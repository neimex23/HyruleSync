import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function developmentProxy() {
  if (!process.env.HYRULESYNC_URL) return undefined;
  const target = new URL(process.env.HYRULESYNC_URL);
  // Node uses Windows DNS; browsers resolve *.localhost themselves.
  target.hostname = "127.0.0.1";
  return Object.fromEntries(
    ["/api", "/catalog.json", "/assets", "/map-tiles", "/legal"].map(
      (prefix) => [
        prefix,
        {
          target: target.href,
          changeOrigin: true,
          rewrite: (path) => path.slice(1),
          configure(proxy) {
            proxy.on("proxyReq", (request) => {
              // The local server requires matching Host/Origin for mutations.
              if (request.getHeader("origin"))
                request.setHeader("origin", target.origin);
            });
          },
        },
      ],
    ),
  );
}

// The executable serves the UI below a different private session path each run.
export default defineConfig({
  root: "web",
  base: "./",
  plugins: [react()],
  publicDir: "public",
  build: {
    outDir: "../.local/build/web",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "app.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "bundled/[name]-[hash][extname]",
      },
    },
  },
  server: {
    // Set the full URL printed by HyruleSync --url-file, including its session path.
    proxy: developmentProxy(),
  },
  test: {
    root: ".",
    include: ["tests/web/**/*.test.{js,jsx}"],
    environment: "jsdom",
    restoreMocks: true,
  },
});
