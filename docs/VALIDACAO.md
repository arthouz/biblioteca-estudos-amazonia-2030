# Relatório de validação

Data da execução: 25/11/2026 · Ambiente: Chromium (Playwright 1.63) sobre o `dist/` servido localmente com suporte a HTTP Range · Suíte: `tests/run.mjs` (executada três vezes na versão final; última execução: **81/81 aprovadas**, sem erros de console).

## 1. Fidelidade documental

| Verificação | Método | Resultado |
|---|---|---|
| 8 estudos registrados | contagem no JSON e na interface (estante e grade) | 8 / 8 |
| Títulos e subtítulos iguais aos das capas | `scripts/check_against_pdfs.py`: cada palavra do título/subtítulo é procurada nas 6 primeiras páginas do PDF | 8/8 conferem |
| Autores constam no PDF | mesmo script, busca do nome completo no texto do PDF | 8/8 conferem |
| Capa correta de cada estudo | extração da página 1 de cada PDF; contact sheet conferido visualmente (capa × número da série × título) | 8/8 |
| Ano de publicação ≠ período analisado | campos separados (`year` × `analysisPeriod`) | ok |
| Anos não impressos sinalizados | asterisco na estante, grade, legenda e ficha, com a base (fonte secundária ou inferido) | 3 anos impressos (nº 88, 92, 95); 5 não impressos (nº 87, 89, 90, 93, 94), todos marcados com asterisco e base declarada |
| Síntese × resumo oficial | rótulo fixo “Síntese da biblioteca… não é o resumo oficial”; trecho oficial separado, com página (quando existe) | ok |
| Dados ausentes | “Não identificado” em itálico + lista “Não identificado neste PDF” na ficha | ok |

Detalhe por estudo: `docs/INVENTARIO.md`.

## 2. Resultado da suíte automatizada

81/81 verificações aprovadas.

