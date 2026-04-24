"""Inter-workflow connection inference — deterministic, rule-based.

The SubRegionGraph panel renders arrows between workflows that share
context — but ``connections`` was always written as ``[]``, so the graph
displayed as isolated nodes with no narrative flow.

This module infers connections from ``skills_involved`` overlap: if two
workflows share enough skills, they are likely complementary domains
(e.g. "backend" and "devops" sharing "deploy", "logs", "monitoring").

Algorithm
---------
* For every unordered pair of workflows ``(a, b)``:
    - Compute Jaccard similarity: ``|A ∩ B| / |A ∪ B|``
    - If the overlap is below ``MIN_OVERLAP``, drop the pair
    - Else emit ``{from, to, type: 'complementary', strength: J}``
* Sort by ``(from, to)`` for stable output across runs.

Deterministic: identical input → identical output, no LLM call.
"""

from __future__ import annotations

from typing import Iterable


# Connection dict shape (``from`` is a Python keyword so we don't use
# TypedDict here). Each connection is a plain dict with keys:
#   - "from":     str  — source workflow id (lex-smaller of the pair)
#   - "to":       str  — target workflow id
#   - "type":     str  — "complementary" for this module
#   - "strength": float — rounded Jaccard similarity, 0.0–1.0

# Minimum Jaccard similarity required to emit a complementary connection.
# 0.15 ≈ 1 shared skill out of 6–7 union — enough signal to draw an arrow
# without drowning the graph in spurious pairs.
MIN_OVERLAP = 0.15


def jaccard(a: Iterable[str], b: Iterable[str]) -> float:
    """Jaccard similarity between two skill iterables.

    Empty or blank entries are dropped before comparison. If either side
    is empty the similarity is 0 (never produces a spurious connection).
    """
    set_a = {s for s in a if s and s.strip()}
    set_b = {s for s in b if s and s.strip()}
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    if union == 0:
        return 0.0
    return intersection / union


def infer_connections(workflows: list[dict]) -> list[dict]:
    """Infer connections from a workflows list.

    Pure function — takes the current map's workflows slice and returns
    the connections that should replace ``map["connections"]``. Never
    mutates the input.
    """
    out: list[dict] = []
    n = len(workflows)
    for i in range(n):
        a = workflows[i]
        a_id = a.get("id")
        if not a_id:
            continue
        skills_a = a.get("skills_involved") or []
        if not skills_a:
            continue
        for j in range(i + 1, n):
            b = workflows[j]
            b_id = b.get("id")
            if not b_id or b_id == a_id:
                continue
            skills_b = b.get("skills_involved") or []
            if not skills_b:
                continue
            strength = jaccard(skills_a, skills_b)
            if strength < MIN_OVERLAP:
                continue
            # Stable direction: lexicographically smaller id is ``from``.
            src, dst = (a_id, b_id) if a_id < b_id else (b_id, a_id)
            out.append(
                {
                    "from": src,
                    "to": dst,
                    "type": "complementary",
                    # Round to 2 decimals so persisted JSON diffs stay stable.
                    "strength": round(strength, 2),
                }
            )
    out.sort(key=lambda c: (c["from"], c["to"]))
    return out
