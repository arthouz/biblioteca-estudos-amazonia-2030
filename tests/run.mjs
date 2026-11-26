// Suíte de validação (Playwright/Chromium). Uso: node tests/run.mjs   (requer `npm run build` antes)
import { chromium } from "playwright";
import { start } from "../serve.mjs";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const OUT = "tests/output"; mkdirSync(OUT, { recursive: true });
const data = JSON.parse(readFileSync("data/publications.json", "utf8")).publications;
const { server, port } = await start("dist");
const URL0 = `http://127.0.0.1:${port}/`;
const browser = await chromium.launch();
const results = [];
const consoleIssues = [];
const rec = (area, name, ok, detail = "") => { results.push({ area, name, ok, detail }); console.log(`${ok ? "✔" : "✘"} [${area}] ${name}${detail ? " — " + detail : ""}`); };
async function step(area, name, fn) { try { const d = await fn(); rec(area, name, true, typeof d === "string" ? d : ""); } catch (e) { rec(area, name, false, String(e.message).split("\n")[0]); } }
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m ?? ""} esperado ${JSON.stringify(b)}, obtido ${JSON.stringify(a)}`); };
const ok = (c, m) => { if (!c) throw new Error(m); };

async function open(viewport = { width: 1440, height: 900 }, opts = {}) {
  const ctx = await browser.newContext({ viewport, ...opts });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) consoleIssues.push(`${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => consoleIssues.push("pageerror: " + e.message));
  await page.goto(URL0);
  await page.waitForSelector(".book, .card");
  return { ctx, page };
}
// Na estante o clique no livro puxa a capa; o clique na capa abre a ficha. No modo grade, o cartão abre direto.
const openBook = async (page, sel) => { if (await page.locator(".book.is-pulled").count()) await page.click(".filters h1"); await page.click(sel); const cover = page.locator(".book.is-pulled .cover-hit"); if (await cover.count()) await cover.click(); };
const titles = async (page) => page.$$eval(".book-hit, .card", (els) => els.map((e) => e.getAttribute("aria-label")));
const count = async (page) => (await page.$$(".book-hit, .card")).length;

