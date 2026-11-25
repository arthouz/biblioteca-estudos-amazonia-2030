# Biblioteca de Estudos · Amazônia 2030

Estante virtual interativa dos estudos do Amazônia 2030. Aplicação estática (React 19 + TypeScript, empacotada com esbuild): não precisa de servidor de aplicação nem de banco de dados.

- **Estante 3D** de lombadas (e modo **Grade** com as capas), filtros por categoria, ano, território e instituição, busca livre, ficha completa de cada estudo e **leitor de PDF** embutido (pdf.js) com opção de baixar.
- **Botão de download oficial:** com `officialUrl` preenchido no estudo, o download redireciona ao site do Amazônia 2030 (para contar downloads lá); o leitor de PDF continua usando o arquivo local.
- **Dados fora do código**: tudo vem de `data/publications.json` e `data/taxonomy.json`, lidos em tempo de execução. Adicionar um estudo não exige mexer na interface.
- Identidade editorial própria (Fraunces + DM Sans, cores sóbrias) e o logotipo oficial do Amazônia 2030 no cabeçalho (`public/brand/`). A experiência de navegação foi inspirada na referência indicada; nenhum logotipo, código ou identidade dela foi copiado.

## Estrutura

```
data/publications.json   registro de todos os estudos (fonte única)
data/taxonomy.json       categorias temáticas
public/pdfs/             PDFs  (<id>.pdf)
public/covers/           capas extraídas da página 1 do PDF (<id>.webp e <id>-thumb.webp)
public/fonts/            fontes (licenças OFL incluídas)
src/                     código React/TypeScript (components/, lib/, styles/)
scripts/                 prepare_assets.py · add_publication.py · validate-data.mjs · check_against_pdfs.py
tests/run.mjs            suíte de validação (Playwright/Chromium)
docs/                    INVENTARIO.md · ADICIONAR_ESTUDOS.md · VALIDACAO.md
build.mjs · serve.mjs    build estático e servidor local (com suporte a HTTP Range)
```

> **Sobre os PDFs:** o pacote de código não inclui os PDFs (97 MB). Eles já estão no pacote do site pronto (`pdfs/`); para desenvolver, copie essa pasta para `public/pdfs/` ou, a partir dos originais, coloque-os em `fontes/` e rode `npm run assets`.

## Rodar localmente

Requisitos: Node 22+ e Python 3 (com Pillow e pypdf) + `pdftoppm` (poppler) apenas para preparar capas.

```bash
npm install
npm run build        # gera dist/
npm run dev          # serve dist/ em http://127.0.0.1:4173
npm run typecheck    # tsc --noEmit
npm run check:data   # valida os JSON e os arquivos referenciados
npm test             # suíte Playwright (requer: npx playwright install chromium)
```

## Publicar

GitHub Pages (recomendado): ver `docs/PUBLICAR_GITHUB_PAGES.md`. O fluxo `.github/workflows/pages.yml` publica automaticamente a cada push na branch `main`.

Outras hospedagens:

`dist/` é um site estático completo (HTML, JS, CSS, dados, capas, PDFs e arquivos do pdf.js). Envie a pasta para qualquer hospedagem estática (Netlify, Cloudflare Pages, GitHub Pages, S3+CDN, servidor Nginx/Apache). Funciona em subpasta, pois todos os caminhos são relativos e a navegação usa `#/`.

Requisito importante: o servidor deve responder a **HTTP Range** (`Accept-Ranges: bytes`), como fazem as hospedagens acima; é isso que permite abrir PDFs grandes (o de Rematamento tem 31 MB) sem baixar tudo antes da primeira página. Sem Range o leitor continua funcionando, porém mais devagar.

## Adicionar um estudo

Resumo (detalhes em `docs/ADICIONAR_ESTUDOS.md`):

```bash
python3 scripts/add_publication.py ~/Downloads/novo.pdf --id novo-estudo --title "Título oficial" --number 96 --category governanca-politicas
# complete os metadados em data/publications.json
npm run check:data && npm run build
```

## Direitos e fontes

Os PDFs, capas e conteúdos pertencem aos respectivos autores e instituições; a biblioteca apenas os organiza e os distribui como recebidos. Fontes tipográficas sob SIL Open Font License (ver `public/fonts/`).
