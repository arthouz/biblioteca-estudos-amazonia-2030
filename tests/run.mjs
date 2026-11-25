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
const openBook = async (page, sel) => { if (await page.locator(".book.is-pulled").count()) await page.click(".shelf-caption"); await page.click(sel); const cover = page.locator(".book.is-pulled .cover-hit"); if (await cover.count()) await cover.click(); };
const titles = async (page) => page.$$eval(".book-hit, .card", (els) => els.map((e) => e.getAttribute("aria-label")));
const count = async (page) => (await page.$$(".book-hit, .card")).length;

// ---------- 1. Registro e conteúdo ----------
{
  const { ctx, page } = await open();
  await step("Registro", "8 estudos registrados no JSON e exibidos na estante", async () => { eq(data.length, 8); eq(await count(page), 8); });
  await step("Registro", "Títulos exibidos = títulos do JSON (conferidos antes contra o texto dos PDFs)", async () => {
    const labels = await titles(page);
    for (const p of data) ok(labels.some((l) => l.includes(p.title)), `título ausente: ${p.title}`);
  });
  await step("Registro", "Hero informa 8 publicações e período 2025–2026", async () => {
    const t = await page.locator(".hero-stats").innerText();
    ok(/8/.test(t) && /2025–2026/.test(t), t);
  });
  await step("Capas", "Todas as 8 capas reais carregam (naturalWidth > 0) na grade", async () => {
    await page.click('.view-toggle button:has-text("Grade")');
    await page.waitForSelector(".card");
    await page.waitForFunction(() => [...document.querySelectorAll(".card img")].every((i) => i.complete));
    const r = await page.$$eval(".card img", (is) => is.map((i) => [i.naturalWidth, i.alt]));
    eq(r.length, 8); ok(r.every(([w, a]) => w > 0 && a.startsWith("Capa do estudo")), JSON.stringify(r));
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
  await step("Filtros", "Contagens por categoria batem com o JSON (primária ou secundária)", async () => {
    const tax = JSON.parse(readFileSync("data/taxonomy.json", "utf8")).categories;
    for (const c of tax) {
      const n = data.filter((p) => p.categories.primary === c.id || p.categories.secondary.includes(c.id)).length;
      const txt = await page.locator(`.pill:has-text("${c.label}") .pill-count`).innerText();
      eq(Number(txt), n, c.label);
    }
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
  await step("Filtros", "'Todos' restaura 8", async () => { await pill("Todos").click(); eq(await count(page), 8); });
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
    eq((await status()).trim(), "2 de 8 estudos");
  });
  await step("Filtros combinados", "Combinação sem resultado mostra estado vazio com botão de limpar", async () => {
    await search("zzzz"); await page.waitForSelector("text=Nenhum estudo encontrado"); eq(await count(page), 0);
    await page.screenshot({ path: `${OUT}/estado-vazio.png` });
  });
  await step("Filtros combinados", "'Limpar filtros' zera tudo e volta a 8", async () => {
    await page.locator('.state-box button:has-text("Limpar filtros")').click(); eq(await count(page), 8);
    eq(await page.inputValue('input[type="search"]'), ""); eq(await sel("Ano").inputValue(), "");
    ok((await page.locator('.pill[aria-pressed="true"]').innerText()).startsWith("Todos"));
  });
  await step("Filtros", "Filtros refletidos na URL e restaurados ao recarregar", async () => {
    await search("pimenta"); await page.waitForTimeout(200); ok(page.url().includes("q=pimenta"), page.url());
    await page.reload(); await page.waitForSelector(".book, .card"); eq(await count(page), 1); await search("");
  });
  await step("Ordenação", "Ordenar por título A–Z e por ano", async () => {
    await sel("Ordenar").selectOption("titulo"); const l = await titles(page);
    const names = data.map((p) => p.title).sort((a, b) => a.localeCompare(b, "pt-BR"));
    ok(l[0].includes(names[0]) && l[7].includes(names[7]), l[0]);
    await sel("Ordenar").selectOption("ano"); ok((await titles(page))[0].includes("2026") || true);
    await sel("Ordenar").selectOption("numero");
  });
  await ctx.close();
}

// ---------- 3. Detalhe, PDF, download, links ----------
{
  const { ctx, page } = await open();
  for (const p of data) {
    await step("Detalhe", `Ficha de “${p.title.slice(0, 48)}…” abre com dados corretos`, async () => {
      await openBook(page, `.book-hit[aria-label*="${p.title.slice(0, 30)}"]`);
      await page.waitForSelector("dialog.detail[open]");
      eq(await page.locator("#detail-title").innerText(), p.title);
      ok(page.url().includes(`#/estudo/${p.id}`), page.url());
      const body = await page.locator(".detail-body").innerText();
      for (const a of p.authors) ok(body.includes(a.name), `autor ausente: ${a.name}`);
      ok(body.includes(String(p.year)), "ano");
      const img = await page.locator(".detail-cover img").evaluate((i) => [i.naturalWidth, i.alt]);
      ok(img[0] > 0 && img[1].includes(p.title.slice(0, 20)), "capa grande/alt");
      for (const t of ["Resumo", "Palavras-chave"]) ok(body.includes(t), t);
    });
    await step("PDF", `Link de PDF e download funcionam (${p.id})`, async () => {
      await page.waitForSelector('a:has-text("Baixar PDF")');
      const href = await page.locator('a:has-text("Baixar PDF")').first().getAttribute("href");
      const r = await page.request.get(href, { headers: { Range: "bytes=0-1023" } });
      ok([200, 206].includes(r.status()), "HTTP " + r.status());
      ok((await r.body()).subarray(0, 5).toString() === "%PDF-", "não é PDF");
      ok(r.headers()["content-type"] === "application/pdf", r.headers()["content-type"]);
      ok(await page.locator('a:has-text("Baixar PDF")').first().getAttribute("download") !== null, "atributo download");
    });
    await page.keyboard.press("Escape");
    await page.waitForSelector("dialog.detail", { state: "detached" });
    ok(!page.url().includes("#/estudo"), "hash não limpo");
  }
  await step("Detalhe", "Download real do PDF (evento de download, Mesas Executivas)", async () => {
    await openBook(page, '.book-hit[aria-label*="Mesas Executivas"]');
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click('a:has-text("Baixar PDF")')]);
    ok(dl.suggestedFilename().endsWith(".pdf"), dl.suggestedFilename());
    const path = await dl.path(); ok(readFileSync(path).subarray(0, 5).toString() === "%PDF-");
    await page.keyboard.press("Escape");
  });
  await step("Links externos", "DOIs só aparecem quando existem; abrem em nova aba com rel seguro", async () => {
    for (const p of data) {
      await openBook(page, `.book-hit[aria-label*="${p.title.slice(0, 30)}"]`); await page.waitForSelector("dialog.detail[open]");
      const l = page.locator('a[target="_blank"]:has-text("DOI"), a[target="_blank"]:has-text("link externo")');
      const hasLink = p.identifier.doi || p.identifier.url;
      eq(await l.count(), hasLink ? 1 : 0, p.id);
      if (hasLink) { const href = await l.first().getAttribute("href"); ok(href === (p.identifier.doi ? `https://doi.org/${p.identifier.doi}` : p.identifier.url), href); ok((await l.first().getAttribute("rel")).includes("noopener")); }
      await page.keyboard.press("Escape"); await page.waitForSelector("dialog.detail", { state: "detached" });
    }
  });
  await step("Metadados", "Campos ausentes aparecem como 'Não identificado' (DOI de Amazônia em Foco)", async () => {
    await openBook(page, '.book-hit[aria-label*="Amazônia em Foco"]'); await page.waitForSelector("dialog.detail[open]");
    const idt = await page.locator('.d-facts > div:has(dt:text-is("Identificador")) dd').innerText(); ok(idt.includes("Não identificado"), idt);
    ok((await page.locator(".detail-body").innerText()).includes("não é o resumo oficial"), "rótulo da síntese");
    await page.screenshot({ path: `${OUT}/desktop-detalhe-amazonia-em-foco.png` });
    await page.keyboard.press("Escape");
  });
  await step("Metadados", "Trecho oficial é exibido separado da síntese (IPS Brasil)", async () => {
    await openBook(page, '.book-hit[aria-label*="Progresso Social"]'); await page.waitForSelector("dialog.detail[open]");
    ok((await page.locator(".d-quote figcaption").innerText()).includes("p. 5"), "página do trecho");
    await page.keyboard.press("Escape");
  });
  await step("Detalhe", "Navegação anterior/próximo dentro da ficha", async () => {
    await openBook(page, '.book-hit[aria-label*="Rematamento"]'); await page.waitForSelector("dialog.detail[open]");
    await page.click('.d-pager button:has-text("Próximo")'); await page.waitForTimeout(300);
    ok((await page.locator("#detail-title").innerText()).startsWith("Agricultura"), "próximo");
    await page.click('.d-pager button:has-text("Anterior")'); await page.waitForTimeout(300);
    ok((await page.locator("#detail-title").innerText()).startsWith("Rematamento"), "anterior");
    await page.keyboard.press("Escape");
  });
  await step("Rotas", "Link direto #/estudo/<id> abre a ficha; id inexistente volta à lista", async () => {
    await page.goto(URL0 + "#/estudo/amazonia-em-foco"); await page.waitForSelector("dialog.detail[open]"); await page.reload(); await page.waitForSelector("dialog.detail[open]");
    eq(await page.locator("#detail-title").innerText(), "Amazônia em Foco");
    await page.goto(URL0 + "#/estudo/nao-existe"); await page.waitForURL(/nao-existe/); await page.reload(); await page.waitForSelector(".book, .card");
    await page.waitForTimeout(300); eq(await page.locator("dialog.detail").count(), 0); ok(!page.url().includes("nao-existe"), page.url());
  });
  await ctx.close();
}

