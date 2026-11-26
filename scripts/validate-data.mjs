// Valida data/publications.json e data/taxonomy.json e confere se os arquivos referenciados existem.
import { readFileSync, existsSync } from "node:fs";
const pubs = JSON.parse(readFileSync("data/publications.json", "utf8")).publications;
const tax = JSON.parse(readFileSync("data/taxonomy.json", "utf8")).categories.map((c) => c.id);
const errors = [], warns = [];
const ids = new Set();
for (const p of pubs) {
  const w = (m) => errors.push(`${p.id ?? "(sem id)"}: ${m}`);
  if (!p.id || !/^[a-z0-9-]+$/.test(p.id)) w("id ausente ou inválido (use minúsculas, números e hífens)");
  if (ids.has(p.id)) w("id duplicado"); ids.add(p.id);
  if (!p.title) w("título ausente");
  if (!p.categories?.primary) w("categoria primária ausente");
  for (const c of [p.categories?.primary, ...(p.categories?.secondary ?? [])]) if (c && !tax.includes(c)) w(`categoria '${c}' não existe em taxonomy.json`);
  if (!p.officialUrl) warns.push(`${p.id}: sem officialUrl (o botão "Ler estudo" não aparecerá)`);
  else if (!/^https:\/\/amazonia2030\.org\.br\//.test(p.officialUrl)) w("officialUrl deve apontar para https://amazonia2030.org.br/");
  if (p.cover) for (const k of ["large", "thumb"]) if (!existsSync(`public/${p.cover[k]}`)) w(`capa ausente: public/${p.cover[k]}`);
  if (!p.cover) warns.push(`${p.id}: sem capa (a interface usará a capa tipográfica)`);
  if (p.year && !p.yearBasis) warns.push(`${p.id}: ano sem 'yearBasis' (impresso | fonte-secundaria | inferido)`);
}
console.log(`${pubs.length} publicações verificadas.`);
warns.forEach((m) => console.log("aviso:", m));
errors.forEach((m) => console.error("ERRO:", m));
process.exit(errors.length ? 1 : 0);
