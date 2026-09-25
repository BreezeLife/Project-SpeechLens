import { build } from "esbuild";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist-web");
await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "assets"), { recursive: true });
await build({ entryPoints: [resolve(root, "src/main.tsx")], bundle: true, format: "esm", platform: "browser", outfile: resolve(output, "assets/app.js"), sourcemap: false, minify: true, define: { "process.env.NODE_ENV": '"production"' } });
const source = await readFile(resolve(root, "index.html"), "utf8");
const html = source.replace(/<script type="module" src="\/src\/main\.tsx"><\/script>/, '<link rel="stylesheet" href="/assets/app.css"><script type="module" src="/assets/app.js"></script>');
await writeFile(resolve(output, "index.html"), html);
console.log(`Built web app: ${output}`);