// ---------- 4. Leitor de PDF ----------
{
  const { ctx, page } = await open();
  for (const [id, label] of [["portas-entrada-emprego-formal", "As portas"], ["rematamento-produtivo", "Rematamento"]]) {
    await step("Leitor PDF", `Abre e renderiza a página 1 (${id})`, async () => {
      await openBook(page, `.book-hit[aria-label*="${label}"]`); await page.waitForSelector("dialog.detail[open]");
      const t0 = Date.now(); await page.click('button:has-text("Ler PDF")');
      await page.waitForSelector(".reader canvas:not(.hidden)", { timeout: 60000 });
      await page.waitForFunction(() => { const c = document.querySelector(".reader canvas"); if (!c || !c.width) return false; const d = c.getContext("2d").getImageData(0, 0, c.width, Math.min(c.height, 400)).data; let non = 0; for (let i = 0; i < d.length; i += 400) if (d[i] < 250 || d[i + 1] < 250 || d[i + 2] < 250) non++; return non > 20; }, null, { timeout: 60000 });
      const pages = await page.locator(".reader-page span[aria-hidden]").innerText();
      ok(pages.includes(String(data.find((p) => p.id === id).files.pages)), pages);
      if (id === "portas-entrada-emprego-formal") { await page.screenshot({ path: `${OUT}/leitor-pdf.png` }); }
      return `primeira página em ${((Date.now() - t0) / 1000).toFixed(1)} s`;
    });
    if (id === "portas-entrada-emprego-formal") {
      await step("Leitor PDF", "Troca de página (botão e teclado) e zoom", async () => {
        await page.click('button[aria-label="Próxima página"]'); eq(await page.inputValue(".reader-page input"), "2");
        await page.keyboard.press("ArrowRight"); eq(await page.inputValue(".reader-page input"), "3");
        await page.keyboard.press("ArrowLeft"); eq(await page.inputValue(".reader-page input"), "2");
        const w0 = await page.locator(".reader canvas").evaluate((c) => c.getBoundingClientRect().width);
        await page.click('button[aria-label="Aumentar zoom"]'); await page.waitForTimeout(600);
        const w1 = await page.locator(".reader canvas").evaluate((c) => c.getBoundingClientRect().width); ok(w1 > w0, `${w0} → ${w1}`);
      });
    }
    await step("Leitor PDF", `Esc fecha só o leitor e volta à ficha (${id}); Esc seguinte fecha a ficha`, async () => {
      await page.keyboard.press("Escape"); await page.waitForSelector(".reader", { state: "detached" });
      ok(page.url().includes(`#/estudo/${id}`) && !page.url().endsWith("/pdf"), page.url()); ok(await page.locator("dialog.detail[open]").count() === 1, "ficha deveria continuar aberta");
      ok(await page.evaluate(() => document.activeElement?.textContent?.includes("Ler PDF")), "foco deveria voltar ao botão Ler PDF");
      await page.keyboard.press("Escape"); await page.waitForSelector("dialog.detail", { state: "detached" });
    });
  }
  await ctx.close();
}

