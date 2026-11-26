# Relatório de validação

Data da execução: 26/11/2026 · Ambiente: Chromium (Playwright) sobre o `dist/` servido localmente · Suíte: `tests/run.mjs` (última execução: **77/77 aprovadas**, sem erros de console).

## 1. Fidelidade documental

| Verificação | Método | Resultado |
|---|---|---|
| 9 estudos registrados (nº 87 a 95) | contagem no JSON e na interface (estante e grade) | 9 / 9 |
| Link oficial de cada estudo | `officialUrl` de todos os registros começa com `https://amazonia2030.org.br/`; o botão “Ler estudo” aponta exatamente para ele (nova aba, `rel="noopener noreferrer"`) | 9 / 9 |
| Títulos e autores iguais aos dos PDFs | `scripts/check_against_pdfs.py` nos 8 PDFs recebidos no início; o nº 91 foi cadastrado a partir do texto do PDF do projeto | conferidos |
| Capa correta de cada estudo | página 1 de cada PDF; nº 91 usa capa **provisória** (declarada em `cover.source`, no `alt` e nas notas) | 8 oficiais + 1 provisória |
| Ano de publicação ≠ período analisado | campos separados (`year` × `analysisPeriod`) | ok |
| Anos não impressos sinalizados | asterisco com base declarada (fonte secundária ou inferido): nº 87, 89, 90, 93, 94 | ok |
| Síntese × resumo oficial | a ficha mostra só um resumo curto da síntese; o trecho oficial permanece separado no JSON | ok |
| Dados ausentes | “Não identificado” no JSON e lista `unidentified` | ok |

Detalhe por estudo: `docs/INVENTARIO.md`.

## 2. Resultado da suíte automatizada

77/77 verificações aprovadas.