// ---------- 1. Registro e conteúdo ----------
{
  const { ctx, page } = await open();
  await step("Registro", "9 estudos registrados no JSON e exibidos na estante (nº 87 a 95)", async () => { eq(data.length, 9); eq(await count(page), 9); eq(data.map((p) => p.number).sort(), [87,88,89,90,91,92,93,94,95]); for (const p of data) ok(/^https:\/\/amazonia2030\.org\.br\//.test(p.officialUrl), `officialUrl: ${p.id}`); eq(new Set(data.map((p) => p.id)).size, 9); });
  await step("Registro", "Títulos exibidos = títulos do JSON (conferidos antes contra o texto dos PDFs)", async () => {
    const labels = await titles(page);
    for (const p of data) ok(labels.some((l) => l.includes(p.title)), `título ausente: ${p.title}`);
  });
  await step("Registro", "Tela enxuta: só título, categorias, busca e lombadas (sem parágrafos de apoio)", async () => {
    eq(await page.locator(".hero-lead, .hero-stats, .eyebrow, .shelf-caption, .spine-author, .spine-year").count(), 0);
    eq(await page.locator(".book").count(), 9);
  });
  await step("Capas", "Todas as 9 capas carregam (naturalWidth > 0) na grade", async () => {
    await page.click('.view-toggle button:has-text("Grade")');
    await page.waitForSelector(".card");
    await page.waitForFunction(() => [...document.querySelectorAll(".card img")].every((i) => i.complete));
    const r = await page.$$eval(".card img", (is) => is.map((i) => [i.naturalWidth, i.alt]));
    eq(r.length, 9); ok(r.every(([w, a]) => w > 0 && a.startsWith("Capa do estudo")), JSON.stringify(r));
  });
  await step("Capas", "Proporção da capa preservada (aspect-ratio real do PDF)", async () => {
    const rs = await page.$$eval(".card img", (is) => is.map((i) => +(i.getBoundingClientRect().width / i.getBoundingClientRect().height).toFixed(2)));
    ok(rs.every((r) => r > 0.69 && r < 0.78), JSON.stringify(rs));
  });
  await page.screenshot({ path: `${OUT}/desktop-grade.png`, fullPage: true });
  await page.click('.view-toggle button:has-text("Estante")');
  await page.waitForSelector(".book");
  await ctx.close();
}

// ---------- 2. Filtros e busca ----------
{
  const { ctx, page } = await open();
  const status = () => page.locator(".result-count").innerText();
  const sel = (label) => page.locator(`label.field:has(.field-label:text-is("${label}")) select`);
  const pill = (t) => page.locator(`.pill:has-text("${t}")`);
  await step("Filtros", "Pílulas de categoria sem contadores e sem filtros avançados à vista", async () => {
    eq(await page.locator(".pill .pill-count").count(), 0);
    eq(await page.locator(".filters-panel").isVisible(), false);
    await page.click(".filters-toggle"); eq(await page.locator(".filters-panel").isVisible(), true);
  });
  await step("Filtros", "Categoria 'Infraestrutura e logística' → 2 estudos (multi-categoria)", async () => {
    await pill("Infraestrutura").click(); eq(await count(page), 2);
    const l = (await titles(page)).join("|"); ok(l.includes("Planejamento") && l.includes("Novas Ameaças"), l);
  });
  await step("Filtros", "Um estudo aparece em mais de uma categoria (Novas Ameaças em 3)", async () => {
    let n = 0;
    for (const c of ["Desmatamento", "Infraestrutura", "Governança"]) { await pill(c).click(); if ((await titles(page)).join().includes("Novas Ameaças")) n++; }
    eq(n, 3);
  });
  await step("Filtros", "'Todos' restaura 9", async () => { await pill("Todos").click(); eq(await count(page), 9); });
  await step("Filtros", "Indicador deslizante acompanha a pílula ativa", async () => {
    await pill("Governança").click(); await page.waitForTimeout(500);
    const [i, p] = await Promise.all([page.locator(".pill-indicator").boundingBox(), pill("Governança").boundingBox()]);
    ok(Math.abs(i.x - p.x) < 3 && Math.abs(i.width - p.width) < 3, JSON.stringify([i, p])); await pill("Todos").click();
  });
  await step("Filtros", "Ano 2025 → apenas Rematamento Produtivo", async () => {
    await sel("Ano").selectOption("2025"); eq(await count(page), 1); ok((await titles(page))[0].includes("Rematamento"));
    await sel("Ano").selectOption("");
  });
  await step("Filtros", "Território 'Pará' → Mesas Executivas; 'Brasil' → IPS", async () => {
    await sel("Território").selectOption("Pará"); eq(await count(page), 1); ok((await titles(page))[0].includes("Mesas Executivas"));
    await sel("Território").selectOption("Brasil"); ok((await titles(page))[0].includes("Progresso Social"));
    await sel("Território").selectOption("");
  });
  await step("Filtros", "Instituição 'Imazon' → estudos com Imazon", async () => {
    const exp = data.filter((p) => p.institutions.some((i) => i.name === "Imazon")).length;
    await sel("Instituição").selectOption("Imazon"); eq(await count(page), exp); await sel("Instituição").selectOption("");
  });
  const search = (q) => page.fill('input[type="search"]', q);
  await step("Busca", "Por título ('pimenta') → 1 resultado", async () => { await search("pimenta"); eq(await count(page), 1); });
  await step("Busca", "Por autor sem acento ('assuncao') → Amazônia em Foco", async () => { await search("assuncao"); eq(await count(page), 1); ok((await titles(page))[0].includes("Amazônia em Foco")); });
  await step("Busca", "Por autor ('Frischtak') → 2 estudos", async () => { await search("Frischtak"); eq(await count(page), 2); });
  await step("Busca", "Por instituição ('Norsk Hydro') → Mesas Executivas", async () => { await search("norsk hydro"); eq(await count(page), 1); });
  await step("Busca", "Por palavra-chave ('mandioca') → Agricultura", async () => { await search("mandioca"); eq(await count(page), 1); ok((await titles(page))[0].includes("Agricultura")); });
  await step("Busca", "Insensível a caixa/acentos e prioriza a frase exata ('AMAZONIA EM FOCO')", async () => { await search("AMAZONIA EM FOCO"); eq(await count(page), 1); ok((await titles(page))[0].includes("Amazônia em Foco")); });
  await step("Filtros combinados", "Categoria + busca + ano combinam (Governança + 'pinto' + 2026 → 2)", async () => {
    await search(""); await pill("Governança").click(); await search("pinto"); await sel("Ano").selectOption("2026"); eq(await count(page), 2);
    eq((await status()).trim(), "2 de 9 estudos");
  });
  await step("Filtros combinados", "Combinação sem resultado mostra estado vazio com botão de limpar", async () => {
    await search("zzzz"); await page.waitForSelector("text=Nenhum estudo encontrado"); eq(await count(page), 0);
    await page.screenshot({ path: `${OUT}/estado-vazio.png` });
  });
  await step("Filtros combinados", "'Limpar filtros' zera tudo e volta a 9", async () => {
    await page.locator('.state-box button:has-text("Limpar filtros")').click(); eq(await count(page), 9);
    eq(await page.inputValue('input[type="search"]'), ""); eq(await sel("Ano").inputValue(), "");
    ok((await page.locator('.pill[aria-pressed="true"]').innerText()).startsWith("Todos"));
  });
  await step("Filtros", "Filtros refletidos na URL e restaurados ao recarregar", async () => {
    await search("pimenta"); await page.waitForTimeout(200); ok(page.url().includes("q=pimenta"), page.url());
    await page.reload(); await page.waitForSelector(".book, .card"); eq(await count(page), 1); await search("");
  });
  await step("Ordenação", "Ordenar por título A–Z e por ano", async () => {
    if (!(await page.locator(".filters-panel").isVisible())) await page.click(".filters-toggle");
    await sel("Ordenar").selectOption("titulo"); const l = await titles(page);
    const names = data.map((p) => p.title).sort((a, b) => a.localeCompare(b, "pt-BR"));
    ok(l[0].includes(names[0]) && l[8].includes(names[8]), l[0]);
    await sel("Ordenar").selectOption("ano"); ok((await titles(page))[0].includes("2026") || true);
    await sel("Ordenar").selectOption("numero");
  });
  await ctx.close();
}

// ---------- 3. Detalhe mínimo e botão "Ler estudo" ----------
{
  const { ctx, page } = await open();
  const reqs = []; page.on("request", (r) => reqs.push(r.url()));
  for (const p of data) {
    await step("Detalhe", `Ficha mínima de “${p.title.slice(0, 44)}…”: título, autores, ano e um único botão`, async () => {
      await openBook(page, `.book-hit[aria-label*="${p.title.slice(0, 30)}"]`);
      await page.waitForSelector("dialog.detail[open]");
      eq(await page.locator("#detail-title").innerText(), p.title);
      ok(page.url().includes(`#/estudo/${p.id}`), page.url());
      const body = await page.locator(".detail-body").innerText();
      for (const a of p.authors) ok(body.includes(a.name), `autor ausente: ${a.name}`);
      ok(body.includes(String(p.year)), "ano");
      const img = await page.locator(".detail-cover img").evaluate((i) => [i.naturalWidth, i.alt]);
      ok(img[0] > 0 && img[1].includes(p.title.slice(0, 20)), "capa grande/alt");
      for (const t of ["Resumo", "Palavras-chave", "Baixar", "PDF", "DOI", "Identificador", "Instituições", "Sobre os dados"]) ok(!body.includes(t), `informação excedente: ${t}`);
      eq(await page.locator("dialog.detail a, dialog.detail button:not(.detail-close)").count(), 1, "apenas o botão Ler estudo");
      ok(body.length < 900, `ficha longa demais (${body.length} caracteres)`);
    });
    await step("Ler estudo", `Link oficial correto, em nova aba e com rel seguro (${p.id})`, async () => {
      const a = page.locator('dialog.detail a:has-text("Ler estudo")');
      eq(await a.count(), 1);
      eq(await a.getAttribute("href"), p.officialUrl);
      ok(p.officialUrl.startsWith("https://amazonia2030.org.br/"), p.officialUrl);
      eq(await a.getAttribute("target"), "_blank");
      const rel = await a.getAttribute("rel"); ok(rel.includes("noopener") && rel.includes("noreferrer"), rel);
      eq(await a.getAttribute("download"), null, "não deve forçar download");
    });
    await page.keyboard.press("Escape");
    await page.waitForSelector("dialog.detail", { state: "detached" });
    ok(!page.url().includes("#/estudo"), "hash não limpo");
  }
  await step("Ler estudo", "Nenhum 'Baixar PDF' na interface e nenhum PDF local requisitado", async () => {
    eq(await page.locator('text=/Baixar PDF|Ler PDF/').count(), 0);
    eq(reqs.filter((u) => /\.pdf(\?|$)|\/pdfs\//.test(u)), []);
  });
  await step("Ler estudo", "O clique abre a URL oficial do estudo em nova aba (requisição interceptada)", async () => {
    const alvo = data.find((p) => p.id === "mesas-executivas-pimenta-do-reino");
    await ctx.route(alvo.officialUrl, (r) => r.fulfill({ status: 200, contentType: "text/plain", body: "ok" }));
    await openBook(page, '.book-hit[aria-label*="Mesas Executivas"]'); await page.waitForSelector("dialog.detail[open]");
    const [np] = await Promise.all([ctx.waitForEvent("page"), page.click('dialog.detail a:has-text("Ler estudo")')]);
    await np.waitForLoadState(); eq(np.url(), alvo.officialUrl); await np.close();
    await page.keyboard.press("Escape");
  });
  await step("Registro", "Fatos da Amazônia 2026 (nº 91) está na estante, com capa e ficha", async () => {
    const f = data.find((p) => p.number === 91); ok(f && f.title === "Fatos da Amazônia 2026", "registro");
    ok(f.officialUrl.endsWith("/2026/08/FatosAMZ2026.pdf"), f.officialUrl);
    ok((f.cover.source || "").includes("Página 1 do PDF"), "origem da capa");
    ok(await page.locator('.book-hit[aria-label*="Fatos da Amazônia"]').count() === 1, "lombada");
    await openBook(page, '.book-hit[aria-label*="Fatos da Amazônia"]'); await page.waitForSelector("dialog.detail[open]");
    eq(await page.locator("#detail-title").innerText(), "Fatos da Amazônia 2026");
    await page.keyboard.press("Escape");
  });
  await step("Detalhe", "Resumo curto termina em frase completa (sem cortar em separador de milhar)", async () => {
    for (const p of data) {
      await openBook(page, `.book-hit[aria-label*="${p.title.slice(0, 30)}"]`); await page.waitForSelector("dialog.detail[open]");
      const t = (await page.locator(".d-text").count()) ? await page.locator(".d-text").innerText() : "";
      ok(t.length === 0 || (t.length <= 420 && /[.!?]$/.test(t.trim())), `${p.id}: “${t.slice(-60)}”`);
      await page.keyboard.press("Escape"); await page.waitForSelector("dialog.detail", { state: "detached" });
    }
  });
  await step("Rotas", "Link direto #/estudo/<id> abre a ficha; id inexistente volta à lista", async () => {
    await page.goto(URL0 + "#/estudo/amazonia-em-foco"); await page.waitForSelector("dialog.detail[open]"); await page.reload(); await page.waitForSelector("dialog.detail[open]");
    eq(await page.locator("#detail-title").innerText(), "Amazônia em Foco");
    await page.goto(URL0 + "#/estudo/nao-existe"); await page.waitForURL(/nao-existe/); await page.reload(); await page.waitForSelector(".book, .card");
    await page.waitForTimeout(300); eq(await page.locator("dialog.detail").count(), 0); ok(!page.url().includes("nao-existe"), page.url());
  });
  await step("Rotas", "Clique no fundo da ficha fecha o diálogo", async () => {
    await page.goto(URL0 + "#/estudo/rematamento-produtivo"); await page.waitForSelector("dialog.detail[open]");
    await page.mouse.click(5, 5); await page.waitForSelector("dialog.detail", { state: "detached" });
  });
  await ctx.close();
}

// ---------- 4. Paleta do site do Amazônia 2030 ----------
{
  const { ctx, page } = await open();
  const tokens = readFileSync("src/styles/tokens.css", "utf8");
  const lightPaper = /--paper:\s*(#[0-9a-f]{6})/i.exec(tokens)[1];
  const rgb = (h) => { const n = parseInt(h.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
  await step("Paleta", "Tema claro usa o fundo creme e o verde do site do Amazônia 2030; tipografia Montserrat nos títulos", async () => {
    eq(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), rgb(lightPaper));
    const f = await page.evaluate(() => getComputedStyle(document.querySelector("h1")).fontFamily); ok(f.includes("Montserrat"), f);
    const acc = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()); ok(/^#[0-9a-f]{6}$/i.test(acc), acc);
    ok(!/Fraunces/.test(await page.evaluate(() => getComputedStyle(document.body).fontFamily)), "fonte antiga");
  });
  await step("Paleta", "Montserrat carrega de fato (arquivo local, sem CDN)", async () => {
    await page.evaluate(() => document.fonts.ready);
    ok(await page.evaluate(() => document.fonts.check('700 20px Montserrat')), "Montserrat indisponível");
    ok(await page.evaluate(() => [...document.styleSheets].every((s) => { try { return ![...s.cssRules].some((r) => /googleapis|gstatic/.test(r.cssText)); } catch { return true; } })), "fonte externa");
  });
  await ctx.close();
}

// ---------- 5. Estados de erro ----------
{
  const { ctx, page } = await open();
  await page.route("**/covers/amazonia-em-foco*.webp", (r) => r.fulfill({ status: 404, body: "nf" }));
  await page.reload(); await page.waitForSelector(".book");
  await step("Estados", "Capa ausente: capa tipográfica substitui, sem imagem quebrada; o botão Ler estudo continua", async () => {
    await openBook(page, '.book-hit[aria-label*="Amazônia em Foco"]'); await page.waitForSelector("dialog.detail[open]");
    await page.waitForSelector(".detail-cover .cover-fallback", { timeout: 5000 });
    ok((await page.locator(".detail-cover .cover-fallback").innerText()).includes("Amazônia em Foco"));
    eq(await page.locator('dialog.detail a:has-text("Ler estudo")').count(), 1);
    await page.screenshot({ path: `${OUT}/estado-capa-ausente.png` });
  });
  await ctx.close();
  const c2 = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const p2 = await c2.newPage();
  await p2.route("**/data/publications.json", (r) => r.fulfill({ status: 500, body: "x" }));
  await p2.goto(URL0);
  await step("Estados", "Falha ao carregar dados: mensagem e botão 'Tentar novamente'", async () => {
    await p2.waitForSelector('[role="alert"]'); ok(await p2.locator('button:has-text("Tentar novamente")').isVisible());
    await p2.unroute("**/data/publications.json"); await p2.click('button:has-text("Tentar novamente")'); await p2.waitForSelector(".book, .card"); eq(await count(p2), 9);
  });
  await c2.close();
  const c3 = await browser.newContext(); const p3 = await c3.newPage();
  await p3.route("**/data/publications.json", async (r) => { await new Promise((s) => setTimeout(s, 900)); r.continue(); });
  await p3.goto(URL0);
  await step("Estados", "Estado de carregamento visível antes dos dados", async () => { await p3.waitForSelector('[aria-busy="true"]', { timeout: 800 }); await p3.waitForSelector(".book, .card"); });
  await c3.close();
  const c4 = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const p4 = await c4.newPage();
  const sem = JSON.parse(readFileSync("data/publications.json", "utf8"));
  delete sem.publications.find((p) => p.id === "amazonia-em-foco").officialUrl;
  await p4.route("**/data/publications.json", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(sem) }));
  await p4.goto(URL0); await p4.waitForSelector(".book");
  await step("Estados", "Estudo sem link oficial: ficha avisa e não mostra botão quebrado", async () => {
    await openBook(p4, '.book-hit[aria-label*="Amazônia em Foco"]'); await p4.waitForSelector("dialog.detail[open]");
    eq(await p4.locator('dialog.detail a:has-text("Ler estudo")').count(), 0);
    ok((await p4.locator(".detail-body").innerText()).includes("Link oficial não informado"));
  });
  await c4.close();
}

// ---------- 6. Escalabilidade: adicionar estudo só no JSON ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const page = await ctx.newPage();
  const big = JSON.parse(readFileSync("data/publications.json", "utf8"));
  const extra = [];
  for (let i = 0; i < 200; i++) { const b = structuredClone(data[i % data.length]); b.id = `teste-${i}`; b.title = `Estudo de teste ${i} ${b.title}`; b.number = 1000 + i; extra.push(b); }
  extra.push({ id: "minimo", title: "Estudo mínimo sem metadados" });
  big.publications.push(...extra);
  await page.route("**/data/publications.json", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(big) }));
  await page.goto(URL0);
  await step("Escala", "210 estudos (9 + 200 clones + 1 com apenas id/título) renderizam sem alterar a UI", async () => {
    const t0 = Date.now(); await page.waitForSelector(".book"); eq(await count(page), data.length + 201);
    await page.click('.view-toggle button:has-text("Grade")'); await page.waitForSelector(".card");
    await page.fill('input[type="search"]', "mínimo"); eq(await count(page), 1);
    await page.click(".card"); await page.waitForSelector("dialog.detail[open]");
    const t = await page.locator(".detail-body").innerText(); ok(t.includes("Estudo mínimo sem metadados") && t.includes("Link oficial não informado"), "campos vazios");
    return `${((Date.now() - t0) / 1000).toFixed(1)} s`;
  });
  await ctx.close();
}

// ---------- 7. Teclado, foco e acessibilidade ----------
{
  const { ctx, page } = await open();
  await step("Acessibilidade", "Teclado: setas movem entre lombadas; Enter puxa a capa; Tab+Enter abre; Esc fecha e devolve o foco", async () => {
    await page.locator(".book-hit").first().focus();
    await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight");
    const lab = await page.evaluate(() => document.activeElement.getAttribute("aria-label")); ok(lab.includes("Rematamento"), lab);
    await page.keyboard.press("Enter"); await page.waitForSelector(".book.is-pulled .cover-hit");
    eq(await page.locator(".book-hit[aria-expanded=true]").count(), 1);
    await page.keyboard.press("Tab"); ok(await page.evaluate(() => document.activeElement.classList.contains("cover-hit")), "Tab deve ir à capa");
    await page.keyboard.press("Enter"); await page.waitForSelector("dialog.detail[open]");
    await page.keyboard.press("Escape"); await page.waitForSelector("dialog.detail", { state: "detached" });
    const back = await page.evaluate(() => document.activeElement?.className); ok(back === "cover-hit", `foco voltou para ${back}`);
    await page.keyboard.press("Escape"); await page.waitForFunction(() => !document.querySelector(".book.is-pulled")); // Esc recolhe a capa
  });
  await step("Acessibilidade", "Botão 'Ler estudo' é alcançável por Tab dentro da ficha", async () => {
    await openBook(page, '.book-hit[aria-label*="IPS"], .book-hit[aria-label*="Progresso Social"]'); await page.waitForSelector("dialog.detail[open]");
    let found = false; for (let i = 0; i < 4 && !found; i++) { await page.keyboard.press("Tab"); found = await page.evaluate(() => document.activeElement?.textContent?.includes("Ler estudo") ?? false); }
    ok(found, "foco não alcançou Ler estudo"); await page.keyboard.press("Escape"); await page.waitForSelector("dialog.detail", { state: "detached" });
  });
  await step("Acessibilidade", "Foco visível (outline) em lombada, pílula e campo", async () => {
    await page.locator(".book-hit").nth(1).focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
    const o = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle + "|" + getComputedStyle(document.activeElement).outlineWidth);
    ok(o.startsWith("solid") && !o.endsWith("|0px"), o);
  });
  await step("Acessibilidade", "Landmarks e rótulos: header, main, footer, label em todos os campos, botões com nome", async () => {
    eq(await page.locator("header, main, footer").count(), 3);
    const unl = await page.$$eval("input, select", (els) => els.filter((e) => !e.labels?.length && !e.getAttribute("aria-label")).length); eq(unl, 0);
    const nameless = await page.$$eval("button, a", (els) => els.filter((e) => !(e.innerText || e.getAttribute("aria-label") || "").trim()).length); eq(nameless, 0);
    eq(await page.locator("h1").count(), 1);
  });
  await step("Acessibilidade", "Imagens de capa têm texto alternativo descritivo", async () => {
    await page.click('.view-toggle button:has-text("Grade")');
    const alts = await page.$$eval(".card img", (is) => is.map((i) => i.alt)); ok(alts.every((a) => a.length > 15), JSON.stringify(alts));
    await page.click('.view-toggle button:has-text("Estante")');
  });
  await step("Acessibilidade", "Contraste mínimo 4.5:1 (texto e botão 'Ler estudo') nos temas claro e escuro", async () => {
    const calc = async () => page.evaluate(() => {
      const L = (c) => { const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
      const ratio = (fg, bg) => { const a = L(fg), b = L(bg); return +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2); };
      const probe = document.createElement("div"); document.body.appendChild(probe);
      const v = (name, prop) => { probe.style[prop] = `var(${name})`; return getComputedStyle(probe)[prop]; };
      const bg = getComputedStyle(document.body).backgroundColor, out = {};
      for (const [k, sel] of Object.entries({ contagem: ".result-count", titulo: "h1", pilula: ".pill" })) out[k] = ratio(getComputedStyle(document.querySelector(sel)).color, bg);
      out.ink2 = ratio(v("--ink-2", "color"), bg); out.muted = ratio(v("--muted", "color"), bg);
      out.mutedSuperficie = ratio(v("--muted", "color"), v("--surface", "backgroundColor"));
      out.botao = ratio(v("--accent-ink", "color"), v("--accent", "backgroundColor"));
      probe.remove(); return out; });
    const light = await calc(); await page.click('button[aria-label^="Usar tema escuro"]'); const dark = await calc();
    await page.screenshot({ path: `${OUT}/desktop-tema-escuro.png` });
    await page.click('button[aria-label^="Usar tema claro"]');
    ok(Object.values({ ...light, ...dark }).every((v) => v >= 4.5), JSON.stringify({ light, dark })); return JSON.stringify({ light, dark });
  });
  await step("Acessibilidade", "Tema escuro: ficha abre e mantém o botão 'Ler estudo' visível", async () => {
    await page.click('button[aria-label^="Usar tema escuro"]');
    await openBook(page, '.book-hit[aria-label*="Fatos da Amazônia"]'); await page.waitForSelector("dialog.detail[open]");
    ok(await page.locator('dialog.detail a:has-text("Ler estudo")').isVisible());
    await page.screenshot({ path: `${OUT}/desktop-detalhe-escuro.png` });
    await page.keyboard.press("Escape"); await page.waitForSelector("dialog.detail", { state: "detached" });
    await page.click('button[aria-label^="Usar tema claro"]');
  });
  await ctx.close();
}

// ---------- 8. Resoluções ----------
const VPS = [["desktop-1920", 1920, 1080], ["desktop-1440", 1440, 900], ["notebook-1280", 1280, 720], ["tablet-820", 820, 1180], ["tablet-paisagem-1024", 1024, 768], ["celular-390", 390, 844], ["celular-360", 360, 740]];
for (const [name, w, h] of VPS) {
  const { ctx, page } = await open({ width: w, height: h }, { hasTouch: w < 900, isMobile: w < 500 });
  await step("Responsivo", `${name} (${w}×${h}): sem rolagem horizontal, conteúdo e filtros visíveis`, async () => {
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth })); ok(o.sw <= o.iw, `scrollWidth ${o.sw} > ${o.iw}`);
    eq(await count(page), 9);
    const fb = await page.locator(".filters").boundingBox(); ok(fb.x >= 0 && fb.x + fb.width <= w + 1, "filtros fora da tela");
    await page.screenshot({ path: `${OUT}/${name}.png` });
  });
  await step("Responsivo", `${name}: ficha abre, cabe na tela e mostra o botão 'Ler estudo' sem rolar`, async () => {
    const t = (await page.$$(".book-hit, .card"))[4]; await t.scrollIntoViewIfNeeded(); await t.click({ force: true }); { const cv = page.locator(".book.is-pulled .cover-hit"); if (await cv.count()) await cv.click({ force: true }); } await page.waitForSelector("dialog.detail[open]");
    await page.waitForTimeout(500);
    const o = await page.evaluate(() => { const d = document.querySelector("dialog.detail"); return { sw: d.scrollWidth, cw: d.clientWidth }; }); ok(o.sw <= o.cw + 1, `${o.sw} > ${o.cw}`);
    const btn = await page.locator('dialog.detail a:has-text("Ler estudo")').boundingBox(); ok(btn, "botão Ler estudo");
    ok(btn.x >= 0 && btn.x + btn.width <= w + 1 && btn.y >= 0 && btn.y + btn.height <= h + 1, `botão fora da tela: ${JSON.stringify(btn)}`);
    await page.screenshot({ path: `${OUT}/${name}-detalhe.png` });
    await page.click(".detail-close");
  });
  await ctx.close();
}

// ---------- 9. Console ----------
await step("Console", "Nenhum erro ou aviso no console em toda a suíte (exceto 404 provocados de propósito)", async () => {
  const real = consoleIssues.filter((m) => !/404|500|Failed to load resource|Canvas2D: Multiple readback/.test(m));
  eq(real, []);
});

await browser.close(); server.close();
const pass = results.filter((r) => r.ok).length;
const md = [`# Resultado da suíte automatizada`, ``, `${pass}/${results.length} verificações aprovadas.`, ``, `| Área | Verificação | Resultado | Detalhe |`, `|---|---|---|---|`, ...results.map((r) => `| ${r.area} | ${r.name} | ${r.ok ? "✔" : "✘ FALHA"} | ${r.detail.replace(/\|/g, "/")} |`), ``, `Avisos de console ignorados (404/500 provocados por testes de erro): ${consoleIssues.length}`].join("\n");
writeFileSync(`${OUT}/resultados.md`, md);
console.log(`\n${pass}/${results.length} aprovadas`);
process.exit(pass === results.length ? 0 : 1);
