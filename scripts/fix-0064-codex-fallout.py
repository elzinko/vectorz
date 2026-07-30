#!/usr/bin/env python3
"""Fix migration fallout from 0064 Codex findings (one-shot, post-migration)."""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
remap = json.loads((ROOT / "features/MIGRATION-0064-remap.json").read_text())["collisions"]
rev = {v: k for k, v in remap.items()}


def rel(from_file: Path, to_file: Path) -> str:
    return os.path.relpath(to_file, from_file.parent)


def fix_headings() -> list[tuple[str, str, str]]:
    fixed: list[tuple[str, str, str]] = []
    for p in (ROOT / "features").rglob("*.md"):
        text = p.read_text(errors="replace")
        m = re.search(r"^id:\s*(\d{4})\s*$", text, re.M)
        if not m:
            continue
        cur = m.group(1)

        def repl(match: re.Match[str], cur_id: str = cur, path: Path = p) -> str:
            if match.group(1) != cur_id:
                fixed.append((str(path.relative_to(ROOT)), match.group(1), cur_id))
                return f"# {cur_id}{match.group(2)}"
            return match.group(0)

        new = re.sub(r"^# (\d{4})(\b.*)$", repl, text, count=1, flags=re.M)
        if new != text:
            p.write_text(new)
    return fixed


def fix_links() -> tuple[list[tuple[str, str, str]], list[tuple[str, str]]]:
    adr_dir = ROOT / "products/mega-city/docs/adr"
    adr_by_slug = {p.name.split("-", 1)[1]: p.name for p in adr_dir.glob("[0-9]*.md")}
    pat = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")
    link_fixes: list[tuple[str, str, str]] = []
    mc_prefixes = {
        "../agents/": "products/mega-city/agents/",
        "../bin/": "products/mega-city/bin/",
        "../skills/": "products/mega-city/skills/",
        "../src/": "products/mega-city/src/",
    }

    files = list((ROOT / "features").rglob("*.md")) + list((ROOT / "docs/adr").rglob("*.md"))
    for p in files:
        text = p.read_text(errors="replace")
        rel_p = p.relative_to(ROOT)
        in_done = rel_p.parts[:2] == ("features", "done")
        file_fixes: list[tuple[str, str]] = []

        def resolve(href: str) -> str | None:
            target = (p.parent / href).resolve()
            if target.exists():
                return None

            # Wrongly remapped mega-city ADR numbers under docs/adr/
            m = re.match(r"^((?:\.\./)+docs/adr/)(\d{4})-(.+)$", href)
            if m and m.group(2) in rev:
                slug = m.group(3)
                real_name = adr_by_slug.get(slug)
                if real_name:
                    return rel(p, ROOT / "products/mega-city/docs/adr" / real_name)

            for old_pref, new_tail in mc_prefixes.items():
                if href.startswith(old_pref):
                    return rel(p, ROOT / new_tail / href[len(old_pref) :])

            if href.startswith("../../../features/"):
                name = href[len("../../../features/") :]
                if name.startswith("0154-release-pastille"):
                    name = "0050-release-pastille-dogfooding.md"
                for cand in (ROOT / "features" / name, ROOT / "features/done" / name):
                    if cand.exists():
                        return rel(p, cand)

            if href.startswith("../../../docs/adr/"):
                name = href[len("../../../docs/adr/") :]
                cand = ROOT / "docs/adr" / name
                if cand.exists():
                    return rel(p, cand)

            if re.match(r"^\d{4}-.+\.md$", href):
                cand = ROOT / "features/done" / href
                if cand.exists():
                    return rel(p, cand)

            if "products/mega-city/features/" in href:
                name = Path(href).name
                for cand in (ROOT / "features" / name, ROOT / "features/done" / name):
                    if cand.exists():
                        return rel(p, cand)
                mid = name[:4]
                if mid in remap:
                    new_name = remap[mid] + name[4:]
                    for cand in (
                        ROOT / "features" / new_name,
                        ROOT / "features/done" / new_name,
                    ):
                        if cand.exists():
                            return rel(p, cand)

            if re.match(r"^(\.\./)+docs/adr/", href):
                name = Path(href).name
                mid = name[:4] if re.match(r"^\d{4}-", name) else None
                if mid and mid in rev:
                    name = rev[mid] + name[4:]
                cand = ROOT / "products/mega-city/docs/adr" / name
                if cand.exists():
                    return rel(p, cand)

            return None

        def sub(match: re.Match[str]) -> str:
            label, href_raw = match.group(1), match.group(2)
            href = href_raw.split("#")[0].split(" ")[0].strip()
            frag = ""
            first = href_raw.split(" ")[0]
            if "#" in first:
                frag = "#" + first.split("#", 1)[1]
            title_suf = ""
            if " " in href_raw:
                title_suf = " " + href_raw.split(" ", 1)[1]
            if not href or href.startswith(("http://", "https://", "mailto:")):
                return match.group(0)
            if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", href):
                return match.group(0)
            new_href = resolve(href)
            if new_href and new_href != href:
                file_fixes.append((href, new_href))
                return f"[{label}]({new_href}{frag}{title_suf})"
            return match.group(0)

        new = pat.sub(sub, text)
        if new != text:
            p.write_text(new)
            for a, b in file_fixes:
                link_fixes.append((str(rel_p), a, b))

    broken: list[tuple[str, str]] = []
    for p in files:
        text = p.read_text(errors="replace")
        for m in pat.finditer(text):
            href = m.group(2).split("#")[0].split(" ")[0].strip()
            if not href or href.startswith(("http://", "https://", "mailto:")):
                continue
            if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", href):
                continue
            if not (p.parent / href).resolve().exists():
                broken.append((str(p.relative_to(ROOT)), href))
    return link_fixes, broken