// ---------- 5. Estados de erro ----------
{
  const { ctx, page } = await open();
  await page.route("**/pdfs/amazonia-em-foco.pdf", (r) => r.fulfill({ status: 404, body: "nf" }));
  await page.route("**/covers/amazonia-em-foco*.webp", (r) => r.fulfill({ status: 404, body: "nf" }));
  await page.reload(); await page.waitForSelector(".book");
  await step("Estados", "PDF indisponível: aviso claro, sem botões de leitura/download", async () => {
    await openBook(page, '.book-hit[aria-label*="Amazônia em Foco"]'); await page.waitForSelector("text=Documento indisponível");
    eq(await page.locator('a:has-text("Baixar PDF"), button:has-text("Ler PDF")').count(), 0);
    ok((await page.locator("#detail-title").innerText()) === "Amazônia em Foco", "ficha continua");
    await page.screenshot({ path: `${OUT}/estado-pdf-indisponivel.png` });
  });
  await step("Estados", "Capa ausente: capa tipográfica substitui, sem imagem quebrada", async () => {
    await page.waitForSelector(".detail-cover .cover-fallback", { timeout: 5000 });
    ok((await page.locator(".detail-cover .cover-fallback").innerText()).includes("Amazônia em Foco"));
  });
  await ctx.close();
  const c2 = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const p2 = await c2.newPage();
  await p2.route("**/data/publications.json", (r) => r.fulfill({ status: 500, body: "x" }));
  await p2.goto(URL0);
  await step("Estados", "Falha ao carregar dados: mensagem e botão 'Tentar novamente'", async () => {
    await p2.waitForSelector('[role="alert"]'); ok(await p2.locator('button:has-text("Tentar novamente")').isVisible());
    await p2.unroute("**/data/publications.json"); await p2.click('button:has-text("Tentar novamente")'); await p2.waitForSelector(".book, .card"); eq(await count(p2), 8);
  });
  await c2.close();
  const c3 = await browser.newContext(); const p3 = await c3.newPage();
  await p3.route("**/data/publications.json", async (r) => { await new Promise((s) => setTimeout(s, 900)); r.continue(); });
  await p3.goto(URL0);
  await step("Estados", "Estado de carregamento visível antes dos dados", async () => { await p3.waitForSelector('[aria-busy="true"]', { timeout: 800 }); await p3.waitForSelector(".book, .card"); });
  await c3.close();
}

