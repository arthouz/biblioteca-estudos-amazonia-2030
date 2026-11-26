// Build estático: bundle (esbuild) + cópia de dados, capas, fontes e marca para dist/.
import { build } from "esbuild";
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

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
for (const d of ["covers"]) if (existsSync(`public/${d}`)) cpSync(`public/${d}`, `${out}/${d}`, { recursive: true });
cpSync("public/fonts/Montserrat-OFL.txt", `${out}/fonts/Montserrat-OFL.txt`, { recursive: true });
cpSync("public/fonts/DMSans-OFL.txt", `${out}/fonts/DMSans-OFL.txt`, { recursive: true });
cpSync("data", `${out}/data`, { recursive: true });
cpSync("public/brand", `${out}/brand`, { recursive: true });
writeFileSync(`${out}/.nojekyll`, ""); // GitHub Pages: servir arquivos como estão

console.log("dist/ pronto.");
