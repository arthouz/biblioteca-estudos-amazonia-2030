# Biblioteca de Estudos · Amazônia 2030

Estante virtual interativa dos estudos do Amazônia 2030. Aplicação estática (React 19 + TypeScript, empacotada com esbuild): não precisa de servidor de aplicação nem de banco de dados.

- **Estante 3D** de lombadas (e modo **Grade** com as capas), filtros por categoria, ano, território e instituição e busca livre. A capa só aparece ao clicar no livro; ao clicar na capa, abre uma ficha mínima (título, autores, resumo curto) com um único botão, **Ler estudo**, que leva ao PDF no site do Amazônia 2030 (assim os acessos são contados lá). A biblioteca não hospeda PDFs.
- **Dados fora do código**: tudo vem de `data/publications.json` e `data/taxonomy.json`, lidos em tempo de execução. Adicionar um estudo não exige mexer na interface.
- Paleta e tipografia do site do Amazônia 2030 (creme, verdes, Montserrat nos títulos e DM Sans no texto) e o logotipo oficial no cabeçalho (`public/brand/`). A experiência de navegação foi inspirada na referência indicada; nenhum logotipo, código ou identidade dela foi copiado.

## Estrutura

```
data/publications.json   registro de todos os estudos (fonte única; officialUrl = link do botão "Ler estudo")
data/taxonomy.json       categorias temáticas
public/covers/           capas extraídas da página 1 do PDF (<id>.webp e <id>-thumb.webp)
public/fonts/            fontes (licenças OFL incluídas)
src/                     código React/TypeScript (components/, lib/, styles/)
scripts/                 prepare_assets.py · add_publication.py · validate-data.mjs · check_against_pdfs.py
tests/run.mjs            suíte de validação (Playwright/Chromium)
docs/                    INVENTARIO.md · ADICIONAR_ESTUDOS.md · VALIDACAO.md · PUBLICAR_GITHUB_PAGES.md
build.mjs · serve.mjs    build estático e servidor local
```

## Rodar localmente

Requisitos: Node 22+ e Python 3 (com Pillow e pypdf) + `pdftoppm` (poppler) apenas para preparar capas a partir dos PDFs (que ficam em `fontes/`, fora do site).

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

Outras hospedagens: `dist/` é um site estático completo (HTML, JS, CSS, dados e capas, poucos MB). Envie a pasta para qualquer hospedagem estática (Netlify, Cloudflare Pages, S3+CDN, Nginx/Apache). Funciona em subpasta, pois todos os caminhos são relativos e a navegação usa `#/`.

## Adicionar um estudo

Resumo (detalhes em `docs/ADICIONAR_ESTUDOS.md`):

```bash
python3 scripts/add_publication.py ~/Downloads/novo.pdf --id novo-estudo --title "Título oficial" --number 96 --category governanca-politicas
# complete os metadados e o officialUrl em data/publications.json
npm run check:data && npm run build
```

## Direitos e fontes

Os estudos, capas e conteúdos pertencem aos respectivos autores e instituições; a biblioteca apenas os organiza e remete ao site do Amazônia 2030. Fontes tipográficas sob SIL Open Font License (ver `public/fonts/`).