| Área | Verificação | Resultado | Detalhe |
|---|---|---|---|
| Registro | 8 estudos registrados no JSON e exibidos na estante | ✔ |  |
| Registro | Títulos exibidos = títulos do JSON (conferidos antes contra o texto dos PDFs) | ✔ |  |
| Registro | Hero informa 8 publicações e período 2025–2026 | ✔ |  |
| Capas | Todas as 8 capas reais carregam (naturalWidth > 0) na grade | ✔ |  |
| Capas | Proporção da capa preservada (aspect-ratio real do PDF) | ✔ |  |
| Filtros | Contagens por categoria batem com o JSON (primária ou secundária) | ✔ |  |
| Filtros | Categoria 'Infraestrutura e logística' → 2 estudos (multi-categoria) | ✔ |  |
| Filtros | Um estudo aparece em mais de uma categoria (Novas Ameaças em 3) | ✔ |  |
| Filtros | 'Todos' restaura 8 | ✔ |  |
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
| Filtros combinados | 'Limpar filtros' zera tudo e volta a 8 | ✔ |  |
| Filtros | Filtros refletidos na URL e restaurados ao recarregar | ✔ |  |
| Ordenação | Ordenar por título A–Z e por ano | ✔ |  |
| Detalhe | Ficha de “As portas de entrada do emprego formal na Amazôn…” abre com dados corretos | ✔ |  |
| PDF | Link de PDF e download funcionam (portas-entrada-emprego-formal) | ✔ |  |
| Detalhe | Ficha de “Índice de Progresso Social Brasil 2026…” abre com dados corretos | ✔ |  |
| PDF | Link de PDF e download funcionam (ips-brasil-2026) | ✔ |  |
| Detalhe | Ficha de “Rematamento Produtivo, Conservação e Desenvolvim…” abre com dados corretos | ✔ |  |
| PDF | Link de PDF e download funcionam (rematamento-produtivo) | ✔ |  |
| Detalhe | Ficha de “Agricultura na Amazônia Legal…” abre com dados corretos | ✔ |  |
| PDF | Link de PDF e download funcionam (agricultura-amazonia-legal) | ✔ |  |
| Detalhe | Ficha de “Novas Ameaças ao Desmatamento da Amazônia…” abre com dados corretos | ✔ |  |
| PDF | Link de PDF e download funcionam (novas-ameacas-desmatamento) | ✔ |  |
| Detalhe | Ficha de “Amazônia em Foco…” abre com dados corretos | ✔ |  |
| PDF | Link de PDF e download funcionam (amazonia-em-foco) | ✔ |  |
| Detalhe | Ficha de “Mesas Executivas…” abre com dados corretos | ✔ |  |
| PDF | Link de PDF e download funcionam (mesas-executivas-pimenta-do-reino) | ✔ |  |
| Detalhe | Ficha de “Planejamento e Priorização de Obras de Infraestr…” abre com dados corretos | ✔ |  |
| PDF | Link de PDF e download funcionam (planejamento-obras-transportes) | ✔ |  |
| Detalhe | Download real do PDF (evento de download, Mesas Executivas) | ✔ |  |
| Links externos | DOIs só aparecem quando existem; abrem em nova aba com rel seguro | ✔ |  |
| Metadados | Campos ausentes aparecem como 'Não identificado' (DOI de Amazônia em Foco) | ✔ |  |
| Metadados | Trecho oficial é exibido separado da síntese (IPS Brasil) | ✔ |  |
| Detalhe | Navegação anterior/próximo dentro da ficha | ✔ |  |
| Rotas | Link direto #/estudo/<id> abre a ficha; id inexistente volta à lista | ✔ |  |
| Leitor PDF | Abre e renderiza a página 1 (portas-entrada-emprego-formal) | ✔ | primeira página em 1.6 s |
| Leitor PDF | Troca de página (botão e teclado) e zoom | ✔ |  |
| Leitor PDF | Esc fecha só o leitor e volta à ficha (portas-entrada-emprego-formal); Esc seguinte fecha a ficha | ✔ |  |
| Leitor PDF | Abre e renderiza a página 1 (rematamento-produtivo) | ✔ | primeira página em 0.7 s |
| Leitor PDF | Esc fecha só o leitor e volta à ficha (rematamento-produtivo); Esc seguinte fecha a ficha | ✔ |  |
| Estados | PDF indisponível: aviso claro, sem botões de leitura/download | ✔ |  |
| Estados | Capa ausente: capa tipográfica substitui, sem imagem quebrada | ✔ |  |
| Estados | Falha ao carregar dados: mensagem e botão 'Tentar novamente' | ✔ |  |
| Estados | Estado de carregamento visível antes dos dados | ✔ |  |
| Escala | 208 estudos (200 clones + 1 com apenas id/título) renderizam sem alterar a UI | ✔ | 0.5 s |
| Download oficial | Com officialUrl, o botão vira link externo (nova aba, rel seguro) e o PDF local não é oferecido para baixar | ✔ |  |
| Download oficial | O clique abre a URL oficial em nova aba (requisição interceptada) | ✔ |  |
| Download oficial | No leitor de PDF o botão 'Baixar' também leva ao site oficial | ✔ |  |
| Acessibilidade | Teclado: setas movem entre lombadas; Enter abre; Esc fecha e devolve o foco | ✔ |  |
| Acessibilidade | Foco visível (outline) em lombada, pílula e campo | ✔ |  |
| Acessibilidade | Landmarks e rótulos: header, main, footer, label em todos os campos, botões com nome | ✔ |  |
| Acessibilidade | Imagens de capa têm texto alternativo descritivo | ✔ |  |
| Acessibilidade | Contraste mínimo 4.5:1 do texto principal e secundário (claro e escuro) | ✔ | {"light":{"ink":8.81,"muted":5.33,"title":16.35,"eyebrow":5.33},"dark":{"ink":11.45,"muted":7.48,"title":16.36,"eyebrow":7.48}} |
| Acessibilidade | Diálogo 'Sobre os dados' abre e fecha por teclado | ✔ |  |
| Responsivo | desktop-1920 (1920×1080): sem rolagem horizontal, conteúdo e filtros visíveis | ✔ |  |
| Responsivo | desktop-1920: ficha de detalhe abre e cabe na largura | ✔ |  |
| Responsivo | desktop-1440 (1440×900): sem rolagem horizontal, conteúdo e filtros visíveis | ✔ |  |
| Responsivo | desktop-1440: ficha de detalhe abre e cabe na largura | ✔ |  |
| Responsivo | notebook-1280 (1280×720): sem rolagem horizontal, conteúdo e filtros visíveis | ✔ |  |
| Responsivo | notebook-1280: ficha de detalhe abre e cabe na largura | ✔ |  |
| Responsivo | tablet-820 (820×1180): sem rolagem horizontal, conteúdo e filtros visíveis | ✔ |  |
| Responsivo | tablet-820: ficha de detalhe abre e cabe na largura | ✔ |  |
| Responsivo | tablet-paisagem-1024 (1024×768): sem rolagem horizontal, conteúdo e filtros visíveis | ✔ |  |
| Responsivo | tablet-paisagem-1024: ficha de detalhe abre e cabe na largura | ✔ |  |
| Responsivo | celular-390 (390×844): sem rolagem horizontal, conteúdo e filtros visíveis | ✔ |  |
| Responsivo | celular-390: ficha de detalhe abre e cabe na largura | ✔ |  |
| Responsivo | celular-360 (360×740): sem rolagem horizontal, conteúdo e filtros visíveis | ✔ |  |
| Responsivo | celular-360: ficha de detalhe abre e cabe na largura | ✔ |  |
| Responsivo | Celular: leitor de PDF abre e renderiza | ✔ |  |
| Console | Nenhum erro ou aviso no console em toda a suíte (exceto 404 provocados de propósito) | ✔ |  |