def fix_bare_ids_in_remapped_cards() -> list[tuple[str, str, str]]:
    """Rewrite explicit cross-refs in remapped mega-city cards.

    Conservative: only `fiche NNNN`, markdown `#NNNN` (not headings — already
    fixed), and `mc-NNNN` when NNNN is a collision id. Skips NNNN-slug filenames.
    """
    changes: list[tuple[str, str, str]] = []
    for new_id, old_id in rev.items():
        matches = list((ROOT / "features").rglob(f"{new_id}-*.md"))
        if not matches:
            continue
        p = matches[0]
        text = p.read_text(errors="replace")
        parts = text.split("---", 2)
        if len(parts) < 3:
            continue
        fm, body = parts[1], parts[2]

        def bare_remap(m: re.Match[str]) -> str:
            oid = m.group(2)
            if oid in remap and oid != remap[oid]:
                return f"{m.group(1)}{remap[oid]}"
            return m.group(0)

        # fiche 0034 | mc-0034 | (#0034) — not # 0034 headings (space after #)
        new_body, n = re.subn(
            r"(fiche\s+|mc-|(?<!\n)#)(\d{4})\b(?!-)",
            bare_remap,
            body,
        )
        if n:
            changes.append((str(p.relative_to(ROOT)), f"cross-ref×{n}", f"{old_id} card"))
            p.write_text(f"---{fm}---{new_body}")
    return changes


def main() -> None:
    h = fix_headings()
    print(f"1. headings fixed: {len(h)}")
    for row in h:
        print(f"   {row[0]}: #{row[1]} → #{row[2]}")

    links, broken = fix_links()
    print(f"2. links fixed: {len(links)}")
    for row in links:
        print(f"   {row[0]}: {row[1]} → {row[2]}")
    print(f"2b. remaining broken: {len(broken)}")
    for row in broken:
        print(f"   {row[0]}: {row[1]}")

    bare = fix_bare_ids_in_remapped_cards()
    print(f"3. bare-id cross-refs: {len(bare)}")
    for row in bare:
        print(f"   {row[0]}: {row[1]} ({row[2]})")

    _, broken2 = fix_links()
    print(f"4. remaining broken: {len(broken2)}")
    for row in broken2:
        print(f"   {row[0]}: {row[1]}")


if __name__ == "__main__":
    main()
