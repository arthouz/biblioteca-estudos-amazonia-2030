# Publicar no GitHub Pages

O repositório já traz o fluxo de publicação (`.github/workflows/pages.yml`): a cada `git push` na branch `main`, o GitHub instala as dependências, valida os dados, verifica os tipos, gera o site e o publica. Não é preciso rodar nada no seu computador além do `git`.

## Passo a passo

1. **Crie o repositório** em github.com → *New repository* (ex.: `biblioteca-estudos`). Deixe vazio, sem README. Para usar o GitHub Pages gratuito, o repositório precisa ser **público**.
2. **Envie os arquivos pelo `git` ou pelo GitHub Desktop** (de preferência, em vez do “Upload files” do navegador). Na pasta descompactada:
   ```bash
   git init -b main
   git add .
   git commit -m "Biblioteca de Estudos Amazônia 2030"
   git remote add origin https://github.com/SEU-USUARIO/biblioteca-estudos.git
   git push -u origin main
   ```
   O repositório é leve: não contém PDFs, apenas código, dados e capas.
3. No repositório: **Settings → Pages → Build and deployment → Source: “GitHub Actions”**.
4. Abra a aba **Actions**: o fluxo “Publicar no GitHub Pages” roda sozinho (se não rodou, clique em *Run workflow*). Em 1 a 2 minutos o endereço aparece no resumo do fluxo e em Settings → Pages:
   `https://SEU-USUARIO.github.io/biblioteca-estudos/`

Funciona em subpasta (todos os caminhos são relativos) e a navegação usa `#/`, então não precisa de configuração de rotas.

## Domínio próprio (opcional)

Em Settings → Pages → *Custom domain*, informe, por exemplo, `biblioteca.amazonia2030.org.br`, e peça à equipe de TI para criar um registro **CNAME** desse subdomínio apontando para `SEU-USUARIO.github.io`. Marque *Enforce HTTPS*.

## Atualizar a biblioteca

- Editar dados (`data/publications.json`) ou trocar capas: faça commit e `git push`; o site é republicado sozinho.
- Novo estudo: veja `docs/ADICIONAR_ESTUDOS.md`.
- **Botão “Ler estudo”:** preencha `officialUrl` em cada estudo com o link do PDF em `https://amazonia2030.org.br/…`. O botão abre esse link em nova aba, então os acessos são contados no site do Amazônia 2030. A biblioteca não hospeda nem oferece os PDFs.

## Limites do GitHub Pages

Site publicado de até 1 GB, uso recomendado de até 100 GB de tráfego por mês e 10 publicações por hora. Sem PDFs, o site publicado tem poucos MB, o que comporta centenas de estudos.
