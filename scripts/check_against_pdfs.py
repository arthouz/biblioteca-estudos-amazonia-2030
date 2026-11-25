#!/usr/bin/env python3
"""Confere se título, subtítulo e autores de cada ficha aparecem no texto do respectivo PDF."""
import json, re, subprocess, sys, unicodedata
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
def n(s): return re.sub(r"[^a-z0-9]+", " ", unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()).strip()
bad = 0
for p in json.loads((ROOT / "data/publications.json").read_text(encoding="utf-8"))["publications"]:
    src = ROOT / "public" / p["files"]["pdf"]
    first = n(subprocess.run(["pdftotext", "-f", "1", "-l", "6", str(src), "-"], capture_output=True, text=True).stdout)
    full = n(subprocess.run(["pdftotext", str(src), "-"], capture_output=True, text=True).stdout)
    miss = [w for w in n(p["title"] + " " + (p["subtitle"] or "")).split() if len(w) > 3 and w not in first]
    am = [a["name"] for a in p["authors"] if n(a["name"]) not in full]
    ok = not miss and not am
    bad += not ok
    print(("OK   " if ok else "FALHA"), p["id"], miss or "", am or "")
sys.exit(1 if bad else 0)
