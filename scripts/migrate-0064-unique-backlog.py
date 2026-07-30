#!/usr/bin/env python3
"""One-shot migration 0064 — dual backlog → single features/ + product: field.

Deterministic: colliding mega-city ids remap to 0106+ in ascending old-id order.
Does NOT commit; uses `git mv` when available.

Post-migration fallout (Codex PR #66) is fixed by `scripts/fix-0064-codex-fallout.py`:
  - bare IDs in headings / « fiche NNNN » cross-refs
  - relative links rebased from products/mega-city/features/ → features/
  - pre-ship paths for 0094/0095 (active → done) for inbound ADR rewrites
  - mega-city ADR filenames must NOT be remapped (only feature ids collide)
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FEATURES = ROOT / "features"
MC_FEATURES = ROOT / "products" / "mega-city" / "features"
REMAP_OUT = FEATURES / "MIGRATION-0064-remap.json"


def git_mv(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        ["git", "mv", str(src), str(dst)],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        # fallback for untracked
        src.rename(dst)


def collect(base: Path) -> dict[str, Path]:
    out: dict[str, Path] = {}
    for p in base.rglob("[0-9]*.md"):
        m = re.match(r"(\d{4})-", p.name)
        if not m:
            continue
        out[m.group(1)] = p
    return out


def split_fm(text: str) -> tuple[str, str, str]:
    if not text.startswith("---"):
        raise ValueError("missing front-matter")
    end = text.find("\n---", 3)
    if end < 0:
        raise ValueError("unclosed front-matter")
    return text[:3], text[3:end], text[end:]  # '---', body, '\n---...'


def set_fm_field(fm: str, key: str, value: str) -> str:
    """Set or insert a YAML scalar field in front-matter body (no leading/trailing ---)."""
    pattern = re.compile(rf"^{re.escape(key)}:.*$", re.M)
    line = f"{key}: {value}" if value != "" else f"{key}:"
    if pattern.search(fm):
        return pattern.sub(line, fm, count=1)
    # insert after priority: if present, else after title:, else at top
    for anchor in ("priority:", "title:", "id:"):
        m = re.search(rf"^{anchor}.*$", fm, re.M)
        if m:
            i = m.end()
            return fm[:i] + "\n" + line + fm[i:]
    return line + "\n" + fm


def ensure_product(fm: str, product: str) -> str:
    if re.search(r"^product:", fm, re.M):
        return set_fm_field(fm, "product", product)
    return set_fm_field(fm, "product", product)


def rewrite_text(
    text: str,
    remap: dict[str, str],
    path_moves: dict[str, str],
    *,
    rewrite_bare_filenames: bool = False,
) -> str:
    """Rewrite mc- prefixes and old mega-city paths.

    Bare `NNNN-slug` renames only when `rewrite_bare_filenames` (moved MC fiches) —
    never globally: root keeps its own colliding ids.
    """
    for old, new in sorted(path_moves.items(), key=lambda kv: -len(kv[0])):
        text = text.replace(old, new)

    def mc_sub(m: re.Match[str]) -> str:
        return remap.get(m.group(1), m.group(1))

    text = re.sub(r"\bmc-(\d{4})\b", lambda m: mc_sub(m), text)

    if rewrite_bare_filenames:
        def epic_sub(m: re.Match[str]) -> str:
            old = m.group(1)
            return f"epic: {remap.get(old, old)}"

        text = re.sub(r"^epic:\s*(\d{4})\s*$", epic_sub, text, flags=re.M)
        for old, new in remap.items():
            if old == new:
                continue
            text = re.sub(rf"\b{old}-([a-z0-9][a-z0-9-]*)", rf"{new}-\1", text)

    return text


def main() -> None:
    root_files = collect(FEATURES)
    mc_files = collect(MC_FEATURES)
    collisions = sorted(set(root_files) & set(mc_files))
    next_id = max(int(i) for i in set(root_files) | set(mc_files)) + 1
    remap: dict[str, str] = {}
    for old in collisions:
        remap[old] = f"{next_id:04d}"
        next_id += 1
    # identity for non-colliding MC ids (for uniform rewrite of mc- prefix)
    for oid in mc_files:
        remap.setdefault(oid, oid)

    # Ship 0094 / 0095 if still active (reconcile).
    # NOTE: also record the *active* path in path_moves (see fallout script) so
    # inbound links like docs/adr → products/mega-city/features/0094-… rewrite.
    for ship_id, pr in (("0094", "#54"), ("0095", "#55")):
        p = mc_files.get(ship_id)
        if p and "done" not in p.parts:
            text = p.read_text()
            _, fm, rest = split_fm(text)
            fm = set_fm_field(fm, "status", "shipped")
            fm = set_fm_field(fm, "pr", pr)
            p.write_text("---" + fm + rest)
            dest = MC_FEATURES / "done" / p.name
            git_mv(p, dest)
            mc_files[ship_id] = dest
            print(f"ship {ship_id} → done/ ({pr})")

    # Re-collect MC after ships
    mc_files = collect(MC_FEATURES)

    path_moves: dict[str, str] = {}
    moves: list[tuple[Path, Path, str, str]] = []  # src, dst, old_id, new_id

    for old_id, src in sorted(mc_files.items()):
        new_id = remap[old_id]
        in_done = "done" in src.parts
        slug = src.name[5:]  # drop NNNN-
        if old_id != new_id:
            new_name = f"{new_id}-{slug}"
        else:
            new_name = src.name
        dest_dir = FEATURES / "done" if in_done else FEATURES
        dest = dest_dir / new_name
        if dest.exists() and dest.resolve() != src.resolve():
            raise SystemExit(f"destination exists: {dest}")
        # relative path strings used in docs
        old_rel = str(src.relative_to(ROOT))
        new_rel = str(dest.relative_to(ROOT))
        path_moves[old_rel] = new_rel
        # also common relative forms from mega-city docs
        path_moves[f"../features/{src.name}"] = (
            f"../../../features/done/{new_name}" if in_done else f"../../../features/{new_name}"
        )
        moves.append((src, dest, old_id, new_id))

    # Persist remap before mutating
    REMAP_OUT.write_text(
        json.dumps(
            {
                "collisions": {k: remap[k] for k in collisions},
                "kept": sorted(i for i in mc_files if i not in collisions),
                "note": "mega-city colliding ids → 0106+; root ids unchanged",
            },
            indent=2,
            sort_keys=True,
        )
        + "\n"
    )
    print(f"remap written → {REMAP_OUT.relative_to(ROOT)} ({len(collisions)} collisions)")

    # Execute moves + rewrite each moved file
    for src, dest, old_id, new_id in moves:
        git_mv(src, dest)
        text = dest.read_text()
        _, fm, rest = split_fm(text)
        fm = set_fm_field(fm, "id", new_id)
        fm = ensure_product(fm, "mega-city")
        # fix epic: if points to remapped id
        m = re.search(r"^epic:\s*(\d{4})\s*$", fm, re.M)
        if m and m.group(1) in remap:
            fm = set_fm_field(fm, "epic", remap[m.group(1)])
        body = rest[4:] if rest.startswith("\n---") else rest  # after closing ---
        # rest is '\n---\n...' — keep structure
        full = "---" + fm + rest
        # Apply path/mc rewrites on full file (bare filenames OK — this was an MC fiche)
        full = rewrite_text(full, remap, path_moves, rewrite_bare_filenames=True)
        # ensure id/product survived rewrite of NNNN-slug in fm
        _, fm2, rest2 = split_fm(full)
        fm2 = set_fm_field(fm2, "id", new_id)
        fm2 = ensure_product(fm2, "mega-city")
        dest.write_text("---" + fm2 + rest2)
        print(f"mv {old_id} → {dest.relative_to(ROOT)}")

    # Tag root fiches with product: vectorz
    for p in FEATURES.rglob("[0-9]*.md"):
        text = p.read_text()
        try:
            _, fm, rest = split_fm(text)
        except ValueError:
            continue
        # skip if already mega-city (just moved)
        if re.search(r"^product:\s*mega-city\s*$", fm, re.M):
            continue
        fm = ensure_product(fm, "vectorz")
        # rewrite mc- refs and remapped paths inside root fiches too
        full = rewrite_text("---" + fm + rest, remap, path_moves, rewrite_bare_filenames=False)
        _, fm2, rest2 = split_fm(full)
        fm2 = ensure_product(fm2, "vectorz")
        p.write_text("---" + fm2 + rest2)

    # Also rewrite PLAN.md and other docs that reference mc- / paths
    extra_globs = [
        FEATURES / "PLAN.md",
        ROOT / "PORTFOLIO.md",
        ROOT / "README.md",
    ]
    for base in [
        ROOT / "docs",
        ROOT / "products" / "mega-city" / "docs",
        ROOT / "products" / "mega-city" / "skills",
        ROOT / "products" / "mega-city" / "src",
        ROOT / "products" / "mega-city" / "bin",
    ]:
        if base.exists():
            extra_globs.extend(base.rglob("*.md"))
            extra_globs.extend(base.rglob("*.ts"))
            extra_globs.extend(base.rglob("*.sh"))

    seen = set()
    for p in extra_globs:
        if not p.is_file():
            continue
        rp = str(p.resolve())
        if rp in seen:
            continue
        seen.add(rp)
        # skip the migration script itself and node_modules
        if "node_modules" in p.parts:
            continue
        text = p.read_text()
        new = rewrite_text(text, remap, path_moves, rewrite_bare_filenames=False)
        if new != text:
            p.write_text(new)
            print(f"rewrite {p.relative_to(ROOT)}")

    # Stub mega-city features dir
    stub = MC_FEATURES / "README.md"
    MC_FEATURES.mkdir(parents=True, exist_ok=True)
    (MC_FEATURES / "done").mkdir(exist_ok=True)
    stub.write_text(
        "# features/ (mega-city) — migrées\n\n"
        "Depuis la fiche **0064**, toutes les fiches vivent dans le backlog unique\n"
        "`features/` à la racine du monorepo, avec `product: mega-city`.\n\n"
        "Table de remap des ids collisionnants : "
        "[`features/MIGRATION-0064-remap.json`](../../../features/MIGRATION-0064-remap.json).\n"
    )
    # remove empty leftover md if any
    leftovers = [p for p in MC_FEATURES.rglob("*.md") if p.name != "README.md"]
    if leftovers:
        print("WARNING leftovers:", leftovers)

    # Uniqueness check
    ids = collect(FEATURES)
    if len(ids) != len(list(FEATURES.rglob("[0-9]*.md"))):
        # detect dupes
        from collections import Counter

        c = Counter()
        for p in FEATURES.rglob("[0-9]*.md"):
            m = re.match(r"(\d{4})-", p.name)
            if m:
                c[m.group(1)] += 1
        dups = {k: v for k, v in c.items() if v > 1}
        raise SystemExit(f"duplicate ids after migration: {dups}")
    print(f"OK unique ids: {len(ids)} fiches in features/")


if __name__ == "__main__":
    main()