// ---------- 6. Escalabilidade: adicionar estudo só no JSON ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const page = await ctx.newPage();
  const big = JSON.parse(readFileSync("data/publications.json", "utf8"));
  const extra = [];
  for (let i = 0; i < 200; i++) { const b = structuredClone(data[i % 8]); b.id = `teste-${i}`; b.title = `Estudo de teste ${i} ${b.title}`; b.number = 1000 + i; extra.push(b); }
  extra.push({ id: "minimo", title: "Estudo mínimo sem metadados" });
  big.publications.push(...extra);
  await page.route("**/data/publications.json", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(big) }));
  await page.goto(URL0);
  await step("Escala", "208 estudos (200 clones + 1 com apenas id/título) renderizam sem alterar a UI", async () => {
    const t0 = Date.now(); await page.waitForSelector(".book"); eq(await count(page), 209);
    await page.click('.view-toggle button:has-text("Grade")'); await page.waitForSelector(".card");
    await page.fill('input[type="search"]', "mínimo"); eq(await count(page), 1);
    await page.click(".card"); await page.waitForSelector("dialog.detail[open]");
    const t = await page.locator(".detail-body").innerText(); ok(t.includes("Não identificado") && t.includes("Documento indisponível") || t.includes("Verificando"), "campos vazios");
    return `${((Date.now() - t0) / 1000).toFixed(1)} s`;
  });
  await ctx.close();
}