| Área | Verificação | Resultado | Detalhe |
|---|---|---|---|
| Registro | 9 estudos registrados no JSON e exibidos na estante (nº 87 a 95) | ✔ |  |
| Registro | Títulos exibidos = títulos do JSON (conferidos antes contra o texto dos PDFs) | ✔ |  |
| Registro | Tela enxuta: só título, categorias, busca e lombadas (sem parágrafos de apoio) | ✔ |  |
| Capas | Todas as 9 capas carregam (naturalWidth > 0) na grade | ✔ |  |
| Capas | Proporção da capa preservada (aspect-ratio real do PDF) | ✔ |  |
| Filtros | Pílulas de categoria sem contadores e sem filtros avançados à vista | ✔ |  |
| Filtros | Categoria 'Infraestrutura e logística' → 2 estudos (multi-categoria) | ✔ |  |
| Filtros | Um estudo aparece em mais de uma categoria (Novas Ameaças em 3) | ✔ |  |
| Filtros | 'Todos' restaura 9 | ✔ |  |
| Filtros | Indicador deslizante acompanha a pílula ativa | ✔ |  |
| Filtros | Ano 2025 → apenas Rematamento Produtivo | ✔ |  |
| Filtros | Território 'Pará' → Mesas Executivas; 'Brasil' → IPS | ✔ |  |
| Filtros | Instituição 'Imazon' → estudos com Imazon | ✔ |  |
| Busca | Por título ('pimenta') → 1 resultado | ✔ |  |
| Busca | Por autor sem acento ('assuncao') → Amazônia em Foco | ✔ |  |
| Busca | Por autor ('Frischtak') → 2 estudos | ✔ |  |
| Busca | Por instituição ('Norsk Hydro') → Mesas Executivas | ✔ |  |
| Busca | Por palavra-chave ('mandioca') → Agricultura | ✔ |  |
| Busca | Insensível a caixa/acentos e prioriza a frase exata ('AMAZONIA EM FOCO') | ✔ |  |
| Filtros combinados | Categoria + busca + ano combinam (Governança + 'pinto' + 2026 → 2) | ✔ |  |
| Filtros combinados | Combinação sem resultado mostra estado vazio com botão de limpar | ✔ |  |
| Filtros combinados | 'Limpar filtros' zera tudo e volta a 9 | ✔ |  |
| Filtros | Filtros refletidos na URL e restaurados ao recarregar | ✔ |  |
| Ordenação | Ordenar por título A–Z e por ano | ✔ |  |
| Detalhe | Ficha mínima de “As portas de entrada do emprego formal na Am…”: título, autores, ano e um único botão | ✔ |  |
| Ler estudo | Link oficial correto, em nova aba e com rel seguro (portas-entrada-emprego-formal) | ✔ |  |
| Detalhe | Ficha mínima de “Índice de Progresso Social Brasil 2026…”: título, autores, ano e um único botão | ✔ |  |
| Ler estudo | Link oficial correto, em nova aba e com rel seguro (ips-brasil-2026) | ✔ |  |
| Detalhe | Ficha mínima de “Rematamento Produtivo, Conservação e Desenvo…”: título, autores, ano e um único botão | ✔ |  |
| Ler estudo | Link oficial correto, em nova aba e com rel seguro (rematamento-produtivo) | ✔ |  |
| Detalhe | Ficha mínima de “Agricultura na Amazônia Legal…”: título, autores, ano e um único botão | ✔ |  |
| Ler estudo | Link oficial correto, em nova aba e com rel seguro (agricultura-amazonia-legal) | ✔ |  |
| Detalhe | Ficha mínima de “Fatos da Amazônia 2026…”: título, autores, ano e um único botão | ✔ |  |
| Ler estudo | Link oficial correto, em nova aba e com rel seguro (fatos-da-amazonia-2026) | ✔ |  |
| Detalhe | Ficha mínima de “Novas Ameaças ao Desmatamento da Amazônia…”: título, autores, ano e um único botão | ✔ |  |
| Ler estudo | Link oficial correto, em nova aba e com rel seguro (novas-ameacas-desmatamento) | ✔ |  |
| Detalhe | Ficha mínima de “Amazônia em Foco…”: título, autores, ano e um único botão | ✔ |  |
| Ler estudo | Link oficial correto, em nova aba e com rel seguro (amazonia-em-foco) | ✔ |  |
| Detalhe | Ficha mínima de “Mesas Executivas…”: título, autores, ano e um único botão | ✔ |  |
| Ler estudo | Link oficial correto, em nova aba e com rel seguro (mesas-executivas-pimenta-do-reino) | ✔ |  |
| Detalhe | Ficha mínima de “Planejamento e Priorização de Obras de Infra…”: título, autores, ano e um único botão | ✔ |  |
| Ler estudo | Link oficial correto, em nova aba e com rel seguro (planejamento-obras-transportes) | ✔ |  |
| Ler estudo | Nenhum 'Baixar PDF' na interface e nenhum PDF local requisitado | ✔ |  |
| Ler estudo | O clique abre a URL oficial do estudo em nova aba (requisição interceptada) | ✔ |  |
| Registro | Fatos da Amazônia 2026 (nº 91) está na estante, com capa e ficha | ✔ |  |
| Detalhe | Resumo curto termina em frase completa (sem cortar em separador de milhar) | ✔ |  |
| Rotas | Link direto #/estudo/<id> abre a ficha; id inexistente volta à lista | ✔ |  |
| Rotas | Clique no fundo da ficha fecha o diálogo | ✔ |  |
| Paleta | Tema claro usa o fundo creme e o verde do site do Amazônia 2030; tipografia Montserrat nos títulos | ✔ |  |
| Paleta | Montserrat carrega de fato (arquivo local, sem CDN) | ✔ |  |
| Estados | Capa ausente: capa tipográfica substitui, sem imagem quebrada; o botão Ler estudo continua | ✔ |  |
| Estados | Falha ao carregar dados: mensagem e botão 'Tentar novamente' | ✔ |  |
| Estados | Estado de carregamento visível antes dos dados | ✔ |  |
| Estados | Estudo sem link oficial: ficha avisa e não mostra botão quebrado | ✔ |  |
| Escala | 210 estudos (9 + 200 clones + 1 com apenas id/título) renderizam sem alterar a UI | ✔ | 0.9 s |
| Acessibilidade | Teclado: setas movem entre lombadas; Enter puxa a capa; Tab+Enter abre; Esc fecha e devolve o foco | ✔ |  |
| Acessibilidade | Botão 'Ler estudo' é alcançável por Tab dentro da ficha | ✔ |  |
| Acessibilidade | Foco visível (outline) em lombada, pílula e campo | ✔ |  |
| Acessibilidade | Landmarks e rótulos: header, main, footer, label em todos os campos, botões com nome | ✔ |  |
| Acessibilidade | Imagens de capa têm texto alternativo descritivo | ✔ |  |
| Acessibilidade | Contraste mínimo 4.5:1 (texto e botão 'Ler estudo') nos temas claro e escuro | ✔ | {"light":{"contagem":5.29,"titulo":14.4,"pilula":1,"ink2":6.13,"muted":5.29,"mutedSuperficie":5.63,"botao":5.17},"dark":{"contagem":7.06,"titulo":12.84,"pilula":12.25,"ink2":9.62,"muted":7.06,"mutedSuperficie":6.23,"botao":6.27}} |
| Acessibilidade | Tema escuro: ficha abre e mantém o botão 'Ler estudo' visível | ✔ |  |
| Responsivo | desktop-1920 (1920×1080): sem rolagem horizontal, conteúdo e filtros visíveis | ✔ |  |
| Responsivo | desktop-1920: ficha abre, cabe na tela e mostra o botão 'Ler estudo' sem rolar | ✔ |  |
| Responsivo | desktop-1440 (1440×900): sem rolagem horizontal, conteúdo e filtros visíveis | ✔ |  |
| Responsivo | desktop-1440: ficha abre, cabe na tela e mostra o botão 'Ler estudo' sem rolar | ✔ |  |
| Responsivo | notebook-1280 (1280×720): sem rolagem horizontal, conteúdo e filtros visíveis | ✔ |  |
| Responsivo | notebook-1280: ficha abre, cabe na tela e mostra o botão 'Ler estudo' sem rolar | ✔ |  |
| Responsivo | tablet-820 (820×1180): sem rolagem horizontal, conteúdo e filtros visíveis | ✔ |  |
| Responsivo | tablet-820: ficha abre, cabe na tela e mostra o botão 'Ler estudo' sem rolar | ✔ |  |
| Responsivo | tablet-paisagem-1024 (1024×768): sem rolagem horizontal, conteúdo e filtros visíveis | ✔ |  |
| Responsivo | tablet-paisagem-1024: ficha abre, cabe na tela e mostra o botão 'Ler estudo' sem rolar | ✔ |  |
| Responsivo | celular-390 (390×844): sem rolagem horizontal, conteúdo e filtros visíveis | ✔ |  |
| Responsivo | celular-390: ficha abre, cabe na tela e mostra o botão 'Ler estudo' sem rolar | ✔ |  |
| Responsivo | celular-360 (360×740): sem rolagem horizontal, conteúdo e filtros visíveis | ✔ |  |
| Responsivo | celular-360: ficha abre, cabe na tela e mostra o botão 'Ler estudo' sem rolar | ✔ |  |
| Console | Nenhum erro ou aviso no console em toda a suíte (exceto 404 provocados de propósito) | ✔ |  |

