import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    rollupOptions: {
      // Each legal page is its own HTML file so it works as /terms/ on botnames.dev and on IPFS gateways
      input: {
        main: resolve(__dirname, "index.html"),
        terms: resolve(__dirname, "terms/index.html"),
        privacy: resolve(__dirname, "privacy/index.html"),
        disclaimer: resolve(__dirname, "disclaimer/index.html"),
      },
      output: {
        // By package path, so shared helpers (react/jsx-runtime, scheduler) never land in the wallet
        // chunk: the legal pages load only react, the homepage adds the wallet libraries.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react";
          if (/node_modules\/(wagmi|@wagmi|viem|@reown)\//.test(id)) return "wagmi";
        },
      },
    },
  },
});
