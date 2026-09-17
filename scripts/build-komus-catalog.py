#!/usr/bin/env python3
"""Build compact Komus catalog JSON from downloaded sitemaps."""

from __future__ import annotations

import collections
import gzip
import json
import re
from pathlib import Path

SRC = Path("/tmp/komus-sitemaps")
OUT = Path("/workspace/data/komus-catalog.json.gz")

LOC_RE = re.compile(r"<loc>(https://www\.komus\.ru/[^<]+)</loc>")
IMG_RE = re.compile(r"<image:loc>([^<]+)</image:loc>")
PROD_RE = re.compile(r"/katalog/(.+)/p/(\d+)/?$")

DEPT_MAP = {
    "kantstovary": "stationery",
    "ruchki-karandashi-markery": "stationery",
    "papki-i-sistemy-arkhivatsii": "stationery",
    "demonstratsionnoe-oborudovanie": "stationery",
    "bumaga-i-bumazhnye-izdeliya": "paper",
    "tekhnika": "print",
    "mebel": "furniture",
    "interer": "furniture",
    "khozyajstvennye-tovary": "cleaning",
    "upakovka-i-markirovka": "packaging",
    "tara-emkosti-khranenie": "packaging",
    "rabochaya-spetsodezhda-i-siz": "workwear",
    "produkty-pitaniya": "food",
    "tovary-dlya-torgovli": "trade",
    "otraslevye-predlozheniya": "trade",
    "tovary-dlya-ucheby-i-tvorchestva": "school",
    "posuda-i-tekstil": "kitchen",
    "tekstil": "kitchen",
    "katalog-instrumentov": "tools",
    "podarki-i-suveniry": "gifts",
    "tovary-dlya-sporta-piknika-i-otdykha": "sport",
    "tovary-dlya-doma": "home",
    "tovary-dlya-dachi-i-sada": "home",
    "dlya-ozeleneniya-i-mikroklimata-ofisa": "home",
    "novogodnie-tovary": "seasonal",
    "krasota-i-zdorove": "beauty",
    "nashi-uslugi": "other",
}

REPLACEMENTS = sorted(
    [
        ("shh", "щ"),
        ("yo", "ё"),
        ("yu", "ю"),
        ("ya", "я"),
        ("zh", "ж"),
        ("kh", "х"),
        ("ts", "ц"),
        ("ch", "ч"),
        ("sh", "ш"),
        ("eh", "э"),
        ("yj", "ый"),
        ("ij", "ий"),
        ("aya", "ая"),
        ("iya", "ия"),
        ("oe", "ое"),
        ("ie", "ие"),
        ("jo", "ё"),
        ("ju", "ю"),
        ("ja", "я"),
        ("iy", "ий"),
    ],
    key=lambda pair: -len(pair[0]),
)

LETTERS = {
    "a": "а",
    "b": "б",
    "v": "в",
    "g": "г",
    "d": "д",
    "e": "е",
    "z": "з",
    "i": "и",
    "j": "й",
    "k": "к",
    "l": "л",
    "m": "м",
    "n": "н",
    "o": "о",
    "p": "п",
    "r": "р",
    "s": "с",
    "t": "т",
    "u": "у",
    "f": "ф",
    "y": "ы",
    "c": "к",
    "h": "х",
    "w": "в",
    "x": "кс",
    "q": "к",
}

KEEP_LATIN = re.compile(
    r"^(hp|epson|brother|canon|samsung|acer|logitech|philips|lg|sony|apple|dell|"
    r"lenovo|asus|xiaomi|huawei|bosch|makita|tork|attache|brauberg|pilot|bic|"
    r"erichkrause|komus|argo|born|strike|referent|royal|clima|hisense|centek|"
    r"camelion|eureka|bagi|magic|time|colorpics|usb|hdmi|led|lcd|a3|a4|a5|"
    r"wifi|laserjet|ecotank)$",
    re.I,
)


def map_dept(parts: list[str]) -> str:
    if not parts:
        return "other"
    top = parts[0]
    if any("pozhar" in part for part in parts):
        return "safety"
    if top == "tekhnika" and len(parts) > 1:
        second = parts[1]
        if "kartridzh" in second or "ofisnaya-tekhnika" in second:
            return "print"
        if "kompyut" in second:
            return "computers"
        if "bytovaya" in second or "professional" in second:
            return "appliances"
        if "tv-audio" in second or "kommunik" in second:
            return "electronics"
        if "sistemy-kontrolya" in second:
            return "electronics"
        return "print"
    return DEPT_MAP.get(top, "other")


def detranlit_token(token: str) -> str:
    if not token:
        return token
    if KEEP_LATIN.match(token):
        return token.upper() if token.isupper() or len(token) <= 3 else token
    if re.fullmatch(r"[0-9]+(?:[.,xх×][0-9]+)*", token):
        return token.replace("x", "×")
    if re.search(r"[A-Za-z]{4,}", token) and re.search(r"[0-9]", token):
        return token
    raw = token.lower()
    out = []
    i = 0
    while i < len(raw):
        matched = False
        for src, dst in REPLACEMENTS:
            if raw.startswith(src, i):
                out.append(dst)
                i += len(src)
                matched = True
                break
        if matched:
            continue
        ch = raw[i]
        out.append(LETTERS.get(ch, ch))
        i += 1
    return "".join(out)


def slug_to_name(slug: str) -> str:
    parts = [detranlit_token(p) for p in slug.split("-") if p]
    name = " ".join(parts)
    name = re.sub(r"\s+", " ", name).strip()
    if name:
        name = name[0].upper() + name[1:]
    return name[:180]


def extract_brand(name: str) -> str:
    for token in name.split():
        if KEEP_LATIN.match(token):
            return token if token.isupper() else token[0].upper() + token[1:]
    return "Комус"


def main() -> None:
    products: dict[str, dict] = {}
    for fn in sorted(SRC.glob("*.xml"), key=lambda p: int(p.stem)):
        text = fn.read_text("utf-8", errors="ignore")
        img_by_id: dict[str, str] = {}
        for im in IMG_RE.findall(text):
            im = im.replace("https://www.komus.ruhttps://", "https://")
            m = re.search(r"/(\d+)-1-", im)
            if m:
                img_by_id[m.group(1)] = im
        for loc in LOC_RE.findall(text):
            m = PROD_RE.search(loc)
            if not m:
                continue
            path, pid = m.group(1), m.group(2)
            parts = path.split("/")
            slug = parts[-1]
            category_slug = parts[-2] if len(parts) >= 2 else parts[0]
            name = slug_to_name(slug)
            products[pid] = {
                "id": pid,
                "n": name,
                "b": extract_brand(name),
                "d": map_dept(parts[:-1]),
                "c": slug_to_name(category_slug),
                "p": "/".join(parts[:-1])[:160],
                "i": img_by_id.get(pid, ""),
            }
        print(fn.name, "running", len(products))

    rows = list(products.values())
    OUT.parent.mkdir(parents=True, exist_ok=True)
    raw = json.dumps(rows, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    OUT.write_bytes(gzip.compress(raw, compresslevel=9))
    counts = collections.Counter(r["d"] for r in rows)
    print("UNIQUE", len(rows), "gzip", OUT.stat().st_size, "raw", len(raw))
    print(dict(counts))
    print("sample", rows[0])
    print("sample", rows[3])


if __name__ == "__main__":
    main()
