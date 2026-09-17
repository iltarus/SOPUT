#!/usr/bin/env python3
"""Query the committed Komus catalog dump (data/komus-catalog.json.gz)."""

from __future__ import annotations

import argparse
import gzip
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / "data" / "komus-catalog.json.gz"


def load() -> list[dict]:
    if not FILE.exists():
        sys.stderr.write(f"catalog missing: {FILE}\n")
        sys.exit(1)
    return json.loads(gzip.open(FILE, "rt", encoding="utf-8").read())


def main() -> None:
    parser = argparse.ArgumentParser(description="Read data/komus-catalog.json.gz")
    parser.add_argument("--id", help="Komus article id")
    parser.add_argument("-q", "--query", help="substring in id, name, brand, category, path")
    parser.add_argument("--department", help="department id, e.g. print")
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--stats", action="store_true", help="counts by department")
    args = parser.parse_args()

    rows = load()
    if args.stats or not (args.id or args.query or args.department):
        counts = Counter(row["d"] for row in rows)
        json.dump(
            {"file": str(FILE.relative_to(ROOT)), "count": len(rows), "byDepartment": dict(counts.most_common())},
            sys.stdout,
            ensure_ascii=False,
            indent=2,
        )
        sys.stdout.write("\n")
        return

    matched: list[dict] = []
    needle = (args.query or "").strip().lower()
    for row in rows:
        if args.id and row["id"] != args.id:
            continue
        if args.department and row["d"] != args.department:
            continue
        if needle:
            hay = f"{row['id']} {row['n']} {row['b']} {row['c']} {row['p']}".lower()
            if needle not in hay:
                continue
        matched.append(row)
        if args.id:
            break

    payload = {"total": len(matched), "items": matched[: max(args.limit, 1)]}
    if args.id and not args.query and not args.department:
        payload = {"total": len(matched), "items": matched}
    json.dump(payload, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    if args.id and not matched:
        sys.exit(2)


if __name__ == "__main__":
    main()
