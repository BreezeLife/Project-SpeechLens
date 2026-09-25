import { build } from "esbuild";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist-extension");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await Promise.all([
  build({ entryPoints: [resolve(root, "apps/extension/src/background.ts")], bundle: true, format: "esm", platform: "browser", outfile: resolve(output, "background.js"), sourcemap: false }),
  build({ entryPoints: [resolve(root, "apps/extension/src/offscreen.ts")], bundle: true, format: "esm", platform: "browser", outfile: resolve(output, "offscreen.js"), sourcemap: false }),
  build({ entryPoints: [resolve(root, "apps/extension/src/sidepanel.ts")], bundle: true, format: "esm", platform: "browser", outfile: resolve(output, "sidepanel.js"), sourcemap: false }),
  cp(resolve(root, "apps/extension/public/manifest.json"), resolve(output, "manifest.json")),
]);

await writeFile(resolve(output, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SpeechLens</title></head><body><main><header><strong>SpeechLens</strong><span id="status">Idle</span></header><div class="meter"><i id="level"></i></div><p id="interim" class="interim">Waiting for audio...</p><p id="score" class="score">Local score: --</p><ol id="transcript"></ol><footer><button id="pause">Pause</button><button id="stop">End session</button></footer></main><style>:root{color-scheme:dark;font:13px system-ui,sans-serif;background:#07111f;color:#e6f0f7}body{margin:0}main{padding:16px}header,footer{display:flex;align-items:center;justify-content:space-between;gap:8px}header{font-size:16px}#status{color:#67e8f9;font-size:11px;text-transform:uppercase}.meter{height:4px;margin:18px 0;background:#1b3044}.meter i{display:block;height:100%;width:0;background:#22d3ee;transition:width .1s}.interim{min-height:18px;color:#8fa6b8;font-style:italic}.score{color:#67e8f9;font-size:12px}ol{padding-left:20px;line-height:1.5}li{margin:10px 0}footer{position:fixed;right:16px;bottom:16px;left:16px}button{border:1px solid #34516a;border-radius:5px;background:#10263a;color:inherit;padding:8px 11px;cursor:pointer}button:last-child{color:#fda4af}</style><script type="module" src="./sidepanel.js"></script></body></html>`);
await writeFile(resolve(output, "offscreen.html"), `<!doctype html><html><head><meta charset="utf-8"><title>SpeechLens audio processor</title></head><body><script type="module" src="./offscreen.js"></script></body></html>`);
console.log(`Built extension: ${output}`);
