"""Bag item classifier — deterministic rules.

Completions used to be dropped into the bag as
``{type: "research_note", rarity: "common"}``, so the inventory always
looked the same regardless of what the agent actually accomplished.

This module derives two things from a completion ``.md``:

* ``rarity`` — mapped from the completion's ``- rank: **X**`` metadata
  (S → legendary, A → epic, B → rare, C → uncommon, D → common).
* ``type`` — keyword-based classification of the ``## Brief`` + title text.

Pure, deterministic, no LLM. Idempotent: same input → same output.
Missing signals fall back to ``research_note`` / ``common`` so existing
behaviour is preserved.
"""

from __future__ import annotations

import re
from typing import TypedDict


class Classification(TypedDict):
    type: str
    rarity: str
    icon: str


FALLBACK: Classification = {"type": "research_note", "rarity": "common", "icon": "scroll"}

# Rank letter → rarity tier. The rank header is written by quest-cycle
# when a quest completes.
RANK_TO_RARITY = {
    "S": "legendary",
    "A": "epic",
    "B": "rare",
    "C": "uncommon",
    "D": "common",
}

# Ordered keyword → type rules. First match wins.
#
# Order matters: specific intents at the top, broad categories below.
# Each rule gets an ``icon`` hint that matches icon-registry's typeMap so
# the frontend renders a shaped icon instead of defaulting to a scroll.
_TYPE_RULES: list[tuple[str, str, re.Pattern[str]]] = [
    (
        "map_fragment",
        "map",
        re.compile(
            r"\b(?:design|architecture|diagram|flowchart|plan|roadmap|blueprint|topology|map)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "training_report",
        "book",
        re.compile(
            r"\b(?:ui|ux|viewer|interface|layout|render|display|animation|visual|theme|sprite|panel)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "code_snippet",
        "scroll",
        re.compile(
            r"\b(?:implement|implemented|refactor|refactored|fix|fixed|patch|patched|port|ported|bug|debug|hotfix|rewrite)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "book",
        "book",
        re.compile(r"\b(?:tutorial|guide|walkthrough|handbook|manual)\b", re.IGNORECASE),
    ),
    (
        "research_note",
        "scroll",
        re.compile(
            r"\b(?:document|documented|research|investigat(?:e|ed|ion)|analyz(?:e|ed|is)|audit|survey|explore|explored)\b",
            re.IGNORECASE,
        ),
    ),
]

_RANK_RE = re.compile(r"^[\s\-]*rank:\s*\**([A-Za-z])\**", re.IGNORECASE | re.MULTILINE)


def extract_rank(raw: str) -> str | None:
    """Return the rank letter from the completion header, or None."""
    if not raw:
        return None
    match = _RANK_RE.search(raw)
    if not match:
        return None
    letter = match.group(1).upper()
    return letter if letter in RANK_TO_RARITY else None


def extract_brief(raw: str) -> str:
    """Extract the ``## Brief`` section body for keyword scanning.

    The Reflection paragraph is often flowery narrative that mis-classifies
    as "design", so we focus on the Brief when available. Falls back to the
    title line otherwise.
    """
    if not raw:
        return ""
    lines = [line.strip() for line in raw.split("\n")]
    try:
        brief_idx = next(i for i, line in enumerate(lines) if line.lower() == "## brief")
    except StopIteration:
        brief_idx = -1
    if brief_idx >= 0:
        collected: list[str] = []
        for line in lines[brief_idx + 1 :]:
            if line.startswith("#"):
                break
            if line:
                collected.append(line)
        if collected:
            return " ".join(collected)
    title = next((line for line in lines if line.startswith("# ")), None)
    return title[2:] if title else ""


def classify_type(raw: str, stem: str) -> tuple[str, str]:
    """Classify the Brief + title into an item ``(type, icon)`` tuple.

    Runs through ``_TYPE_RULES`` in declared order and returns the first
    rule whose regex matches.
    """
    title = stem.replace("-", " ")
    brief = extract_brief(raw)
    haystack = f"{title} {brief}".lower()
    for type_name, icon, pattern in _TYPE_RULES:
        if pattern.search(haystack):
            return type_name, icon
    return FALLBACK["type"], FALLBACK["icon"]


def classify_rarity(raw: str) -> str:
    """Map a rank letter to a rarity tier. Unknown/missing rank → common."""
    letter = extract_rank(raw)
    if letter is None:
        return FALLBACK["rarity"]
    return RANK_TO_RARITY.get(letter, FALLBACK["rarity"])


def classify_completion(raw: str, stem: str) -> Classification:
    """Classify a completion ``.md`` into ``{type, rarity, icon}``.

    Pure function — no I/O, no side effects.
    """
    if not raw:
        return dict(FALLBACK)  # type: ignore[return-value]
    type_name, icon = classify_type(raw, stem)
    return {"type": type_name, "rarity": classify_rarity(raw), "icon": icon}
