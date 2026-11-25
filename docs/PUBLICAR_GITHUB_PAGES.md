# Publicar no GitHub Pages

O repositório já traz o fluxo de publicação (`.github/workflows/pages.yml`): a cada `git push` na branch `main`, o GitHub instala as dependências, valida os dados, verifica os tipos, gera o site e o publica. Não é preciso rodar nada no seu computador além do `git`.

## Passo a passo

1. **Crie o repositório** em github.com → *New repository* (ex.: `biblioteca-estudos`). Deixe vazio, sem README. Para usar o GitHub Pages gratuito, o repositório precisa ser **público**.
2. **Envie os arquivos pelo `git` ou pelo GitHub Desktop** (não pelo “Upload files” do navegador: ele recusa arquivos acima de 25 MB, e o PDF de Rematamento tem 31 MB). Na pasta descompactada:
   ```bash
   git init -b main
   git add .
   git commit -m "Biblioteca de Estudos Amazônia 2030"
   git remote add origin https://github.com/SEU-USUARIO/biblioteca-estudos.git
   git push -u origin main
   ```
   O envio tem cerca de 100 MB (os PDFs). Todos os arquivos ficam abaixo do limite de 100 MB por arquivo do GitHub.
3. No repositório: **Settings → Pages → Build and deployment → Source: “GitHub Actions”**.
4. Abra a aba **Actions**: o fluxo “Publicar no GitHub Pages” roda sozinho (se não rodou, clique em *Run workflow*). Em 1 a 2 minutos o endereço aparece no resumo do fluxo e em Settings → Pages:
   `https://SEU-USUARIO.github.io/biblioteca-estudos/`

Funciona em subpasta (todos os caminhos são relativos) e a navegação usa `#/`, então não precisa de configuração de rotas. O GitHub Pages responde a HTTP Range, que o leitor de PDF usa nos arquivos grandes.

## Domínio próprio (opcional)

Em Settings → Pages → *Custom domain*, informe, por exemplo, `biblioteca.amazonia2030.org.br`, e peça à equipe de TI para criar um registro **CNAME** desse subdomínio apontando para `SEU-USUARIO.github.io`. Marque *Enforce HTTPS*.

## Atualizar a biblioteca

- Editar dados (`data/publications.json`) ou trocar PDFs/capas: faça commit e `git push`; o site é republicado sozinho.
- Novo estudo: veja `docs/ADICIONAR_ESTUDOS.md`.
- **Botão de download pelo site do Amazônia 2030:** preencha `officialUrl` em cada estudo. Com o campo preenchido, o botão passa a ser “Baixar no site do Amazônia 2030” e abre a URL em nova aba, de modo que o download seja contado lá. Sem o campo, o botão baixa o PDF hospedado aqui. O botão “Ler PDF” continua usando o PDF local nos dois casos.

## Limites do GitHub Pages

Site publicado de até 1 GB, uso recomendado de até 100 GB de tráfego por mês e 10 publicações por hora. Os 8 PDFs somam 97 MB; com centenas de estudos, considere hospedar os PDFs em armazenamento próprio (S3/Cloudflare R2) e apontar `files.pdf` para a URL completa.