Avisos de console ignorados (404/500 provocados por testes de erro): 4
## 3. Comparação visual com a referência

A referência (layoffsandhires.com/engineering) foi inspecionada ao vivo no navegador embutido no início do trabalho; não foi possível carregá-la pelo shell do ambiente de construção, por isso a comparação abaixo é de **padrões de experiência**, não de pixels.

| Padrão da referência | Esta biblioteca |
|---|---|
| Estante de lombadas em perspectiva 3D, cada livro girado 90° | Igual em conceito: lombadas em `perspective: 2200px`, ponto de fuga que acompanha o centro da área visível; ao passar o cursor/foco o livro avança e abre, mostrando a capa real |
| Faixa numerada de cor, título vertical e autor na lombada | Faixa numerada com a cor predominante da capa real, título vertical em serifa, autor em caixa-alta e ano |
| Filtros em pílulas com indicador preto deslizante | Igual; as pílulas quebram em duas linhas quando necessário (a taxonomia tem 6 categorias com nomes longos) |
| Setas de navegação e cursor “Abrir” (desktop) | Igual; o cursor só aparece com mouse |
| Detalhe em tela cheia, 2 colunas, uma coluna abaixo de 1024 px | Igual (capa grande à esquerda; ficha à direita) |
| URL própria por item | Adaptada para hash (`#/estudo/<id>`), que funciona em hospedagem estática sem configuração |
| Tema claro/escuro | Presente, com contraste verificado |
| Identidade | Original: papel off-white, tipografia Fraunces + DM Sans, cores sóbrias, logotipo oficial do Amazônia 2030 no cabeçalho; sem logotipo, código ou ilustração da referência e sem clichês amazônicos |

Acréscimos funcionais pedidos no briefing e ausentes na referência: busca livre, filtros de ano/território/instituição, modo Grade, leitor de PDF, download, indicação de proveniência dos dados e estados de erro/vazio/carregamento.

Capturas em `docs/capturas/` (desktop, tablet, celular, ficha, leitor, tema escuro, estados vazio e de PDF indisponível). Todas as resoluções testadas estão em `tests/output/`.

## 4. Limitações e pontos que dependem de você

1. **DOIs e links externos:** o fluxo de build não acessa a internet; numa checagem posterior pelo buscador web, os DOIs do nº 87 e do nº 89 redirecionaram para o PDF em amazonia2030.org.br e o link curto do nº 92 para a página da CPI; os DOIs dos nº 88 e 90 não abriram nessa checagem (não confirmados). Nos testes automatizados, só foi possível verificar que o link é montado corretamente e abre em nova aba com `rel="noopener noreferrer"`. Os DOIs vêm da lista de *Fatos da Amazônia 2026* (fonte secundária) e **precisam ser clicados e confirmados antes da publicação**. O link `bit.ly` do estudo nº 92 foi extraído de uma citação em outro PDF, também sem verificação online.
2. **Anos não impressos:** nº 87, 89 e 90 (fonte secundária) e nº 93 e 94 (inferidos). Confirme com a equipe.
3. **Navegadores:** a suíte rodou apenas em Chromium. O código usa recursos presentes em Chrome, Edge, Firefox e Safari recentes (`<dialog>`, `inert`, `color-mix`, CSS 3D), mas Firefox e Safari não foram exercitados. Toque foi emulado, sem aparelho físico.
4. **Verificação de tipos:** `tsc` passou com um arquivo de declarações mínimo para React, porque `@types/react` não estava instalado e o ambiente não tem rede. Ao rodar `npm install`, `npm run typecheck` usa os tipos oficiais; um ajuste menor pode aparecer.
5. **Desempenho com PDFs grandes:** localmente a primeira página do PDF de 31 MB aparece em menos de 1 s porque o servidor de teste suporta Range. Em produção isso depende de a hospedagem suportar Range. O total de PDFs é de 97 MB (pasta `dist/` com 107 MB).
6. **Rematamento Produtivo:** o PDF recebido tem data de geração posterior ao ano da lista (2025) e imprime só um autor; a ficha segue o PDF e registra a divergência.
7. **Celular:** a estante 3D funciona, mas o padrão é a Grade, por usabilidade; o efeito de abertura por hover é desligado em telas pequenas.
