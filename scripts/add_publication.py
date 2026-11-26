#!/usr/bin/env python3
"""Cria o registro-base de um novo estudo em data/publications.json e prepara a capa (o PDF fica só em fontes/, fora do site).

Uso:
  python3 scripts/add_publication.py caminho/arquivo.pdf --id meu-estudo --title "Título oficial" --number 96 \
      --category governanca-politicas

Depois, abra data/publications.json e complete autores, ano (com yearBasis), instituições, resumo etc.
Campos que você não preencher aparecem na interface como "Não identificado".
"""
import argparse, json, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("pdf", type=Path)
ap.add_argument("--id", required=True)
ap.add_argument("--title", required=True)
ap.add_argument("--number", type=int)
ap.add_argument("--category", required=True)
a = ap.parse_args()

tax = [c["id"] for c in json.loads((ROOT / "data/taxonomy.json").read_text(encoding="utf-8"))["categories"]]
if a.category not in tax:
    sys.exit(f"Categoria '{a.category}' não existe em data/taxonomy.json. Existentes: {', '.join(tax)}")
path = ROOT / "data/publications.json"
data = json.loads(path.read_text(encoding="utf-8"))
if any(p["id"] == a.id for p in data["publications"]):
    sys.exit(f"Já existe um estudo com id '{a.id}'.")
src_dir = ROOT / "fontes"; src_dir.mkdir(exist_ok=True)
shutil.copyfile(a.pdf, src_dir / a.pdf.name)
data["publications"].append({
    "id": a.id, "number": a.number, "title": a.title, "subtitle": None, "authors": [], "year": None, "yearBasis": None,
    "institutions": [], "funders": [], "series": None, "categories": {"primary": a.category, "secondary": []},
    "territories": [], "keywords": [], "keywordsSource": None,
    "summary": {"synthesis": None, "official": None}, "questions": [], "methods": [], "findings": [],
    "identifier": {"doi": None, "isbn": None, "url": None, "source": "Não identificado"},
    "relatedVersions": [], "officialUrl": None,  # preencha com o link do estudo em https://amazonia2030.org.br/ (botão "Ler estudo")
    "files": {"source": a.pdf.name}, "unidentified": ["autores", "ano", "instituições", "resumo"], "notes": [],
})
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
subprocess.run([sys.executable, str(ROOT / "scripts/prepare_assets.py"), "--sources", str(src_dir), "--only", a.id], check=True)
print(f"\nRegistro criado. Complete os metadados em data/publications.json e rode: npm run check:data && npm run build")
