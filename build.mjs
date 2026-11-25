// Build estático: bundle (esbuild) + cópia de dados, PDFs, capas, fontes e arquivos do pdf.js para dist/.
import { build } from "esbuild";
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const out = "dist";
rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/assets`, { recursive: true });

const res = await build({
  entryPoints: { app: "src/main.tsx" },
  bundle: true,
  splitting: true,
  format: "esm",
  outdir: `${out}/assets`,
  entryNames: "[name]-[hash]",
  chunkNames: "chunks/[name]-[hash]",
  target: ["es2022", "chrome110", "firefox115", "safari16"],
  minify: true,
  sourcemap: true,
  metafile: true,
  jsx: "automatic",
  loader: { ".woff": "file", ".woff2": "file" },
  assetNames: "fonts/[name]-[hash]",
  logLevel: "info",
});

const files = Object.keys(res.metafile.outputs).map((f) => f.replace(/\\/g, "/"));
const js = files.find((f) => /assets\/app-.*\.js$/.test(f)).replace(`${out}/`, "");
const css = files.find((f) => /assets\/app-.*\.css$/.test(f)).replace(`${out}/`, "");
let html = readFileSync("public/index.html", "utf8");
html = html.replace("%CSS%", css).replace("%JS%", js);
writeFileSync(`${out}/index.html`, html);

// Conteúdo estático
for (const d of ["pdfs", "covers"]) if (existsSync(`public/${d}`)) cpSync(`public/${d}`, `${out}/${d}`, { recursive: true });
cpSync("public/fonts/Fraunces-OFL.txt", `${out}/fonts/Fraunces-OFL.txt`, { recursive: true });
cpSync("public/fonts/DMSans-OFL.txt", `${out}/fonts/DMSans-OFL.txt`, { recursive: true });
cpSync("data", `${out}/data`, { recursive: true });
cpSync("public/brand", `${out}/brand`, { recursive: true });
writeFileSync(`${out}/.nojekyll`, ""); // GitHub Pages: servir arquivos como estão

// pdf.js (leitor): worker, wasm, cmaps, fontes padrão
const pdfjsDir = path.dirname(path.dirname(require.resolve("pdfjs-dist/package.json")));
const pj = path.join(path.dirname(require.resolve("pdfjs-dist/package.json")));
mkdirSync(`${out}/pdfjs`, { recursive: true });
cpSync(`${pj}/build/pdf.worker.min.mjs`, `${out}/pdfjs/pdf.worker.min.mjs`);
for (const d of ["wasm", "cmaps", "standard_fonts", "iccs"]) cpSync(`${pj}/${d}`, `${out}/pdfjs/${d}`, { recursive: true });
void pdfjsDir;
console.log("dist/ pronto.");
