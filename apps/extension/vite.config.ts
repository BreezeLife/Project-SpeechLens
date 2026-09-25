import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const extensionRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: extensionRoot,
  publicDir: resolve(extensionRoot, "public"),
  build: {
    outDir: resolve(extensionRoot, "../../dist-extension"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(extensionRoot, "index.html"),
        offscreen: resolve(extensionRoot, "offscreen.html"),
        background: resolve(extensionRoot, "src/background.ts"),
      },
      output: { entryFileNames: "[name].js", chunkFileNames: "assets/[name]-[hash].js" },
    },
  },
});
