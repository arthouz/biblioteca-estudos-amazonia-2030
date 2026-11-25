# Como adicionar, corrigir ou remover estudos

A interface não precisa de alterações: ela lê `data/publications.json` e `data/taxonomy.json` a cada carregamento.

## 1. Adicionar um estudo

1. Coloque o PDF na pasta `fontes/` (ou use o caminho direto no comando abaixo).
2. Crie o registro e os ativos:
   ```bash
   python3 scripts/add_publication.py fontes/NOVO.pdf --id novo-estudo --title "Título oficial exato" --number 96 --category governanca-politicas
   ```
   O script copia o PDF para `public/pdfs/novo-estudo.pdf`, renderiza a capa real (página 1) em `public/covers/`, mede páginas/tamanho/SHA-256, calcula a cor da lombada e cria o registro-base.
3. Abra `data/publications.json` e complete os campos (veja o esquema abaixo). O que ficar vazio aparece como “Não identificado”.
4. Valide e gere o site: `npm run check:data && npm run build`.
5. (Recomendado) Confira título e autores contra o PDF: `python3 scripts/check_against_pdfs.py`.

Se o PDF for atualizado, rode `python3 scripts/prepare_assets.py --sources fontes --only <id> --force` para refazer cópia, capa e medidas.

## 2. Esquema de um registro (resumo)

| Campo | Observação |
|---|---|
| `id` | minúsculas, números e hífens; usado na URL `#/estudo/<id>` e nos nomes de arquivo |
| `title`, `subtitle` | exatamente como na capa |
| `authors[]` | `{ name, affiliation }` como impressos no PDF; `affiliation: null` se não houver |
| `year` + `yearBasis` | `impresso`, `fonte-secundaria` ou `inferido`. Anos não impressos recebem asterisco na interface |
| `analysisPeriod` | período dos dados analisados (não confundir com o ano de publicação) |
| `institutions[]` | `{ name, role }` — `publicação`/`realização`/`parceiro` ou `afiliação…` |
| `categories` | `primary` + `secondary[]`, usando ids de `taxonomy.json` |
| `territories[]` | alimenta o filtro “Território” |
| `keywords` + `keywordsSource` | `oficial` (impressas no PDF) ou `aplicacao` (elaboradas) |
| `summary.synthesis` / `summary.official` | síntese da biblioteca **e** trecho oficial (`{ text, page }`), sempre separados |
| `questions`, `methods`, `findings` | listas curtas, só o que o PDF afirma |
| `identifier` | DOI/ISBN/URL e `source` (de onde veio). Nunca preencha o que não foi encontrado |
| `officialUrl` | URL do estudo no site do Amazônia 2030. Se preenchida, o botão de download redireciona para ela (nova aba), contando o download lá. Vazio = baixa o PDF hospedado |
| `relatedVersions[]` | outras versões/estudos relacionados, com a referência |
| `unidentified[]`, `notes[]` | lista do que não foi identificado e observações documentais |

Regras de fidelidade: não inventar autores, datas, instituições, métodos ou resultados; não atribuir a um estudo informação de outro; marcar o que for inferência.

## 3. Nova categoria

Acrescente um item em `data/taxonomy.json` (`id`, `label`, `description`) e use o `id` nos estudos. Categorias sem nenhum estudo não aparecem nos filtros. Mantenha a taxonomia derivada do que os documentos de fato tratam.

## 4. Corrigir ou remover

Edite o JSON e rode `npm run build`. Para remover, apague o registro e, se quiser, os arquivos em `public/pdfs/` e `public/covers/`.

## 5. Capa que não pôde ser extraída

Omita `cover` do registro: a interface mostra uma capa tipográfica (título e número), sem imagem inventada. Também é possível salvar manualmente uma imagem em `public/covers/<id>.webp` e `<id>-thumb.webp` e preencher `cover` (largura, altura, `alt`, `spineColor`, `spineText`).

## 6. Escala

A estante rola horizontalmente e a grade lista todos os cards; a busca e os filtros rodam no navegador. A suíte de testes carrega 209 registros sem problemas. Para centenas de estudos, a grade é o modo recomendado; para milhares, seria necessário paginar ou indexar no servidor.