## 3. Comparação visual com a referência

A referência (layoffsandhires.com/engineering) foi usada apenas como inspiração de experiência; nenhum código, logotipo ou identidade foi copiado.

| Padrão da referência | Esta biblioteca |
|---|---|
| Estante de lombadas em perspectiva 3D | Igual em conceito: lombadas em perspectiva; a capa só aparece ao clicar no livro, com leve inclinação, cursor circular “Ver capa”/“Abrir” e vizinhos que se afastam sem ser cobertos |
| Filtros em pílulas com indicador deslizante | Igual |
| Detalhe enxuto | Ficha mínima: capa, categoria e ano, título, autores, resumo curto e um único botão “Ler estudo” |
| Tema claro/escuro | Presente, com contraste ≥ 4,5:1 verificado (texto e botão) |
| Identidade | Paleta e tipografia do site do Amazônia 2030 (Montserrat nos títulos, DM Sans no texto) e logotipo oficial no cabeçalho |

Capturas em `docs/capturas/`; todas as resoluções testadas estão em `tests/output/`.

## 4. Limitações e pontos que dependem de você

1. **Capa do nº 91 (Fatos da Amazônia 2026):** é provisória, pois a arte oficial não estava acessível ao ambiente. Para trocar, veja o README.
2. **Fonte Rubik:** a fonte do site não estava disponível no ambiente; o texto corrido usa DM Sans e os títulos usam Montserrat (mesma família dos títulos do site).
3. **Links oficiais:** foram informados pelo usuário e não são abertos pela suíte (o clique é verificado com a requisição interceptada). Confira-os no site publicado.
4. **Anos não impressos:** nº 87, 89 e 90 (fonte secundária) e nº 93 e 94 (inferidos). Confirme com a equipe.
5. **Navegadores:** a suíte rodou apenas em Chromium; toque foi emulado, sem aparelho real.
6. **Verificação de tipos:** `npm run typecheck` roda no CI com as dependências instaladas.
