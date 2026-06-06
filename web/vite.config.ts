import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          wagmi: ["wagmi", "viem", "@rainbow-me/rainbowkit"],
        },
      },
    },
  },
});
