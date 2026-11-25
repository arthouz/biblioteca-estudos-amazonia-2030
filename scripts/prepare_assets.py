#!/usr/bin/env python3
"""Prepara os ativos de cada estudo registrado em data/publications.json.

Para cada publicação:
  - copia o PDF de origem (files.source) para public/pdfs/<id>.pdf;
  - renderiza a primeira página como capa real (WebP grande e miniatura);
  - mede páginas, tamanho em bytes e SHA-256;
  - calcula a cor predominante da capa (usada na lombada da estante 3D).

Uso:  python3 scripts/prepare_assets.py --sources <pasta-com-os-PDFs> [--only <id>] [--force]
Nenhum campo editorial (título, autores, resumo...) é alterado por este script.
"""
import argparse, hashlib, json, shutil, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "publications.json"
PUB = ROOT / "public"
LARGE_W, THUMB_W = 960, 360


def dominant(img: Image.Image):
    small = img.convert("RGB").resize((96, 96))
    q = small.quantize(colors=8, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[: 8 * 3]
    counts = sorted(q.getcolors(), reverse=True)  # (count, idx)
    best, best_score = None, -1
    for cnt, idx in counts:
        r, g, b = pal[idx * 3: idx * 3 + 3]
        mx, mn = max(r, g, b), min(r, g, b)
        sat = (mx - mn) / (mx or 1)
        lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
        if lum > 0.93:  # ignora branco de fundo
            continue
        score = cnt * (0.35 + sat)
        if score > best_score:
            best, best_score = (r, g, b), score
    if best is None:
        best = (60, 60, 60)
    return best


def lum(rgb):
    def f(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sources", required=True, type=Path)
    ap.add_argument("--only")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()

    data = json.loads(DATA.read_text(encoding="utf-8"))
    (PUB / "pdfs").mkdir(parents=True, exist_ok=True)
    (PUB / "covers").mkdir(parents=True, exist_ok=True)
    problems = []
    for p in data["publications"]:
        if a.only and p["id"] != a.only:
            continue
        src = a.sources / p["files"]["source"]
        if not src.exists():
            problems.append(f"{p['id']}: PDF de origem não encontrado ({src.name})")
            continue
        dst = PUB / "pdfs" / f"{p['id']}.pdf"
        if a.force or not dst.exists() or dst.stat().st_size != src.stat().st_size:
            shutil.copyfile(src.resolve(), dst)
        h = hashlib.sha256(dst.read_bytes()).hexdigest()
        reader = PdfReader(str(dst))
        pages = len(reader.pages)
        box = reader.pages[0].mediabox
        # capa
        with tempfile.TemporaryDirectory() as td:
            subprocess.run(["pdftoppm", "-f", "1", "-l", "1", "-r", "150", "-png", str(dst), f"{td}/c"], check=True)
            png = next(Path(td).glob("c*.png"))
            im = Image.open(png).convert("RGB")
        w, hgt = im.size
        large = im.resize((LARGE_W, round(hgt * LARGE_W / w)), Image.LANCZOS)
        thumb = im.resize((THUMB_W, round(hgt * THUMB_W / w)), Image.LANCZOS)
        large.save(PUB / "covers" / f"{p['id']}.webp", "WEBP", quality=84, method=6)
        thumb.save(PUB / "covers" / f"{p['id']}-thumb.webp", "WEBP", quality=80, method=6)
        rgb = dominant(im)
        spine = "#%02x%02x%02x" % rgb
        on = "#ffffff" if lum(rgb) < 0.4 else "#0a0a0a"
        p["files"].update({
            "pdf": f"pdfs/{p['id']}.pdf",
            "bytes": dst.stat().st_size,
            "pages": pages,
            "sha256": h,
            "pageSizePt": [round(float(box.width), 1), round(float(box.height), 1)],
        })
        p["cover"] = {
            "large": f"covers/{p['id']}.webp",
            "thumb": f"covers/{p['id']}-thumb.webp",
            "width": large.size[0],
            "height": large.size[1],
            "source": "Página 1 do PDF (capa original)",
            "alt": f"Capa do estudo {p['title']}",
            "spineColor": spine,
            "spineText": on,
        }
        print(f"ok {p['id']:38s} {pages:3d} pp  {dst.stat().st_size/1e6:5.1f} MB  capa {large.size}  {spine}")
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if problems:
        print("\nPROBLEMAS:", *problems, sep="\n  ")
        sys.exit(1)


if __name__ == "__main__":
    main()