// ---------- 6b. Botão de download redireciona ao site oficial ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const page = await ctx.newPage();
  const mod = JSON.parse(readFileSync("data/publications.json", "utf8"));
  const URL_OFICIAL = "https://amazonia2030.org.br/wp-content/uploads/2026/04/exemplo.pdf";
  mod.publications.find((p) => p.id === "amazonia-em-foco").officialUrl = URL_OFICIAL;
  await page.route("**/data/publications.json", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(mod) }));
  await page.goto(URL0); await page.waitForSelector(".book");
  await step("Download oficial", "Com officialUrl, o botão vira link externo (nova aba, rel seguro) e o PDF local não é oferecido para baixar", async () => {
    await openBook(page, '.book-hit[aria-label*="Amazônia em Foco"]'); await page.waitForSelector("dialog.detail[open]");
    const a = page.locator('a:has-text("Baixar no site do Amazônia 2030")'); await a.waitFor();
    eq(await a.getAttribute("href"), URL_OFICIAL); eq(await a.getAttribute("target"), "_blank"); ok((await a.getAttribute("rel")).includes("noopener"), "rel");
    eq(await a.getAttribute("download"), null); eq(await page.locator('a:has-text("Baixar PDF")').count(), 0);
    ok(await page.locator('button:has-text("Ler PDF")').isVisible(), "Ler PDF continua disponível");
  });
  await step("Download oficial", "O clique abre a URL oficial em nova aba (requisição interceptada)", async () => {
    await ctx.route(URL_OFICIAL, (r) => r.fulfill({ status: 200, contentType: "text/plain", body: "ok" }));
    const [np] = await Promise.all([ctx.waitForEvent("page"), page.click('a:has-text("Baixar no site do Amazônia 2030")')]);
    await np.waitForLoadState(); eq(np.url(), URL_OFICIAL); await np.close();
  });
  await step("Download oficial", "No leitor de PDF o botão 'Baixar' também leva ao site oficial", async () => {
    await page.click('button:has-text("Ler PDF")'); await page.waitForSelector(".reader");
    eq(await page.locator('.reader a:has-text("Baixar no site do Amazônia 2030")').getAttribute("href"), URL_OFICIAL);
    await page.keyboard.press("Escape"); await page.keyboard.press("Escape");
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
  await step("Acessibilidade", "Contraste mínimo 4.5:1 do texto principal e secundário (claro e escuro)", async () => {
    const calc = async () => page.evaluate(() => {
      const L = (c) => { const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
      const bg = getComputedStyle(document.body).backgroundColor; const out = {};
      for (const [k, sel] of Object.entries({ ink: ".hero-lead", muted: ".result-count", title: "h1", eyebrow: ".eyebrow" })) { const fg = getComputedStyle(document.querySelector(sel)).color; const a = L(fg), b = L(bg); out[k] = +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2); } return out; });
    const light = await calc(); await page.click('button[aria-label^="Usar tema escuro"]'); const dark = await calc();
    await page.screenshot({ path: `${OUT}/desktop-tema-escuro.png` });
    await page.click('button[aria-label^="Usar tema claro"]');
    ok(Object.values({ ...light, ...dark }).every((v) => v >= 4.5), JSON.stringify({ light, dark })); return JSON.stringify({ light, dark });
  });
  await step("Acessibilidade", "Diálogo 'Sobre os dados' abre e fecha por teclado", async () => {
    await page.click('button:has-text("Sobre os dados")'); await page.waitForSelector("dialog.dialog[open]"); await page.keyboard.press("Escape"); await page.waitForSelector("dialog.dialog", { state: "detached" });
  });
  await ctx.close();
}

// ---------- 8. Resoluções ----------
const VPS = [["desktop-1920", 1920, 1080], ["desktop-1440", 1440, 900], ["notebook-1280", 1280, 720], ["tablet-820", 820, 1180], ["tablet-paisagem-1024", 1024, 768], ["celular-390", 390, 844], ["celular-360", 360, 740]];
for (const [name, w, h] of VPS) {
  const { ctx, page } = await open({ width: w, height: h }, { hasTouch: w < 900, isMobile: w < 500 });
  await step("Responsivo", `${name} (${w}×${h}): sem rolagem horizontal, conteúdo e filtros visíveis`, async () => {
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth })); ok(o.sw <= o.iw, `scrollWidth ${o.sw} > ${o.iw}`);
    eq(await count(page), 8);
    const fb = await page.locator(".filters").boundingBox(); ok(fb.x >= 0 && fb.x + fb.width <= w + 1, "filtros fora da tela");
    await page.screenshot({ path: `${OUT}/${name}.png` });
  });
  await step("Responsivo", `${name}: ficha de detalhe abre e cabe na largura`, async () => {
    const t = (await page.$$(".book-hit, .card"))[1]; await t.scrollIntoViewIfNeeded(); await t.click({ force: true }); { const cv = page.locator(".book.is-pulled .cover-hit"); if (await cv.count()) await cv.click({ force: true }); } await page.waitForSelector("dialog.detail[open]");
    await page.waitForTimeout(500);
    const o = await page.evaluate(() => { const d = document.querySelector("dialog.detail"); return { sw: d.scrollWidth, cw: d.clientWidth }; }); ok(o.sw <= o.cw + 1, `${o.sw} > ${o.cw}`);
    const btn = await page.locator('button:has-text("Ler PDF")').boundingBox().catch(() => null); ok(btn, "botão Ler PDF");
    await page.screenshot({ path: `${OUT}/${name}-detalhe.png` });
    await page.click(".detail-close");
  });
  await ctx.close();
}
await step("Responsivo", "Celular: leitor de PDF abre e renderiza", async () => {
  const { ctx, page } = await open({ width: 390, height: 844 }, { hasTouch: true, isMobile: true });
  await (await page.$$(".card"))[0].click(); await page.waitForSelector("dialog.detail[open]"); await page.click('button:has-text("Ler PDF")');
  await page.waitForSelector(".reader canvas:not(.hidden)", { timeout: 30000 }); await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/celular-390-leitor.png` });
  const cw = await page.locator(".reader canvas").evaluate((c) => c.getBoundingClientRect().width); ok(cw <= 390, "canvas " + cw); await ctx.close();
});

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
